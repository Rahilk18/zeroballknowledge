import React, { useState } from 'react';
import { Player } from '../types';
import { StatBar } from './StatBar';
import { getPositionBadgeColor, formatCurrency, formatThousands } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { Hero3DViewer } from './Hero3DViewer';
import { X, Flame, Heart, Shield, Award, DollarSign, Calendar, Glasses, BarChart2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'3d' | 'stats'>('3d');
  if (!player) return null;

  const posBadge = getPositionBadgeColor(player.position);
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0E1324] border border-[#00E5FF]/40 rounded-3xl shadow-glow-cyan overflow-hidden z-10 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#0E1324] via-[#0A0A14] to-[#12182D] border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#0A0A14] border border-slate-700 hover:border-[#00E5FF] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Player Avatar */}
            {(() => {
              const avatar = getPlayerAvatarUrl(player);
              return (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-[#0A0A14] border-2 border-[#00E5FF]/50 flex items-center justify-center text-white font-black text-xl shadow-glow-cyan overflow-hidden flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain object-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className={`tracking-wider ${avatar ? 'hidden' : ''}`}>{initials}</span>
                  {player.number && (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-bold text-slate-300 z-10">
                      #{player.number}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Name & Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                  {player.position}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {player.nationality}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-display tracking-wide text-glow-cyan">
                {player.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>Foot: <strong className="text-slate-200">{player.preferredFoot || 'Right'}</strong></span>
                <span>•</span>
                <span>Value: <strong className="text-[#00E5FF] font-mono">{formatCurrency(player.marketValue)}</strong></span>
              </div>
            </div>

            {/* OVR Shield */}
            <div className="flex flex-col items-center justify-center min-w-14 px-3 py-2 rounded-2xl bg-gradient-to-b from-[#00E5FF] to-blue-600 text-slate-950 font-black shadow-glow-cyan border border-[#00E5FF]/60">
              <span className="text-2xl sm:text-3xl leading-none font-display">{player.overall}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold">OVR</span>
            </div>
          </div>

          {/* Tab Switcher: 3D Stage vs 2D Stats */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('3d')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === '3d'
                  ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/50 text-[#00E5FF] shadow-glow-cyan text-glow-cyan'
                  : 'bg-[#0A0A14] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>3D HOLO-STAGE 🥽</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'stats'
                  ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/50 text-[#00E5FF] shadow-glow-cyan text-glow-cyan'
                  : 'bg-[#0A0A14] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>TACTICAL STATS</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === '3d' ? (
            <div className="space-y-3">
              <Hero3DViewer
                player={player}
                auraHex={player.overall >= 90 ? '#F59E0B' : player.overall >= 85 ? '#00E5FF' : '#A855F7'}
                height={380}
                showControls={true}
              />
              <div className="p-3 bg-[#0A0A14] border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ENGINE: THREE.JS WEBGL</span>
                <span className="text-emerald-400 font-bold">● HOLOGRAPHIC 60 FPS</span>
              </div>
            </div>
          ) : (
            <>
              {/* Detailed Attributes */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 font-display">
                  <Award className="w-4 h-4 text-[#00E5FF]" />
                  Tactical Attributes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0A0A14] p-4 rounded-2xl border border-slate-800">
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
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-display">
                  <Calendar className="w-4 h-4 text-[#00E5FF]" />
                  Season Records
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-[#0A0A14] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Matches</span>
                    <span className="text-sm font-black text-white font-mono">{player.stats.matches}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Goals</span>
                    <span className="text-sm font-black text-[#00E5FF] font-mono">{player.stats.goals}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Assists</span>
                    <span className="text-sm font-black text-purple-400 font-mono">{player.stats.assists}</span>
                  </div>
                  <div className="bg-[#0A0A14] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Rating</span>
                    <span className="text-sm font-black text-amber-400 font-mono">{player.stats.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#0A0A14] border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 uppercase"
          >
            Close
          </button>
          {onSwapLineup && (
            <button
              onClick={() => {
                onSwapLineup(player);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-glow-cyan"
            >
              {isStartingLineup ? 'Move To Bench' : 'Place in Starting 7'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
