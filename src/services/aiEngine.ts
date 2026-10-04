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

export const ABSOLUTE_MAX_AI_BID = 21;

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
    maxBidCap: 17,
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
    overpayThreshold: 1.15,
    maxBidCap: 21,
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
    maxBidCap: 15,
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
    overpayThreshold: 1.10,
    maxBidCap: 18,
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
      // Must have at least 1 goalkeeper!
      return personality === 'analytical' ? 1.35 : 1.25;
    }
    // Already has a goalkeeper: heavily deprioritize spending on a backup GK
    return 0.15;
  }

  // 2. Outfield positions
  let count = 0;
  let target = 2;

  if (position === 'DEF') {
    count = defCount;
    target = 2;
  } else if (position === 'MID') {
    count = midCount;
    target = 2;
  } else if (position === 'ATT') {
    count = attCount;
    target = 2;
  }

  if (count === 0) {
    return personality === 'analytical' ? 1.25 : 1.2;
  }
  if (count === 1) {
    return 1.05;
  }
  if (count >= 3) {
    return 0.7;
  }
  if (count >= 4) {
    return 0.35;
  }

  return 1.0;
}

/**
 * Calculates the AI's maximum valuation for a footballer.
 */
export function calculateAIMaxWillingBid(
  player: Player,
  currentBudget: number,
  squad: Player[],
  ai: AIPersonality
): number {
  if (squad.length >= 10) return 0;

  // Reserve budget to guarantee reaching the minimum 7 players (€5M reserve per remaining slot)
  const neededToMinSquad = Math.max(0, 7 - squad.length - 1);
  const reserveForOthers = neededToMinSquad * 5;
  const maxSpendable = Math.max(0, currentBudget - reserveForOthers);

  if (maxSpendable < 5) return 0;

  const ovr = player.overall || 75;

  // Realistic competitive valuation curve across player ratings:
  // 92+ OVR (Messi, Ronaldo): €17M - €21M
  // 90-91 OVR (Rodri, Mbappe, Haaland): €13.5M - €16.5M
  // 86-89 OVR (Van Dijk, Saka, Odegaard): €10M - €13M
  // 82-85 OVR (Solid starters): €7M - €9.5M
  // 78-81 OVR (Squad depth): €5M - €7M
  // < 78 OVR: €5M - €6M
  let baseValue = 5;
  if (ovr >= 92) {
    baseValue = 17 + (ovr - 92) * 1.5; // 92 -> 17M, 94 -> 20M
  } else if (ovr >= 90) {
    baseValue = 13.5 + (ovr - 90) * 1.5; // 90 -> 13.5M, 91 -> 15M (Rodri)
  } else if (ovr >= 86) {
    baseValue = 10 + (ovr - 86) * 0.9;  // 86 -> 10M, 89 -> 12.7M
  } else if (ovr >= 82) {
    baseValue = 7 + (ovr - 82) * 0.7;   // 82 -> 7M, 85 -> 9.1M
  } else if (ovr >= 78) {
    baseValue = 5.5 + (ovr - 78) * 0.35;// 78 -> 5.5M, 81 -> 6.5M
  } else {
    baseValue = 5;
  }

  // Positional need multiplier (urgent GK if 0 GKs, or balanced outfield)
  const needMultiplier = calculatePositionNeed(player.position, squad, ai.type);

  // Personality adjustments:
  let personalityMultiplier = 1.0;
  if (ai.type === 'aggressive') {
    personalityMultiplier = 1.08;
  } else if (ai.type === 'analytical') {
    personalityMultiplier = 0.92;
  } else if (ai.type === 'unpredictable') {
    personalityMultiplier = 0.92 + Math.random() * 0.16;
  }

  const rawVal = baseValue * needMultiplier * personalityMultiplier;

  // Strict hard ceiling: never exceed botCap or ABSOLUTE_MAX_AI_BID (21M)
  const botCap = Math.min(ai.maxBidCap || ABSOLUTE_MAX_AI_BID, ABSOLUTE_MAX_AI_BID);
  const finalBidCap = Math.min(Math.round(rawVal), maxSpendable, currentBudget, botCap);
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

  let interest: 'PASSING' | 'CASUAL' | 'TARGETING' = 'TARGETING';

  if (squad.length >= 10 || (pos === 'GK' && gkCount >= 1) || posCount >= 3) {
    interest = 'PASSING';
  } else {
    const roll = Math.random();
    if (ovr >= 90) {
      // 90+ stars (Rodri, Mbappe, etc.): 90% interested! (65% targeting, 25% casual, only 10% pass)
      if (roll < 0.10) interest = 'PASSING';
      else if (roll < 0.35) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else if (ovr >= 85) {
      // 85-89 solid starters: 80% interested (50% targeting, 30% casual, 20% pass)
      if (roll < 0.20) interest = 'PASSING';
      else if (roll < 0.50) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else if (ovr >= 80) {
      // 80-84 mid-tier: 55% interested (35% casual, 20% targeting, 45% pass)
      if (roll < 0.45) interest = 'PASSING';
      else if (roll < 0.80) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else {
      // < 80 depth: 30% interested (70% pass -> easy bargains for user!)
      if (roll < 0.70) interest = 'PASSING';
      else interest = 'CASUAL';
    }
  }

  const calculatedMax = calculateAIMaxWillingBid(player, currentBudget, squad, bot);
  let maxWilling = calculatedMax;

  if (interest === 'PASSING') {
    maxWilling = 0;
  } else if (interest === 'CASUAL') {
    // Casual bidders drop out early (€6M - €11M max)
    const casualCeiling = Math.min(11, 5 + Math.round((ovr - 75) * 0.35));
    maxWilling = Math.min(calculatedMax, casualCeiling);
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

  // Natural back-out when approaching bot's limit or in bidding battle:
  if (isUserLeading) {
    // 1. If current bid is very close to bot's max valuation (within €1M), high chance to let user have it
    const diffToMax = stance.maxWilling - minRequiredBid;
    if (diffToMax <= 1 && Math.random() < 0.65) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }

    // 2. If bot already bid 3+ times against user on this player, yield respectfully
    if (stance.bidsPlaced >= 3 && Math.random() < 0.75) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }

    // 3. For lower-rated players (<= 82 OVR), give user high bargain chance (60% concession)
    if ((player.overall || 75) <= 82 && Math.random() < 0.60) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }
  }

  // Calculate realistic, incremental bid (+1M or +2M)
  let bidToPlace = minRequiredBid;
  // Mark or Ron sometimes place a +2M bid on elite stars (90+) to show authority, but never above maxWilling
  if ((player.overall || 75) >= 90 && (ai.type === 'aggressive' || ai.type === 'unpredictable') && Math.random() < 0.25) {
    const jump = minRequiredBid + 1;
    if (jump <= stance.maxWilling && jump <= aiTeam.budget && jump <= botCap) {
      bidToPlace = jump;
    }
  }

  // Safety clamps
  bidToPlace = Math.min(bidToPlace, stance.maxWilling, aiTeam.budget, botCap, ABSOLUTE_MAX_AI_BID);
  if (bidToPlace < minRequiredBid) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Record that bot placed a bid
  stance.bidsPlaced += 1;

  // Realistic human delay
  const baseDelay = ai.minDelayMs + Math.random() * (ai.maxDelayMs - ai.minDelayMs);
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
