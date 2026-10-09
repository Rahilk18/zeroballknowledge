import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { fetchUserGameHistory, fetchUserTeams, UserGameHistoryItem, UserPastTeamItem } from '../services/userService';
import type { ActiveTab } from '../types';
import { Trophy, Swords, Shield, PlusCircle, LogIn, LogOut, History, Sparkles, ArrowRight, Award, Flame, Glasses, Zap, Radio, Bot, Check, Users } from 'lucide-react';
import { FOOTBALL_GEARS } from '../data/gearData';
import { AI_BOTS } from '../services/aiEngine';
import { sound } from '../utils/audioSynth';
import { StadiumAudioModal } from '../components/StadiumAudioModal';

const BADGES = ['⚡', '🔥', '🦁', '🐉', '⭐', '🚀', '🏆', '🎯', '🦅', '💎', '🌟', '⚔️'];

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onStartMatch?: (opponentId: string) => void;
}

type DashboardModal = 'none' | 'create' | 'join' | 'ai';

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { user, profile } = useAuth();
  const { 
    currentSession, 
    myTeam, 
    createGame, 
    createAiGame,
    joinGame, 
    leaveGame,
    endGame,
    inactivityNotice,
    clearInactivityNotice,
    loadingSession 
  } = useSession();

  const [modal, setModal] = useState<DashboardModal>('none');
  const [error, setError] = useState('');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // AI Game setup state
  const [aiOpponentCount, setAiOpponentCount] = useState<number>(2);
  const [aiTeamName, setAiTeamName] = useState<string>('');
  const [aiAbbreviation, setAiAbbreviation] = useState<string>('');
  const [aiBadge, setAiBadge] = useState<string>('⚡');

  // Personal Game History & Past Teams (Strictly filtered by user.id)
  const [gameHistory, setGameHistory] = useState<UserGameHistoryItem[]>([]);
  const [pastTeams, setPastTeams] = useState<UserPastTeamItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create Game form state
  const [teamName, setTeamName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('⚡');
  const [createdCode, setCreatedCode] = useState('');

  // Join Game form state
  const [joinCode, setJoinCode] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joinAbbr, setJoinAbbr] = useState('');
  const [joinBadge, setJoinBadge] = useState('🔥');

  // Load user-specific history and teams whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setGameHistory([]);
      setPastTeams([]);
      return;
    }
    loadUserData(user.id);
  }, [user?.id]);

  const loadUserData = async (userId: string) => {
    setLoadingHistory(true);
    try {
      const [history, teams] = await Promise.all([
        fetchUserGameHistory(userId),
        fetchUserTeams(userId),
      ]);
      setGameHistory(history);
      setPastTeams(teams);
    } catch (err) {
      console.error('Error loading dashboard user data:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!teamName.trim()) {
      setError('Please enter your team name.');
      return;
    }
    const abbr = (abbreviation || teamName.slice(0, 3)).toUpperCase();
    const { sessionCode, error: err } = await createGame(teamName.trim(), abbr, selectedBadge);
    if (err) {
      setError(err);
      return;
    }
    if (sessionCode) {
      setCreatedCode(sessionCode);
      if (user) loadUserData(user.id);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) {
      setError('Game code is required.');
      return;
    }
    if (!joinTeamName.trim()) {
      setError('Please enter your team name for this game.');
      return;
    }
    const abbr = (joinAbbr || joinTeamName.slice(0, 3)).toUpperCase();
    const { error: err } = await joinGame(joinCode.trim().toUpperCase(), joinTeamName.trim(), abbr, joinBadge);
    if (err) {
      setError(err);
      return;
    }
    setModal('none');
    setActiveTab('lobby');
    if (user) loadUserData(user.id);
  };

  const handleStartAiGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const tName = aiTeamName.trim() || (profile?.displayName ? `${profile.displayName} FC` : 'Apex FC');
    const tAbbr = (aiAbbreviation || tName.slice(0, 3)).toUpperCase().slice(0, 3);
    sound.playPowerUp();
    sound.playWhistle('kickoff');
    const { error: err } = await createAiGame(aiOpponentCount, tName, tAbbr, aiBadge);
    if (err) {
      setError(err);
      return;
    }
    setModal('none');
    setActiveTab('lobby');
  };

  // User-specific stats
  const gamesPlayed = profile?.gamesPlayed ?? 0;
  const wins = profile?.wins ?? 0;
  const draws = profile?.draws ?? 0;
  const losses = profile?.losses ?? 0;
  const careerPoints = profile?.totalPoints ?? 0;

  const stats = [
    { label: 'GAMES PLAYED', value: gamesPlayed, icon: '🎮', color: 'text-white' },
    { label: 'VICTORIES', value: wins, icon: '🏆', color: 'text-[#FF1744]' },
    { label: 'DRAWS', value: draws, icon: '🤝', color: 'text-amber-400' },
    { label: 'DEFEATS', value: losses, icon: '💔', color: 'text-rose-400' },
    { label: 'CAREER ELO', value: `${careerPoints} pts`, icon: '⭐', color: 'text-[#FF4D6D]' },
  ];

  const getPositionLabel = (pos: number) => {
    if (pos === 1) return { label: 'CHAMPION 🏆', badge: 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40 shadow-glow-cyan' };
    if (pos === 2) return { label: 'RUNNER UP 🥈', badge: 'bg-slate-700/40 text-slate-300 border-slate-600' };
    if (pos === 3) return { label: '3RD PLACE 🥉', badge: 'bg-amber-700/20 text-amber-500 border-amber-700/30' };
    return { label: `RANK #${pos}`, badge: 'bg-[#0A0A14] text-slate-400 border-slate-800' };
  };

  const isHost = currentSession?.hostUserId === user?.id;
  const [exitingRoom, setExitingRoom] = useState(false);

  const handleExitRoom = async () => {
    const confirmMsg = isHost
      ? 'You are the host of this room. Quitting will end the room for all players. Are you sure you want to end and quit the room?'
      : 'Are you sure you want to exit and disconnect from this room?';
    if (!window.confirm(confirmMsg)) return;

    setExitingRoom(true);
    try {
      if (isHost) {
        await endGame();
      } else {
        await leaveGame();
      }
    } catch (err) {
      console.error('Failed to exit room:', err);
    } finally {
      setExitingRoom(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto space-y-4 animate-fadeIn pb-8">
      
      {/* Inactivity Notice Alert */}
      {inactivityNotice && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 text-amber-300 text-xs font-bold animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <span>{inactivityNotice}</span>
          </div>
          <button
            onClick={clearInactivityNotice}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] uppercase font-bold tracking-wider transition"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 1. QUICK PLAY / BATTLE ROOM ACTIONS (FRONT & CENTER - ZERO SCROLLING) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {currentSession ? (
          <div className="sm:col-span-3 bg-[#0E1324] border-2 border-[#FF1744]/50 rounded-2xl p-4 sm:p-5 shadow-glow-cyan relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] animate-ping" />
                  <span className="text-xs font-bold text-[#FF1744] uppercase tracking-wider text-glow-cyan">
                    ACTIVE ROOM CONNECTED
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ROOM CODE: <span className="font-mono text-[#FF1744] tracking-widest text-glow-cyan">{currentSession.sessionCode}</span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Team: <span className="text-white font-bold">{myTeam?.name || 'Your Team'}</span> • Status: <span className="text-[#FF1744] font-bold uppercase">{currentSession.status}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    if (currentSession.status === 'LOBBY') setActiveTab('lobby');
                    else if (currentSession.status === 'AUCTION') setActiveTab('auction');
                    else setActiveTab('my-team');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-glow-cyan flex items-center gap-2 active:scale-95 uppercase tracking-wider"
                >
                  <span>RETURN TO ROOM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExitRoom}
                  disabled={exitingRoom}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 hover:border-rose-500 text-rose-400 hover:text-rose-300 font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-2 active:scale-95 uppercase tracking-wider disabled:opacity-50"
                  title={isHost ? "End and quit room" : "Leave room"}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{exitingRoom ? 'EXITING...' : (isHost ? 'END ROOM' : 'LEAVE')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Play vs AI Button - TOP RECOMMENDED */}
            <button
              onClick={() => {
                setModal('ai');
                setError('');
                setAiOpponentCount(2);
                if (!aiTeamName) {
                  setAiTeamName(profile?.displayName ? `${profile.displayName} FC` : 'Apex FC');
                  setAiAbbreviation('APX');
                }
              }}
              className="group bg-gradient-to-br from-[#0E1324] via-[#101b2a] to-[#0E1324] hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5 shadow-xl border border-emerald-500/35 hover:shadow-glow-emerald"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-400 shadow-glow-emerald flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                    SOLO FAST PLAY
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-display text-glow-emerald">
                    PLAY VS AI
                  </h2>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Start immediately vs intelligent bot managers (Steve, Mark, Joseph, Ron). No waiting.
              </p>
            </button>

            {/* 2. Create Room Button */}
            <button
              onClick={() => { setModal('create'); setError(''); setCreatedCode(''); setTeamName(''); setAbbreviation(''); }}
              className="group bg-gradient-to-br from-[#0E1324] to-[#13192E] hover:border-[#FF1744]/60 rounded-2xl p-4 sm:p-5 text-left transition-all shadow-xl hover:-translate-y-0.5 border border-[#FF1744]/25 hover:shadow-glow-cyan"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/30 flex items-center justify-center text-xl text-[#FF1744] shadow-glow-cyan flex-shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 tracking-wider">
                    HOST LOBBY
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                    CREATE ROOM
                  </h2>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Host a multiplayer room for up to 8 managers with custom €130M budget & live timer.
              </p>
            </button>

            {/* 3. Join Room Button */}
            <button
              onClick={() => { setModal('join'); setError(''); setJoinCode(''); setJoinTeamName(''); setJoinAbbr(''); }}
              className="group bg-gradient-to-br from-[#0E1324] to-[#13192E] hover:border-purple-500/60 rounded-2xl p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5 shadow-xl border border-purple-500/25 hover:shadow-glow-purple"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl text-purple-300 shadow-glow-purple flex-shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 tracking-wider">
                    CODE ENTRY
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-display text-glow-purple">
                    JOIN A ROOM
                  </h2>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Enter a 6-letter room code from your friends or discord lobby to draft together.
              </p>
            </button>
          </>
        )}
      </div>

      {/* 2. HEROBID ARENA COMPACT BANNER */}
      <div className="relative bg-gradient-to-br from-[#0E1324] via-[#0A0A14] to-[#12182D] border border-[#FF1744]/25 rounded-2xl p-4 sm:p-5 shadow-glow-cyan overflow-hidden">
        {/* Holographic grid and glow lines */}
        <div className="absolute inset-0 cyber-grid-bg opacity-25 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF1744]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0E1324] rounded-xl flex items-center justify-center p-1.5 shadow-glow-cyan border border-[#FF1744]/50 flex-shrink-0 relative overflow-hidden group">
              <img src="/logo.png" alt="ZBK" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,23,68,0.7)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30 tracking-widest text-glow-cyan">
                  ARENA MANAGER
                </span>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display text-glow-cyan">
                {profile?.displayName || profile?.username || 'CYBER MANAGER'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="text-[#FF1744] font-mono">@{profile?.username || 'manager'}</span>
                <span>•</span>
                <span>Division I</span>
                {myTeam && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                    {myTeam.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <div className="bg-[#0A0A14]/90 border border-[#FF1744]/20 rounded-xl px-3.5 py-2 shadow">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">CAREER PTS</span>
              <span className="text-lg font-black font-mono text-[#FF1744] text-glow-cyan">{careerPoints} ELO</span>
            </div>
            <div className="bg-[#0A0A14]/90 border border-amber-500/25 rounded-xl px-3.5 py-2 shadow">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">WIN RATE</span>
              <span className="text-lg font-black font-mono text-amber-300">
                {gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT 3D BIDDING ARENA ENTRY */}
      <div 
        onClick={() => setActiveTab('auction')}
        className="group relative cursor-pointer bg-gradient-to-r from-rose-950/40 via-[#0E1324] to-purple-950/40 border border-[#FF1744]/35 rounded-2xl p-4 sm:p-5 shadow-glow-cyan hover:shadow-glow-cyan-lg transition-all hover:-translate-y-0.5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-full bg-[#FF1744]/10 blur-2xl group-hover:bg-[#FF1744]/20 transition-all pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF1744]/20 to-purple-600/30 border border-[#FF1744]/50 flex items-center justify-center text-2xl shadow-glow-cyan group-hover:scale-105 transition-transform flex-shrink-0">
              🥽
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 tracking-wider">
                  IMMERSIVE 3D STUDIO
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  REAL-TIME DRAFT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                ENTER 3D FOOTBALL BIDDING ARENA
              </h2>
              <p className="text-slate-300 text-xs mt-0.5 max-w-xl">
                WebGL 60 FPS holographic player stage with interactive 3D rotation, live buzzer timer & AI bids.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <button className="px-4 py-2 rounded-xl bg-[#FF1744] text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow-cyan group-hover:bg-[#FF4D6D] transition flex items-center gap-1.5">
              <span>LAUNCH ARENA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. ZEROBALLKNOWLEDGE GEAR & TRAITS SHOWCASE */}
      <div className="bg-[#0E1324] border border-[#FF1744]/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white font-display">
              ZEROBALLKNOWLEDGE GEAR & SPECIAL TRAITS
            </h2>
          </div>
          <span className="text-[11px] text-[#FF1744] font-bold uppercase tracking-wider">
            {FOOTBALL_GEARS.length} ITEMS CATALOGED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FOOTBALL_GEARS.slice(0, 5).map((gear) => (
            <div
              key={gear.id}
              className="bg-[#0A0A14] border border-slate-800 hover:border-[#FF1744]/40 rounded-2xl p-3.5 transition group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{gear.icon}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                  gear.rarity === 'MYTHIC'
                    ? 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {gear.rarity}
                </span>
              </div>
              <h4 className="text-white font-bold text-xs group-hover:text-[#FF1744] transition truncate">
                {gear.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {gear.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold uppercase">{gear.category}</span>
                <span className="text-emerald-400 font-mono font-bold">+{gear.statBoost.amount} {gear.statBoost.stat.slice(0, 3).toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CAREER STATISTICS GRID */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          MANAGER CAREER STATISTICS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0E1324] border border-[#FF1744]/15 rounded-2xl p-4 text-center shadow-lg hover:border-[#FF1744]/40 transition">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MY GAME HISTORY */}
      <div className="bg-[#0E1324] border border-[#FF1744]/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#FF1744]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white font-display">
              BATTLE HISTORY
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {gameHistory.length} GAMES RECORDED
          </span>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-[#FF1744] border-t-transparent rounded-full animate-spin mx-auto shadow-glow-cyan" />
            <p className="text-xs font-mono">SYNCING GAME RECORDS...</p>
          </div>
        ) : gameHistory.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#0A0A14] border border-dashed border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0E1324] border border-slate-800 flex items-center justify-center text-2xl mx-auto text-slate-500">
              🎮
            </div>
            <div>
              <h3 className="text-white font-bold text-base">NO GAMES PLAYED YET</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Host a battle room or join with a room code to launch your football draft journey.
              </p>
            </div>
            {!currentSession && (
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => { setModal('create'); setError(''); }}
                  className="px-4 py-2 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-bold rounded-xl text-xs transition shadow-glow-cyan uppercase"
                >
                  Host Room
                </button>
                <button
                  onClick={() => { setModal('join'); setError(''); }}
                  className="px-4 py-2 bg-[#0E1324] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition border border-slate-700 uppercase"
                >
                  Join Room
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {gameHistory.map((item) => {
              const pos = getPositionLabel(item.finalPosition);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0A0A14] border border-slate-800 hover:border-[#FF1744]/40 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#0E1324] flex items-center justify-center text-2xl border border-slate-700 flex-shrink-0">
                      {item.teamBadge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#FF1744]">Game #{item.gameNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Room: {item.sessionCode}</span>
                      </div>
                      <h4 className="text-white font-extrabold text-sm sm:text-base">{item.teamName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pos.badge}`}>
                      {pos.label}
                    </span>
                    <div className="text-right bg-[#0E1324] px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Points Earned</span>
                      <span className="text-xs font-black font-mono text-amber-400">+{item.pointsEarned} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE GAME MODAL */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#0E1324] border border-[#FF1744]/40 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-glow-cyan overflow-hidden animate-fadeIn max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                  HOST BATTLE ROOM
                </h2>
              </div>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-white transition text-lg">✕</button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {createdCode ? (
                <div className="text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <h3 className="text-lg font-black text-white font-display text-glow-cyan">ROOM INITIALIZED!</h3>
                  <div className="bg-[#FF1744]/10 border border-[#FF1744]/40 rounded-2xl p-5 shadow-glow-cyan">
                    <p className="text-slate-400 text-xs mb-1">YOUR 6-LETTER ARENA CODE:</p>
                    <p className="text-4xl font-black text-[#FF1744] tracking-widest font-mono select-all text-glow-cyan">{createdCode}</p>
                    <p className="text-slate-400 text-xs mt-2">Share this code with your friends to join the real-time live auction.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(createdCode)}
                      className="flex-1 py-3 bg-[#0A0A14] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition border border-slate-700"
                    >
                      📋 Copy Code
                    </button>
                    <button
                      onClick={() => { setModal('none'); setActiveTab('lobby'); }}
                      className="flex-1 py-3 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl text-xs transition shadow-glow-cyan uppercase"
                    >
                      Go to Lobby →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Your Club Name <span className="text-[#FF1744]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={e => {
                        setTeamName(e.target.value);
                        if (!abbreviation) {
                          setAbbreviation(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase());
                        }
                      }}
                      placeholder="e.g. Cyber City FC"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Club Code (3 letters)
                    </label>
                    <input
                      type="text"
                      value={abbreviation}
                      onChange={e => setAbbreviation(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. CCF"
                      maxLength={3}
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-sm font-mono uppercase tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Club Crest Badge</label>
                    <div className="grid grid-cols-6 gap-2">
                      {BADGES.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBadge(b)}
                          className={`aspect-square flex items-center justify-center text-xl rounded-xl border transition ${
                            selectedBadge === b ? 'border-[#FF1744] bg-[#FF1744]/20 shadow-glow-cyan' : 'border-slate-800 bg-[#0A0A14] hover:border-slate-700'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingSession}
                    className="w-full py-3.5 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl text-sm transition shadow-glow-cyan disabled:opacity-50 mt-2 uppercase tracking-wider"
                  >
                    {loadingSession ? 'GENERATING ROOM...' : '🚀 CREATE ROOM'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOIN GAME MODAL */}
      {modal === 'join' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#0E1324] border border-purple-500/40 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-glow-purple overflow-hidden animate-fadeIn max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-lg font-black text-white uppercase tracking-wider font-display text-glow-purple">
                  JOIN ARENA ROOM
                </h2>
              </div>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-white transition text-lg">✕</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoinGame} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Room Code (6 letters) <span className="text-[#FF1744]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. F7K92A"
                    maxLength={6}
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-lg font-mono tracking-widest uppercase text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Your Team Name <span className="text-[#FF1744]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinTeamName}
                    onChange={e => {
                      setJoinTeamName(e.target.value);
                      if (!joinAbbr) {
                        setJoinAbbr(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase());
                      }
                    }}
                    placeholder="e.g. Cyber Squad"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Abbreviation (3 letters)
                  </label>
                  <input
                    type="text"
                    value={joinAbbr}
                    onChange={e => setJoinAbbr(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="e.g. CSQ"
                    maxLength={3}
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-sm font-mono uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Team Badge</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGES.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setJoinBadge(b)}
                        className={`aspect-square flex items-center justify-center text-xl rounded-xl border transition ${
                          joinBadge === b ? 'border-[#FF1744] bg-[#FF1744]/20 shadow-glow-cyan' : 'border-slate-800 bg-[#0A0A14] hover:border-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingSession}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-rose-700 hover:from-purple-500 hover:to-rose-600 text-white font-black rounded-xl text-sm transition shadow-glow-purple disabled:opacity-50 mt-2 uppercase tracking-wider"
                >
                  {loadingSession ? 'CONNECTING...' : '🎯 ENTER ROOM'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PLAY VS AI MODAL */}
      {modal === 'ai' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#0E1324] border border-[#FF1744]/40 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-glow-cyan overflow-hidden animate-fadeIn max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/40 flex items-center justify-center text-lg text-[#FF1744] shadow-glow-cyan flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                    PLAY VS AI
                  </h2>
                  <p className="text-slate-400 text-[11px]">
                    Fast Solo Battle with Intelligent Bots.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsAudioModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-black hover:bg-emerald-900/40 transition shadow-glow-emerald"
                  title="Test Stadium Crowd Audio & SFX"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">SOUND</span>
                </button>
                <button
                  onClick={() => setModal('none')}
                  className="text-slate-400 hover:text-white transition text-lg p-1.5 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* 1. SELECT NUMBER OF AI OPPONENTS */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2 tracking-wider">
                  CHOOSE NUMBER OF AI OPPONENTS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { count: 1, label: '1 AI', players: '2 PLAYERS' },
                    { count: 2, label: '2 AI', players: '3 PLAYERS' },
                    { count: 3, label: '3 AI', players: '4 PLAYERS' },
                    { count: 4, label: '4 AI', players: '5 PLAYERS' },
                  ].map(opt => {
                    const isSelected = aiOpponentCount === opt.count;
                    return (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setAiOpponentCount(opt.count)}
                        className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-[#FF1744]/20 border-[#FF1744] shadow-glow-cyan scale-[1.02]'
                            : 'bg-[#0A0A14] border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className={`text-base font-black font-display uppercase ${isSelected ? 'text-[#FF1744] text-glow-cyan' : 'text-white'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          {opt.players}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. VISUAL PARTICIPANTS ROSTER */}
              <div className="bg-[#0A0A14] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-white">
                    <Users className="w-3.5 h-3.5 text-[#FF1744]" />
                    ROOM ROSTER ({aiOpponentCount + 1} PARTICIPANTS)
                  </span>
                  <span className="text-slate-500 font-mono">1 HUMAN + {aiOpponentCount} AI</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Human player */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/40 text-xs shadow-glow-cyan">
                    <span className="text-base">{aiBadge}</span>
                    <div>
                      <span className="font-black text-white">{aiTeamName.trim() || 'YOU'}</span>
                      <span className="text-[9px] font-mono text-[#FF1744] ml-1.5 font-bold uppercase">(YOU)</span>
                    </div>
                  </div>

                  {/* AI opponents in strict order: Steve, Mark, Joseph, Ron */}
                  {AI_BOTS.slice(0, aiOpponentCount).map(bot => (
                    <div
                      key={bot.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                    >
                      <span className="text-base">{bot.badgeIcon}</span>
                      <div>
                        <span className="font-bold text-white uppercase">{bot.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1.5">[{bot.shortCode}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. YOUR CLUB DETAILS */}
              <form onSubmit={handleStartAiGame} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Your Club Name
                    </label>
                    <input
                      type="text"
                      value={aiTeamName}
                      onChange={e => {
                        setAiTeamName(e.target.value);
                        if (!aiAbbreviation) {
                          setAiAbbreviation(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase());
                        }
                      }}
                      placeholder="e.g. Apex FC"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Club Code (3 letters)
                    </label>
                    <input
                      type="text"
                      value={aiAbbreviation}
                      onChange={e => setAiAbbreviation(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. APX"
                      maxLength={3}
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-mono uppercase tracking-widest text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Club Crest Badge
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGES.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setAiBadge(b)}
                        className={`aspect-square flex items-center justify-center text-lg rounded-xl border transition ${
                          aiBadge === b
                            ? 'border-[#FF1744] bg-[#FF1744]/20 shadow-glow-cyan'
                            : 'border-slate-800 bg-[#0A0A14] hover:border-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingSession}
                  className="w-full py-4 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-2xl text-sm transition shadow-glow-cyan disabled:opacity-50 mt-2 uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98"
                >
                  <Bot className="w-5 h-5" />
                  <span>{loadingSession ? 'INITIALIZING AI ARENA...' : 'START AI ROOM'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stadium Audio & Crowd Soundboard Modal */}
      <StadiumAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

    </div>
  );
}

export default Dashboard;
