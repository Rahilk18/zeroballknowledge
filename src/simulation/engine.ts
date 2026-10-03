import { Player, Team, MatchResult, MatchEvent, TeamMatchStats, PlayerMatchRating } from '../types';

export interface SimulationTeam {
  team: Team;
  players: Player[];
}

export function simulateMatch(
  homeSimTeam: SimulationTeam,
  awaySimTeam: SimulationTeam
): MatchResult {
  const { team: homeTeam, players: homePlayers } = homeSimTeam;
  const { team: awayTeam, players: awayPlayers } = awaySimTeam;

  // Filter down to the starting 7 players
  const homeStarting = homePlayers.filter(p => homeTeam.startingSeven.includes(p.id));
  const awayStarting = awayPlayers.filter(p => awayTeam.startingSeven.includes(p.id));

  // Compute unit ratings
  const getUnitRating = (players: Player[], pos: string, defaultAttr: keyof Player) => {
    const unit = players.filter(p => p.position === pos);
    if (unit.length === 0) return 75;
    const total = unit.reduce((acc, p) => {
      const formBonus = ((p.form - 80) * 0.15);
      return acc + (Number(p[defaultAttr]) || p.overall) + formBonus;
    }, 0);
    return total / unit.length;
  };

  const homeGkRating = getUnitRating(homeStarting, 'GK', 'goalkeeping');
  const awayGkRating = getUnitRating(awayStarting, 'GK', 'goalkeeping');

  const homeDefRating = getUnitRating(homeStarting, 'DEF', 'defending');
  const awayDefRating = getUnitRating(awayStarting, 'DEF', 'defending');

  const homeMidRating = getUnitRating(homeStarting, 'MID', 'passing');
  const awayMidRating = getUnitRating(awayStarting, 'MID', 'passing');

  const homeAttRating = getUnitRating(homeStarting, 'ATT', 'shooting');
  const awayAttRating = getUnitRating(awayStarting, 'ATT', 'shooting');

  // Home advantage
  const homeAdvantage = 2.5;

  // Calculate possession based on midfield battle
  const midDiff = (homeMidRating + homeAdvantage) - awayMidRating;
  const basePossession = 50 + midDiff * 0.7 + (Math.random() * 8 - 4);
  const homePossession = Math.round(Math.min(68, Math.max(32, basePossession)));
  const awayPossession = 100 - homePossession;

  // Expected chances
  const homeChancesCount = Math.round(5 + (homePossession / 100) * 6 + (homeAttRating - awayDefRating) * 0.15 + (Math.random() * 3 - 1.5));
  const awayChancesCount = Math.round(5 + (awayPossession / 100) * 6 + (awayAttRating - homeDefRating) * 0.15 + (Math.random() * 3 - 1.5));

  const totalChances = Math.max(4, homeChancesCount) + Math.max(4, awayChancesCount);
  
  // Pick random distinct minutes across 90 minutes
  const availableMinutes: number[] = [];
  for (let m = 3; m <= 89; m++) availableMinutes.push(m);
  // Shuffle minutes
  for (let i = availableMinutes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableMinutes[i], availableMinutes[j]] = [availableMinutes[j], availableMinutes[i]];
  }

  const matchMinutes = availableMinutes.slice(0, Math.min(totalChances, 14)).sort((a, b) => a - b);

  const events: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;

  let homeShots = 0;
  let homeShotsOnTarget = 0;
  let homeSaves = 0;
  let homeCorners = Math.floor(2 + (homePossession / 15) + Math.random() * 3);
  let homeFouls = Math.floor(4 + Math.random() * 6);

  let awayShots = 0;
  let awayShotsOnTarget = 0;
  let awaySaves = 0;
  let awayCorners = Math.floor(2 + (awayPossession / 15) + Math.random() * 3);
  let awayFouls = Math.floor(4 + Math.random() * 6);

  // Stats tracking for player ratings
  const playerStatsTracker: Record<string, {
    goals: number;
    assists: number;
    shots: number;
    saves: number;
    tackles: number;
    cards: number;
  }> = {};

  const allPlayers = [...homeStarting, ...awayStarting];
  allPlayers.forEach(p => {
    playerStatsTracker[p.id] = { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0, cards: 0 };
  });

  // Helper to pick attacker/scorer weighted by shooting & overall
  const pickScorer = (players: Player[]): Player => {
    const attackers = players.filter(p => p.position === 'ATT');
    const midfielders = players.filter(p => p.position === 'MID');
    const defenders = players.filter(p => p.position === 'DEF');

    const roll = Math.random();
    if (attackers.length > 0 && roll < 0.70) {
      return attackers[Math.floor(Math.random() * attackers.length)];
    }
    if (midfielders.length > 0 && roll < 0.94) {
      return midfielders[Math.floor(Math.random() * midfielders.length)];
    }
    if (defenders.length > 0) {
      return defenders[Math.floor(Math.random() * defenders.length)];
    }
    return players[Math.floor(Math.random() * players.length)];
  };

  const pickAssister = (players: Player[], scorerId: string): Player | undefined => {
    const candidates = players.filter(p => p.id !== scorerId && p.position !== 'GK');
    if (candidates.length === 0 || Math.random() > 0.82) return undefined;
    
    // Midfielders provide most assists
    const mids = candidates.filter(p => p.position === 'MID');
    if (mids.length > 0 && Math.random() < 0.65) {
      return mids[Math.floor(Math.random() * mids.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const homeGk = homeStarting.find(p => p.position === 'GK') || homeStarting[0];
  const awayGk = awayStarting.find(p => p.position === 'GK') || awayStarting[0];

  // Distribute chances
  matchMinutes.forEach(minute => {
    const isHomeAttack = Math.random() < (homePossession / 100);
    const attackingTeam = isHomeAttack ? homeTeam : awayTeam;
    const defendingTeam = isHomeAttack ? awayTeam : homeTeam;
    const attackingPlayers = isHomeAttack ? homeStarting : awayStarting;
    const opposingGk = isHomeAttack ? awayGk : homeGk;
    const attackPower = isHomeAttack ? (homeAttRating * 0.6 + homeMidRating * 0.4) : (awayAttRating * 0.6 + awayMidRating * 0.4);
    const defensePower = isHomeAttack ? (awayDefRating * 0.6 + awayGkRating * 0.4) : (homeDefRating * 0.6 + homeGkRating * 0.4);

    // Goal probability per chance
    const goalOdds = Math.min(0.38, Math.max(0.12, 0.22 + (attackPower - defensePower) * 0.012));
    const saveOdds = 0.32;
    const cardOdds = 0.08;

    const roll = Math.random();

    if (roll < goalOdds) {
      // GOAL!
      const scorer = pickScorer(attackingPlayers);
      const assister = pickAssister(attackingPlayers, scorer.id);

      if (isHomeAttack) {
        homeScore++;
        homeShots++;
        homeShotsOnTarget++;
      } else {
        awayScore++;
        awayShots++;
        awayShotsOnTarget++;
      }

      playerStatsTracker[scorer.id].goals++;
      playerStatsTracker[scorer.id].shots++;
      if (assister) {
        playerStatsTracker[assister.id].assists++;
      }

      const desc = assister 
        ? `${scorer.name} finishes clinical strike into the corner, assisted by a sublime pass from ${assister.shortName}!`
        : `${scorer.name} bursts through the defense with incredible skill and slots it past the keeper!`;

      events.push({
        id: `evt-${minute}-${scorer.id}`,
        minute,
        type: 'goal',
        teamId: attackingTeam.id,
        teamName: attackingTeam.name,
        playerId: scorer.id,
        playerName: scorer.name,
        assistPlayerId: assister?.id,
        assistPlayerName: assister?.shortName,
        scoreAfter: { home: homeScore, away: awayScore },
        description: desc
      });
    } else if (roll < goalOdds + saveOdds) {
      // GOALKEEPER SAVE!
      if (isHomeAttack) {
        homeShots++;
        homeShotsOnTarget++;
        awaySaves++;
      } else {
        awayShots++;
        awayShotsOnTarget++;
        homeSaves++;
      }

      playerStatsTracker[opposingGk.id].saves++;
      const attackerShooting = pickScorer(attackingPlayers);
      playerStatsTracker[attackerShooting.id].shots++;

      events.push({
        id: `evt-${minute}-${opposingGk.id}`,
        minute,
        type: 'save',
        teamId: defendingTeam.id,
        teamName: defendingTeam.name,
        playerId: opposingGk.id,
        playerName: opposingGk.name,
        description: `Sensational diving reflex save by ${opposingGk.shortName} to deny ${attackerShooting.shortName}!`
      });
    } else if (roll < goalOdds + saveOdds + cardOdds) {
      // YELLOW CARD!
      const defendingPlayers = isHomeAttack ? awayStarting : homeStarting;
      const defenders = defendingPlayers.filter(p => p.position === 'DEF' || p.position === 'MID');
      const cardedPlayer = defenders.length > 0 
        ? defenders[Math.floor(Math.random() * defenders.length)]
        : defendingPlayers[Math.floor(Math.random() * defendingPlayers.length)];

      playerStatsTracker[cardedPlayer.id].cards++;

      events.push({
        id: `evt-${minute}-${cardedPlayer.id}`,
        minute,
        type: 'yellow_card',
        teamId: defendingTeam.id,
        teamName: defendingTeam.name,
        playerId: cardedPlayer.id,
        playerName: cardedPlayer.name,
        description: `Tactical foul: ${cardedPlayer.name} is booked with a yellow card by the referee.`
      });
    } else {
      // Regular shot off target or woodwork
      if (isHomeAttack) {
        homeShots++;
      } else {
        awayShots++;
      }
      const attackerShooting = pickScorer(attackingPlayers);
      playerStatsTracker[attackerShooting.id].shots++;
    }
  });

  // Ensure shots logic integrity
  if (homeShots < homeShotsOnTarget) homeShots = homeShotsOnTarget + Math.floor(Math.random() * 3 + 2);
  if (awayShots < awayShotsOnTarget) awayShots = awayShotsOnTarget + Math.floor(Math.random() * 3 + 2);

  // Compute final player ratings (Scale 5.8 - 9.8)
  const playerRatings: Record<string, PlayerMatchRating> = {};

  allPlayers.forEach(p => {
    const isHome = homeTeam.startingSeven.includes(p.id);
    const teamWon = isHome ? homeScore > awayScore : awayScore > homeScore;
    const teamDrew = homeScore === awayScore;
    const goalsConceded = isHome ? awayScore : homeScore;

    let rating = 6.4 + (p.overall - 80) * 0.04 + (p.form - 80) * 0.03;
    const tracker = playerStatsTracker[p.id] || { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0, cards: 0 };

    rating += tracker.goals * 1.1;
    rating += tracker.assists * 0.7;
    rating += tracker.saves * 0.45;
    rating -= tracker.cards * 0.4;

    if (p.position === 'GK' || p.position === 'DEF') {
      if (goalsConceded === 0) rating += 0.8;
      else rating -= goalsConceded * 0.25;
    }

    if (teamWon) rating += 0.4;
    else if (!teamDrew) rating -= 0.3;

    // Small random touch
    rating += (Math.random() * 0.4 - 0.2);

    // Clamped
    rating = Math.round(Math.min(9.9, Math.max(5.5, rating)) * 10) / 10;

    playerRatings[p.id] = {
      playerId: p.id,
      playerName: p.name,
      teamId: isHome ? homeTeam.id : awayTeam.id,
      position: p.position,
      rating,
      goals: tracker.goals,
      assists: tracker.assists,
      shots: tracker.shots,
      saves: tracker.saves,
      tackles: tracker.tackles
    };
  });

  // Determine Player of the Match
  const ratingsList = Object.values(playerRatings);
  ratingsList.sort((a, b) => b.rating - a.rating);
  const best = ratingsList[0];

  let potmReason = `Outstanding all-around display with an influential ${best.rating} match rating.`;
  if (best.goals >= 2) {
    potmReason = `Decisive match-winner with ${best.goals} brilliant goals and constant threat!`;
  } else if (best.goals === 1 && best.assists >= 1) {
    potmReason = `Masterful performance with 1 goal and 1 assist dominating the pitch!`;
  } else if ((best.saves ?? 0) >= 3) {
    potmReason = `Rock-solid goalkeeping with ${best.saves ?? 0} vital match-saving stops!`;
  } else if (best.goals === 1) {
    potmReason = `Scored the crucial goal with high work rate and tactical discipline.`;
  }

  const homeStats: TeamMatchStats = {
    possession: homePossession,
    shots: Math.max(homeShots, homeScore + 1),
    shotsOnTarget: Math.max(homeShotsOnTarget, homeScore),
    passAccuracy: Math.round(79 + (homeMidRating - 80) * 0.5 + Math.random() * 4),
    corners: homeCorners,
    fouls: homeFouls,
    saves: homeSaves
  };

  const awayStats: TeamMatchStats = {
    possession: awayPossession,
    shots: Math.max(awayShots, awayScore + 1),
    shotsOnTarget: Math.max(awayShotsOnTarget, awayScore),
    passAccuracy: Math.round(78 + (awayMidRating - 80) * 0.5 + Math.random() * 4),
    corners: awayCorners,
    fouls: awayFouls,
    saves: awaySaves
  };

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  return {
    id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeScore,
    awayScore,
    events,
    stats: {
      home: homeStats,
      away: awayStats
    },
    playerRatings,
    playerOfTheMatch: {
      playerId: best.playerId,
      playerName: best.playerName,
      teamId: best.teamId,
      rating: best.rating,
      reason: potmReason
    },
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    completed: true
  };
}
