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

export function calculateTeamOverall(players: { overall: number }[]): number {
  if (players.length === 0) return 75;
  const sum = players.reduce((acc, p) => acc + p.overall, 0);
  return Math.round(sum / players.length);
}
