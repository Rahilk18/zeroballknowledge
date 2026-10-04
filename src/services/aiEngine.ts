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

export const ABSOLUTE_MAX_AI_BID = 27;

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
    maxBidCap: 24,
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
    maxBidCap: 27,
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
    maxBidCap: 20,
    leniencyRate: 0.70,
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
    maxBidCap: 25,
    leniencyRate: 0.50,
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

  // Base valuation curve based on overall rating (75 to 94)
  // Tuned for a 130M budget so bids stay strictly in the €5M - €27M range
  const ovr = player.overall || 75;
  let baseValue = 5;
  if (ovr >= 92) {
    baseValue = 20 + (ovr - 92) * 1.5; // 92 OVR -> 20M, 94 OVR -> 23M
  } else if (ovr >= 89) {
    baseValue = 16 + (ovr - 89) * 1.2; // 89 OVR -> 16M, 91 OVR -> 18.4M
  } else if (ovr >= 86) {
    baseValue = 12 + (ovr - 86) * 1.0; // 86 OVR -> 12M, 88 OVR -> 14M
  } else if (ovr >= 82) {
    baseValue = 8 + (ovr - 82) * 0.8;  // 82 OVR -> 8M, 85 OVR -> 10.4M
  } else {
    baseValue = 5 + Math.max(0, ovr - 75) * 0.4; // 75 OVR -> 5M, 81 OVR -> 7.4M
  }

  // Positional need multiplier
  const needMultiplier = calculatePositionNeed(player.position, squad, ai.type);

  // Personality adjustments
  let personalityMultiplier = ai.overpayThreshold;
  if (ai.type === 'aggressive') {
    // Mark pushes up toward his cap on 88+ stars
    if (ovr >= 88) personalityMultiplier += 0.08;
  } else if (ai.type === 'analytical') {
    // Joseph is frugal and looks for bargains
    personalityMultiplier = ovr >= 90 ? 0.95 : 1.02;
  } else if (ai.type === 'unpredictable') {
    // Ron varies between 0.85 and 1.10
    personalityMultiplier = 0.85 + Math.random() * 0.25;
  }

  const rawVal = baseValue * needMultiplier * personalityMultiplier;

  // Cap strictly at AI personality max cap and absolute max cap of 27M
  const botCap = ai.maxBidCap || ABSOLUTE_MAX_AI_BID;
  const hardCeiling = Math.min(botCap, ABSOLUTE_MAX_AI_BID);

  // Never exceed spendable budget or hard ceiling
  const finalBidCap = Math.min(Math.round(rawVal), maxSpendable, currentBudget, hardCeiling);
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

  let interest: 'PASSING' | 'CASUAL' | 'TARGETING' = 'CASUAL';

  if (squad.length >= 10) {
    interest = 'PASSING';
  } else if (pos === 'GK' && gkCount >= 1) {
    interest = 'PASSING';
  } else if (posCount >= 4) {
    interest = 'PASSING';
  } else {
    const roll = Math.random();
    if (ovr < 82) {
      if (roll < 0.50) interest = 'PASSING';
      else if (roll < 0.85) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else if (ovr <= 87) {
      if (roll < 0.35) interest = 'PASSING';
      else if (roll < 0.70) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else if (ovr <= 90) {
      if (roll < 0.20) interest = 'PASSING';
      else if (roll < 0.55) interest = 'CASUAL';
      else interest = 'TARGETING';
    } else {
      if (bot.type === 'analytical') {
        if (roll < 0.30) interest = 'PASSING';
        else if (roll < 0.65) interest = 'CASUAL';
        else interest = 'TARGETING';
      } else if (bot.type === 'aggressive') {
        if (roll < 0.10) interest = 'PASSING';
        else if (roll < 0.30) interest = 'CASUAL';
        else interest = 'TARGETING';
      } else {
        if (roll < 0.15) interest = 'PASSING';
        else if (roll < 0.45) interest = 'CASUAL';
        else interest = 'TARGETING';
      }
    }
  }

  const calculatedMax = calculateAIMaxWillingBid(player, currentBudget, squad, bot);
  let maxWilling = calculatedMax;

  if (interest === 'PASSING') {
    maxWilling = 0;
  } else if (interest === 'CASUAL') {
    // Casual bidders drop out early (€6M - €14M depending on rating)
    const casualCeiling = Math.min(14, 6 + Math.round((ovr - 75) * 0.45));
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

  // If decided to pass or already conceded to the user
  if (stance.interest === 'PASSING' || stance.concededToUser || stance.maxWilling <= 0) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const minRequiredBid = currentBid > 0 ? currentBid + 1 : (startingPrice || 5);
  const botCap = Math.min(ai.maxBidCap || ABSOLUTE_MAX_AI_BID, ABSOLUTE_MAX_AI_BID);

  // Hard cap check: if min required bid exceeds 27M or bot cap, AI will not bid
  if (minRequiredBid > botCap || minRequiredBid > ABSOLUTE_MAX_AI_BID) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Current price is too expensive for this AI stance
  if (minRequiredBid > stance.maxWilling || minRequiredBid > aiTeam.budget) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const isUserLeading = Boolean(highestTeamId && !highestTeamId.startsWith('ai-'));

  // LENIENCY SYSTEM: Allow user to buy players for cheap and avoid endless bidding wars
  if (isUserLeading) {
    // 1. If casual interest, 75% chance to concede to the user immediately
    if (stance.interest === 'CASUAL' && Math.random() < 0.75) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }

    // 2. If bot already counter-bid the user once or twice, high chance to concede
    if (stance.bidsPlaced >= 1) {
      const dropChance = stance.bidsPlaced === 1 ? 0.55 : 0.85;
      if (Math.random() < dropChance) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
    }

    // 3. Low-bid bargain leniency: if current bid is cheap (<= 12M), roll to let user get the player cheap!
    if (currentBid <= 12) {
      const bargainChance = (player.overall || 75) <= 86 ? 0.60 : (ai.leniencyRate || 0.50);
      if (Math.random() < bargainChance) {
        stance.concededToUser = true;
        return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
      }
    }

    // 4. General leniency roll based on personality
    if (Math.random() < (ai.leniencyRate || 0.40) * 0.7) {
      stance.concededToUser = true;
      return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
    }
  }

  // Realistic bid increment
  let bidToPlace = minRequiredBid;
  // Mark or Ron sometimes jump by +1 on high-value targets if competing with another AI
  if (!isUserLeading && (ai.type === 'aggressive' || ai.type === 'unpredictable') && Math.random() < 0.2) {
    const jump = minRequiredBid + 1;
    if (jump <= stance.maxWilling && jump <= aiTeam.budget && jump <= botCap) {
      bidToPlace = jump;
    }
  }

  // Double safety: guarantee bidToPlace never exceeds 27M or botCap
  bidToPlace = Math.min(bidToPlace, stance.maxWilling, aiTeam.budget, botCap, ABSOLUTE_MAX_AI_BID);
  if (bidToPlace < minRequiredBid) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Track that this bot placed a bid in this auction lot
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
