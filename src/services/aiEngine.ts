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

export const ABSOLUTE_MAX_AI_BID = 22;

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
    maxBidCap: 18,
    leniencyRate: 0.60,
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
    maxBidCap: 22,
    leniencyRate: 0.40,
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
    maxBidCap: 16,
    leniencyRate: 0.75,
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
    maxBidCap: 19,
    leniencyRate: 0.55,
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
  const ovr = player.overall || 75;

  // ONLY top rated cards (88+ OVR) are actively bid on by AI!
  // All cards below 88 OVR are passed to let the user buy them for cheap.
  if (ovr < 88) {
    // If the team has zero goalkeepers, allow a modest bid up to €6M for a GK
    if (player.position === 'GK' && squad.filter(p => p.position === 'GK').length === 0) {
      return Math.min(6, currentBudget);
    }
    return 0; // 100% pass on all cards < 88 OVR!
  }

  if (squad.length >= 10) return 0;

  // Reserve budget to guarantee reaching the minimum 7 players (€5M reserve per remaining slot)
  const neededToMinSquad = Math.max(0, 7 - squad.length - 1);
  const reserveForOthers = neededToMinSquad * 5;
  const maxSpendable = Math.max(0, currentBudget - reserveForOthers);

  if (maxSpendable < 5) return 0;

  // Top rated cards valuation curve (88 to 94)
  // Max willing bids stay strictly in the €10M - €22M range
  let baseValue = 10;
  if (ovr >= 92) {
    baseValue = 17 + (ovr - 92) * 1.5; // 92 OVR -> 17M, 94 OVR -> 20M
  } else if (ovr >= 90) {
    baseValue = 13 + (ovr - 90) * 1.5; // 90 OVR -> 13M, 91 OVR -> 14.5M (Rodri ~ 14.5M!)
  } else {
    baseValue = 9 + (ovr - 88) * 1.5;  // 88 OVR -> 9M, 89 OVR -> 10.5M
  }

  // Positional need multiplier (0.8 to 1.15)
  const needMultiplier = calculatePositionNeed(player.position, squad, ai.type);

  // Personality adjustments
  let personalityMultiplier = 1.0;
  if (ai.type === 'aggressive') {
    personalityMultiplier = 1.08;
  } else if (ai.type === 'analytical') {
    personalityMultiplier = 0.92;
  } else if (ai.type === 'unpredictable') {
    personalityMultiplier = 0.90 + Math.random() * 0.18;
  }

  const rawVal = baseValue * needMultiplier * personalityMultiplier;

  // Strict hard ceiling: never exceed botCap or ABSOLUTE_MAX_AI_BID (22M)
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

  let interest: 'PASSING' | 'CASUAL' | 'TARGETING' = 'PASSING';

  // RULE: ONLY top rated cards (88+ OVR) the AI bids!
  // All cards below 88 OVR are 100% PASS so the user gets great deals for cheap.
  if (ovr < 88) {
    if (pos === 'GK' && gkCount === 0) {
      interest = 'CASUAL'; // only if desperately needing a goalkeeper
    } else {
      interest = 'PASSING';
    }
  } else if (squad.length >= 10 || (pos === 'GK' && gkCount >= 1) || posCount >= 3) {
    interest = 'PASSING';
  } else {
    // 88+ OVR top rated cards:
    const roll = Math.random();
    if (ovr >= 92) {
      if (roll < 0.25) interest = 'PASSING';
      else if (roll < 0.60) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else {
      // 88 - 91 OVR (like Rodri)
      if (roll < 0.40) interest = 'PASSING';
      else if (roll < 0.75) interest = 'CASUAL';
      else interest = 'TARGETING';
    }
  }

  const calculatedMax = calculateAIMaxWillingBid(player, currentBudget, squad, bot);
  let maxWilling = calculatedMax;

  if (interest === 'PASSING') {
    maxWilling = 0;
  } else if (interest === 'CASUAL') {
    // Casual bidders drop out very early (€6M - €12M max)
    const casualCeiling = Math.min(12, 6 + Math.round((ovr - 88) * 1.5));
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

  // 1. Strict cap: An AI bot can place AT MOST 2 BIDS per player auction!
  // If it already placed 2 bids, it ALWAYS backs out!
  if (stance.bidsPlaced >= 2) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // 2. If decided to pass or already conceded to the user
  if (stance.interest === 'PASSING' || stance.concededToUser || stance.maxWilling <= 0) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const minRequiredBid = currentBid > 0 ? currentBid + 1 : (startingPrice || 5);
  const botCap = Math.min(ai.maxBidCap || ABSOLUTE_MAX_AI_BID, ABSOLUTE_MAX_AI_BID);

  // Hard cap check: if min required bid exceeds 22M or bot cap, AI backs out immediately!
  if (minRequiredBid > botCap || minRequiredBid > ABSOLUTE_MAX_AI_BID) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Current price is too expensive for this AI stance: back out!
  if (minRequiredBid > stance.maxWilling || minRequiredBid > aiTeam.budget) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const isUserLeading = Boolean(highestTeamId && !highestTeamId.startsWith('ai-'));

  // BACK OUT LOGIC: Make sure the AI backs out frequently
  if (isUserLeading) {
    // A) If bot already counter-bid the user once: 85% chance to back out on user raise!
    if (stance.bidsPlaced >= 1) {
      if (Math.random() < 0.85) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
    }

    // B) If casual interest: 80% chance to back out immediately
    if (stance.interest === 'CASUAL' && Math.random() < 0.80) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }

    // C) Initial hesitation against user: 50% chance the bot never contests the user's bid
    if (Math.random() < 0.50) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }
  } else {
    // If competing with another AI bot and already bid once: 70% chance to back out
    if (stance.bidsPlaced >= 1 && Math.random() < 0.70) {
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }
  }

  // Place next bid
  let bidToPlace = minRequiredBid;

  // Never exceed botCap, stance.maxWilling, or ABSOLUTE_MAX_AI_BID (22M)
  bidToPlace = Math.min(bidToPlace, stance.maxWilling, aiTeam.budget, botCap, ABSOLUTE_MAX_AI_BID);
  if (bidToPlace < minRequiredBid) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Record that this bot placed a bid
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
