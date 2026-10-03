import React, { useState } from 'react';
import { Player, PlayerPosition } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
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
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border border-[#00E5FF]/30 shadow-glow-cyan bg-gradient-to-b from-[#0A0D1A] via-[#0E1324] to-[#0A0D1A] p-3 sm:p-5 select-none">
      
      {/* Holographic Arena Turf Grid & Glow Lines */}
      <div className="relative w-full aspect-[4/5] rounded-2xl border border-[#00E5FF]/30 overflow-hidden flex flex-col justify-between p-3 cyber-grid-bg">
        
        {/* Subtle Pitch Cyber Stripes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,#00E5FF_40px,#00E5FF_80px)]" />

        {/* Pitch Boundary Lines */}
        <div className="absolute inset-2 border-2 border-[#00E5FF]/25 rounded-xl pointer-events-none shadow-glow-cyan" />

        {/* Center Halfway Line */}
        <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-[#00E5FF]/30 -translate-y-1/2 pointer-events-none shadow-glow-cyan" />

        {/* Center Circle & Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#00E5FF]/30 pointer-events-none flex items-center justify-center shadow-glow-cyan">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-glow-cyan" />
        </div>

        {/* Top Penalty Box (Opponent's end) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-20 sm:h-24 border-b-2 border-x-2 border-[#00E5FF]/25 rounded-b-2xl pointer-events-none flex justify-center">
          <div className="w-24 sm:w-32 h-10 border-b-2 border-x-2 border-[#00E5FF]/20 rounded-b-lg" />
        </div>

        {/* Bottom Penalty Box (Our Goal Area) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-20 sm:h-24 border-t-2 border-x-2 border-[#00E5FF]/25 rounded-t-2xl pointer-events-none flex items-end justify-center">
          <div className="w-24 sm:w-32 h-10 border-t-2 border-x-2 border-[#00E5FF]/20 rounded-t-lg" />
        </div>

        {/* --- ROW 1: ATTACKERS --- */}
        <div className="relative z-10 w-full flex justify-around items-center pt-2 sm:pt-4">
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
        <div className="relative z-10 w-full flex justify-around items-center pb-2">
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
        <div className="relative z-10 w-full flex justify-center items-center pb-3 sm:pb-5">
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
      <div className="flex items-center justify-between mt-3 text-xs text-slate-300 font-semibold px-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="text-[#00E5FF] font-black uppercase tracking-wider font-display">TACTICAL FORMATION:</span>
          <span className="text-white font-mono font-bold bg-[#0A0A14] px-2 py-0.5 rounded border border-[#00E5FF]/30">
            {formation}
          </span>
        </span>
        <span className="text-slate-400 text-[11px] font-mono hidden sm:block">
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
  const avatar = getPlayerAvatarUrl(player);

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
        isSelected ? 'scale-115' : 'hover:scale-105 active:scale-95'
      } ${isDragOver ? 'ring-4 ring-emerald-400 rounded-2xl scale-110' : ''}`}
    >
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-xl overflow-hidden ${
            isSelected
              ? 'bg-[#00E5FF] text-slate-950 ring-4 ring-[#00E5FF]/80 shadow-glow-cyan'
              : 'bg-gradient-to-b from-[#0E1324] to-[#0A0A14] text-white border-2 border-slate-700/80 group-hover:border-[#00E5FF] shadow-glow-cyan'
          }`}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={player.name}
              className="w-full h-full object-cover object-top scale-110 drop-shadow-md pointer-events-none"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <>
              <span className="text-sm sm:text-base leading-none font-mono">#{player.number ?? 7}</span>
              <span
                className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 ${
                  isSelected ? 'bg-slate-950 text-[#00E5FF]' : `${badge.bg} ${badge.text}`
                }`}
              >
                {player.position}
              </span>
            </>
          )}
        </div>

        {/* Overall Rating Pill */}
        <div className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-[#00E5FF] text-slate-950 text-[10px] font-black shadow-glow-cyan border border-[#00E5FF]/60 leading-none z-10 font-display">
          {player.overall}
        </div>

        {/* Position badge if avatar is present */}
        {avatar && (
          <div className={`absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase border z-10 shadow-md ${badge.bg} ${badge.text} ${badge.border}`}>
            {player.position}
          </div>
        )}

        {/* High Form Indicator */}
        {player.form >= 90 && (
          <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-amber-500 text-slate-950 shadow-md z-10">
            <Flame className="w-3 h-3 fill-slate-950 text-slate-950" />
          </div>
        )}
      </div>

      {/* Player Name Banner */}
      <div className="mt-1 px-2 py-0.5 rounded-lg bg-[#0A0A14]/90 backdrop-blur-sm border border-[#00E5FF]/20 text-center shadow-md max-w-[85px] sm:max-w-[105px]">
        <p className="text-[11px] font-bold text-white truncate font-display">
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
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-[#00E5FF]/40 bg-[#0A0D1A]/60 flex flex-col items-center justify-center text-slate-400 group-hover:border-[#00E5FF] group-hover:text-white transition shadow-sm">
        <Plus className="w-4 h-4 text-[#00E5FF]" />
        <span className="text-[9px] font-mono font-bold">{role}</span>
      </div>
      <span className="text-[9px] text-slate-500 font-mono mt-1">EMPTY</span>
    </div>
  );
};
