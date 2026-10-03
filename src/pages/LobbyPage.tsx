import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { sound } from '../utils/audioSynth';
import type { ActiveTab } from '../types';
import { Radio, Users, Copy, Check, Zap, Play, LogOut, Shield } from 'lucide-react';

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
}

export default function LobbyPage({ setActiveTab }: Props) {
  const { user } = useAuth();
  const { currentSession, myTeam, lobbyMembers, allTeams, loadingSession, startAuction, leaveGame } = useSession();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!currentSession) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center py-20 bg-[#0E1324] border border-[#FF1744]/20 rounded-3xl my-12 shadow-glow-cyan">
        <div className="text-5xl mb-4">🏟️</div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider font-display text-glow-cyan mb-2">
          NO ACTIVE BATTLE ROOM
        </h2>
        <p className="text-slate-400 text-xs mb-6">Create or join an arena room from the Battle Hub.</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-3 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-glow-cyan"
        >
          Return to Battle Hub
        </button>
      </div>
    );
  }

  const isHost = currentSession.hostUserId === user?.id;
  const memberCount = lobbyMembers.length;

  // Auto-redirect all players when host starts auction or matches
  React.useEffect(() => {
    if (currentSession?.status === 'AUCTION') {
      setActiveTab('auction');
    } else if (currentSession?.status === 'MATCHES') {
      setActiveTab('matches');
    }
  }, [currentSession?.status, setActiveTab]);

  const copyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentSession.sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAuction = async () => {
    sound.playVictorySound();
    setStartError('');
    setStarting(true);
    const { error } = await startAuction();
    if (error) setStartError(error);
    else setActiveTab('auction');
    setStarting(false);
  };

  const handleLeave = async () => {
    sound.playClick();
    const msg = isHost
      ? 'You are the host of this room. Quitting will end the room for all players. Are you sure you want to end and quit the room?'
      : 'Are you sure you want to disconnect from this arena room?';
    if (!confirm(msg)) return;
    await leaveGame();
    setActiveTab('dashboard');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* Session Header Banner */}
      <div className="relative bg-gradient-to-br from-[#0E1324] via-[#0A0A14] to-[#12182D] border border-[#FF1744]/30 rounded-3xl p-6 sm:p-7 shadow-glow-cyan overflow-hidden">
        <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] animate-ping" />
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30 tracking-widest text-glow-cyan">
                ROOM STATUS: {currentSession.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide font-display text-glow-cyan">
              {myTeam?.teamName ?? 'ZEROBALLKNOWLEDGE ARENA'}
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {memberCount} / {currentSession.maxPlayers} managers connected in session
            </p>
          </div>

          <div className="text-left sm:text-right bg-[#0A0A14]/80 border border-[#FF1744]/20 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">ROOM CODE</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2.5 bg-[#0E1324] hover:bg-slate-800 border border-[#FF1744]/30 rounded-xl px-4 py-2 transition shadow-glow-cyan group"
            >
              <span className="text-2xl font-black text-[#FF1744] font-mono tracking-widest text-glow-cyan">
                {currentSession.sessionCode}
              </span>
              <span className="text-[#FF1744] text-sm">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              </span>
            </button>
          </div>
        </div>

        {/* Room Parameters Pills */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <span className="bg-[#0A0A14] border border-[#FF1744]/20 text-[#FF1744] text-xs font-mono font-bold px-3 py-1 rounded-xl">
            💰 €{currentSession.startingBudget}M STARTING BUDGET
          </span>
          <span className="bg-[#0A0A14] border border-slate-800 text-slate-300 text-xs font-mono px-3 py-1 rounded-xl">
            👤 {currentSession.squadSize} PLAYERS PER SQUAD
          </span>
          <span className="bg-[#0A0A14] border border-slate-800 text-slate-300 text-xs font-mono px-3 py-1 rounded-xl">
            🏆 {currentSession.seasonLength} MATCH TOURNAMENT
          </span>
        </div>
      </div>

      {/* Connected Managers in Room */}
      <div className="bg-[#0E1324] border border-[#FF1744]/20 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0A14]/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF1744]" />
            <h2 className="font-black text-white text-xs uppercase tracking-wider font-display text-glow-cyan">
              CONNECTED MANAGERS
            </h2>
          </div>
          <span className="text-xs text-[#FF1744] font-mono font-bold">{memberCount} CONNECTED</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {lobbyMembers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-xs font-mono">WAITING FOR MANAGERS TO ENTER CODE...</p>
            </div>
          ) : (
            lobbyMembers.map((member) => {
              const memberTeam = allTeams.find(t => t.userId === member.userId);
              const isMe = member.userId === user?.id;
              const isMemberHost = member.userId === currentSession.hostUserId;

              return (
                <div key={member.userId} className="flex items-center gap-4 px-6 py-4 hover:bg-[#12182D] transition">
                  <div className="w-11 h-11 bg-[#0A0A14] border border-[#FF1744]/30 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-glow-cyan">
                    {memberTeam?.badgeIcon ?? '⚡'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {memberTeam?.teamName ?? member.profile?.displayName ?? 'Manager'}
                      </span>
                      {isMemberHost && (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/40 flex-shrink-0">
                          HOST
                        </span>
                      )}
                      {isMe && (
                        <span className="bg-[#FF1744]/20 text-[#FF1744] text-[10px] font-black px-2 py-0.5 rounded border border-[#FF1744]/40 flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      @{member.profile?.username ?? 'manager'}
                      {memberTeam && ` · ${memberTeam.abbreviation}`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-amber-400 font-mono font-black text-sm">
                      €{memberTeam?.budget ?? currentSession.startingBudget}M
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">BUDGET</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && currentSession.status === 'LOBBY' && (
        <div className="bg-[#0E1324] border border-[#FF1744]/30 rounded-3xl p-6 space-y-4 shadow-glow-cyan">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FF1744]" />
            <h2 className="font-black text-white text-xs uppercase tracking-wider font-display text-glow-cyan">
              ROOM HOST COMMAND CENTER
            </h2>
          </div>

          {startError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
              {startError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStartAuction}
              disabled={starting || loadingSession || memberCount < 1}
              className="flex-1 py-4 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-2xl transition-all shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{starting ? 'INITIALIZING STAGE...' : `LAUNCH 3D AUCTION (${memberCount} READY)`}</span>
            </button>
          </div>

          {memberCount < 2 && (
            <p className="text-xs text-slate-400 text-center font-medium">
              You can start drafting solo vs intelligent AI bidders or wait for managers with code <span className="text-[#FF1744] font-mono font-bold">{currentSession.sessionCode}</span>.
            </p>
          )}
        </div>
      )}

      {/* Non-host waiting message */}
      {!isHost && currentSession.status === 'LOBBY' && (
        <div className="bg-[#0E1324]/80 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
          <div className="text-3xl mb-1">⏳</div>
          <p className="text-white font-bold text-sm">
            Waiting for Host <span className="text-[#FF1744] font-black">{allTeams.find(t => t.userId === currentSession.hostUserId)?.teamName || 'Host'}</span> to launch auction...
          </p>
          <p className="text-slate-400 text-xs">
            {memberCount} manager{memberCount === 1 ? '' : 's'} connected. You will automatically drop into the 3D Bidding Arena as soon as lot #1 opens!
          </p>
        </div>
      )}

      {/* Leave button */}
      <div className="text-center pt-2">
        <button
          onClick={handleLeave}
          className="text-xs text-slate-500 hover:text-rose-400 font-bold uppercase tracking-wider transition flex items-center gap-1.5 mx-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isHost ? 'END & QUIT ROOM' : 'DISCONNECT FROM ROOM'}</span>
        </button>
      </div>
    </div>
  );
}
