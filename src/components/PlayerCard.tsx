import React, { useState } from 'react';
import { Player } from '../types';
import { getPositionBadgeColor, formatCurrency } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { Flame, Eye, Activity, Zap, Glasses } from 'lucide-react';

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
  const avatarUrl = getPlayerAvatarUrl(player);
  const [imgError, setImgError] = useState(false);

  // HeroBid Rarity Tiers
  const rarity = player.overall >= 90 
    ? { name: 'MYTHIC', badge: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40 text-glow-cyan' }
    : player.overall >= 86
    ? { name: 'LEGENDARY', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    : player.overall >= 82
    ? { name: 'EPIC', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
    : { name: 'RARE', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };

  // Initials for player silhouette/badge
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl bg-[#0E1324] border transition-all duration-300 shadow-lg hover:shadow-glow-cyan hover:border-[#00E5FF]/60 ${
        isSelected
          ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40 shadow-glow-cyan bg-[#12182D]'
          : 'border-slate-800 hover:-translate-y-1'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Card Header: Position, Rarity, & Overall Rating */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Position Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}
            >
              {player.position}
            </span>

            {/* Rarity Pill */}
            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${rarity.badge}`}>
              {rarity.name}
            </span>

            {/* Form Pill */}
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{player.form}</span>
            </span>
          </div>

          {/* Overall Rating Shield */}
          <div className="flex flex-col items-center justify-center min-w-10 px-2 py-1 rounded-xl bg-gradient-to-b from-[#00E5FF] to-blue-600 text-slate-950 font-black shadow-glow-cyan border border-[#00E5FF]/50">
            <span className="text-base leading-none font-display">{player.overall}</span>
            <span className="text-[8px] uppercase tracking-wider font-extrabold">OVR</span>
          </div>
        </div>

        {/* Player Identity: Silhouette / Avatar & Name */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="relative flex-shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-slate-800 to-[#0A0A14] border border-[#00E5FF]/30 flex items-center justify-center text-slate-300 font-extrabold text-sm shadow-md overflow-hidden group-hover:border-[#00E5FF]/60 transition">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={player.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top scale-110 drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-125"
              />
            ) : (
              <span className="tracking-wider">{initials}</span>
            )}
            {player.number && (
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-slate-700 text-[9px] font-bold text-slate-300 z-10 shadow">
                #{player.number}
              </div>
            )}
          </div>

          <div className="overflow-hidden">
            <h3 className="font-black text-white text-base leading-tight truncate group-hover:text-[#00E5FF] transition font-display">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="truncate">{player.nationality}</span>
              <span>•</span>
              <span className="text-[#00E5FF] font-mono font-bold">{formatCurrency(player.marketValue)}</span>
            </div>
          </div>
        </div>

        {/* 6 Key Attributes Grid */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0A0A14] p-2.5 rounded-2xl border border-slate-800 mb-3">
          {player.position === 'GK' ? (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">GKP</span>
                <span className="text-xs font-black text-amber-400 font-mono">{player.goalkeeping}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PAS</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.passing}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PHY</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.physical}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PAC</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.pace}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">DEF</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.defending}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">FIT</span>
                <span className="text-xs font-black text-emerald-400 font-mono">{player.fitness}%</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PAC</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.pace}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">SHO</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.shooting}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PAS</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.passing}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">DRI</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.dribbling}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">DEF</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.defending}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">PHY</span>
                <span className="text-xs font-black text-slate-200 font-mono">{player.physical}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        {onView && (
          <button
            onClick={() => onView(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#0A0A14] hover:bg-[#12182D] text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 border border-slate-800 hover:border-[#00E5FF]/40 uppercase"
          >
            <Glasses className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>3D VIEW 🥽</span>
          </button>
        )}

        {onSelect && (
          <button
            onClick={() => onSelect(player)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 ${
              isSelected
                ? 'bg-[#00E5FF] text-slate-950 shadow-glow-cyan'
                : 'bg-[#0A0A14] hover:bg-[#12182D] text-[#00E5FF] border border-[#00E5FF]/30'
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
