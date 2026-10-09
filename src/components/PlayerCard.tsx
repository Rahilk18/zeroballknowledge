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
    ? { name: 'MYTHIC', badge: 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40 text-glow-cyan' }
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

  // Dynamic card class per rarity
  const rarityCardStyle = player.overall >= 90
    ? 'card-mythic foil-shimmer'
    : player.overall >= 86
    ? 'card-legendary foil-shimmer'
    : player.overall >= 82
    ? 'card-epic'
    : '';

  const shieldGradient = player.overall >= 90
    ? 'bg-gradient-to-b from-[#FF1744] via-rose-600 to-amber-500 text-white shadow-glow-cyan border-[#FF1744]/70'
    : player.overall >= 86
    ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-slate-950 shadow-glow-gold border-amber-300/80'
    : player.overall >= 82
    ? 'bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-800 text-white shadow-glow-purple border-purple-400/70'
    : 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700 text-white border-blue-400/60';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl bg-[#0E1324]/90 backdrop-blur-md border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 ${rarityCardStyle} ${
        isSelected
          ? 'border-[#FF1744] ring-2 ring-[#FF1744]/50 shadow-glow-cyan bg-[#12182D]'
          : 'border-slate-800 hover:border-slate-700'
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
          <div className={`flex flex-col items-center justify-center min-w-10 px-2.5 py-1 rounded-xl font-black shadow-lg border transition-transform duration-200 group-hover:scale-105 ${shieldGradient}`}>
            <span className="text-base sm:text-lg leading-none font-display font-black">{player.overall}</span>
            <span className="text-[7.5px] uppercase tracking-wider font-extrabold opacity-90">OVR</span>
          </div>
        </div>

        {/* Player Identity: Silhouette / Avatar & Name */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-slate-800/90 to-[#0A0A14] border border-[#FF1744]/30 flex items-center justify-center text-slate-300 font-extrabold text-sm shadow-md overflow-hidden group-hover:border-[#FF1744]/60 transition">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={player.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain object-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-110"
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
            <h3 className="font-black text-white text-base leading-tight truncate group-hover:text-[#FF1744] transition font-display">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="truncate">{player.nationality}</span>
              <span>•</span>
              <span className="text-[#FF1744] font-mono font-bold">{formatCurrency(player.marketValue)}</span>
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
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#0A0A14] hover:bg-[#12182D] text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 border border-slate-800 hover:border-[#FF1744]/40 uppercase"
          >
            <Glasses className="w-3.5 h-3.5 text-[#FF1744]" />
            <span>3D VIEW 🥽</span>
          </button>
        )}

        {onSelect && (
          <button
            onClick={() => onSelect(player)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 ${
              isSelected
                ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan'
                : 'bg-[#0A0A14] hover:bg-[#12182D] text-[#FF1744] border border-[#FF1744]/30'
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
