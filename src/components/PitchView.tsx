import React from 'react';
import { Player, PlayerPosition } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { Flame } from 'lucide-react';

interface PitchViewProps {
  startingPlayers: Player[];
  onPlayerClick?: (player: Player) => void;
  selectedPlayerId?: string | null;
  interactive?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({
  startingPlayers,
  onPlayerClick,
  selectedPlayerId,
  interactive = true
}) => {
  // Sort players by tactical lines
  const gk = startingPlayers.find(p => p.position === 'GK');
  const defs = startingPlayers.filter(p => p.position === 'DEF');
  const mids = startingPlayers.filter(p => p.position === 'MID');
  const atts = startingPlayers.filter(p => p.position === 'ATT');

  // Fallback if some positions are custom
  const remaining = startingPlayers.filter(
    p => p !== gk && !defs.includes(p) && !mids.includes(p) && !atts.includes(p)
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-gradient-to-b from-[#0e2a1b] via-[#091f13] to-[#06170d] p-3 sm:p-5 select-none">
      
      {/* Authentic Football Turf Grid & Lines */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/5] rounded-2xl border border-emerald-500/30 overflow-hidden flex flex-col justify-between p-3 bg-[radial-gradient(#144026_1px,transparent_1px)] [background-size:16px_16px]">
        
        {/* Subtle Pitch Grass Stripes */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,#042211_40px,#042211_80px)]" />

        {/* Pitch Boundary Lines */}
        <div className="absolute inset-2 border-2 border-white/20 rounded-lg pointer-events-none" />

        {/* Center Halfway Line */}
        <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-white/20 -translate-y-1/2 pointer-events-none" />

        {/* Center Circle & Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/20 pointer-events-none flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
        </div>

        {/* Top Penalty Box (Opponent's end) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-20 sm:h-24 border-b-2 border-x-2 border-white/20 rounded-b-xl pointer-events-none flex justify-center">
          <div className="w-24 sm:w-32 h-10 border-b-2 border-x-2 border-white/15 rounded-b-md" />
        </div>

        {/* Bottom Penalty Box (Our Goal Area) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-20 sm:h-24 border-t-2 border-x-2 border-white/20 rounded-t-xl pointer-events-none flex items-end justify-center">
          <div className="w-24 sm:w-32 h-10 border-t-2 border-x-2 border-white/15 rounded-t-md" />
        </div>

        {/* --- ROW 1: ATTACKERS (2 PLAYERS) --- */}
        <div className="relative z-10 w-full flex justify-around items-center pt-2 sm:pt-4">
          {atts.map(player => (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
            />
          ))}
        </div>

        {/* --- ROW 2: MIDFIELDERS (2 PLAYERS) --- */}
        <div className="relative z-10 w-full flex justify-around items-center my-auto px-2">
          {mids.map(player => (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
            />
          ))}
          {/* If there were any extra unclassified players */}
          {remaining.map(player => (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
            />
          ))}
        </div>

        {/* --- ROW 3: DEFENDERS (2 PLAYERS) --- */}
        <div className="relative z-10 w-full flex justify-around items-center pb-2">
          {defs.map(player => (
            <PitchPlayerToken
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(player)}
            />
          ))}
        </div>

        {/* --- ROW 4: GOALKEEPER (1 PLAYER) --- */}
        <div className="relative z-10 w-full flex justify-center items-center pb-3 sm:pb-5">
          {gk && (
            <PitchPlayerToken
              key={gk.id}
              player={gk}
              isSelected={gk.id === selectedPlayerId}
              onClick={() => interactive && onPlayerClick && onPlayerClick(gk)}
            />
          )}
        </div>

      </div>

      {/* Formation label & guide */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-300 font-semibold px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          7-A-Side Tactical Formation: <span className="text-white font-extrabold">2-2-2 + GK</span>
        </span>
        <span className="text-slate-400 text-[11px] hidden sm:block">
          Tap player to view profile or change lineup
        </span>
      </div>
    </div>
  );
};

interface PitchPlayerTokenProps {
  player: Player;
  isSelected?: boolean;
  onClick?: () => void;
}

const PitchPlayerToken: React.FC<PitchPlayerTokenProps> = ({
  player,
  isSelected = false,
  onClick
}) => {
  const badge = getPositionBadgeColor(player.position);
  const avatar = getPlayerAvatarUrl(player);

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center focus:outline-none transition-all duration-200 transform ${
        isSelected ? 'scale-110' : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Jersey / Kit Token / Player Face */}
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-xl overflow-hidden ${
            isSelected
              ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-300/80 shadow-emerald-500/50'
              : 'bg-gradient-to-b from-slate-900 to-[#0e1720] text-white border-2 border-slate-700/80 group-hover:border-emerald-400'
          }`}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={player.name}
              className="w-full h-full object-cover object-top scale-110 drop-shadow-md"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <>
              {/* Player Number */}
              <span className="text-sm sm:text-base leading-none">#{player.number}</span>
              
              {/* Position Pill */}
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 ${
                  isSelected ? 'bg-slate-950 text-emerald-400' : `${badge.bg} ${badge.text}`
                }`}
              >
                {player.position}
              </span>
            </>
          )}
        </div>

        {/* Overall Rating Pill */}
        <div className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shadow-md border border-emerald-300/60 leading-none z-10">
          {player.overall}
        </div>

        {/* Position badge if avatar is present */}
        {avatar && (
          <div className={`absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase border z-10 shadow-md ${badge.bg} ${badge.text} ${badge.border}`}>
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
      <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-sm border border-slate-800 text-center shadow-md max-w-[85px] sm:max-w-[105px]">
        <p className="text-[11px] sm:text-xs font-bold text-white truncate">
          {player.shortName}
        </p>
      </div>
    </button>
  );
};
