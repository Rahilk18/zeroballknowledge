import React from 'react';
import { Player } from '../types';
import { StatBar } from './StatBar';
import { getPositionBadgeColor, formatCurrency, formatThousands } from '../utils/formatters';
import { X, Flame, Heart, Shield, Award, DollarSign, Calendar } from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player | null;
  onClose: () => void;
  onSwapLineup?: (player: Player) => void;
  isStartingLineup?: boolean;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  onClose,
  onSwapLineup,
  isStartingLineup
}) => {
  if (!player) return null;

  const posBadge = getPositionBadgeColor(player.position);
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0e1720] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        
        {/* Modal Header with Player Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-[#10202e] to-[#0d161f] border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Player Avatar */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-emerald-500/50 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl">
              {initials}
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-bold text-slate-300">
                #{player.number}
              </div>
            </div>

            {/* Name & Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                  {player.position}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {player.nationality}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {player.name}
              </h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span>Foot: <strong className="text-slate-200">{player.preferredFoot}</strong></span>
                <span>•</span>
                <span>Value: <strong className="text-emerald-400">{formatCurrency(player.marketValue)}</strong></span>
              </div>
            </div>

            {/* OVR Shield */}
            <div className="flex flex-col items-center justify-center min-w-14 sm:min-w-16 px-3 py-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-700 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border border-emerald-300">
              <span className="text-2xl sm:text-3xl leading-none">{player.overall}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold">OVR</span>
            </div>
          </div>

          {/* Quick status meters */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Current Form
              </span>
              <span className="text-xs font-black text-amber-400">{player.form} / 100</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                Match Fitness
              </span>
              <span className="text-xs font-black text-emerald-400">{player.fitness}%</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Detailed Attributes */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Tactical Attributes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#090f14] p-4 rounded-2xl border border-slate-800/80">
              {player.position === 'GK' ? (
                <>
                  <StatBar label="Goalkeeping" value={player.goalkeeping} />
                  <StatBar label="Passing" value={player.passing} />
                  <StatBar label="Physical" value={player.physical} />
                  <StatBar label="Pace" value={player.pace} />
                  <StatBar label="Defending" value={player.defending} />
                  <StatBar label="Match Form" value={player.form} />
                </>
              ) : (
                <>
                  <StatBar label="Pace (PAC)" value={player.pace} />
                  <StatBar label="Shooting (SHO)" value={player.shooting} />
                  <StatBar label="Passing (PAS)" value={player.passing} />
                  <StatBar label="Dribbling (DRI)" value={player.dribbling} />
                  <StatBar label="Defending (DEF)" value={player.defending} />
                  <StatBar label="Physical (PHY)" value={player.physical} />
                </>
              )}
            </div>
          </div>

          {/* Season Record */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Season Statistics
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#090f14] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Matches</span>
                <span className="text-sm font-black text-white">{player.stats.matches}</span>
              </div>
              <div className="bg-[#090f14] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Goals</span>
                <span className="text-sm font-black text-emerald-400">{player.stats.goals}</span>
              </div>
              <div className="bg-[#090f14] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assists</span>
                <span className="text-sm font-black text-teal-400">{player.stats.assists}</span>
              </div>
              <div className="bg-[#090f14] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Rating</span>
                <span className="text-sm font-black text-amber-400">{player.stats.avgRating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Contract & Financial details */}
          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Weekly Wage: </span>
              <strong className="text-white">{formatThousands(player.wage)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Market Value: </span>
              <strong className="text-emerald-400">{formatCurrency(player.marketValue)}</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Close
          </button>
          {onSwapLineup && (
            <button
              onClick={() => {
                onSwapLineup(player);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-md shadow-emerald-500/20"
            >
              {isStartingLineup ? 'Move To Bench' : 'Put In Starting 7'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
