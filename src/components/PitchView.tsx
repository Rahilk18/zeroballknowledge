import React, { useState, useEffect, useMemo } from 'react';
import { Player, PlayerPosition } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { getPlayerAvatarUrl, getPlayerAvatarFallbacks } from '../data/playerAvatars';
import { getFormationInfo } from '../utils/formation';
import { Flame, Plus, Shield } from 'lucide-react';

interface PitchViewProps {
  startingPlayers: Player[];
  formation?: string;
  onPlayerClick?: (player: Player) => void;
  selectedPlayerId?: string | null;
  interactive?: boolean;
  onSwap?: (playerAId: string, playerBId: string) => void;
  onEmptySlotClick?: (role: PlayerPosition) => void;
  onEmptySlotDrop?: (draggedPlayerId: string) => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
  startingPlayers,
  formation = '1-2-2-2',
  onPlayerClick,
  selectedPlayerId,
  interactive = true,
  onSwap,
  onEmptySlotClick,
  onEmptySlotDrop,
}) => {
  const formationInfo = getFormationInfo(formation);
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null);

  // Group starting players into tactical rows
  const remainingStarters = [...startingPlayers];

  // 1. GK
  const gkIndex = remainingStarters.findIndex(p => p.position === 'GK');
  const gk = gkIndex >= 0 ? remainingStarters.splice(gkIndex, 1)[0] : remainingStarters.shift();

  // 2. Attackers
  const atts: (Player | null)[] = [];
  for (let i = 0; i < formationInfo.attCount; i++) {
    const idx = remainingStarters.findIndex(p => p.position === 'ATT');
    if (idx >= 0) {
      atts.push(remainingStarters.splice(idx, 1)[0]);
    } else if (remainingStarters.length > 0) {
      atts.push(remainingStarters.shift() || null);
    } else {
      atts.push(null);
    }
  }

  // 3. Midfielders
  const mids: (Player | null)[] = [];
  for (let i = 0; i < formationInfo.midCount; i++) {
    const idx = remainingStarters.findIndex(p => p.position === 'MID');
    if (idx >= 0) {
      mids.push(remainingStarters.splice(idx, 1)[0]);
    } else if (remainingStarters.length > 0) {
      mids.push(remainingStarters.shift() || null);
    } else {
      mids.push(null);
    }
  }

  // 4. Defenders
  const defs: (Player | null)[] = [];
  for (let i = 0; i < formationInfo.defCount; i++) {
    const idx = remainingStarters.findIndex(p => p.position === 'DEF');
    if (idx >= 0) {
      defs.push(remainingStarters.splice(idx, 1)[0]);
    } else if (remainingStarters.length > 0) {
      defs.push(remainingStarters.shift() || null);
    } else {
      defs.push(null);
    }
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPlayerId !== id) setDragOverPlayerId(id);
  };

  const handleDragLeave = () => {
    setDragOverPlayerId(null);
  };

  const handleDropOnPlayer = (e: React.DragEvent, targetPlayerId: string) => {
    e.preventDefault();
    setDragOverPlayerId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetPlayerId && onSwap) {
      onSwap(draggedId, targetPlayerId);
    }
  };

  const handleDropOnEmpty = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPlayerId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && onEmptySlotDrop) {
      onEmptySlotDrop(draggedId);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#FF1744]/30 shadow-glow-cyan bg-gradient-to-b from-[#0A0D1A] via-[#0E1324] to-[#0A0D1A] p-2.5 sm:p-3.5 select-none">
      
      {/* Holographic Arena Turf Grid & Glow Lines */}
      <div className="relative w-full aspect-[4/4.6] max-h-[480px] rounded-xl border border-[#FF1744]/30 overflow-hidden flex flex-col justify-between p-2 sm:p-2.5 cyber-grid-bg">
        
        {/* Subtle Pitch Cyber Stripes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,#FF1744_40px,#FF1744_80px)]" />

        {/* Pitch Boundary Lines */}
        <div className="absolute inset-2 border-2 border-[#FF1744]/25 rounded-xl pointer-events-none shadow-glow-cyan" />

        {/* Center Halfway Line */}
        <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-[#FF1744]/30 -translate-y-1/2 pointer-events-none shadow-glow-cyan" />

        {/* Center Circle & Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-[#FF1744]/30 pointer-events-none flex items-center justify-center shadow-glow-cyan">
          <div className="w-2 h-2 rounded-full bg-[#FF1744] shadow-glow-cyan" />
        </div>

        {/* Top Penalty Box (Opponent's end) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-16 sm:h-20 border-b-2 border-x-2 border-[#FF1744]/25 rounded-b-2xl pointer-events-none flex justify-center">
          <div className="w-20 sm:w-28 h-8 border-b-2 border-x-2 border-[#FF1744]/20 rounded-b-lg" />
        </div>

        {/* Bottom Penalty Box (Our Goal Area) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-16 sm:h-20 border-t-2 border-x-2 border-[#FF1744]/25 rounded-t-2xl pointer-events-none flex items-end justify-center">
          <div className="w-20 sm:w-28 h-8 border-t-2 border-x-2 border-[#FF1744]/20 rounded-t-lg" />
        </div>

        {/* --- ROW 1: ATTACKERS --- */}
        {atts.length > 0 && (
          <div className="relative z-10 w-full flex justify-around items-center pt-1 sm:pt-1.5">
            {atts.map((player, idx) => player ? (
              <PitchPlayerToken
                key={player.id}
                player={player}
                isSelected={player.id === selectedPlayerId}
                isDragOver={player.id === dragOverPlayerId}
                onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
                onDragOver={(e) => handleDragOver(e, player.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnPlayer(e, player.id)}
                interactive={interactive}
              />
            ) : (
              <EmptyPitchSlot
                key={`empty-att-${idx}`}
                role="ATT"
                onClick={() => onEmptySlotClick && onEmptySlotClick('ATT')}
                onDragOver={(e) => handleDragOver(e, `empty-att-${idx}`)}
                onDrop={handleDropOnEmpty}
              />
            ))}
          </div>
        )}

        {/* --- ROW 2: MIDFIELDERS --- */}
        <div className="relative z-10 w-full flex justify-around items-center my-auto px-2">
          {mids.map((player, idx) => player ? (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              isDragOver={player.id === dragOverPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
              onDragOver={(e) => handleDragOver(e, player.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnPlayer(e, player.id)}
              interactive={interactive}
            />
          ) : (
            <EmptyPitchSlot
              key={`empty-mid-${idx}`}
              role="MID"
              onClick={() => onEmptySlotClick && onEmptySlotClick('MID')}
              onDragOver={(e) => handleDragOver(e, `empty-mid-${idx}`)}
              onDrop={handleDropOnEmpty}
            />
          ))}
        </div>

        {/* --- ROW 3: DEFENDERS --- */}
        <div className="relative z-10 w-full flex justify-around items-center pb-1">
          {defs.map((player, idx) => player ? (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              isDragOver={player.id === dragOverPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
              onDragOver={(e) => handleDragOver(e, player.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnPlayer(e, player.id)}
              interactive={interactive}
            />
          ) : (
            <EmptyPitchSlot
              key={`empty-def-${idx}`}
              role="DEF"
              onClick={() => onEmptySlotClick && onEmptySlotClick('DEF')}
              onDragOver={(e) => handleDragOver(e, `empty-def-${idx}`)}
              onDrop={handleDropOnEmpty}
            />
          ))}
        </div>

        {/* --- ROW 4: GOALKEEPER --- */}
        <div className="relative z-10 w-full flex justify-center items-center pb-1.5 sm:pb-2">
          {gk ? (
            <PitchPlayerToken
              key={gk.id}
              player={gk}
              isSelected={gk.id === selectedPlayerId}
              isDragOver={gk.id === dragOverPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(gk)}
              onDragOver={(e) => handleDragOver(e, gk.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnPlayer(e, gk.id)}
              interactive={interactive}
            />
          ) : (
            <EmptyPitchSlot
              role="GK"
              onClick={() => onEmptySlotClick && onEmptySlotClick('GK')}
              onDragOver={(e) => handleDragOver(e, 'empty-gk')}
              onDrop={handleDropOnEmpty}
            />
          )}
        </div>

      </div>

      {/* Formation label & guide */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-300 font-semibold px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF1744] animate-ping" />
          <span className="text-[#FF1744] font-black uppercase tracking-wider font-display text-[11px]">TACTICAL FORMATION:</span>
          <span className="text-white font-mono font-bold bg-[#0A0A14] px-1.5 py-0.2 rounded border border-[#FF1744]/30 text-[11px]">
            {formation}
          </span>
        </span>
        <span className="text-slate-400 text-[10px] font-mono hidden sm:block">
          DRAG & DROP OR TAP TO SWAP
        </span>
      </div>
    </div>
  );
};

interface PitchPlayerTokenProps {
  player: Player;
  isSelected?: boolean;
  isDragOver?: boolean;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  interactive?: boolean;
}

const PitchPlayerToken: React.FC<PitchPlayerTokenProps> = ({
  player,
  isSelected = false,
  isDragOver = false,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  interactive = true,
}) => {
  const badge = getPositionBadgeColor(player.position);
  const fallbacks = useMemo(() => getPlayerAvatarFallbacks(player), [player]);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setFallbackIndex(0);
  }, [player.id, player.name]);

  const avatar = fallbacks[fallbackIndex] || getPlayerAvatarUrl(player);

  return (
    <div
      draggable={interactive}
      onDragStart={(e) => {
        if (!interactive) return;
        e.dataTransfer.setData('text/plain', player.id);
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group flex flex-col items-center cursor-pointer transition-all duration-200 transform ${
        isSelected ? 'scale-110' : 'hover:scale-105 active:scale-95'
      } ${isDragOver ? 'ring-2 ring-emerald-400 rounded-xl scale-105' : ''}`}
    >
      <div className="relative">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-black transition-all shadow-lg overflow-hidden ${
            isSelected
              ? 'bg-[#FF1744] text-slate-950 ring-2 ring-[#FF1744]/80 shadow-glow-cyan'
              : 'bg-gradient-to-b from-[#0E1324] to-[#0A0A14] text-white border border-slate-700/80 group-hover:border-[#FF1744] shadow-glow-cyan'
          }`}
        >
          {avatar ? (
            <img
              key={`${player.id || player.name}-${fallbackIndex}`}
              src={avatar}
              alt={player.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center drop-shadow-md pointer-events-none"
              loading="lazy"
              onError={() => {
                if (fallbackIndex + 1 < fallbacks.length) {
                  setFallbackIndex(prev => prev + 1);
                }
              }}
            />
          ) : (
            <>
              <span className="text-xs sm:text-sm leading-none font-mono">#{player.number ?? 7}</span>
              <span
                className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 ${
                  isSelected ? 'bg-slate-950 text-[#FF1744]' : `${badge.bg} ${badge.text}`
                }`}
              >
                {player.position}
              </span>
            </>
          )}
        </div>

        {/* Overall Rating Pill */}
        <div className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-[#FF1744] text-slate-950 text-[9px] font-black shadow-glow-cyan border border-[#FF1744]/60 leading-none z-10 font-display">
          {player.overall}
        </div>

        {/* Position badge if avatar is present */}
        {avatar && (
          <div className={`absolute -bottom-1 -left-1 px-1 py-0.2 rounded text-[7px] font-black uppercase border z-10 shadow-md ${badge.bg} ${badge.text} ${badge.border}`}>
            {player.position}
          </div>
        )}

        {/* High Form Indicator */}
        {player.form >= 90 && (
          <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-amber-500 text-slate-950 shadow-md z-10">
            <Flame className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
          </div>
        )}
      </div>

      {/* Player Name Banner */}
      <div className="mt-0.5 px-1.5 py-0.2 rounded-md bg-[#0A0A14]/90 backdrop-blur-sm border border-[#FF1744]/20 text-center shadow-md max-w-[75px] sm:max-w-[90px]">
        <p className="text-[10px] font-bold text-white truncate font-display leading-tight">
          {player.shortName}
        </p>
      </div>
    </div>
  );
};

interface EmptyPitchSlotProps {
  role: PlayerPosition;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const EmptyPitchSlot: React.FC<EmptyPitchSlotProps> = ({
  role,
  onClick,
  onDragOver,
  onDrop,
}) => {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex flex-col items-center cursor-pointer group"
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-dashed border-[#FF1744]/40 bg-[#0A0D1A]/60 flex flex-col items-center justify-center text-slate-400 group-hover:border-[#FF1744] group-hover:text-white transition shadow-sm">
        <Plus className="w-3.5 h-3.5 text-[#FF1744]" />
        <span className="text-[8px] font-mono font-bold">{role}</span>
      </div>
      <span className="text-[8px] text-slate-500 font-mono mt-0.5">EMPTY</span>
    </div>
  );
};
