import { Team, MatchResult, LeagueStanding, Player } from '../types';

export interface TournamentFixture {
  id: string;
  round: number; // 1, 2, or 3
  matchIndex: number; // 0, 1, 2...
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeBadge: string;
  awayBadge: string;
  leg: number; // 1, 2, or 3
  isDecider?: boolean;
}

/**
 * Checks the head-to-head match history between two teams.
 * Determines if leg 3 is an official decider tiebreak.
 */
export function getHeadToHeadRecord(
  teamAId: string,
  teamBId: string,
  matches: MatchResult[]
): {
  teamAWins: number;
  teamBWins: number;
  draws: number;
  totalPlayed: number;
  isDecider: boolean;
} {
  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;

  (matches || []).forEach(m => {
    const isAvsB = m.homeTeamId === teamAId && m.awayTeamId === teamBId;
    const isBvsA = m.homeTeamId === teamBId && m.awayTeamId === teamAId;
    if (!isAvsB && !isBvsA) return;

    if (m.wentToPenalties && m.penaltyScore) {
      const aPen = isAvsB ? m.penaltyScore.home : m.penaltyScore.away;
      const bPen = isAvsB ? m.penaltyScore.away : m.penaltyScore.home;
      if (aPen > bPen) teamAWins++;
      else if (bPen > aPen) teamBWins++;
      return;
    }

    const aScore = isAvsB ? m.homeScore : m.awayScore;
    const bScore = isAvsB ? m.awayScore : m.homeScore;

    if (aScore > bScore) teamAWins++;
    else if (bScore > aScore) teamBWins++;
    else draws++;
  });

  const totalPlayed = teamAWins + teamBWins + draws;
  // Match 3 is a decider if both teams have played at least 2 matches and neither has won both (tied series e.g. 1-1)
  const isDecider = totalPlayed >= 2 && teamAWins === teamBWins;

  return { teamAWins, teamBWins, draws, totalPlayed, isDecider };
}

/**
 * Generates tournament fixtures where each team plays every other team exactly 3 times.
 * Total matches = 3 * (N * (N - 1) / 2).
 * For 2 teams (A & B): 3 matches:
 *  - Leg 1: A vs B
 *  - Leg 2: B vs A
 *  - Leg 3: A vs B (Decider)
 */
export function generateTournamentFixtures(teams: Team[]): TournamentFixture[] {
  if (!teams || teams.length < 2) {
    return [];
  }

  const fixtures: TournamentFixture[] = [];
  let matchIndex = 0;

  // Collect all unique pairs of teams
  const pairs: Array<[Team, Team]> = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }

  // 3 legs for each pair
  // Leg 1: Team A (Home) vs Team B (Away)
  pairs.forEach(([teamA, teamB]) => {
    fixtures.push({
      id: `fixture-${matchIndex + 1}`,
      round: 1,
      leg: 1,
      matchIndex: matchIndex++,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      homeTeamName: teamA.name || teamA.teamName || 'Team A',
      awayTeamName: teamB.name || teamB.teamName || 'Team B',
      homeBadge: teamA.badgeIcon || teamA.badge || '⚽',
      awayBadge: teamB.badgeIcon || teamB.badge || '⚽',
      isDecider: false,
    });
  });

  // Leg 2: Team B (Home) vs Team A (Away)
  pairs.forEach(([teamA, teamB]) => {
    fixtures.push({
      id: `fixture-${matchIndex + 1}`,
      round: 2,
      leg: 2,
      matchIndex: matchIndex++,
      homeTeamId: teamB.id,
      awayTeamId: teamA.id,
      homeTeamName: teamB.name || teamB.teamName || 'Team B',
      awayTeamName: teamA.name || teamA.teamName || 'Team A',
      homeBadge: teamB.badgeIcon || teamB.badge || '⚽',
      awayBadge: teamA.badgeIcon || teamA.badge || '⚽',
      isDecider: false,
    });
  });

  // Leg 3: Team A (Home) vs Team B (Away) (Rubber Match / Decider)
  pairs.forEach(([teamA, teamB]) => {
    fixtures.push({
      id: `fixture-${matchIndex + 1}`,
      round: 3,
      leg: 3,
      matchIndex: matchIndex++,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      homeTeamName: teamA.name || teamA.teamName || 'Team A',
      awayTeamName: teamB.name || teamB.teamName || 'Team B',
      homeBadge: teamA.badgeIcon || teamA.badge || '⚽',
      awayBadge: teamB.badgeIcon || teamB.badge || '⚽',
      isDecider: true,
    });
  });

  return fixtures;
}

/**
 * Computes official league/tournament standings for the given teams and matches.
 * All teams in `teams` will be present in the standings even if 0 matches have been played.
 * Sorted by:
 * 1. Points (3 for Win, 1 for Draw, 0 for Loss)
 * 2. Goal Difference (GF - GA)
 * 3. Goals For (GF)
 * 4. Most Wins
 */
export function computeTournamentStandings(
  teams: Team[],
  matches: MatchResult[]
): LeagueStanding[] {
  const standingsMap = new Map<string, LeagueStanding>();

  // Pre-seed all teams with 0 stats so the table is never blank
  teams.forEach((t) => {
    standingsMap.set(t.id, {
      teamId: t.id,
      teamName: t.name || t.teamName || 'Team',
      abbreviation: t.shortCode || t.abbreviation || 'TM',
      badgeIcon: t.badgeIcon || t.badge || '⚽',
      badge: t.badgeIcon || t.badge || '⚽',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      recentForm: [],
    });
  });

  // Apply match results
  matches.forEach((m) => {
    const home = standingsMap.get(m.homeTeamId);
    const away = standingsMap.get(m.awayTeamId);

    if (home) {
      home.played += 1;
      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;

      if (m.wentToPenalties && m.penaltyScore) {
        if (m.penaltyScore.home > m.penaltyScore.away) {
          home.won += 1;
          home.points += 3;
          home.recentForm.unshift('W');
        } else {
          home.lost += 1;
          home.recentForm.unshift('L');
        }
      } else if (m.homeScore > m.awayScore) {
        home.won += 1;
        home.points += 3;
        home.recentForm.unshift('W');
      } else if (m.homeScore === m.awayScore) {
        home.drawn += 1;
        home.points += 1;
        home.recentForm.unshift('D');
      } else {
        home.lost += 1;
        home.recentForm.unshift('L');
      }
      home.recentForm = home.recentForm.slice(0, 5);
    }

    if (away) {
      away.played += 1;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (m.wentToPenalties && m.penaltyScore) {
        if (m.penaltyScore.away > m.penaltyScore.home) {
          away.won += 1;
          away.points += 3;
          away.recentForm.unshift('W');
        } else {
          away.lost += 1;
          away.recentForm.unshift('L');
        }
      } else if (m.awayScore > m.homeScore) {
        away.won += 1;
        away.points += 3;
        away.recentForm.unshift('W');
      } else if (m.awayScore === m.homeScore) {
        away.drawn += 1;
        away.points += 1;
        away.recentForm.unshift('D');
      } else {
        away.lost += 1;
        away.recentForm.unshift('L');
      }
      away.recentForm = away.recentForm.slice(0, 5);
    }
  });

  // Sort: Points DESC, Goal Difference DESC, Goals For DESC, Wins DESC
  return Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.teamName.localeCompare(b.teamName);
  });
}

export interface TournamentPlayerLeader {
  playerId: string;
  playerName: string;
  shortName: string;
  position: string;
  teamId: string;
  teamName: string;
  badge: string;
  avatarUrl?: string;
  overall: number;
  goals: number;
  assists: number;
  motmCount: number;
  matchesPlayed: number;
  avgRating: number;
  cleanSheets: number;
}

/**
 * Computes official tournament player statistics aggregated across all completed matches.
 * Scans match events, player ratings, and official MOTM honors directly from match records
 * to guarantee 100% data integrity and consistency across tournament legs.
 */
export function computeTournamentPlayerStats(
  allPlayers: Player[],
  matches: MatchResult[],
  teams: Team[]
): TournamentPlayerLeader[] {
  const teamMap = new Map<string, Team>();
  (teams || []).forEach(t => teamMap.set(t.id, t));

  const statsMap = new Map<string, {
    player: Player;
    teamId: string;
    goals: number;
    assists: number;
    motmCount: number;
    matchesPlayed: number;
    ratingSum: number;
    cleanSheets: number;
  }>();

  // Initialize from allPlayers
  (allPlayers || []).forEach(p => {
    statsMap.set(p.id, {
      player: p,
      teamId: p.teamId || '',
      goals: 0,
      assists: 0,
      motmCount: 0,
      matchesPlayed: 0,
      ratingSum: 0,
      cleanSheets: 0,
    });
  });

  (matches || []).forEach(match => {
    const isHomeCleanSheet = match.awayScore === 0;
    const isAwayCleanSheet = match.homeScore === 0;

    // Check Player of the Match honors
    const potmId = match.playerOfTheMatch?.playerId || match.potmPlayerId;

    // Process player ratings
    if (match.playerRatings) {
      Object.entries(match.playerRatings).forEach(([pId, pr]) => {
        let entry = statsMap.get(pId);
        if (!entry) {
          const fallbackPlayer: Player = {
            id: pId,
            name: pr.playerName,
            shortName: pr.playerName.split(' ').slice(-1)[0] || pr.playerName,
            position: (pr.position as any) || 'MID',
            nationality: 'Club',
            overall: 78,
            pace: 75,
            shooting: 75,
            passing: 75,
            dribbling: 75,
            defending: 75,
            physical: 75,
            goalkeeping: 15,
            form: 80,
            stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 7.0 }
          };
          entry = {
            player: fallbackPlayer,
            teamId: pr.teamId || '',
            goals: 0,
            assists: 0,
            motmCount: 0,
            matchesPlayed: 0,
            ratingSum: 0,
            cleanSheets: 0,
          };
          statsMap.set(pId, entry);
        }

        entry.matchesPlayed += 1;
        entry.goals += pr.goals || 0;
        entry.assists += pr.assists || 0;
        entry.ratingSum += pr.rating || 7.0;
        if (pr.teamId) entry.teamId = pr.teamId;

        // Clean sheet tracking
        const isHome = pr.teamId === match.homeTeamId;
        const earnedCleanSheet = (pr.position === 'GK' || pr.position === 'DEF') && (isHome ? isHomeCleanSheet : isAwayCleanSheet);
        if (earnedCleanSheet) {
          entry.cleanSheets += 1;
        }
      });
    }

    // Award MOTM
    if (potmId && statsMap.has(potmId)) {
      statsMap.get(potmId)!.motmCount += 1;
    }
  });

  // Convert to TournamentPlayerLeader list
  const results: TournamentPlayerLeader[] = [];
  statsMap.forEach((entry, pId) => {
    const p = entry.player;
    const team = teamMap.get(entry.teamId) || teamMap.get(p.teamId || '');
    const teamName = team?.name || team?.teamName || 'Free Agent';
    const badge = team?.badgeIcon || team?.badge || '⚽';

    // If no matches yet, fall back to player's existing stats
    const goals = matches.length > 0 ? entry.goals : (p.stats?.goals || p.goals || 0);
    const assists = matches.length > 0 ? entry.assists : (p.stats?.assists || p.assists || 0);
    const motmCount = matches.length > 0 ? entry.motmCount : (p.stats?.motm || 0);
    const matchesPlayed = matches.length > 0 ? entry.matchesPlayed : (p.stats?.matches || p.appearances || 0);
    const avgRating = entry.matchesPlayed > 0
      ? Number((entry.ratingSum / entry.matchesPlayed).toFixed(1))
      : (p.stats?.avgRating || p.rating || 7.0);
    const cleanSheets = matches.length > 0 ? entry.cleanSheets : (p.stats?.cleanSheets || p.cleanSheets || 0);

    results.push({
      playerId: pId,
      playerName: p.name,
      shortName: p.shortName || p.name,
      position: p.position,
      teamId: entry.teamId || p.teamId || '',
      teamName,
      badge,
      avatarUrl: p.avatarUrl || p.imageUrl,
      overall: p.overall,
      goals,
      assists,
      motmCount,
      matchesPlayed,
      avgRating,
      cleanSheets,
    });
  });

  return results;
}

/**
 * Computes Tournament Top Scorers (Golden Boot) Leaderboard.
 * Prioritizes goals scored, then assists, then fewest matches played, then player overall.
 */
export function computeTournamentGoldenBoot(
  allPlayers: Player[],
  matches: MatchResult[],
  teams: Team[]
): TournamentPlayerLeader[] {
  const allStats = computeTournamentPlayerStats(allPlayers, matches, teams);

  return allStats
    .filter(p => p.goals > 0 || (matches.length === 0 && p.overall >= 88))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      if (a.matchesPlayed !== b.matchesPlayed && a.matchesPlayed > 0 && b.matchesPlayed > 0) {
        return a.matchesPlayed - b.matchesPlayed;
      }
      return b.overall - a.overall;
    });
}

/**
 * Computes Tournament Man of the Match (MOTM Honors) Leaderboard.
 * Ranks players by total MOTM awards, then average match rating.
 */
export function computeTournamentMotmLeaders(
  allPlayers: Player[],
  matches: MatchResult[],
  teams: Team[]
): TournamentPlayerLeader[] {
  const allStats = computeTournamentPlayerStats(allPlayers, matches, teams);

  return allStats
    .filter(p => p.motmCount > 0 || p.matchesPlayed > 0)
    .sort((a, b) => {
      if (b.motmCount !== a.motmCount) return b.motmCount - a.motmCount;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.overall - a.overall;
    });
}

/**
 * Applies a simulated match result to the player collection,
 * updating matches, appearances, goals, assists, clean sheets, MOTM honors, and avg rating.
 */
export function applyMatchToPlayerStats(
  players: Player[],
  result: MatchResult
): Player[] {
  const potmId = result.playerOfTheMatch?.playerId || result.potmPlayerId;
  const isHomeCleanSheet = result.awayScore === 0;
  const isAwayCleanSheet = result.homeScore === 0;

  return players.map(p => {
    const matchRating = result.playerRatings?.[p.id];
    if (!matchRating) return p;

    const prevMatches = p.stats?.matches || 0;
    const newMatches = prevMatches + 1;
    const newGoals = (p.stats?.goals || 0) + (matchRating.goals || 0);
    const newAssists = (p.stats?.assists || 0) + (matchRating.assists || 0);

    const isHome = matchRating.teamId === result.homeTeamId;
    const earnedCleanSheet =
      (p.position === 'GK' || p.position === 'DEF') &&
      (isHome ? isHomeCleanSheet : isAwayCleanSheet);
    const newCleanSheets = (p.stats?.cleanSheets || 0) + (earnedCleanSheet ? 1 : 0);

    const isMotm = potmId === p.id;
    const newMotm = (p.stats?.motm || 0) + (isMotm ? 1 : 0);

    const prevAvg = p.stats?.avgRating || 7.0;
    const newAvg = Number(
      (((prevAvg * prevMatches) + matchRating.rating) / newMatches).toFixed(1)
    );

    return {
      ...p,
      stats: {
        ...p.stats,
        matches: newMatches,
        appearances: newMatches,
        goals: newGoals,
        assists: newAssists,
        cleanSheets: newCleanSheets,
        motm: newMotm,
        avgRating: newAvg,
      },
      goals: newGoals,
      assists: newAssists,
      appearances: newMatches,
      cleanSheets: newCleanSheets,
      rating: newAvg,
    };
  });
}

