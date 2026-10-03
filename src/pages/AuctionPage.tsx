import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useAuction } from '../contexts/AuctionContext';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { Hero3DViewer } from '../components/Hero3DViewer';
import { sound } from '../utils/audioSynth';
import type { ActiveTab } from '../types';
import { Gavel, Sparkles, Zap, Award, Flame, Volume2, Shield, ArrowRight, Brain, Clock, Users } from 'lucide-react';

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
}

const positionColor: Record<string, string> = {
  GK: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  ATT: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

function OverallBadge({ value }: { value: number }) {
  const color = value >= 90 ? 'from-[#00E5FF] to-blue-500 text-slate-950' : value >= 85 ? 'from-amber-400 to-amber-600 text-slate-950' : 'from-purple-500 to-indigo-600 text-white';
  return (
    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${color} rounded-2xl font-black font-display text-xl shadow-glow-cyan`}>
      {value}
    </div>
  );
}

export function AuctionPage({ setActiveTab }: any) {
  const { user } = useAuth();
  const { currentSession, startAuction, broadcastNavigation } = useSession();
  const {
    currentAuction,
    currentPlayer,
    bids,
    mySquad,
    myTeam,
    allTeams,
    timeLeft,
    auctionComplete,
    teamSquadCounts,
    allTeamsHaveMinSquad,
    minSquadRequired,
    placeBid,
    nextPlayer,
    skipPlayer,
    endAuctionManually,
    reopenAuction,
  } = useAuction();

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [show3D, setShow3D] = useState(true);

  const isHost = currentSession?.hostUserId === user?.id;

  const latestBid = bids && bids.length > 0 ? bids[0] : null;
  const effectiveCurrentBid = Math.max(currentAuction?.currentBid ?? 0, latestBid?.amount ?? 0);

  const effectiveHighestTeamId = useMemo(() => {
    if (effectiveCurrentBid <= 0) return null;
    if (latestBid?.teamId) return latestBid.teamId;
    return currentAuction?.highestTeamId || null;
  }, [effectiveCurrentBid, latestBid, currentAuction?.highestTeamId]);

  const highestBidTeam = useMemo(() => {
    if (!effectiveHighestTeamId) return null;
    return allTeams.find(t => t.id === effectiveHighestTeamId) ?? null;
  }, [effectiveHighestTeamId, allTeams]);

  const myTeamIsHighest = Boolean(
    myTeam &&
    effectiveCurrentBid > 0 &&
    effectiveHighestTeamId === myTeam.id
  );

  const minBid = effectiveCurrentBid > 0 
    ? effectiveCurrentBid + 1 
    : (currentAuction?.startingPrice ?? 5);

  // Sound pulse when time is running low
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 5) {
      sound.playCountdownPulse();
    }
  }, [timeLeft]);

  // AI Tactical Advice Generator
  const aiAdvice = useMemo(() => {
    if (!currentPlayer) return '';
    const ovr = currentPlayer.overall || 75;
    const pos = currentPlayer.position;
    if (ovr >= 90) {
      return `ZEROBALL AI: ${currentPlayer.name} is a generational elite ${pos}. Recommended bidding ceiling is up to €${Math.min(myTeam?.budget || 100, Math.round(ovr * 0.95))}M.`;
    } else if (ovr >= 85) {
      return `ZEROBALL AI: Solid core ${pos} with great squad synergy. Optimal value target is €${Math.round(ovr * 0.55)}M.`;
    }
    return `ZEROBALL AI: High-efficiency depth signing. Preserve budget for marquee attackers.`;
  }, [currentPlayer, myTeam?.budget]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      setBidError(`Bid must be at least €${minBid}M`);
      return;
    }
    setSubmittingBid(true);
    sound.playBidSound();
    const { error } = await placeBid(amount);
    if (error) {
      setBidError(error);
    } else {
      sound.playVictorySound();
      setBidSuccess(`Bid of €${amount}M placed successfully!`);
      setBidAmount('');
      setTimeout(() => setBidSuccess(''), 3000);
    }
    setSubmittingBid(false);
  };

  const handleNext = async () => {
    sound.playClick();
    const { error } = await nextPlayer();
    if (error) setBidError(error);
    setBidAmount('');
    setBidError('');
    setBidSuccess('');
  };

  const handleSkip = async () => {
    sound.playClick();
    const { error } = await skipPlayer();
    if (error) setBidError(error);
    setBidAmount('');
    setBidError('');
    setBidSuccess('');
  };

  // No session at all
  if (!currentSession) {
    return (
      <div className="p-6 text-center py-20 bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl max-w-xl mx-auto my-12 shadow-glow-cyan">
        <span className="text-5xl mb-4 block">🥽</span>
        <h2 className="text-xl font-black text-white uppercase tracking-wider font-display text-glow-cyan mb-2">
          NO ACTIVE BIDDING ARENA
        </h2>
        <p className="text-slate-400 text-xs mb-6">Create or join an arena room from the Battle Hub to start the live auction.</p>
        <button
          onClick={() => setActiveTab && setActiveTab('dashboard')}
          className="px-6 py-3 bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-glow-cyan"
        >
          Return to Battle Hub
        </button>
      </div>
    );
  }

  // Auction complete
  if (auctionComplete) {
    const handleContinueToMatches = async () => {
      sound.playVictorySound();
      if (currentSession) {
        await supabase
          .from('game_sessions')
          .update({ status: 'TEAM_SETUP' })
          .eq('id', currentSession.id);
        broadcastNavigation('lineup');
      }
      if (typeof setActiveTab === 'function') {
        setActiveTab('lineup');
      }
    };

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto py-12 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00E5FF] to-blue-600 rounded-2xl text-3xl shadow-glow-cyan mb-2">
            🏆
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase font-display text-glow-cyan">
            DRAFT AUCTION CONCLUDED
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-wider">
            All football superstars drafted. Proceed to the Battle Arena!
          </p>
        </div>

        {/* Your Team Card */}
        <div className="bg-[#0E1324] border border-[#00E5FF]/30 rounded-3xl p-6 shadow-glow-cyan space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-[#0A0A14] border border-[#00E5FF]/20 rounded-2xl">{myTeam?.badgeIcon || myTeam?.badge || '⚡'}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]">YOUR SQUAD</p>
                <h2 className="text-xl font-bold text-white tracking-wide">{myTeam?.name || myTeam?.teamName || 'Your Club'}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BUDGET LEFTOVER</p>
              <p className="text-2xl font-black text-amber-400 font-mono">€{myTeam?.budget ?? 100}M</p>
            </div>
          </div>

          {/* Squad List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                Acquired Squad ({mySquad.length}/10 Players)
              </h3>
              <span className="text-[10px] text-[#00E5FF] font-mono">ZEROBALL REGISTERED</span>
            </div>

            <div className="space-y-2">
              {mySquad.length === 0 ? (
                <div className="p-4 bg-[#0A0A14] rounded-2xl text-center text-xs text-slate-400">
                  Default superstar roster assigned for tactical battle.
                </div>
              ) : (
                mySquad.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between bg-[#0A0A14] border border-slate-800 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${positionColor[sq.player?.position ?? 'ATT'] ?? positionColor['ATT']}`}>
                        {sq.player?.position ?? 'ATT'}
                      </span>
                      <span className="font-semibold text-white text-sm">
                        {sq.player?.name ?? sq.playerId}
                      </span>
                      {sq.player?.overall && (
                        <span className="text-xs text-[#00E5FF] font-mono font-bold">({sq.player.overall} OVR)</span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-sm">€{sq.purchasePrice}M</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleContinueToMatches}
            className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-glow-cyan active:scale-98 flex items-center justify-center gap-2"
          >
            <span>CHOOSE YOUR PLAYING 7 →</span>
          </button>

          {isHost && (
            <button
              onClick={async () => {
                sound.playClick();
                await reopenAuction();
              }}
              className="w-full py-3.5 bg-[#0A0D1A] hover:bg-slate-800 border border-[#00E5FF]/40 text-[#00E5FF] font-bold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2"
            >
              <span>🔙 REOPEN LIVE AUCTION / DRAFT MORE PLAYERS</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Waiting for auction to start or load
  if (!currentAuction || currentSession.status !== 'AUCTION') {
    return (
      <div className="p-6 text-center py-20 space-y-4 max-w-lg mx-auto bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl my-12 shadow-glow-cyan">
        {currentSession.status === 'LOBBY' ? (
          <div className="space-y-4">
            <div className="text-5xl mb-2">🏟️</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
              DRAFT STAGE IDLE
            </h2>
            {isHost ? (
              <div className="space-y-3 pt-2">
                <p className="text-slate-400 text-xs">
                  You are the Room Host! Synchronize all managers and launch the live 3D Bidding Arena.
                </p>
                <button
                  onClick={async () => {
                    sound.playClick();
                    const { error } = await startAuction();
                    if (error) setBidError(error);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-glow-cyan active:scale-98"
                >
                  🚀 START 3D AUCTION NOW
                </button>
                <button onClick={() => setActiveTab && setActiveTab('lobby')} className="text-xs text-slate-400 hover:text-white underline">
                  Back to Room Lobby
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-slate-400 text-xs">Waiting for the host to launch the draft. You will connect automatically as soon as lot #1 opens!</p>
                <button onClick={() => setActiveTab && setActiveTab('lobby')} className="px-5 py-2.5 bg-[#0A0A14] border border-slate-700 hover:border-[#00E5FF] text-white rounded-xl text-xs uppercase font-bold">
                  View Lobby
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 space-y-3">
            <div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto shadow-glow-cyan" />
            <h3 className="text-white font-bold text-base uppercase tracking-wider">PROJECTING NEXT PLAYER...</h3>
            <p className="text-slate-400 text-xs font-mono">Syncing Three.js Holo-Stage</p>
          </div>
        )}
      </div>
    );
  }

  const timerColor = timeLeft <= 5 ? 'text-rose-400 text-glow-purple' : timeLeft <= 10 ? 'text-amber-400 text-glow-gold' : 'text-[#00E5FF] text-glow-cyan';
  const timerPulse = timeLeft <= 5 ? 'animate-pulse' : '';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 animate-fadeIn">
      
      {/* ARENA HEADER: ROOM CODE & 3D STAGE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0E1324] border border-[#00E5FF]/25 shadow-glow-cyan">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-center text-lg text-[#00E5FF]">
            🥽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 tracking-wider">
                ZEROBALLKNOWLEDGE 3D ARENA
              </span>
              <span className="text-[11px] font-mono text-slate-400">ROOM: {currentSession.sessionCode}</span>
            </div>
            <p className="text-white text-xs font-bold mt-0.5">
              Live Multiplayer Bidding War • Lot #{currentPlayer?.id.slice(-4) || '1'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow3D(!show3D)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition flex items-center gap-1.5 ${
              show3D
                ? 'bg-[#00E5FF]/20 border-[#00E5FF]/50 text-[#00E5FF] shadow-glow-cyan'
                : 'bg-[#0A0A14] border-slate-700 text-slate-400'
            }`}
          >
            <span>{show3D ? 'Hide 3D Stage' : 'Show 3D Stage'}</span>
          </button>
        </div>
      </div>

      {/* ROOM SQUAD READINESS & HOST DRAFT CONCLUDE PANEL */}
      <div className="bg-[#0E1324] border border-[#00E5FF]/30 rounded-3xl p-4 sm:p-5 shadow-glow-cyan space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              SQUAD READINESS TRACKER (MINIMUM {minSquadRequired} PLAYERS PER TEAM)
            </span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
            allTeamsHaveMinSquad ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {allTeamsHaveMinSquad ? `✓ ALL TEAMS READY (${minSquadRequired}+ PLAYERS)` : `⚠️ DRAFT IN PROGRESS (NEEDS ${minSquadRequired}+ PLAYERS)`}
          </span>
        </div>

        {/* Teams Status Pill List */}
        <div className="flex flex-wrap gap-2">
          {(allTeams || []).map(t => {
            const count = teamSquadCounts[t.id] || 0;
            const hasMin = count >= minSquadRequired;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  hasMin 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <span>{t.badgeIcon || t.badge || '⚡'}</span>
                <span className="font-bold">{t.name || t.teamName || 'Team'}</span>
                <span className={`font-mono font-black px-1.5 py-0.2 rounded ${hasMin ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
                  {count}/{minSquadRequired}
                </span>
                {hasMin ? (
                  <span className="text-[10px] text-emerald-400 font-bold">✓ Ready</span>
                ) : (
                  <span className="text-[10px] text-amber-400 animate-pulse font-bold">Needs {minSquadRequired - count}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Host Conclude Button */}
        {isHost && (
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {allTeamsHaveMinSquad 
                ? 'All managers have acquired at least 8 players! You can conclude the auction whenever you are ready.'
                : `Simulation is locked until every team drafts at least ${minSquadRequired} players.`}
            </p>
            <button
              onClick={async () => {
                sound.playClick();
                const { error } = await endAuctionManually();
                if (error) {
                  setBidError(error);
                } else {
                  sound.playVictorySound();
                  if (typeof setActiveTab === 'function') setActiveTab('lineup');
                }
              }}
              disabled={!allTeamsHaveMinSquad}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                allTeamsHaveMinSquad
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <span>🏁 CONCLUDE AUCTION & START SQUAD SELECTION</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ===== MAIN AUCTION LOT / 3D VIEWER PANEL ===== */}
        <div className="lg:col-span-2 space-y-4">

          {/* Interactive Three.js 3D Viewer or 2D Card */}
          {show3D && (
            <div className="transition-all">
              <Hero3DViewer
                player={currentPlayer}
                auraHex={currentPlayer?.overall && currentPlayer.overall >= 90 ? '#F59E0B' : '#00E5FF'}
                height={380}
                showControls={true}
              />
            </div>
          )}

          {/* Player Scouting Info & Live Countdown */}
          <div className="bg-[#0E1324] border border-[#00E5FF]/30 rounded-3xl overflow-hidden shadow-glow-cyan">
            {/* Header with live timer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0A0A14]/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#00E5FF] rounded-full animate-ping" />
                <span className="text-xs font-black text-[#00E5FF] uppercase tracking-widest text-glow-cyan">
                  CURRENT LOT
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-2 py-0.5 rounded-md font-mono">
                  +10s EXTENSION / BID
                </span>
                <div className={`text-2xl font-black font-display ${timerColor} ${timerPulse}`}>
                  {timeLeft === 0 ? 'SOLD!' : `${timeLeft}s`}
                </div>
              </div>
            </div>

            {/* Player details */}
            {currentPlayer ? (
              <div className="p-5">
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Player avatar */}
                  {(() => {
                    const avatar = getPlayerAvatarUrl(currentPlayer);
                    return (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-slate-800 to-[#0A0A14] rounded-2xl flex flex-col items-center justify-center border border-[#00E5FF]/30 flex-shrink-0 overflow-hidden shadow-glow-cyan">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={currentPlayer.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain object-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl font-black text-white">
                            {(currentPlayer.shortName || currentPlayer.name || 'PL').split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </span>
                        )}
                        <span className={`absolute bottom-1 px-2 py-0.2 rounded border text-[9px] font-black z-10 backdrop-blur-sm ${positionColor[currentPlayer.position ?? 'ATT'] ?? positionColor['ATT']}`}>
                          {currentPlayer.position ?? 'ATT'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Name & stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-display tracking-wide">
                          {currentPlayer.name}
                        </h2>
                        <p className="text-slate-400 text-xs font-semibold mt-0.5">
                          {currentPlayer.nationality || 'World'} • {currentPlayer.position || 'MID'}
                        </p>
                      </div>
                      <OverallBadge value={currentPlayer.overall ?? 75} />
                    </div>

                    {/* Attribute grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-800">
                      {[
                        { label: 'PAC', val: currentPlayer.pace ?? 70 },
                        { label: 'SHO', val: currentPlayer.shooting ?? 70 },
                        { label: 'PAS', val: currentPlayer.passing ?? 70 },
                        { label: 'DRI', val: currentPlayer.dribbling ?? 70 },
                        { label: 'DEF', val: currentPlayer.defending ?? 70 },
                        { label: 'PHY', val: currentPlayer.physical ?? 70 },
                      ].map(st => (
                        <div key={st.label} className="bg-[#0A0A14] border border-slate-800 rounded-xl px-2 py-1 text-center">
                          <span className="text-[9px] font-bold text-slate-500 block">{st.label}</span>
                          <span className="text-xs font-black text-white font-mono">{st.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Tactical Advice Chip */}
                {aiAdvice && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-[#00E5FF]/20 rounded-2xl flex items-start gap-2 text-xs">
                    <Brain className="w-4 h-4 text-[#00E5FF] flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300 leading-relaxed font-medium">
                      {aiAdvice}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto shadow-glow-cyan" />
                <p className="text-xs text-slate-400 font-mono">LOADING SCOUTING CARD...</p>
              </div>
            )}

            {/* Bid Info Strip */}
            <div className="border-t border-slate-800 grid grid-cols-3 divide-x divide-slate-800 bg-[#0A0A14]">
              <div className="p-3.5 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">OPENING LOT</p>
                <p className="text-base sm:text-lg font-black text-white font-mono">€{currentAuction.startingPrice}M</p>
              </div>
              <div className="p-3.5 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">CURRENT BID</p>
                <p className="text-xl sm:text-2xl font-black text-[#00E5FF] font-mono text-glow-cyan">
                  {effectiveCurrentBid > 0 ? `€${effectiveCurrentBid}M` : '€0M'}
                </p>
              </div>
              <div className="p-3.5 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">HIGH BIDDER</p>
                <p className="text-sm sm:text-base font-black text-white truncate">
                  {highestBidTeam ? (
                    <span className={myTeamIsHighest ? 'text-[#00E5FF] text-glow-cyan' : 'text-white'}>
                      {myTeamIsHighest ? 'YOU 🎉' : (highestBidTeam.abbreviation || highestBidTeam.name)}
                    </span>
                  ) : 'NO BIDS'}
                </p>
              </div>
            </div>
          </div>

          {/* Bid Controls */}
          <div className="bg-[#0E1324] border border-[#00E5FF]/30 rounded-3xl p-5 space-y-3.5 shadow-glow-cyan">
            {bidError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">{bidError}</div>}
            {bidSuccess && <div className="p-3 bg-[#00E5FF]/10 border border-[#00E5FF]/40 rounded-xl text-[#00E5FF] text-xs font-bold text-glow-cyan">{bidSuccess}</div>}

            {myTeamIsHighest && (
              <div className="p-3 bg-[#00E5FF]/10 border border-[#00E5FF]/40 rounded-2xl text-[#00E5FF] text-xs font-black uppercase tracking-wider text-center shadow-glow-cyan">
                🏆 YOU ARE CURRENTLY THE HIGHEST BIDDER!
              </div>
            )}

            <form onSubmit={handleBid} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00E5FF] font-black text-sm">€</span>
                <input
                  type="number"
                  min={minBid}
                  max={myTeam?.budget ?? 100}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Min bid: €${minBid}M`}
                  className="w-full bg-[#0A0A14] border border-slate-700 focus:border-[#00E5FF] rounded-2xl pl-8 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none text-sm font-bold font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={submittingBid || currentAuction.status !== 'LIVE' || mySquad.length >= 10}
                className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-glow-cyan active:scale-95 flex items-center gap-1.5"
              >
                <Gavel className="w-4 h-4" />
                <span>{submittingBid ? 'PLACING...' : 'PLACE BID'}</span>
              </button>
            </form>

            {/* Quick bid buttons */}
            <div className="flex flex-wrap gap-2">
              {[minBid, minBid + 2, minBid + 5, minBid + 10, minBid + 20].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBidAmount(String(amt));
                  }}
                  disabled={!myTeam || amt > myTeam.budget}
                  className="px-3 py-1.5 bg-[#0A0A14] hover:bg-[#12182D] border border-slate-800 hover:border-[#00E5FF]/40 text-white text-xs font-mono font-bold rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +€{amt}M
                </button>
              ))}
              {myTeam && myTeam.budget >= minBid && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBidAmount(String(Math.floor(myTeam.budget)));
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  ALL-IN!
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>BUDGET: <span className="text-[#00E5FF] font-black font-mono">€{myTeam?.budget ?? '—'}M</span></span>
              <span>SQUAD SLOTS: <span className="text-white font-bold">{mySquad.length}/10</span></span>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
                  >
                    {effectiveCurrentBid > 0 ? '✓ HAMMER DOWN & NEXT LOT' : '→ NEXT FOOTBALLER'}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-3 bg-[#0A0A14] hover:bg-slate-800 text-slate-300 rounded-xl text-xs uppercase font-bold transition border border-slate-700"
                  >
                    SKIP LOT
                  </button>
                </div>
                {mySquad.length >= 3 && (
                  <button
                    onClick={async () => {
                      if (confirm('Finish auction draft now and choose your Playing 7?')) {
                        sound.playVictorySound();
                        if (currentSession) {
                          await supabase
                            .from('game_sessions')
                            .update({ status: 'TEAM_SETUP' })
                            .eq('id', currentSession.id);
                          broadcastNavigation('lineup');
                        }
                        if (typeof setActiveTab === 'function') {
                          setActiveTab('lineup');
                        }
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    🏁 FINISH DRAFT & SELECT PLAYING 7
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR: BID FEED, MY SQUAD, ALL MANAGERS ===== */}
        <div className="space-y-4">
          
          {/* Live Bidding War Log */}
          <div className="bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-xs uppercase tracking-wider font-display">
                BID WAR TICKER
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
              {bids.length === 0 ? (
                <div className="p-5 text-center text-slate-500 text-xs">
                  No bids on this lot yet. Submit opening bid!
                </div>
              ) : (
                bids.map(bid => {
                  const team = allTeams.find(t => t.id === bid.teamId);
                  const isMyBid = myTeam && bid.teamId === myTeam.id;
                  return (
                    <div key={bid.id} className={`flex items-center justify-between px-4 py-2.5 ${isMyBid ? 'bg-[#00E5FF]/10' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{team?.badgeIcon ?? '⚽'}</span>
                        <span className="text-xs font-bold text-slate-300">{team?.abbreviation ?? '???'}</span>
                        {isMyBid && <span className="text-[10px] text-[#00E5FF] font-black uppercase">(YOU)</span>}
                      </div>
                      <span className="text-emerald-400 font-mono font-black text-sm">€{bid.amount}M</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Acquired Squad */}
          <div className="bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-xs uppercase tracking-wider font-display">
                MY SQUAD
              </h3>
              <span className="text-xs font-mono font-bold text-[#00E5FF]">{mySquad.length}/10</span>
            </div>
            <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
              {mySquad.length === 0 ? (
                <div className="p-5 text-center text-slate-500 text-xs">
                  No footballers acquired yet. Bid to build your squad of up to 10!
                </div>
              ) : (
                mySquad.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${positionColor[sq.player?.position ?? 'ATT']}`}>
                        {sq.player?.position ?? '?'}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{sq.player?.shortName ?? sq.playerId.slice(0, 8)}</span>
                    </div>
                    <span className="text-emerald-400 text-xs font-mono font-bold flex-shrink-0">€{sq.purchasePrice}M</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Managers & Budgets */}
          <div className="bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800">
              <h3 className="font-black text-white text-xs uppercase tracking-wider font-display">
                ROOM MANAGERS
              </h3>
            </div>
            <div className="divide-y divide-slate-800/80">
              {allTeams.map(t => {
                const isMe = myTeam && t.id === myTeam.id;
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-[#00E5FF]/10' : ''}`}>
                    <span className="text-base">{t.badgeIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.teamName}</p>
                    </div>
                    <span className="text-amber-400 text-xs font-mono font-black">€{t.budget}M</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
