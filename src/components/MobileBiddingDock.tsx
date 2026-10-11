import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player, Team, Auction } from '../types';
import { getPlayerAvatarUrl, getPlayerAvatarFallbacks } from '../data/playerAvatars';
import { sound } from '../utils/audioSynth';
import {
  Gavel,
  Zap,
  ChevronUp,
  X,
  Clock,
  Brain,
  Shield,
  Coins,
  SkipForward,
  Check,
  AlertCircle,
  Flame,
  ArrowRight
} from 'lucide-react';

export interface MobileBiddingDockProps {
  currentPlayer: Player | null;
  currentAuction: Auction | null;
  timeLeft: number;
  effectiveCurrentBid: number;
  highestBidTeam: Team | null;
  myTeamIsHighest: boolean;
  myTeam: Team | null;
  minBid: number;
  bidAmount: string;
  setBidAmount: (val: string) => void;
  onSubmitBid: (e: React.FormEvent) => Promise<void>;
  onDirectBid: (amount: number) => Promise<void>;
  submittingBid: boolean;
  bidError: string;
  bidSuccess: string;
  aiThinking: string | null;
  aiAdvice?: string;
  isHost: boolean;
  onNextPlayer?: () => Promise<void>;
  onSkipPlayer?: () => Promise<void>;
  mySquadLength: number;
}

const positionColor: Record<string, string> = {
  GK: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  ATT: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

function getRatingBadgeStyle(ovr: number): string {
  if (ovr >= 90) {
    return 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.35)]';
  }
  if (ovr >= 85) {
    return 'bg-purple-500/25 text-purple-300 border-purple-500/40';
  }
  if (ovr >= 80) {
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export const MobileBiddingDock: React.FC<MobileBiddingDockProps> = ({
  currentPlayer,
  currentAuction,
  timeLeft,
  effectiveCurrentBid,
  highestBidTeam,
  myTeamIsHighest,
  myTeam,
  minBid,
  bidAmount,
  setBidAmount,
  onSubmitBid,
  onDirectBid,
  submittingBid,
  bidError,
  bidSuccess,
  aiThinking,
  aiAdvice,
  isHost,
  onNextPlayer,
  onSkipPlayer,
  mySquadLength,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarIdx, setAvatarIdx] = useState(0);

  const fallbacks = useMemo(() => {
    return currentPlayer ? getPlayerAvatarFallbacks(currentPlayer) : [];
  }, [currentPlayer]);

  useEffect(() => {
    setAvatarIdx(0);
  }, [currentPlayer?.id, currentPlayer?.name]);

  // When an error or success happens, keep the drawer open so user sees confirmation
  useEffect(() => {
    if (bidError || bidSuccess) {
      setIsOpen(true);
    }
  }, [bidError, bidSuccess]);

  if (!currentAuction || !currentPlayer || currentAuction.status !== 'LIVE') {
    return null;
  }

  const avatarUrl = fallbacks[avatarIdx] || getPlayerAvatarUrl(currentPlayer);
  const ovr = currentPlayer.overall ?? 75;
  const pos = currentPlayer.position ?? 'ATT';
  const posBadge = positionColor[pos] || positionColor['ATT'];
  const ratingBadge = getRatingBadgeStyle(ovr);

  const timerColor = timeLeft <= 5 ? 'text-rose-400 font-extrabold' : timeLeft <= 10 ? 'text-amber-400' : 'text-[#FF1744]';
  const timerPulse = timeLeft <= 5 ? 'animate-ping' : '';

  const quickBidIncrements = [
    { label: `+€1M`, amt: minBid },
    { label: `+€2M`, amt: minBid + 1 },
    { label: `+€5M`, amt: minBid + 4 },
    { label: `+€10M`, amt: minBid + 9 },
    { label: `+€20M`, amt: minBid + 19 },
  ];

  return (
    <>
      {/* ===== 1. FLOATING BOTTOM DOCK BAR (COLLAPSED) ===== */}
      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px)+8px)] left-2 right-2 z-40 lg:hidden">
        <div
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          className="bg-[#0E1324]/95 backdrop-blur-xl border border-[#FF1744]/40 rounded-2xl p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] transition-all ring-1 ring-white/5"
        >
          {/* Left: Player Avatar & Details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-slate-900 border border-[#FF1744]/40 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
              <span className="text-xs font-black text-white font-display select-none">{currentPlayer.name.slice(0, 2).toUpperCase()}</span>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={currentPlayer.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain object-center"
                  onError={(e) => {
                    if (avatarIdx + 1 < fallbacks.length) {
                      setAvatarIdx(prev => prev + 1);
                    } else {
                      (e.target as HTMLElement).style.display = 'none';
                    }
                  }}
                />
              )}

              <span className={`absolute bottom-0 right-0 text-[8px] font-black px-1 rounded-tl border ${posBadge}`}>
                {pos}
              </span>
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black font-mono px-1 py-0.2 rounded border ${ratingBadge}`}>
                  {ovr}
                </span>
                <p className="text-xs font-black text-white truncate font-display">
                  {currentPlayer.shortName || currentPlayer.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                <span className="text-slate-400 font-mono">
                  {effectiveCurrentBid > 0 ? (
                    <span className="text-[#FF1744] font-black">€{effectiveCurrentBid}M</span>
                  ) : (
                    <span>€{currentAuction.startingPrice}M</span>
                  )}
                </span>
                <span className="text-slate-600">•</span>
                <span className={`font-mono font-black ${timerColor}`}>
                  {timeLeft === 0 ? 'SOLD' : `${timeLeft}s`}
                </span>
                {myTeamIsHighest && (
                  <span className="bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded text-[8px]">
                    YOU HIGHEST
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick 1-tap bid button for min bid */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playBidSound();
                onDirectBid(minBid);
              }}
              disabled={submittingBid || !myTeam || minBid > (myTeam?.budget ?? 0) || mySquadLength >= 10}
              className="px-2.5 py-1.5 min-h-[38px] bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 active:scale-95 text-slate-950 font-black text-[11px] rounded-xl transition-all disabled:opacity-40 shadow-glow-cyan flex items-center gap-1 uppercase whitespace-nowrap"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>€{minBid}M</span>
            </button>

            {/* Expand Drawer Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setIsOpen(true);
              }}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center bg-[#0A0D1A] hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
              title="Open Quick Bid & Scouting Drawer"
            >
              <ChevronUp className="w-4 h-4 text-[#FF1744]" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== 2. POPUP BOTTOM SHEET DRAWER ===== */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col justify-end lg:hidden animate-fadeIn">
          {/* Backdrop Tap to Close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative bg-[#0E1324] border-t-2 border-[#FF1744]/40 rounded-t-3xl p-4 sm:p-5 pb-[max(1.75rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] max-h-[88vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.9)] space-y-3.5">
            {/* Handle bar */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

            {/* Header: Lot & Timer & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF1744] animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-[#FF1744] font-display">
                  LIVE AUCTION LOT #{currentPlayer.id.slice(-4) || '1'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A0D1A] border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`text-xs font-mono font-black ${timerColor}`}>
                    {timeLeft === 0 ? 'SOLD!' : `${timeLeft}s`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Feedback Notifications */}
            {bidError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{bidError}</span>
              </div>
            )}
            {bidSuccess && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {/* Highest Bidder Notice */}
            {myTeamIsHighest && (
              <div className="p-2.5 bg-[#FF1744]/15 border border-[#FF1744]/40 rounded-xl text-[#FF1744] text-xs font-black uppercase tracking-wider text-center shadow-glow-cyan flex items-center justify-center gap-1.5">
                <span>🏆 YOU ARE CURRENTLY THE HIGHEST BIDDER!</span>
              </div>
            )}

            {/* AI Bidding Engine Status */}
            {aiThinking && (
              <div className="p-2 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>{aiThinking}</span>
              </div>
            )}

            {/* Player Scouting Summary Card */}
            <div className="bg-[#0A0D1A] border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl bg-slate-900 border border-[#FF1744]/30 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                <span className="text-base font-black text-white font-display select-none">{currentPlayer.name.slice(0, 2).toUpperCase()}</span>
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={currentPlayer.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain object-center"
                    onError={(e) => {
                      if (avatarIdx + 1 < fallbacks.length) {
                        setAvatarIdx(prev => prev + 1);
                      } else {
                        (e.target as HTMLElement).style.display = 'none';
                      }
                    }}
                  />
                )}

                <span className={`absolute bottom-0 right-0 text-[9px] font-black px-1.5 py-0.2 rounded-tl border ${posBadge}`}>
                  {pos}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white truncate font-display">
                    {currentPlayer.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-lg border text-xs font-black font-mono ${ratingBadge}`}>
                    {ovr} OVR
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentPlayer.nationality || 'World'} • {pos}
                </p>

                {/* Key Attributes Mini Grid */}
                <div className="grid grid-cols-6 gap-1 mt-2 text-center">
                  {[
                    { l: 'PAC', v: currentPlayer.pace ?? 70 },
                    { l: 'SHO', v: currentPlayer.shooting ?? 70 },
                    { l: 'PAS', v: currentPlayer.passing ?? 70 },
                    { l: 'DRI', v: currentPlayer.dribbling ?? 70 },
                    { l: 'DEF', v: currentPlayer.defending ?? 70 },
                    { l: 'PHY', v: currentPlayer.physical ?? 70 },
                  ].map(stat => (
                    <div key={stat.l} className="bg-[#0E1324] border border-slate-800/80 rounded px-0.5 py-0.5">
                      <span className="text-[8px] text-slate-500 font-bold block">{stat.l}</span>
                      <span className="text-[10px] font-black text-white font-mono">{stat.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Tactical Advice Pill */}
            {aiAdvice && (
              <div className="p-2.5 bg-gradient-to-r from-rose-950/40 to-purple-950/40 border border-[#FF1744]/25 rounded-xl flex items-start gap-2 text-xs">
                <Brain className="w-3.5 h-3.5 text-[#FF1744] flex-shrink-0 mt-0.5" />
                <p className="text-slate-300 text-[11px] leading-tight font-medium">
                  {aiAdvice}
                </p>
              </div>
            )}

            {/* Live Pricing Status Strip */}
            <div className="grid grid-cols-3 divide-x divide-slate-800 bg-[#0A0D1A] rounded-xl border border-slate-800 py-2">
              <div className="text-center px-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">BASE LOT</span>
                <span className="text-xs font-black font-mono text-white">€{currentAuction.startingPrice}M</span>
              </div>
              <div className="text-center px-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">CURRENT BID</span>
                <span className="text-sm font-black font-mono text-[#FF1744]">
                  {effectiveCurrentBid > 0 ? `€${effectiveCurrentBid}M` : '€0M'}
                </span>
              </div>
              <div className="text-center px-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">TOP BIDDER</span>
                <span className="text-xs font-black truncate block text-white">
                  {highestBidTeam ? (myTeamIsHighest ? 'YOU 🎉' : highestBidTeam.abbreviation || highestBidTeam.name) : 'NONE'}
                </span>
              </div>
            </div>

            {/* Quick Increment Bid Pills */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>QUICK BID INCREMENTS</span>
                <span className="text-[#FF1744] font-mono">Min Next: €{minBid}M</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickBidIncrements.map(inc => {
                  const disabled = !myTeam || inc.amt > myTeam.budget;
                  return (
                    <button
                      key={inc.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        sound.playClick();
                        setBidAmount(String(inc.amt));
                      }}
                      className="flex-1 min-w-[58px] py-2 px-1.5 bg-[#0A0D1A] hover:bg-[#12182D] active:bg-[#FF1744]/20 border border-slate-800 hover:border-[#FF1744]/40 text-white rounded-xl text-xs font-mono font-bold transition disabled:opacity-30 disabled:cursor-not-allowed text-center"
                    >
                      €{inc.amt}M
                    </button>
                  );
                })}

                {myTeam && myTeam.budget >= minBid && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setBidAmount(String(Math.floor(myTeam.budget)));
                    }}
                    className="py-2 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase rounded-xl transition font-mono"
                  >
                    ALL-IN (€{Math.floor(myTeam.budget)}M)
                  </button>
                )}
              </div>
            </div>

            {/* Custom Amount Form & Place Bid Button */}
            <form onSubmit={onSubmitBid} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF1744] font-black text-sm">€</span>
                  <input
                    type="number"
                    min={minBid}
                    max={myTeam?.budget ?? 130}
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={`Min €${minBid}M`}
                    className="w-full bg-[#0A0D1A] border border-slate-700 focus:border-[#FF1744] rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm font-bold font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingBid || mySquadLength >= 10 || (bidAmount ? parseInt(bidAmount) < minBid : false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 whitespace-nowrap shadow-glow-cyan active:scale-95 flex items-center gap-1.5"
                >
                  <Gavel className="w-4 h-4" />
                  <span>{submittingBid ? 'BIDDING...' : 'PLACE BID'}</span>
                </button>
              </div>
            </form>

            {/* Manager Squad & Budget Status */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>BUDGET: <strong className="text-[#FF1744] font-mono">€{myTeam?.budget ?? '0'}M</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>SLOTS: <strong className="text-white">{mySquadLength}/10</strong></span>
              </div>
            </div>

            {/* Host Controls or Skip/Pass Action */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {isHost ? (
                <div className="flex gap-2">
                  {onNextPlayer && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onNextPlayer();
                      }}
                      className="flex-1 py-2.5 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{effectiveCurrentBid > 0 ? 'HAMMER DOWN LOT' : 'NEXT LOT'}</span>
                    </button>
                  )}
                  {onSkipPlayer && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onSkipPlayer();
                      }}
                      className="px-4 py-2.5 bg-[#0A0D1A] hover:bg-slate-800 text-slate-300 rounded-xl text-xs uppercase font-bold transition border border-slate-700 flex items-center gap-1"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>SKIP</span>
                    </button>
                  )}
                </div>
              ) : (
                onSkipPlayer && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSkipPlayer();
                    }}
                    className="w-full py-2 bg-[#0A0D1A] hover:bg-slate-800 text-slate-400 rounded-xl text-xs uppercase font-bold transition border border-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>PASS ON THIS LOT</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
