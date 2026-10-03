import { Team, MatchResult, LeagueStanding } from '../types';

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
}

/**
 * Generates tournament fixtures where each team plays every other team exactly 3 times.
 * Total matches = 3 * (N * (N - 1) / 2).
 * For 2 teams (A & B): 3 matches:
 *  - Leg 1: A vs B
 *  - Leg 2: B vs A
 *  - Leg 3: A vs B
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
  pairs.forEach(([teamA, teamB], pairIdx) => {
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
    });
  });

  // Leg 2: Team B (Home) vs Team A (Away)
  pairs.forEach(([teamA, teamB], pairIdx) => {
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
    });
  });

  // Leg 3: Team A (Home) vs Team B (Away) (Decider)
  pairs.forEach(([teamA, teamB], pairIdx) => {
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

      if (m.homeScore > m.awayScore) {
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

      if (m.awayScore > m.homeScore) {
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
