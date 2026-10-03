import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { fetchUserGameHistory, fetchUserTeams, UserGameHistoryItem, UserPastTeamItem } from '../services/userService';
import type { ActiveTab } from '../types';
import { Trophy, Swords, Shield, PlusCircle, LogIn, History, Sparkles, ArrowRight, Award, Flame } from 'lucide-react';

const BADGES = ['⚡', '🔥', '🦁', '🐉', '⭐', '🚀', '🏆', '🎯', '🦅', '💎', '🌟', '⚔️'];

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onStartMatch?: (opponentId: string) => void;
}

type DashboardModal = 'none' | 'create' | 'join';

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { user, profile } = useAuth();
  const { currentSession, myTeam, createGame, joinGame, loadingSession } = useSession();

  const [modal, setModal] = useState<DashboardModal>('none');
  const [error, setError] = useState('');

  // Personal Game History & Past Teams (Strictly filtered by user.id)
  const [gameHistory, setGameHistory] = useState<UserGameHistoryItem[]>([]);
  const [pastTeams, setPastTeams] = useState<UserPastTeamItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create Game form state — completely empty by default, no hardcoded team names!
  const [teamName, setTeamName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('⚡');
  const [createdCode, setCreatedCode] = useState('');

  // Join Game form state — completely empty by default
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

  // User-specific stats (New user defaults to strictly 0 with no legacy demo data)
  const gamesPlayed = profile?.gamesPlayed ?? 0;
  const wins = profile?.wins ?? 0;
  const draws = profile?.draws ?? 0;
  const losses = profile?.losses ?? 0;
  const careerPoints = profile?.totalPoints ?? 0;

  const stats = [
    { label: 'Games Played', value: gamesPlayed, icon: '🎮', color: 'text-white' },
    { label: 'Wins', value: wins, icon: '🏆', color: 'text-emerald-400' },
    { label: 'Draws', value: draws, icon: '🤝', color: 'text-amber-400' },
    { label: 'Losses', value: losses, icon: '💔', color: 'text-rose-400' },
    { label: 'Career Points', value: `${careerPoints} pts`, icon: '⭐', color: 'text-yellow-400' },
  ];

  const getPositionLabel = (pos: number) => {
    if (pos === 1) return { label: 'Winner 🏆', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (pos === 2) return { label: '2nd Place 🥈', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    if (pos === 3) return { label: '3rd Place 🥉', badge: 'bg-amber-700/20 text-amber-500 border-amber-700/30' };
    return { label: `${pos}th Place`, badge: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* 1. WELCOME HEADER (Dynamically generated from authenticated user) */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-[#0e1720] to-[#070b0e] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-950 shadow-lg shadow-emerald-500/20 border border-emerald-300/40">
              {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Manager Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                Welcome, {profile?.displayName || profile?.username || 'Manager'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-400 text-xs font-mono">@{profile?.username || 'manager'}</span>
                {myTeam && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                    Current: {myTeam.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Career Points Badge */}
          <div className="bg-[#090f14]/80 border border-slate-800/80 rounded-2xl px-5 py-3 text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Total Career Points</span>
            <span className="text-2xl font-black font-mono text-amber-400">{careerPoints} pts</span>
          </div>
        </div>
      </div>

      {/* 2. STATS GRID (Personal to authenticated user) */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Career Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0e1720] border border-slate-800 rounded-2xl p-4 text-center shadow-lg hover:border-slate-700 transition">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ACTIVE SESSION STATUS OR CREATE / JOIN GAME */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentSession ? (
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-950/30 to-[#0e1720] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Game Session</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Code: <span className="font-mono text-emerald-400 tracking-widest">{currentSession.sessionCode}</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Team: <span className="text-white font-semibold">{myTeam?.name || 'Your Team'}</span> • Status: <span className="text-emerald-400 font-bold capitalize">{currentSession.status.toLowerCase()}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (currentSession.status === 'LOBBY') setActiveTab('lobby');
                    else if (currentSession.status === 'AUCTION') setActiveTab('auction');
                    else setActiveTab('my-team');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  <span>Continue Game</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => { setModal('create'); setError(''); setCreatedCode(''); setTeamName(''); setAbbreviation(''); }}
              className="group bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-3xl p-6 text-left transition-all shadow-xl shadow-emerald-600/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 border border-emerald-400/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-4 text-white">
                <PlusCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Create New Game</h2>
              <p className="text-emerald-100/80 text-xs leading-relaxed">
                Host a brand new draft session. Enter your custom team name and invite friends with your 6-letter room code.
              </p>
            </button>

            <button
              onClick={() => { setModal('join'); setError(''); setJoinCode(''); setJoinTeamName(''); setJoinAbbr(''); }}
              className="group bg-[#0e1720] border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 text-left transition-all hover:-translate-y-0.5 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-2xl mb-4 text-emerald-400">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Join Friend's Game</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Enter a 6-letter game code shared by your friend. Choose your custom team name and join their live auction lobby.
              </p>
            </button>
          </>
        )}
      </div>

      {/* 4. MY GAME HISTORY SECTION (Personal to authenticated user) */}
      <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              My Game History
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {gameHistory.length} {gameHistory.length === 1 ? 'game' : 'games'} recorded
          </span>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading your personal game history...</p>
          </div>
        ) : gameHistory.length === 0 ? (
          /* Empty State as required by prompt */
          <div className="text-center py-12 px-4 rounded-2xl bg-[#090f14]/60 border border-dashed border-slate-800/80 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-2xl mx-auto text-slate-500">
              🎮
            </div>
            <div>
              <h3 className="text-white font-bold text-base">No games played yet.</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Create a game or join a friend’s game to start playing. Your match results and tournament finishes will appear here.
              </p>
            </div>
            {!currentSession && (
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => { setModal('create'); setError(''); }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  Create Game
                </button>
                <button
                  onClick={() => { setModal('join'); setError(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition border border-slate-700"
                >
                  Join Game
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090f14] border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 flex-shrink-0">
                      {item.teamBadge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">Game #{item.gameNumber}</span>
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
                    <div className="text-right bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
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

      {/* 5. USER'S PAST TEAMS (From their previous sessions) */}
      {pastTeams.length > 0 && (
        <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                My Created Teams
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {pastTeams.length} {pastTeams.length === 1 ? 'team' : 'teams'} across all sessions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pastTeams.map(t => (
              <div key={t.teamId} className="bg-[#090f14] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                  {t.badgeIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-sm truncate">{t.teamName}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-mono font-bold text-emerald-400">{t.abbreviation}</span>
                    <span>•</span>
                    <span>Room: {t.sessionCode || 'Completed'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE GAME MODAL */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1720] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-black text-white">Create New Game</h2>
              </div>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-white transition text-lg">✕</button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {createdCode ? (
                <div className="text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <h3 className="text-lg font-black text-white">Game Created!</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                    <p className="text-slate-400 text-xs mb-1">Your 6-letter room code is:</p>
                    <p className="text-4xl font-black text-emerald-400 tracking-widest font-mono select-all">{createdCode}</p>
                    <p className="text-slate-500 text-xs mt-2">Share this code with your friends so they can join your live auction room.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(createdCode)}
                      className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition border border-slate-700"
                    >
                      📋 Copy Code
                    </button>
                    <button
                      onClick={() => { setModal('none'); setActiveTab('lobby'); }}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                    >
                      Go to Lobby →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Your Team Name <span className="text-emerald-400">*</span>
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
                      placeholder="e.g. Barcelona Legends"
                      className="w-full bg-[#090f14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Team Abbreviation (3 letters)
                    </label>
                    <input
                      type="text"
                      value={abbreviation}
                      onChange={e => setAbbreviation(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. BCL"
                      maxLength={3}
                      className="w-full bg-[#090f14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono uppercase tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Team Badge</label>
                    <div className="grid grid-cols-6 gap-2">
                      {BADGES.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBadge(b)}
                          className={`aspect-square flex items-center justify-center text-xl rounded-xl border transition ${
                            selectedBadge === b ? 'border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/10' : 'border-slate-800 bg-[#090f14] hover:border-slate-700'
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
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
                  >
                    {loadingSession ? 'Creating Game...' : '🚀 Create Game'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOIN GAME MODAL */}
      {modal === 'join' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1720] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-lg font-black text-white">Join Game</h2>
              </div>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-white transition text-lg">✕</button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoinGame} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Game Code (6 letters) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. F7K92A"
                    maxLength={6}
                    className="w-full bg-[#090f14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-lg font-mono tracking-widest uppercase text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Your Team Name <span className="text-emerald-400">*</span>
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
                    placeholder="e.g. Mumbai United"
                    className="w-full bg-[#090f14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
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
                    placeholder="e.g. MMU"
                    maxLength={3}
                    className="w-full bg-[#090f14] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono uppercase tracking-widest"
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
                          joinBadge === b ? 'border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/10' : 'border-slate-800 bg-[#090f14] hover:border-slate-700'
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
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
                >
                  {loadingSession ? 'Joining...' : '🎯 Join Game'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
