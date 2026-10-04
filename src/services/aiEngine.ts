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
}

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
    overpayThreshold: 1.25,
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
    overpayThreshold: 1.15,
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
      return personality === 'analytical' ? 1.85 : 1.6;
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
    return personality === 'analytical' ? 1.45 : 1.35;
  }
  if (count === 1) {
    return 1.15;
  }
  if (count >= 3) {
    return 0.75;
  }
  if (count >= 4) {
    return 0.4;
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

  // Reserve budget to guarantee reaching the minimum 7 players
  const neededToMinSquad = Math.max(0, 7 - squad.length - 1);
  const reserveForOthers = neededToMinSquad * 4; // €4M reserve per remaining slot
  const maxSpendable = Math.max(0, currentBudget - reserveForOthers);

  if (maxSpendable < 5) return 0;

  // Base valuation curve based on overall rating (75 to 94)
  const ovr = player.overall || 75;
  let baseValue = 10;
  if (ovr >= 92) {
    baseValue = 65 + (ovr - 92) * 12; // 65M - 89M
  } else if (ovr >= 89) {
    baseValue = 48 + (ovr - 89) * 5;  // 48M - 63M
  } else if (ovr >= 86) {
    baseValue = 34 + (ovr - 86) * 4;  // 34M - 46M
  } else if (ovr >= 82) {
    baseValue = 22 + (ovr - 82) * 3;  // 22M - 34M
  } else {
    baseValue = 10 + (ovr - 75) * 1.5; // 10M - 20M
  }

  // Positional need multiplier
  const needMultiplier = calculatePositionNeed(player.position, squad, ai.type);

  // Personality adjustments
  let personalityMultiplier = ai.overpayThreshold;
  if (ai.type === 'aggressive') {
    // Mark goes crazy for 88+ players
    if (ovr >= 88) personalityMultiplier += 0.15;
  } else if (ai.type === 'analytical') {
    // Joseph is frugal and looks for bargains
    personalityMultiplier = ovr >= 90 ? 0.95 : 1.05;
  } else if (ai.type === 'unpredictable') {
    // Ron varies between 0.85 and 1.25
    personalityMultiplier = 0.85 + Math.random() * 0.4;
  }

  const rawVal = baseValue * needMultiplier * personalityMultiplier;

  // Never exceed spendable budget
  const finalBidCap = Math.min(Math.round(rawVal), maxSpendable, currentBudget);
  return Math.max(0, finalBidCap);
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
  ai: AIPersonality
): AIDecision {
  // If this AI is already the highest bidder, never bid against itself
  if (highestTeamId && highestTeamId === aiTeam.id) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // If squad full
  if (aiSquad.length >= 10) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  const maxWilling = calculateAIMaxWillingBid(player, aiTeam.budget, aiSquad, ai);
  const minRequiredBid = currentBid > 0 ? currentBid + 1 : (startingPrice || 5);

  // Current price is too expensive
  if (minRequiredBid > maxWilling || minRequiredBid > aiTeam.budget) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Human-like hesitation / pass probability
  // AI won't blindly contest every single auction
  const posNeed = calculatePositionNeed(player.position, aiSquad, ai.type);
  if (posNeed < 0.5 && Math.random() < 0.7) {
    return { shouldBid: false, bidAmount: 0, delayMs: 0, thinkingMessage: '' };
  }

  // Realistic bid increment
  let bidToPlace = minRequiredBid;
  // Mark or Ron sometimes jump by +2 or +3 on high-value targets to assert dominance
  if ((ai.type === 'aggressive' || ai.type === 'unpredictable') && Math.random() < 0.25) {
    const jump = minRequiredBid + Math.floor(Math.random() * 2) + 1;
    if (jump <= maxWilling && jump <= aiTeam.budget) {
      bidToPlace = jump;
    }
  }

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
