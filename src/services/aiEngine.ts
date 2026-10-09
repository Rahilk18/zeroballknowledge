import type { Player, PlayerPosition, Team } from '../types';

export type AIPersonalityType = 'balanced' | 'aggressive' | 'analytical' | 'unpredictable';

export interface AIPersonality {
  id: string;
  name: string;
  teamName: string;
  shortCode: string;
  badgeIcon: string;
  type: AIPersonalityType;
  description: string;
  minDelayMs: number;
  maxDelayMs: number;
  aggressionRate: number;
  overpayThreshold: number;
  maxBidCap: number;
  leniencyRate: number;
}

export const ABSOLUTE_MAX_AI_BID = 30;

export const AI_BOTS: AIPersonality[] = [
  {
    id: 'ai-steve',
    name: 'Steve',
    teamName: 'Steve FC',
    shortCode: 'STV',
    badgeIcon: '🦁',
    type: 'balanced',
    description: 'Balanced manager who makes sensible bids and values overall team harmony.',
    minDelayMs: 900,
    maxDelayMs: 2200,
    aggressionRate: 0.5,
    overpayThreshold: 1.05,
    maxBidCap: 28,
    leniencyRate: 0.55,
  },
  {
    id: 'ai-mark',
    name: 'Mark',
    teamName: 'Mark United',
    shortCode: 'MRK',
    badgeIcon: '⚡',
    type: 'aggressive',
    description: 'Aggressive spender who loves elite superstars and enters intense bidding wars.',
    minDelayMs: 600,
    maxDelayMs: 1800,
    aggressionRate: 0.85,
    overpayThreshold: 1.10,
    maxBidCap: 30,
    leniencyRate: 0.35,
  },
  {
    id: 'ai-joseph',
    name: 'Joseph',
    teamName: 'Joseph City',
    shortCode: 'JSP',
    badgeIcon: '🎯',
    type: 'analytical',
    description: 'Analytical and price-conscious tactician who strictly prioritizes squad gaps.',
    minDelayMs: 1400,
    maxDelayMs: 3200,
    aggressionRate: 0.35,
    overpayThreshold: 0.95,
    maxBidCap: 26,
    leniencyRate: 0.65,
  },
  {
    id: 'ai-ron',
    name: 'Ron',
    teamName: 'Ron Rovers',
    shortCode: 'RON',
    badgeIcon: '🐺',
    type: 'unpredictable',
    description: 'Unpredictable strategist who can launch surprise raids or save silently.',
    minDelayMs: 800,
    maxDelayMs: 2800,
    aggressionRate: 0.65,
    overpayThreshold: 1.05,
    maxBidCap: 29,
    leniencyRate: 0.45,
  },
];

export interface AIDecision {
  shouldBid: boolean;
  bidAmount: number;
  delayMs: number;
  thinkingMessage: string;
  reason?: string;
}

/**
 * Calculates how urgently an AI team needs a given position based on its current squad.
 */
export function calculatePositionNeed(
  position: PlayerPosition,
  squad: Player[],
  personality: AIPersonalityType
): number {
  const gkCount = squad.filter(p => p.position === 'GK').length;
  const defCount = squad.filter(p => p.position === 'DEF').length;
  const midCount = squad.filter(p => p.position === 'MID').length;
  const attCount = squad.filter(p => p.position === 'ATT').length;

  // 1. Goalkeeper priority
  if (position === 'GK') {
    if (gkCount === 0) {
      // Must have at least 1 goalkeeper! High urgency as squad progresses
      return squad.length >= 4 ? 1.45 : (personality === 'analytical' ? 1.35 : 1.25);
    }
    // If squad has fewer than 7 players, do NOT draft a backup GK yet!
    if (squad.length < 7) {
      return 0.05;
    }
    // Squad has >= 7 players, can consider affordable backup
    return 0.60;
  }

  // 2. Outfield positions
  let count = 0;
  if (position === 'DEF') count = defCount;
  else if (position === 'MID') count = midCount;
  else if (position === 'ATT') count = attCount;

  if (count === 0) {
    // If team has 0 players in this outfield position, urgent starter need!
    return squad.length >= 4 ? 1.35 : (personality === 'analytical' ? 1.25 : 1.20);
  }
  if (count === 1) {
    return 1.10;
  }
  if (count === 2) {
    // If squad < 7, team has already filled its 2 starters for this position; do not draft a 3rd yet!
    return squad.length < 7 ? 0.05 : 0.85;
  }
  if (count === 3) {
    return squad.length < 7 ? 0.05 : 0.70;
  }
  if (count >= 4) {
    return 0.30;
  }

  return 1.0;
}

/**
 * Strict tier boundaries matching user specification:
 * - 92+ OVR (Messi, Ronaldo): max like €30M [€24M, €30M]
 * - 90–91 OVR (Rodri, Mbappe, Haaland): 25-30 million [€19M, €27M]
 * - 85–89 OVR (Saka, Van Dijk): [€11M, €17M]
 * - 80–84 OVR (Mid-tier): [€7M, €9M]
 * - < 80 OVR (Squad depth): [€5M, €7M]
 */
export function getTierBounds(ovr: number): { tierFloor: number; tierCeiling: number } {
  if (ovr >= 92) return { tierFloor: 24, tierCeiling: 30 };
  if (ovr >= 90) return { tierFloor: 19, tierCeiling: 27 };
  if (ovr >= 85) return { tierFloor: 11, tierCeiling: 17 };
  if (ovr >= 80) return { tierFloor: 7, tierCeiling: 9 };
  return { tierFloor: 5, tierCeiling: 7 };
}

/**
 * Calculates the AI's maximum valuation for a footballer with strict purse preservation
 * to guarantee that bots have sufficient funds to complete at least 7 players.
 */
export function calculateAIMaxWillingBid(
  player: Player,
  currentBudget: number,
  squad: Player[],
  ai: AIPersonality
): number {
  if (squad.length >= 10) return 0;

  const pos = player.position;
  const gkCount = squad.filter(p => p.position === 'GK').length;

  // Rule 1: Never draft a backup GK or excess outfield position when squad has fewer than 7 players.
  // Core 7-a-side starting lineup strictly requires: 1 GK, 2 DEF, 2 MID, 2 ATT (total 7 players).
  if (squad.length < 7) {
    if (pos === 'GK' && gkCount >= 1) return 0;
    const posCount = squad.filter(p => p.position === pos).length;
    if (posCount >= 2) return 0;
  }

  // Rule 2: Strict Purse Reserve to guarantee completing at least 7 players
  const neededSlots = Math.max(0, 7 - squad.length);
  const futureSlotsAfterThis = Math.max(0, neededSlots - 1);

  // Absolute non-negotiable floor: each remaining future slot MUST have at least €5.0M
  const absoluteFloorReserve = futureSlotsAfterThis * 5.0;

  // Safe dynamic reserve: when purse allows, protect €6.5M per future slot
  const preferredReserve = futureSlotsAfterThis * (futureSlotsAfterThis >= 3 ? 7.0 : 6.0);

  // Safe reserve to use:
  const safeReserve = currentBudget >= (preferredReserve + 5.0)
    ? preferredReserve
    : absoluteFloorReserve;

  const maxSpendable = Math.max(0, currentBudget - safeReserve);

  // If bot cannot even afford starting bid (5M) without violating future slots reserve, cannot bid
  if (maxSpendable < 5) return 0;

  const ovr = player.overall || 75;
  const { tierFloor, tierCeiling } = getTierBounds(ovr);

  // Calibrated strictly to user specifications:
  // - 92+ (Ronaldo, Messi): max like 30M [24M - 30M]
  // - 90-91 (Rodri, Mbappe, Haaland): 25-30M [19M - 27M]
  // - 85-89 (Saka, Van Dijk): [11M - 17M]
  // - 80-84 (Mid-tier): [7M - 9M]
  // - <80 (Squad depth): [5M - 7M]
  let baseValue = tierFloor;
  if (ovr >= 92) {
    baseValue = 26 + Math.min(4, (ovr - 92) * 2.0);
  } else if (ovr >= 90) {
    baseValue = 21 + (ovr - 90) * 3.0;
  } else if (ovr >= 85) {
    baseValue = 12 + (ovr - 85) * 1.2;
  } else if (ovr >= 80) {
    baseValue = 7 + (ovr - 80) * 0.45;
  } else {
    baseValue = 5 + Math.max(0, ovr - 75) * 0.35;
  }

  // Positional need multiplier:
  const needMultiplier = calculatePositionNeed(player.position, squad, ai.type);

  // Personality adjustments:
  let personalityMultiplier = 1.0;
  if (ai.type === 'aggressive') {
    personalityMultiplier = 1.04; // Mark pushes slightly higher but capped strictly at 30
  } else if (ai.type === 'analytical') {
    personalityMultiplier = 0.95; // Joseph is thrifty near lower end
  } else if (ai.type === 'unpredictable') {
    personalityMultiplier = 0.96 + Math.random() * 0.08;
  }

  const rawVal = baseValue * needMultiplier * personalityMultiplier;

  // Strictly clamp within user-specified tier bounds:
  let clampedTierVal = Math.min(tierCeiling, Math.max(tierFloor, Math.round(rawVal)));

  // Rule 3: Superstar Quota (Max 2 tier-1 90+ players at premium price per bot)
  const eliteCount = squad.filter(p => (p.overall || 75) >= 90).length;
  if (ovr >= 90 && eliteCount >= 2) {
    // Already has 2 superstars (e.g. Messi & Ronaldo). Don't blow another 25-30M!
    clampedTierVal = Math.min(clampedTierVal, 14);
  }

  // Rule 4: Star Depth Quota (Max 4 players rated 85+ before hitting 7 players)
  const highTierCount = squad.filter(p => (p.overall || 75) >= 85).length;
  if (highTierCount >= 4 && squad.length < 7) {
    clampedTierVal = Math.min(clampedTierVal, 11);
  }

  // Rule 5: Dynamic slot budget ceiling to prevent draining purse on any single card
  if (squad.length < 7) {
    const averageRemainingPerSlot = currentBudget / neededSlots;
    const maxAllowedMultiplier = futureSlotsAfterThis >= 4 ? 2.4 : futureSlotsAfterThis >= 2 ? 1.7 : 1.35;
    const dynamicSlotLimit = Math.max(5, Math.floor(averageRemainingPerSlot * maxAllowedMultiplier));
    clampedTierVal = Math.min(clampedTierVal, dynamicSlotLimit);
  }

  // Strict hard ceiling: never exceed botCap or ABSOLUTE_MAX_AI_BID (30M)
  const botCap = Math.min(ai.maxBidCap || ABSOLUTE_MAX_AI_BID, ABSOLUTE_MAX_AI_BID);
  const finalBidCap = Math.min(clampedTierVal, maxSpendable, currentBudget, botCap);
  return Math.max(0, finalBidCap);
}

export interface BotAuctionStance {
  interest: 'PASSING' | 'CASUAL' | 'TARGETING';
  maxWilling: number;
  concededToUser: boolean;
  bidsPlaced: number;
}

const botStancesByAuction = new Map<string, Map<string, BotAuctionStance>>();

export function resetAiStancesForAuction(auctionId: string) {
  botStancesByAuction.delete(auctionId);
}

export function getOrInitBotStance(
  auctionId: string,
  bot: AIPersonality,
  player: Player,
  currentBudget: number,
  squad: Player[]
): BotAuctionStance {
  // Prune map if getting too large
  if (botStancesByAuction.size > 8) {
    const oldestKey = botStancesByAuction.keys().next().value;
    if (oldestKey) botStancesByAuction.delete(oldestKey);
  }

  if (!botStancesByAuction.has(auctionId)) {
    botStancesByAuction.set(auctionId, new Map());
  }

  const auctionMap = botStancesByAuction.get(auctionId)!;
  if (auctionMap.has(bot.id)) {
    return auctionMap.get(bot.id)!;
  }

  const ovr = player.overall || 75;
  const pos = player.position;
  const gkCount = squad.filter(p => p.position === 'GK').length;
  const posCount = squad.filter(p => p.position === pos).length;
  const eliteCount = squad.filter(p => (p.overall || 75) >= 90).length;

  let interest: 'PASSING' | 'CASUAL' | 'TARGETING' = 'TARGETING';

  // Position quota check for balanced 7-a-side team building:
  // GK: max 1 until squad reaches 7 players; max 2 once 7 players secured
  // Outfield: max 2 starters per position initially (1 GK + 2 DEF + 2 MID + 2 ATT = 7); max 4 once 7 players secured for squad depth
  const isPosFull =
    (pos === 'GK' && gkCount >= (squad.length < 7 ? 1 : 2)) ||
    (pos === 'DEF' && posCount >= (squad.length < 7 ? 2 : 4)) ||
    (pos === 'MID' && posCount >= (squad.length < 7 ? 2 : 4)) ||
    (pos === 'ATT' && posCount >= (squad.length < 7 ? 2 : 4));

  if (squad.length >= 10 || isPosFull) {
    interest = 'PASSING';
  } else if (pos === 'GK' && gkCount >= 1 && squad.length < 7) {
    // Already has starting keeper; must focus on completing outfield starters
    interest = 'PASSING';
  } else if (pos !== 'GK' && posCount >= 2 && squad.length < 7) {
    // Already has 2 starters in this outfield position; must save remaining slots for deficient positions
    interest = 'PASSING';
  } else {
    // Actively go for players that build a strong team and complete minimum 7:
    if (ovr >= 90) {
      if (eliteCount >= 2) {
        // Already has 2 superstars: only casually bid if bargain
        interest = 'CASUAL';
      } else {
        interest = 'TARGETING';
      }
    } else if (ovr >= 85) {
      interest = 'TARGETING';
    } else if (ovr >= 80) {
      if (squad.length < 7) {
        // Starters needed to reach minimum 7: actively target!
        interest = 'TARGETING';
      } else {
        const roll = Math.random();
        interest = roll < 0.20 ? 'PASSING' : roll < 0.50 ? 'CASUAL' : 'TARGETING';
      }
    } else {
      // < 80 Squad depth:
      if (squad.length < 7) {
        // Emergency squad completion mode:
        // If team still needs players and budget is tight or position is needed, TARGET them!
        const neededSlots = 7 - squad.length;
        if (currentBudget <= neededSlots * 9 || posCount < 2 || gkCount === 0) {
          interest = 'TARGETING';
        } else {
          interest = 'CASUAL';
        }
      } else {
        const roll = Math.random();
        interest = roll < 0.35 ? 'PASSING' : 'CASUAL';
      }
    }
  }

  const { tierFloor, tierCeiling } = getTierBounds(ovr);
  const calculatedMax = calculateAIMaxWillingBid(player, currentBudget, squad, bot);
  let maxWilling = calculatedMax;

  if (interest === 'PASSING') {
    maxWilling = 0;
  } else if (interest === 'CASUAL') {
    // Casual bidders drop out slightly earlier in the tier range
    const casualSpread = Math.max(1, Math.round((tierCeiling - tierFloor) * 0.50));
    const casualCeiling = Math.max(tierFloor, Math.min(calculatedMax, tierFloor + casualSpread));
    maxWilling = Math.min(casualCeiling, calculatedMax);
  }

  const stance: BotAuctionStance = {
    interest,
    maxWilling,
    concededToUser: false,
    bidsPlaced: 0,
  };

  auctionMap.set(bot.id, stance);
  return stance;
}

/**
 * Decides whether the AI should submit a bid right now, how much, and after what delay.
 */
export function evaluateAIBid(
  player: Player,
  currentBid: number,
  startingPrice: number,
  highestTeamId: string | null | undefined,
  aiTeam: Team,
  aiSquad: Player[],
  ai: AIPersonality,
  auctionId: string = 'default'
): AIDecision {
  // If this AI is already the highest bidder, never bid against itself
  if (highestTeamId && highestTeamId === aiTeam.id) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // If squad full
  if (aiSquad.length >= 10) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Retrieve or initialize this bot's stance for the auction lot
  const stance = getOrInitBotStance(auctionId, ai, player, aiTeam.budget, aiSquad);

  // If decided to pass or already conceded
  if (stance.interest === 'PASSING' || stance.concededToUser || stance.maxWilling <= 0) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const minRequiredBid = currentBid > 0 ? currentBid + 1 : (startingPrice || 5);
  const botCap = Math.min(ai.maxBidCap || ABSOLUTE_MAX_AI_BID, ABSOLUTE_MAX_AI_BID);

  // If current required bid exceeds botCap or absolute ceiling, bot stops and backs out
  if (minRequiredBid > botCap || minRequiredBid > ABSOLUTE_MAX_AI_BID) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // If current price exceeds this bot's valuation, bot stops and backs out!
  if (minRequiredBid > stance.maxWilling || minRequiredBid > aiTeam.budget) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const isUserLeading = Boolean(highestTeamId && !highestTeamId.startsWith('ai-'));

  // Natural back-out & competitive duel logic:
  if (isUserLeading) {
    const isEliteCard = (player.overall || 75) >= 85;

    if (isEliteCard) {
      // For top cards (85+ OVR), stay competitive! Never concede prematurely below maximum willing valuation
      if (minRequiredBid > stance.maxWilling) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
      // After a fierce 5+ round battle, slight 20% chance of conceding if within 1M of ceiling
      if (stance.bidsPlaced >= 5 && stance.maxWilling - minRequiredBid <= 1 && Math.random() < 0.20) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
    } else {
      // For mid-tier and squad depth (< 85 OVR):
      if (minRequiredBid > stance.maxWilling) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }

      // If already bid 4+ times and squad already has minimum 7 players, give user a chance to win the bargain
      if (aiSquad.length >= 7 && stance.bidsPlaced >= 4 && Math.random() < 0.40) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
    }
  }

  // Calculate realistic, competitive bid increase:
  let bidToPlace = minRequiredBid;
  const ovr = player.overall || 75;
  const gapToValuation = stance.maxWilling - minRequiredBid;

  // Realistic bidding increments (mostly +1M, occasional +2M on elite cards when large gap):
  if (gapToValuation >= 8 && ovr >= 85 && Math.random() < 0.30) {
    const candidateBid = minRequiredBid + 1;
    if (candidateBid <= stance.maxWilling && candidateBid <= aiTeam.budget && candidateBid <= botCap) {
      bidToPlace = candidateBid;
    }
  }

  // Safety clamps
  bidToPlace = Math.min(bidToPlace, stance.maxWilling, aiTeam.budget, botCap, ABSOLUTE_MAX_AI_BID);
  if (bidToPlace < minRequiredBid) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Record that bot placed a bid
  stance.bidsPlaced += 1;

  // Opening bids are placed promptly (450ms - 950ms); subsequent counter-bids follow human pacing
  const isOpeningBid = currentBid === 0;
  const baseDelay = isOpeningBid
    ? 450 + Math.random() * 500
    : ai.minDelayMs + Math.random() * (ai.maxDelayMs - ai.minDelayMs);
  const delayMs = Math.round(baseDelay);

  // Thinking messages
  const thinkingTemplates = [
    `${ai.name} is considering a bid...`,
    `${ai.name} is evaluating squad fit...`,
    `${ai.name} is calculating valuation...`,
    `${ai.name} is preparing a counter-bid...`,
  ];
  const thinkingMessage = thinkingTemplates[Math.floor(Math.random() * thinkingTemplates.length)];

  return {
    shouldBid: true,
    bidAmount: bidToPlace,
    delayMs,
    thinkingMessage,
  };
}

/**
 * Automatically selects the best 7-player lineup for an AI team from its acquired squad.
 */
export function selectAiStartingSeven(squadPlayers: Player[]): {
  startingSeven: string[];
  bench: string[];
  formation: string;
} {
  if (squadPlayers.length === 0) {
    return { startingSeven: [], bench: [], formation: '1-2-2-2' };
  }

  const gks = squadPlayers.filter(p => p.position === 'GK').sort((a, b) => b.overall - a.overall);
  const defs = squadPlayers.filter(p => p.position === 'DEF').sort((a, b) => b.overall - a.overall);
  const mids = squadPlayers.filter(p => p.position === 'MID').sort((a, b) => b.overall - a.overall);
  const atts = squadPlayers.filter(p => p.position === 'ATT').sort((a, b) => b.overall - a.overall);

  const selectedStarting: Player[] = [];
  const remainingOutfield: Player[] = [];

  // Pick 1 goalkeeper
  if (gks.length > 0) {
    selectedStarting.push(gks[0]);
    remainingOutfield.push(...gks.slice(1));
  }

  // Target 2 DEF, 2 MID, 2 ATT for balanced 7-a-side
  if (defs.length > 0) selectedStarting.push(defs[0]);
  if (defs.length > 1) selectedStarting.push(defs[1]);
  remainingOutfield.push(...defs.slice(2));

  if (mids.length > 0) selectedStarting.push(mids[0]);
  if (mids.length > 1) selectedStarting.push(mids[1]);
  remainingOutfield.push(...mids.slice(2));

  if (atts.length > 0) selectedStarting.push(atts[0]);
  if (atts.length > 1) selectedStarting.push(atts[1]);
  remainingOutfield.push(...atts.slice(2));

  // If we still have fewer than 7 starters, fill with best remaining players by overall
  remainingOutfield.sort((a, b) => b.overall - a.overall);
  while (selectedStarting.length < 7 && remainingOutfield.length > 0) {
    selectedStarting.push(remainingOutfield.shift()!);
  }

  // If squad has fewer than 7 players overall, put all in starting
  if (selectedStarting.length < 7) {
    const currentIds = new Set(selectedStarting.map(p => p.id));
    for (const p of squadPlayers) {
      if (!currentIds.has(p.id) && selectedStarting.length < 7) {
        selectedStarting.push(p);
      }
    }
  }

  const startingSevenIds = selectedStarting.map(p => p.id);
  const startingSet = new Set(startingSevenIds);
  const benchIds = squadPlayers.filter(p => !startingSet.has(p.id)).map(p => p.id);

  return {
    startingSeven: startingSevenIds,
    bench: benchIds,
    formation: '1-2-2-2',
  };
}
