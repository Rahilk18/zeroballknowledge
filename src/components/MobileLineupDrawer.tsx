import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { getPositionBadgeColor, getRatingBadgeStyle } from '../utils/formatters';
import { FORMATIONS } from '../utils/formation';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { sound } from '../utils/audioSynth';
import {
  Shield,
  ArrowLeftRight,
  Zap,
  Lock,
  Check,
  X,
  ChevronUp,
  Layers,
  Swords,
  Sparkles
} from 'lucide-react';

export interface MobileLineupDrawerProps {
  starting: string[];
  bench: string[];
  selectedToSwap: string | null;
  setSelectedToSwap: (id: string | null) => void;
  onSwap: (playerId: string) => void;
  getPlayer: (id: string) => Player | undefined;
  teamOvr: number;
  formation: string;
  setFormation: (formation: string) => void;
  onAutoOptimize: () => void;
  isLockedIn: boolean;
  onLockIn: () => Promise<void>;
  isHost: boolean;
  onLaunchMatches?: () => Promise<void>;
  advancingToMatches?: boolean;
}

export const MobileLineupDrawer: React.FC<MobileLineupDrawerProps> = ({
  starting,
  bench,
  selectedToSwap,
  setSelectedToSwap,
  onSwap,
  getPlayer,
  teamOvr,
  formation,
  setFormation,
  onAutoOptimize,
  isLockedIn,
  onLockIn,
  isHost,
  onLaunchMatches,
  advancingToMatches = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Automatically open the drawer when a player is selected to swap on mobile!
  useEffect(() => {
    if (selectedToSwap) {
      setIsOpen(true);
    }
  }, [selectedToSwap]);

  const selectedPlayer = selectedToSwap ? getPlayer(selectedToSwap) : null;
  const isSelectedInStarting = selectedToSwap ? starting.includes(selectedToSwap) : false;

  return (
    <>
      {/* ===== 1. FLOATING BOTTOM ACTION PILL (COLLAPSED) ===== */}
      <div className="fixed bottom-[60px] left-2 right-2 z-40 lg:hidden">
        <div className="bg-[#0E1324]/95 backdrop-blur-xl border border-[#FF1744]/40 rounded-2xl p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-between gap-2 ring-1 ring-white/5">
          {/* Left: Squad Overview */}
          <div
            onClick={() => {
              sound.playClick();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase">SQUAD</span>
              <span className="text-white font-black">{starting.length}/7</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-black">{teamOvr} OVR</span>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Bench & Swaps Popup Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsOpen(true);
              }}
              className="px-2.5 py-1.5 bg-[#0A0D1A] hover:bg-[#12182D] border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 active:scale-95"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Bench ({bench.length})</span>
            </button>

            {/* Auto-Optimize Quick Pill */}
            <button
              type="button"
              onClick={() => {
                sound.playPowerUp();
                onAutoOptimize();
              }}
              className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl transition active:scale-95"
              title="Auto-Optimize Starting 7"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
            </button>

            {/* Lock In Quick Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onLockIn();
              }}
              className={`p-1.5 rounded-xl border transition ${
                isLockedIn
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#FF1744]/20 border-[#FF1744]/40 text-[#FF1744]'
              }`}
              title={isLockedIn ? 'Lineup Locked' : 'Lock In Lineup'}
            >
              {isLockedIn ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ===== 2. POPUP BOTTOM SHEET MODAL ===== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end lg:hidden animate-fadeIn">
          {/* Backdrop Tap to Close */}
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsOpen(false);
              setSelectedToSwap(null);
            }}
          />

          {/* Drawer Content */}
          <div className="relative bg-[#0E1324] border-t-2 border-[#FF1744]/40 rounded-t-3xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.9)] space-y-3.5">
            {/* Top Handle Bar */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#FF1744]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
                  {selectedToSwap ? 'SWAP PLAYER SELECTION' : 'BENCH RESERVES & QUICK TACTICS'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedToSwap(null);
                }}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ===== IF A PLAYER IS ACTIVELY SELECTED FOR SWAPPING ===== */}
            {selectedPlayer && (
              <div className="space-y-3">
                {/* Active Selected Card Banner */}
                <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-emerald-500/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={getPlayerAvatarUrl(selectedPlayer)}
                        alt={selectedPlayer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black font-mono px-1 py-0.2 rounded border ${getRatingBadgeStyle(selectedPlayer.overall)}`}>
                          {selectedPlayer.overall}
                        </span>
                        <p className="text-xs font-black text-white truncate">{selectedPlayer.name}</p>
                      </div>
                      <p className="text-[10px] text-emerald-300 mt-0.5">
                        {isSelectedInStarting ? 'Selected from Pitch (Starter)' : 'Selected from Bench'} • {selectedPlayer.position}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedToSwap(null)}
                    className="text-xs font-bold text-slate-400 hover:text-white underline ml-2 whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>

                {/* Bench Swap Candidates */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>BENCH RESERVES (TAP TO SWAP WITH {selectedPlayer.shortName || selectedPlayer.name})</span>
                  </p>

                  {bench.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-[#0A0D1A] rounded-xl text-center">
                      No players currently on bench.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {bench.map(benchId => {
                        const bp = getPlayer(benchId);
                        if (!bp) return null;
                        const badge = getPositionBadgeColor(bp.position);
                        const isThisSelected = selectedToSwap === benchId;

                        return (
                          <div
                            key={bp.id}
                            onClick={() => {
                              onSwap(bp.id);
                              setIsOpen(false);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all active:scale-98 ${
                              isThisSelected
                                ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-500/40'
                                : 'bg-[#0A0D1A] border-slate-800 hover:border-amber-400/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono border flex-shrink-0 ${getRatingBadgeStyle(bp.overall)}`}>
                                {bp.overall}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                                {bp.position}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                                <img
                                  src={getPlayerAvatarUrl(bp)}
                                  alt={bp.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-black text-white truncate">{bp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Form: {bp.form} • #{bp.number ?? '10'}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>Swap In</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Starting 7 Swap Candidates (if user wants to swap pitch slots) */}
                {isSelectedInStarting && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      OR SWAP PITCH POSITION WITH ANOTHER STARTER:
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {starting
                        .filter(stId => stId !== selectedToSwap)
                        .map(stId => {
                          const sp = getPlayer(stId);
                          if (!sp) return null;
                          const badge = getPositionBadgeColor(sp.position);

                          return (
                            <div
                              key={sp.id}
                              onClick={() => {
                                onSwap(sp.id);
                                setIsOpen(false);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-[#0A0D1A] hover:border-slate-700 cursor-pointer active:scale-98"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black font-mono border flex-shrink-0 ${getRatingBadgeStyle(sp.overall)}`}>
                                  {sp.overall}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {sp.position}
                                </span>
                                <span className="text-xs font-bold text-white truncate">{sp.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Swap Slot</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== IF NO PLAYER IS CURRENTLY SELECTED ===== */}
            {!selectedPlayer && (
              <div className="space-y-3.5">
                {/* Bench Reserves List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>BENCH RESERVES ({bench.length}/3)</span>
                    </p>
                    <span className="text-[10px] text-slate-500">Tap to select for swap</span>
                  </div>

                  {bench.length === 0 ? (
                    <div className="p-4 bg-[#0A0D1A] rounded-xl text-center text-xs text-slate-500 italic">
                      No bench reserves currently stored.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bench.map(id => {
                        const p = getPlayer(id);
                        if (!p) return null;
                        const badge = getPositionBadgeColor(p.position);

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedToSwap(p.id);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-[#0A0D1A] hover:border-amber-400/50 cursor-pointer active:scale-98"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono border flex-shrink-0 ${getRatingBadgeStyle(p.overall)}`}>
                                {p.overall}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                                {p.position}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                                <img
                                  src={getPlayerAvatarUrl(p)}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-black text-white truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">#{p.number ?? '10'} • Form: {p.form}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1"
                            >
                              <ArrowLeftRight className="w-3 h-3 text-[#FF1744]" />
                              <span>Select</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Tactical Formations */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#FF1744]" />
                    <span>TACTICAL FORMATION</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FORMATIONS.map(f => {
                      const isSelected = formation === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setFormation(f.id);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-[#FF1744]/20 border-[#FF1744] text-[#FF1744] ring-1 ring-[#FF1744] font-black'
                              : 'bg-[#0A0D1A] border-slate-800 text-slate-300 hover:bg-[#12182D]'
                          }`}
                        >
                          <span className="text-xs font-mono font-black block">{f.id}</span>
                          <span className="text-[9px] text-slate-400 truncate block">{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tactical Actions */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAutoOptimize();
                      setIsOpen(false);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>AUTO-OPTIMIZE STARTING 7</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onLockIn();
                      setIsOpen(false);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                      isLockedIn
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                        : 'bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 shadow-glow-cyan'
                    }`}
                  >
                    {isLockedIn ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{isLockedIn ? 'LINEUP LOCKED IN' : 'CONFIRM & LOCK IN PLAYING 7'}</span>
                  </button>

                  {isHost && onLaunchMatches && (
                    <button
                      type="button"
                      disabled={advancingToMatches}
                      onClick={async () => {
                        await onLaunchMatches();
                        setIsOpen(false);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 text-xs font-black uppercase rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Swords className="w-4 h-4" />
                      <span>{advancingToMatches ? 'LAUNCHING ARENA...' : 'START TOURNAMENT BATTLES'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
