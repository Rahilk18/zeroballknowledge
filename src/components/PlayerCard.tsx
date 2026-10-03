import React from 'react';
import { Player } from '../types';
import { getPositionBadgeColor, formatCurrency } from '../utils/formatters';
import { Flame, Eye, Activity, Zap } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onView?: (player: Player) => void;
  onSelect?: (player: Player) => void;
  isSelected?: boolean;
  actionLabel?: string;
  showFullStats?: boolean;
  compact?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onView,
  onSelect,
  isSelected = false,
  actionLabel,
  compact = false
}) => {
  const posBadge = getPositionBadgeColor(player.position);

  // Initials for player silhouette/badge
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#111c26] to-[#0c141c] border transition-all duration-300 shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/50 ${
        isSelected
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-emerald-500/20'
          : 'border-slate-800/90 hover:-translate-y-1'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Card Header: Position, Form, & Overall Rating */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Position Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-black tracking-wider uppercase border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}
            >
              {player.position}
            </span>

            {/* Form Pill */}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>FORM {player.form}</span>
            </span>
          </div>

          {/* Overall Rating Shield */}
          <div className="flex flex-col items-center justify-center min-w-11 px-2 py-1 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-700 text-slate-950 font-black shadow-md shadow-emerald-500/20 border border-emerald-300/40">
            <span className="text-base leading-none tracking-tighter">{player.overall}</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-90">OVR</span>
          </div>
        </div>

        {/* Player Identity: Silhouette Avatar & Name */}
        <div className="flex items-center gap-3 mb-3.5">
          {/* Generic Player Silhouette / Badge */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 font-extrabold text-sm shadow-inner group-hover:border-emerald-500/40 transition">
            <span className="tracking-wider">{initials}</span>
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-slate-700 text-[10px] text-slate-300">
              #{player.number}
            </div>
          </div>

          <div className="overflow-hidden">
            <h3 className="font-extrabold text-white text-base leading-tight truncate group-hover:text-emerald-300 transition">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="truncate">{player.nationality}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(player.marketValue)}</span>
            </div>
          </div>
        </div>

        {/* 6 Key Attributes Grid (PAC, SHO, PAS, DRI, DEF, PHY) or GK stats */}
        <div className="grid grid-cols-3 gap-2 bg-[#090f14]/80 p-2.5 rounded-xl border border-slate-800/80 mb-3">
          {player.position === 'GK' ? (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">GKP</span>
                <span className="text-xs font-black text-amber-400">{player.goalkeeping}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PAS</span>
                <span className="text-xs font-black text-slate-200">{player.passing}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PHY</span>
                <span className="text-xs font-black text-slate-200">{player.physical}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PAC</span>
                <span className="text-xs font-black text-slate-200">{player.pace}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">DEF</span>
                <span className="text-xs font-black text-slate-200">{player.defending}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">FIT</span>
                <span className="text-xs font-black text-emerald-400">{player.fitness}%</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PAC</span>
                <span className="text-xs font-black text-slate-200">{player.pace}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">SHO</span>
                <span className="text-xs font-black text-slate-200">{player.shooting}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PAS</span>
                <span className="text-xs font-black text-slate-200">{player.passing}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">DRI</span>
                <span className="text-xs font-black text-slate-200">{player.dribbling}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">DEF</span>
                <span className="text-xs font-black text-slate-200">{player.defending}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">PHY</span>
                <span className="text-xs font-black text-slate-200">{player.physical}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
        {onView && (
          <button
            onClick={() => onView(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 border border-slate-700/60"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Profile</span>
          </button>
        )}

        {onSelect && (
          <button
            onClick={() => onSelect(player)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition active:scale-95 ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{actionLabel || (isSelected ? 'Selected' : 'Select')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
