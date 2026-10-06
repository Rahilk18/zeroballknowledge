import { Player, Team, MatchResult, MatchEvent, TeamMatchStats, PlayerMatchRating } from '../types';
import { calculateTeamOverall } from '../utils/formatters';

export interface SimulationTeam {
  team: Team;
  players: Player[];
}

interface StarterSelection {
  starters: Player[];
  realCount: number;
  hasRealGK: boolean;
  missingCount: number;
}

function ensureStartingSeven(team: Team, availablePlayers: Player[]): StarterSelection {
  const teamPlayerIds = team.startingSeven || [];
  
  // Real players drafted by this team (excluding fillers)
  const realPlayers = (availablePlayers || []).filter(
    p => p && !p.id.includes('empty-') && !p.id.includes('trialist') && !p.id.includes('filler') && !p.id.includes('reserve-')
  );
  const realCount = realPlayers.length;

  // Check if team owns at least one genuine Goalkeeper
  const realGks = realPlayers.filter(p => p.position === 'GK');
  const hasRealGK = realGks.length > 0;

  let starters: Player[] = [];

  // 1. If startingSeven is configured, match from real available players first
  if (teamPlayerIds.length > 0) {
    starters = realPlayers.filter(p => teamPlayerIds.includes(p.id));
  }

  // 2. If fewer than 7, pull remaining from this team's bench/pool
  if (starters.length < 7) {
    const remaining = realPlayers.filter(p => !starters.some(s => s.id === p.id));
    starters = [...starters, ...remaining.slice(0, 7 - starters.length)];
  }

  // Check if starters currently contains a real GK
  const hasGkInStarters = starters.some(p => p.position === 'GK');

  // If team has a real GK in their pool but not in starters, prioritize putting them in
  if (!hasGkInStarters && hasRealGK) {
    const gk = realGks[0];
    if (!starters.some(s => s.id === gk.id)) {
      if (starters.length >= 7) {
        starters[0] = gk;
      } else {
        starters.unshift(gk);
      }
    }
  }

  const missingCount = Math.max(0, 7 - starters.length);

  // 3. If team has NO GOALKEEPER at all:
  // Must insert an emergency makeshift outfield player in goal with severe attribute handicap
  if (!starters.some(p => p.position === 'GK')) {
    const makeshiftGk: Player = {
      id: `${team.id || 'team'}-makeshift-nogk`,
      name: `${team.name || 'Club'} (No GK - Outfield Fill)`,
      shortName: 'No GK Fill',
      position: 'GK',
      nationality: 'Club',
      overall: 32,
      pace: 35,
      shooting: 25,
      passing: 25,
      dribbling: 25,
      defending: 25,
      physical: 35,
      goalkeeping: 18, // Catastrophic goalkeeping rating (vs 75-92 for real GKs)
      form: 40,
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 4.0 }
    };
    if (starters.length >= 7) {
      starters[0] = makeshiftGk;
    } else {
      starters.unshift(makeshiftGk);
    }
  }

  // 4. If team still has fewer than 7 players (e.g. only 3 or 4 players drafted):
  // Generate amateur trialists with SEVERELY LOW ratings (30-36 OVR) so understaffed teams lose badly
  if (starters.length < 7) {
    const roles: Array<'DEF' | 'DEF' | 'MID' | 'MID' | 'ATT' | 'ATT'> = [
      'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT'
    ];
    while (starters.length < 7) {
      const idx = starters.length;
      const pos = roles[idx % roles.length] || 'MID';
      const label = pos === 'DEF' ? 'Amateur Def' : pos === 'MID' ? 'Amateur Mid' : 'Amateur Att';
      starters.push({
        id: `${team.id || 'team'}-trialist-${idx + 1}`,
        name: `${team.name || 'Club'} Amateur Trialist #${idx + 1}`,
        shortName: `${label} #${idx + 1}`,
        position: pos,
        nationality: 'Club',
        overall: 34,
        pace: 35,
        shooting: pos === 'ATT' ? 36 : 28,
        passing: pos === 'MID' ? 36 : 28,
        dribbling: 30,
        defending: pos === 'DEF' ? 36 : 28,
        physical: 32,
        goalkeeping: 10,
        form: 40,
        stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 4.2 }
      });
    }
  }

  return {
    starters: starters.slice(0, 7),
    realCount,
    hasRealGK,
    missingCount
  };
}

export function simulateMatch(
  homeSimTeam: SimulationTeam,
  awaySimTeam: SimulationTeam,
  options?: {
    isDecider?: boolean;
    matchweek?: number;
  }
): MatchResult {
  const { team: homeTeam, players: homePlayers } = homeSimTeam;
  const { team: awayTeam, players: awayPlayers } = awaySimTeam;

  // Filter down to the starting 7 players with squad deficit metadata
  const homeSelection = ensureStartingSeven(homeTeam, homePlayers);
  const awaySelection = ensureStartingSeven(awayTeam, awayPlayers);

  const homeStarting = homeSelection.starters;
  const awayStarting = awaySelection.starters;

  // Dynamic realistic Team Overall calculation using enhanced algorithm
  const homeOverall = calculateTeamOverall(homeStarting);
  const awayOverall = calculateTeamOverall(awayStarting);
  const ovrDiff = homeOverall - awayOverall;

  // Compute unit ratings
  const getUnitRating = (players: Player[], pos: string, defaultAttr: keyof Player) => {
    const unit = players.filter(p => p.position === pos);
    if (unit.length === 0) return 40;
    const total = unit.reduce((acc, p) => {
      const formBonus = ((p.form - 80) * 0.15);
      return acc + (Number(p[defaultAttr]) || p.overall) + formBonus;
    }, 0);
    return total / unit.length;
  };

  const getFormationMod = (fmt?: string) => {
    switch (fmt) {
      case '1-3-2-1': return { def: 3, mid: 0, att: -1 };
      case '1-2-3-1': return { def: 0, mid: 3, att: 0 };
      case '1-3-1-2': return { def: 2, mid: -2, att: 2 };
      case '1-1-3-2': return { def: -3, mid: 2, att: 3 };
      case '1-1-2-3': return { def: -3, mid: 0, att: 5 };
      case '1-2-1-3': return { def: 0, mid: -2, att: 4 };
      case '1-1-4-1': return { def: -2, mid: 5, att: 0 };
      case '1-4-1-1': return { def: 5, mid: -1, att: -2 };
      case '1-2-4-0': return { def: 1, mid: 4, att: -1 };
      case '1-2-2-2':
      default: return { def: 0, mid: 0, att: 0 };
    }
  };

  const homeFmtMod = getFormationMod(homeTeam.formation);
  const awayFmtMod = getFormationMod(awayTeam.formation);

  // Goalkeeper ratings: If no real GK, rating is decimated (18-22)
  let homeGkRating = homeSelection.hasRealGK
    ? getUnitRating(homeStarting, 'GK', 'goalkeeping')
    : 18;
  let awayGkRating = awaySelection.hasRealGK
    ? getUnitRating(awayStarting, 'GK', 'goalkeeping')
    : 18;

  let homeDefRating = getUnitRating(homeStarting, 'DEF', 'defending') + homeFmtMod.def;
  let awayDefRating = getUnitRating(awayStarting, 'DEF', 'defending') + awayFmtMod.def;

  let homeMidRating = getUnitRating(homeStarting, 'MID', 'passing') + homeFmtMod.mid;
  let awayMidRating = getUnitRating(awayStarting, 'MID', 'passing') + awayFmtMod.mid;

  let homeAttRating = getUnitRating(homeStarting, 'ATT', 'shooting') + homeFmtMod.att;
  let awayAttRating = getUnitRating(awayStarting, 'ATT', 'shooting') + awayFmtMod.att;

  // Severe penalty if a team has only 3 or 4 players:
  // Heavily penalize all outfield ratings so they get completely crushed
  if (homeSelection.realCount <= 4) {
    homeDefRating = Math.min(38, homeDefRating * 0.55);
    homeMidRating = Math.min(38, homeMidRating * 0.55);
    homeAttRating = Math.min(38, homeAttRating * 0.55);
  } else if (homeSelection.realCount < 7) {
    const factor = homeSelection.realCount / 7;
    homeDefRating *= factor;
    homeMidRating *= factor;
    homeAttRating *= factor;
  }

  if (awaySelection.realCount <= 4) {
    awayDefRating = Math.min(38, awayDefRating * 0.55);
    awayMidRating = Math.min(38, awayMidRating * 0.55);
    awayAttRating = Math.min(38, awayAttRating * 0.55);
  } else if (awaySelection.realCount < 7) {
    const factor = awaySelection.realCount / 7;
    awayDefRating *= factor;
    awayMidRating *= factor;
    awayAttRating *= factor;
  }

  // Home advantage
  const homeAdvantage = 1.6;

  // Calculate possession based on midfield battle, team composure, and rating disparity
  const midDiff = (homeMidRating - awayMidRating) * 1.1 + (ovrDiff * 0.45) + homeAdvantage;
  let basePossession = 50 + midDiff * 0.95 + (Math.random() * 4 - 2);

  // If a team has <= 4 players, hard cap their possession to maximum 22-26%
  if (homeSelection.realCount <= 4 && awaySelection.realCount > 4) {
    basePossession = Math.min(22, basePossession);
  } else if (awaySelection.realCount <= 4 && homeSelection.realCount > 4) {
    basePossession = Math.max(78, basePossession);
  }

  const homePossession = Math.round(Math.min(80, Math.max(20, basePossession)));
  const awayPossession = 100 - homePossession;

  // Expected chances: Higher overall teams generate noticeably more dangerous chances
  let homeChancesCount = Math.round(5 + (homePossession / 100) * 8 + (homeAttRating - awayDefRating) * 0.22 + (ovrDiff * 0.15) + (Math.random() * 2 - 1));
  let awayChancesCount = Math.round(5 + (awayPossession / 100) * 8 + (awayAttRating - homeDefRating) * 0.22 - (ovrDiff * 0.15) + (Math.random() * 2 - 1));

  // If team has no GK or <= 4 players, opponent gets extra scoring opportunities
  if (!homeSelection.hasRealGK || homeSelection.realCount <= 4) {
    awayChancesCount = Math.max(9, awayChancesCount + 4);
    homeChancesCount = Math.min(3, Math.max(1, homeChancesCount - 3));
  }
  if (!awaySelection.hasRealGK || awaySelection.realCount <= 4) {
    homeChancesCount = Math.max(9, homeChancesCount + 4);
    awayChancesCount = Math.min(3, Math.max(1, awayChancesCount - 3));
  }

  const totalChances = Math.max(3, homeChancesCount) + Math.max(3, awayChancesCount);
  
  // Pick random distinct minutes across 90 minutes
  const availableMinutes: number[] = [];
  for (let m = 3; m <= 89; m++) availableMinutes.push(m);
  // Shuffle minutes
  for (let i = availableMinutes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableMinutes[i], availableMinutes[j]] = [availableMinutes[j], availableMinutes[i]];
  }

  const matchMinutes = availableMinutes.slice(0, Math.min(totalChances, 16)).sort((a, b) => a - b);

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

  const ensureTracker = (id: string) => {
    if (!playerStatsTracker[id]) {
      playerStatsTracker[id] = { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0, cards: 0 };
    }
  };

  const allPlayers: Player[] = [...homeStarting, ...awayStarting];
  allPlayers.forEach(p => {
    ensureTracker(p.id);
  });

  // Helper to pick attacker/scorer weighted by shooting & overall
  const pickScorer = (players: Player[]): Player => {
    const list = players && players.length > 0 ? players : allPlayers;
    const attackers = list.filter(p => p.position === 'ATT');
    const midfielders = list.filter(p => p.position === 'MID');
    const defenders = list.filter(p => p.position === 'DEF');

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
    return list[Math.floor(Math.random() * list.length)] || homeStarting[0];
  };

  const pickAssister = (players: Player[], scorerId: string): Player | undefined => {
    const candidates = (players || []).filter(p => p.id !== scorerId && p.position !== 'GK');
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
    const defendingHasRealGk = isHomeAttack ? awaySelection.hasRealGK : homeSelection.hasRealGK;
    const attackingRealCount = isHomeAttack ? homeSelection.realCount : awaySelection.realCount;

    const attackPower = isHomeAttack ? (homeAttRating * 0.65 + homeMidRating * 0.35) : (awayAttRating * 0.65 + awayMidRating * 0.35);
    const defensePower = isHomeAttack ? (awayDefRating * 0.6 + awayGkRating * 0.4) : (homeDefRating * 0.6 + homeGkRating * 0.4);
    const ratingAdvantage = isHomeAttack ? ovrDiff : -ovrDiff;

    // Goal probability per chance: higher team rating and attack power significantly boost clinical conversion
    let goalOdds = !defendingHasRealGk
      ? 0.76
      : Math.min(0.60, Math.max(0.09, 0.24 + (attackPower - defensePower) * 0.020 + ratingAdvantage * 0.012));

    // If attacking team is severely understaffed (<= 4 players), their finishing odds plummet
    if (attackingRealCount <= 4) {
      goalOdds = 0.06;
    }

    // Goalkeeper save probability: scales dynamically with goalkeeper rating (world-class GKs save much more!)
    const defendingGkRating = isHomeAttack ? awayGkRating : homeGkRating;
    let saveOdds = !defendingHasRealGk ? 0.04 : Math.min(0.56, Math.max(0.18, 0.22 + (defendingGkRating - 75) * 0.018));
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

      ensureTracker(scorer.id);
      playerStatsTracker[scorer.id].goals++;
      playerStatsTracker[scorer.id].shots++;
      if (assister) {
        ensureTracker(assister.id);
        playerStatsTracker[assister.id].assists++;
      }

      let desc = assister 
        ? `${scorer.name} finishes clinical strike into the corner, assisted by a sublime pass from ${assister.shortName}!`
        : `${scorer.name} bursts through the defense with incredible skill and slots it past the keeper!`;

      if (!defendingHasRealGk) {
        desc = `⚽ GOAL! ${scorer.name} fires directly into the unguarded net — disastrous penalty for ${defendingTeam.name} having no registered goalkeeper!`;
      } else if (isHomeAttack && awaySelection.realCount <= 4) {
        desc = `⚽ GOAL! ${scorer.name} completely overwhelms the severely depleted defense of ${defendingTeam.name}!`;
      } else if (!isHomeAttack && homeSelection.realCount <= 4) {
        desc = `⚽ GOAL! ${scorer.name} punishes the depleted defense of ${defendingTeam.name} with effortless precision!`;
      }

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

      ensureTracker(opposingGk.id);
      playerStatsTracker[opposingGk.id].saves++;
      const attackerShooting = pickScorer(attackingPlayers);
      ensureTracker(attackerShooting.id);
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

      ensureTracker(cardedPlayer.id);
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
      ensureTracker(attackerShooting.id);
      playerStatsTracker[attackerShooting.id].shots++;
    }
  });

  let wentToExtraTime = false;
  let wentToPenalties = false;
  let regularTimeScore: { home: number; away: number } | undefined = undefined;
  let penaltyScore: { home: number; away: number } | undefined = undefined;
  let penaltyShootout: MatchResult['penaltyShootout'] = undefined;

  // DECIDER TIEBREAK: If this match is a decider (e.g. Leg 3 where both teams have won 1 game each, or series is tied) and it ends in a draw:
  if (options?.isDecider && homeScore === awayScore) {
    wentToExtraTime = true;
    regularTimeScore = { home: homeScore, away: awayScore };

    events.push({
      id: `evt-90-extra-time-start`,
      minute: 90,
      type: 'EXTRA_TIME_START',
      description: `⏱️ EXTRA TIME! Deadlock at full time (${homeScore} - ${awayScore}) in this tournament decider! 30 minutes of extra time underway.`
    });

    // Extra time minutes (91' - 120')
    const extraTimeMinutes = [95, 103, 111, 117];
    extraTimeMinutes.forEach(minute => {
      const isHomeAttack = Math.random() < (homePossession / 100);
      const attackingTeam = isHomeAttack ? homeTeam : awayTeam;
      const defendingTeam = isHomeAttack ? awayTeam : homeTeam;
      const attackingPlayers = isHomeAttack ? homeStarting : awayStarting;
      const opposingGk = isHomeAttack ? awayGk : homeGk;
      const defendingHasRealGk = isHomeAttack ? awaySelection.hasRealGK : homeSelection.hasRealGK;
      const defendingGkRating = isHomeAttack ? awayGkRating : homeGkRating;

      const attackPower = isHomeAttack ? (homeAttRating * 0.65 + homeMidRating * 0.35) : (awayAttRating * 0.65 + awayMidRating * 0.35);
      const defensePower = isHomeAttack ? (awayDefRating * 0.6 + awayGkRating * 0.4) : (homeDefRating * 0.6 + homeGkRating * 0.4);
      const ratingAdvantage = isHomeAttack ? ovrDiff : -ovrDiff;

      let goalOdds = !defendingHasRealGk
        ? 0.70
        : Math.min(0.52, Math.max(0.08, 0.20 + (attackPower - defensePower) * 0.018 + ratingAdvantage * 0.010));

      let saveOdds = !defendingHasRealGk ? 0.04 : Math.min(0.55, Math.max(0.18, 0.22 + (defendingGkRating - 75) * 0.018));

      const roll = Math.random();
      if (roll < goalOdds) {
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

        ensureTracker(scorer.id);
        playerStatsTracker[scorer.id].goals++;
        playerStatsTracker[scorer.id].shots++;
        if (assister) {
          ensureTracker(assister.id);
          playerStatsTracker[assister.id].assists++;
        }

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
          description: `⚽ EXTRA TIME GOAL! ${scorer.name} strikes for ${attackingTeam.name} in the ${minute}' minute! What drama in this decider!`
        });
      } else if (roll < goalOdds + saveOdds) {
        if (isHomeAttack) {
          homeShots++;
          homeShotsOnTarget++;
          awaySaves++;
        } else {
          awayShots++;
          awayShotsOnTarget++;
          homeSaves++;
        }
        ensureTracker(opposingGk.id);
        playerStatsTracker[opposingGk.id].saves++;
        events.push({
          id: `evt-${minute}-${opposingGk.id}`,
          minute,
          type: 'save',
          teamId: defendingTeam.id,
          teamName: defendingTeam.name,
          playerId: opposingGk.id,
          playerName: opposingGk.name,
          description: `🧤 Heroic extra time diving stop by ${opposingGk.shortName} to preserve the decider deadlock!`
        });
      }
    });

    // If STILL tied after extra time (120'), go to PENALTY SHOOTOUT!
    if (homeScore === awayScore) {
      wentToPenalties = true;

      events.push({
        id: `evt-120-penalties-start`,
        minute: 120,
        type: 'PENALTIES_START',
        description: `🎯 PENALTY SHOOTOUT! Unbelievable: ${homeScore} - ${awayScore} after 120 minutes! The series decider will now be decided from the spot!`
      });

      const getTakers = (starters: Player[]): Player[] => {
        const outfield = starters.filter(p => p.position !== 'GK');
        const sorted = outfield.sort((a, b) => (b.shooting || b.overall) - (a.shooting || a.overall));
        return sorted.length >= 5 ? sorted : starters;
      };

      const homeTakers = getTakers(homeStarting);
      const awayTakers = getTakers(awayStarting);

      let homePenScore = 0;
      let awayPenScore = 0;
      const homeShotsList: { playerId: string; playerName: string; scored: boolean; round: number }[] = [];
      const awayShotsList: { playerId: string; playerName: string; scored: boolean; round: number }[] = [];

      // 5 Regular Rounds
      for (let round = 1; round <= 5; round++) {
        const hTaker = homeTakers[(round - 1) % homeTakers.length] || homeStarting[0];
        const aTaker = awayTakers[(round - 1) % awayTakers.length] || awayStarting[0];

        // Home shot vs Away GK
        const hShootSkill = hTaker.shooting || hTaker.overall || 75;
        const hScoreProb = Math.min(0.88, Math.max(0.60, 0.74 + (hShootSkill - 80) * 0.015 - (awayGkRating - 80) * 0.012));
        const hScored = Math.random() < hScoreProb;
        if (hScored) homePenScore++;
        homeShotsList.push({ playerId: hTaker.id, playerName: hTaker.name, scored: hScored, round });

        events.push({
          id: `evt-pen-h-${round}-${hTaker.id}`,
          minute: 120,
          type: hScored ? 'PENALTY_SCORED' : 'PENALTY_SAVED',
          teamId: homeTeam.id,
          teamName: homeTeam.name,
          playerId: hTaker.id,
          playerName: hTaker.name,
          description: hScored
            ? `⚽ PENALTY SCORED (Round ${round}): ${hTaker.name} puts it away for ${homeTeam.name}! [Shootout: ${homePenScore}-${awayPenScore}]`
            : `❌ PENALTY SAVED (Round ${round}): ${awayGk.name} dives and saves ${hTaker.name}'s penalty! [Shootout: ${homePenScore}-${awayPenScore}]`
        });

        // Away shot vs Home GK
        const aShootSkill = aTaker.shooting || aTaker.overall || 75;
        const aScoreProb = Math.min(0.88, Math.max(0.60, 0.74 + (aShootSkill - 80) * 0.015 - (homeGkRating - 80) * 0.012));
        const aScored = Math.random() < aScoreProb;
        if (aScored) awayPenScore++;
        awayShotsList.push({ playerId: aTaker.id, playerName: aTaker.name, scored: aScored, round });

        events.push({
          id: `evt-pen-a-${round}-${aTaker.id}`,
          minute: 120,
          type: aScored ? 'PENALTY_SCORED' : 'PENALTY_SAVED',
          teamId: awayTeam.id,
          teamName: awayTeam.name,
          playerId: aTaker.id,
          playerName: aTaker.name,
          description: aScored
            ? `⚽ PENALTY SCORED (Round ${round}): ${aTaker.name} converts for ${awayTeam.name}! [Shootout: ${homePenScore}-${awayPenScore}]`
            : `❌ PENALTY SAVED (Round ${round}): ${homeGk.name} brilliantly stops ${aTaker.name}'s spot kick! [Shootout: ${homePenScore}-${awayPenScore}]`
        });
      }

      // Sudden death if tied after 5 rounds!
      let suddenDeathRound = 6;
      while (homePenScore === awayPenScore && suddenDeathRound <= 12) {
        const hTaker = homeTakers[(suddenDeathRound - 1) % homeTakers.length] || homeStarting[0];
        const aTaker = awayTakers[(suddenDeathRound - 1) % awayTakers.length] || awayStarting[0];

        const hScoreProb = 0.72 + (hTaker.overall - 80) * 0.012 - (awayGkRating - 80) * 0.010;
        const aScoreProb = 0.72 + (aTaker.overall - 80) * 0.012 - (homeGkRating - 80) * 0.010;

        const hScored = Math.random() < Math.min(0.85, Math.max(0.55, hScoreProb));
        const aScored = Math.random() < Math.min(0.85, Math.max(0.55, aScoreProb));

        if (hScored) homePenScore++;
        if (aScored) awayPenScore++;

        homeShotsList.push({ playerId: hTaker.id, playerName: hTaker.name, scored: hScored, round: suddenDeathRound });
        awayShotsList.push({ playerId: aTaker.id, playerName: aTaker.name, scored: aScored, round: suddenDeathRound });

        events.push({
          id: `evt-pen-sd-${suddenDeathRound}`,
          minute: 120,
          type: (hScored && !aScored) || (!hScored && aScored) ? 'PENALTY_SCORED' : 'PENALTY_SAVED',
          description: `⚡ Sudden Death Round ${suddenDeathRound}: ${homeTeam.name} ${hScored ? '✓' : '✗'} - ${awayTeam.name} ${aScored ? '✓' : '✗'} [Shootout: ${homePenScore}-${awayPenScore}]`
        });

        suddenDeathRound++;
      }

      // If still tied after 12 rounds, force decisive winner based on star goalkeeper/overall
      if (homePenScore === awayPenScore) {
        if (homeOverall >= awayOverall) homePenScore++;
        else awayPenScore++;
      }

      penaltyScore = { home: homePenScore, away: awayPenScore };
      penaltyShootout = { homeShots: homeShotsList, awayShots: awayShotsList };

      const shootoutWinner = homePenScore > awayPenScore ? homeTeam.name : awayTeam.name;
      events.push({
        id: `evt-120-penalties-winner`,
        minute: 120,
        type: 'FULLTIME',
        description: `🏆 ${shootoutWinner} WINS ON PENALTIES! (${homePenScore} - ${awayPenScore}) to claim victory in the decider!`
      });
    }
  }

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
    completed: true,
    wentToExtraTime,
    wentToPenalties,
    isDecider: options?.isDecider,
    regularTimeScore,
    penaltyScore,
    penaltyShootout,
  };
}
