import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player } from '../types';
import { getPositionBadgeColor, formatCurrency } from '../utils/formatters';
import { getPlayerAvatarUrl, getPlayerAvatarFallbacks } from '../data/playerAvatars';
import { Flame, Eye, Activity, Zap, Glasses, Sparkles } from 'lucide-react';

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
  const fallbacks = useMemo(() => getPlayerAvatarFallbacks(player), [player]);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Tilt and interactive shine state
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Automatically reset fallback index and error state whenever player changes
  useEffect(() => {
    setFallbackIndex(0);
    setImgError(false);
  }, [player.id, player.name]);

  const currentAvatarUrl = fallbacks[fallbackIndex] || getPlayerAvatarUrl(player);

  const handleImageError = () => {
    if (fallbackIndex + 1 < fallbacks.length) {
      setFallbackIndex(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  // Interactive mouse tilt and radial shine calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Subtle 3D tilt: -7deg to +7deg
    const tiltX = ((py - 50) / 50) * -7;
    const tiltY = ((px - 50) / 50) * 7;

    setTilt({ rotateX: tiltX, rotateY: tiltY });
    setShine({ x: px, y: py });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setShine({ x: 50, y: 50 });
  };

  const handleTouchStart = () => {
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const tiltX = ((py - 50) / 50) * -5;
    const tiltY = ((px - 50) / 50) * 5;

    setTilt({ rotateX: tiltX, rotateY: tiltY });
    setShine({ x: px, y: py });
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setShine({ x: 50, y: 50 });
  };

  // HeroBid EA FC / FIFA Tier Configuration
  // 90+ Superstars: Gold foil border, holographic rainbow prism sweep, gold glow & border beam
  // 85-89: Iridescent violet border, iridescent violet-cyan foil sweep & beam
  // 80-84: Electric cyan border
  // <80: Carbon dark border
  const tier = useMemo(() => {
    if (player.overall >= 90) {
      return {
        name: 'MYTHIC',
        badge: 'bg-gradient-to-r from-amber-500/20 via-[#FF1744]/20 to-amber-500/20 text-amber-300 border-amber-400/50 shadow-glow-gold',
        borderClass: 'card-border-gold-foil',
        foilClass: 'holo-foil-90',
        shieldGradient: 'bg-gradient-to-b from-amber-300 via-amber-500 to-[#FF1744] text-slate-950 shadow-glow-gold border-amber-200',
      };
    } else if (player.overall >= 85) {
      return {
        name: 'LEGENDARY',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-glow-purple',
        borderClass: 'card-border-violet',
        foilClass: 'holo-foil-85',
        shieldGradient: 'bg-gradient-to-b from-purple-400 via-purple-600 to-indigo-800 text-white shadow-glow-purple border-purple-300/80',
      };
    } else if (player.overall >= 80) {
      return {
        name: 'EPIC',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
        borderClass: 'card-border-cyan',
        foilClass: '',
        shieldGradient: 'bg-gradient-to-b from-cyan-400 via-blue-600 to-indigo-700 text-white border-cyan-300/70',
      };
    } else {
      return {
        name: 'RARE',
        badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
        borderClass: 'card-border-carbon',
        foilClass: '',
        shieldGradient: 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-slate-200 border-slate-600/60',
      };
    }
  }, [player.overall]);

  // Initials for player silhouette/badge
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${
          isHovered ? 'translateY(-4px)' : 'translateY(0)'
        }`,
        transition: isHovered
          ? 'transform 0.08s ease-out'
          : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`group relative flex flex-col justify-between rounded-3xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-2xl ${
        tier.borderClass
      } ${tier.foilClass} ${
        isSelected
          ? 'ring-2 ring-[#FF1744] shadow-glow-cyan bg-[#12182D]'
          : ''
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* 90+ Superstar Animated Border Beam & Particle Glow */}
      {player.overall >= 90 && (
        <>
          <div className="border-beam-active" />
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/25 via-[#FF1744]/25 to-amber-500/25 blur-xl opacity-75 animate-pulse -z-10" />
          <div className="pointer-events-none absolute top-2 right-2 text-amber-300 text-xs animate-ping opacity-75 z-20">✦</div>
          <div className="pointer-events-none absolute bottom-4 left-3 text-rose-400 text-[10px] animate-pulse opacity-60 z-20">★</div>
        </>
      )}

      {/* 85-89 Iridescent Violet Border Beam & Particle Glow */}
      {player.overall >= 85 && player.overall < 90 && (
        <>
          <div className="border-beam-violet" />
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-indigo-500/20 blur-lg opacity-60 animate-pulse -z-10" />
          <div className="pointer-events-none absolute top-2 right-2 text-purple-300 text-xs animate-pulse opacity-75 z-20">✧</div>
        </>
      )}

      {/* Interactive Mouse / Touch Radial Shine Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-20"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 28%, transparent 65%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* High-Tier Dynamic Holographic Prismatic Color-Dodge Tilt Layer */}
      {player.overall >= 85 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-15 overflow-hidden"
          style={{
            opacity: isHovered
              ? (player.overall >= 90 ? 0.75 : 0.55)
              : (player.overall >= 90 ? 0.3 : 0.18),
            background: player.overall >= 90
              ? `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255, 215, 0, 0.45) 0%, rgba(255, 23, 68, 0.35) 32%, rgba(0, 240, 255, 0.3) 55%, transparent 75%)`
              : `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(192, 132, 252, 0.45) 0%, rgba(236, 72, 153, 0.32) 35%, rgba(59, 130, 246, 0.25) 60%, transparent 75%)`,
            mixBlendMode: 'color-dodge',
          }}
        />
      )}
      {/* Card Header: Position, Rarity, & Overall Rating */}
      <div className="relative z-20">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Position Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}
            >
              {player.position}
            </span>

            {/* Rarity Pill */}
            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${tier.badge}`}>
              {tier.name}
            </span>

            {/* Form Pill */}
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{player.form}</span>
            </span>
          </div>

          {/* Overall Rating Shield */}
          <div className={`flex flex-col items-center justify-center min-w-10 px-2.5 py-1 rounded-xl font-black shadow-lg border transition-transform duration-200 group-hover:scale-105 ${tier.shieldGradient}`}>
            <span className="text-base sm:text-lg leading-none font-display font-black">{player.overall}</span>
            <span className="text-[7.5px] uppercase tracking-wider font-extrabold opacity-90">OVR</span>
          </div>
        </div>

        {/* Player Identity: Silhouette / Avatar & Name */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-slate-800/90 to-[#0A0A14] border border-[#FF1744]/30 flex items-center justify-center text-slate-300 font-extrabold text-sm shadow-md overflow-hidden group-hover:border-[#FF1744]/60 transition">
            {currentAvatarUrl && !imgError ? (
              <img
                key={`${player.id || player.name}-${fallbackIndex}`}
                src={currentAvatarUrl}
                alt={player.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
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
      <div className="relative z-30 flex items-center gap-2 pt-1 border-t border-slate-800">
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
