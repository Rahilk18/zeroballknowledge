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
      <div className="p-6 max-w-xl mx-auto text-center py-8 sm:py-10 bg-[#0E1324] border border-[#FF1744]/20 rounded-2xl my-4 shadow-glow-cyan">
        <div className="text-4xl mb-3">🏟️</div>
        <h2 className="text-lg font-black text-white uppercase tracking-wider font-display text-glow-cyan mb-1.5">
          NO ACTIVE BATTLE ROOM
        </h2>
        <p className="text-slate-400 text-xs mb-5">Create or join an arena room from the Battle Hub.</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-5 py-2.5 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-glow-cyan"
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
    <div className="p-2 sm:p-4 max-w-4xl mx-auto space-y-3.5 animate-fadeIn pb-6">
      
      {/* Session Header Banner */}
      <div className="relative bg-gradient-to-br from-[#0E1324] via-[#0A0A14] to-[#12182D] border border-[#FF1744]/30 rounded-2xl p-4 sm:p-5 shadow-glow-cyan overflow-hidden">
        <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FF1744] animate-ping" />
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30 tracking-widest text-glow-cyan">
                ROOM STATUS: {currentSession.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide font-display text-glow-cyan">
              {myTeam?.teamName ?? 'ZEROBALLKNOWLEDGE ARENA'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              {memberCount} / {currentSession.maxPlayers} managers connected in session
            </p>
          </div>

          <div className="text-left sm:text-right bg-[#0A0A14]/80 border border-[#FF1744]/20 p-3 sm:p-3.5 rounded-xl">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">ROOM CODE</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-[#0E1324] hover:bg-slate-800 border border-[#FF1744]/30 rounded-xl px-3.5 py-1.5 transition shadow-glow-cyan group"
            >
              <span className="text-xl sm:text-2xl font-black text-[#FF1744] font-mono tracking-widest text-glow-cyan">
                {currentSession.sessionCode}
              </span>
              <span className="text-[#FF1744] text-xs">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
              </span>
            </button>
          </div>
        </div>

        {/* Room Parameters Pills */}
        <div className="flex flex-wrap gap-2 mt-3.5 pt-3 border-t border-slate-800/80">
          <span className="bg-[#0A0A14] border border-[#FF1744]/20 text-[#FF1744] text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg">
            💰 €{currentSession.startingBudget}M STARTING BUDGET
          </span>
          <span className="bg-[#0A0A14] border border-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-0.5 rounded-lg">
            👤 {currentSession.squadSize} PLAYERS PER SQUAD
          </span>
          <span className="bg-[#0A0A14] border border-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-0.5 rounded-lg">
            🏆 {currentSession.seasonLength} MATCH TOURNAMENT
          </span>
        </div>
      </div>

      {/* Connected Managers in Room */}
      <div className="bg-[#0E1324] border border-[#FF1744]/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0A0A14]/60">
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
            <div className="p-6 text-center text-slate-500">
              <div className="text-2xl mb-1.5">⏳</div>
              <p className="text-xs font-mono">WAITING FOR MANAGERS TO ENTER CODE...</p>
            </div>
          ) : (
            lobbyMembers.map((member) => {
              const memberTeam = allTeams.find(t => t.userId === member.userId);
              const isMe = member.userId === user?.id;
              const isMemberHost = member.userId === currentSession.hostUserId;

              return (
                <div key={member.userId} className="flex items-center gap-3.5 px-4 sm:px-5 py-2.5 hover:bg-[#12182D] transition">
                  <div className="w-9 h-9 bg-[#0A0A14] border border-[#FF1744]/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-glow-cyan">
                    {memberTeam?.badgeIcon ?? '⚡'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {memberTeam?.teamName ?? member.profile?.displayName ?? 'Manager'}
                      </span>
                      {isMemberHost && (
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/40 flex-shrink-0">
                          HOST
                        </span>
                      )}
                      {isMe && (
                        <span className="bg-[#FF1744]/20 text-[#FF1744] text-[9px] font-black px-1.5 py-0.2 rounded border border-[#FF1744]/40 flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      @{member.profile?.username ?? 'manager'}
                      {memberTeam && ` · ${memberTeam.abbreviation}`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-amber-400 font-mono font-black text-sm">
                      €{memberTeam?.budget ?? currentSession.startingBudget}M
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">BUDGET</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && currentSession.status === 'LOBBY' && (
        <div className="bg-[#0E1324] border border-[#FF1744]/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-glow-cyan">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#FF1744]" />
            <h2 className="font-black text-white text-xs uppercase tracking-wider font-display text-glow-cyan">
              ROOM HOST COMMAND CENTER
            </h2>
          </div>

          {startError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
              {startError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStartAuction}
              disabled={starting || loadingSession || memberCount < 1}
              className="flex-1 py-3 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl transition-all shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2"
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
        <div className="bg-[#0E1324]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-1.5">
          <div className="text-2xl mb-1">⏳</div>
          <p className="text-white font-bold text-sm">
            Waiting for Host <span className="text-[#FF1744] font-black">{allTeams.find(t => t.userId === currentSession.hostUserId)?.teamName || 'Host'}</span> to launch auction...
          </p>
          <p className="text-slate-400 text-xs">
            {memberCount} manager{memberCount === 1 ? '' : 's'} connected. You will automatically drop into the 3D Bidding Arena as soon as lot #1 opens!
          </p>
        </div>
      )}

      {/* Leave button */}
      <div className="text-center pt-1">
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
