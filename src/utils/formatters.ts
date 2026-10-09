import { PlayerPosition } from '../types';

export function formatCurrency(amountInMillions: number | undefined = 0): string {
  const val = amountInMillions ?? 0;
  if (val >= 1000) {
    return `€${(val / 1000).toFixed(1)}B`;
  }
  return `€${val}M`;
}

export function formatThousands(amountInThousands: number | undefined = 0): string {
  const val = amountInThousands ?? 0;
  return `€${val.toLocaleString()}k/wk`;
}

export function getPositionBadgeColor(pos: string): { bg: string; text: string; border: string } {
  switch (pos) {
    case 'GK':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'DEF':
      return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'MID':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'ATT':
      return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export function getRatingBadgeStyle(ovr: number = 75): string {
  if (ovr >= 90) {
    return 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.35)]';
  }
  if (ovr >= 85) {
    return 'bg-purple-500/25 text-purple-300 border-purple-500/40';
  }
  if (ovr >= 80) {
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export function getRatingColor(rating: number): string {
  if (rating >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (rating >= 85) return 'text-teal-400 border-teal-500/40 bg-teal-500/10';
  if (rating >= 80) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
  if (rating >= 75) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  return 'text-slate-400 border-slate-700 bg-slate-800/40';
}

export function getStatBarColor(val: number): string {
  if (val >= 90) return 'bg-emerald-400';
  if (val >= 85) return 'bg-teal-400';
  if (val >= 80) return 'bg-blue-400';
  if (val >= 70) return 'bg-amber-400';
  return 'bg-rose-500';
}

export function calculateTeamOverall(players: { overall: number; position?: string; form?: number }[]): number {
  if (!players || players.length === 0) return 40;

  // In 7-a-side football, if a team has fewer than 7 starters, unfilled spots severely penalize team strength
  const fullRoster = [...players];
  const missingCount = Math.max(0, 7 - fullRoster.length);
  const trialistRating = 34;

  const effectiveRatings = [
    ...fullRoster.map(p => {
      // Dynamic form modifier: subtle momentum fluctuation (+/- 1.5)
      const formMod = p.form ? (p.form - 80) * 0.08 : 0;
      return p.overall + formMod;
    }),
    ...Array(missingCount).fill(trialistRating)
  ];

  const totalEffective = effectiveRatings.slice(0, 7);
  const baseAvg = totalEffective.reduce((a, b) => a + b, 0) / totalEffective.length;

  // Star player impact: EA FC/FIFA-style superstar weight where players above base average pull the team up
  let starBonus = 0;
  totalEffective.forEach(r => {
    if (r > baseAvg) {
      starBonus += (r - baseAvg) * 0.18;
    }
  });

  // Positional synergy: Real Goalkeeper presence check
  let posMod = 0;
  const hasGk = players.some(p => p.position === 'GK');
  if (players.length >= 7 && !hasGk) {
    posMod -= 5; // Serious handicap without a dedicated goalkeeper
  }

  const finalRating = Math.round(baseAvg + Math.min(4.5, starBonus) + posMod);
  return Math.min(99, Math.max(30, finalRating));
}
