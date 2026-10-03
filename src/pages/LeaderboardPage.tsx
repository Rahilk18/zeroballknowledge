import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { Trophy, Award, Globe, Users, Shield, ArrowUpRight, Flame, Zap } from 'lucide-react';
import type { UserProfile, LeagueStanding, ProfileRow } from '../types';
import { profileFromRow } from '../services/sessionService';

interface LeaderboardPageProps {
  sessionStandings?: LeagueStanding[];
  onBackToDashboard?: () => void;
}

export function LeaderboardPage({ sessionStandings = [] }: LeaderboardPageProps) {
  const { user, profile } = useAuth();
  const { currentSession } = useSession();
  const [activeTab, setActiveTab] = useState<'global' | 'session'>('global');
  const [globalProfiles, setGlobalProfiles] = useState<UserProfile[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, []);

  const fetchGlobalLeaderboard = async () => {
    setLoadingGlobal(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50);

      if (!error && data) {
        setGlobalProfiles(data.map((r: any) => profileFromRow(r as ProfileRow)));
      } else {
        setGlobalProfiles(profile ? [profile] : []);
      }
    } catch {
      setGlobalProfiles(profile ? [profile] : []);
    } finally {
      setLoadingGlobal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/40 via-[#0E1324] to-purple-950/40 border border-[#FF1744]/30 p-6 sm:p-8 shadow-glow-cyan">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF1744] font-display text-glow-cyan">
                ZEROBALLKNOWLEDGE RANKINGS & HALL OF FAME
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
              GLOBAL LEADERBOARDS
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Track global career manager ELO points and live tournament standings
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#0A0A14] rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'global'
                  ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>GLOBAL ELO</span>
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'session'
                  ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ROOM TOURNAMENT</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM CARDS */}
      {activeTab === 'global' && globalProfiles.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="bg-[#0E1324] border border-slate-700 rounded-3xl p-5 text-center shadow-lg order-2 md:order-1 relative overflow-hidden">
            <div className="text-3xl mb-2">🥈</div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              RANK #2
            </span>
            <h3 className="text-lg font-black text-white mt-2 truncate font-display">{globalProfiles[1].displayName}</h3>
            <p className="text-xs text-[#FF1744] font-mono mt-0.5">@{globalProfiles[1].username}</p>
            <div className="mt-3 text-2xl font-black font-mono text-slate-200">{globalProfiles[1].totalPoints} ELO</div>
          </div>

          {/* 1st Place Champion */}
          <div className="bg-gradient-to-b from-[#12182D] to-[#0E1324] border-2 border-[#FF1744] rounded-3xl p-6 text-center shadow-glow-cyan order-1 md:order-2 relative overflow-hidden -translate-y-1">
            <div className="text-4xl mb-2">👑</div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 text-glow-cyan">
              CHAMPION 🥇
            </span>
            <h3 className="text-xl font-black text-white mt-2 truncate font-display text-glow-cyan">{globalProfiles[0].displayName}</h3>
            <p className="text-xs text-[#FF1744] font-mono mt-0.5">@{globalProfiles[0].username}</p>
            <div className="mt-3 text-3xl font-black font-mono text-[#FF1744] text-glow-cyan">{globalProfiles[0].totalPoints} ELO</div>
          </div>

          {/* 3rd Place */}
          <div className="bg-[#0E1324] border border-amber-900/40 rounded-3xl p-5 text-center shadow-lg order-3 relative overflow-hidden">
            <div className="text-3xl mb-2">🥉</div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
              RANK #3
            </span>
            <h3 className="text-lg font-black text-white mt-2 truncate font-display">{globalProfiles[2].displayName}</h3>
            <p className="text-xs text-[#FF1744] font-mono mt-0.5">@{globalProfiles[2].username}</p>
            <div className="mt-3 text-2xl font-black font-mono text-amber-400">{globalProfiles[2].totalPoints} ELO</div>
          </div>
        </div>
      )}

      {/* TAB 1: GLOBAL CAREER LEADERBOARD TABLE */}
      {activeTab === 'global' && (
        <div className="bg-[#0E1324] rounded-3xl border border-[#FF1744]/20 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
                ALL RANKED MANAGERS
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ELO persists across all multiplayer draft tournaments
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#FF1744]">
              {globalProfiles.length} REGISTERED
            </span>
          </div>

          {globalProfiles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-50" />
              <p className="text-base font-bold text-white mb-1">NO RANKED MANAGERS YET</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Play and complete match sessions to earn career points and claim your spot on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Manager</th>
                    <th className="py-3 px-3 text-center">Games</th>
                    <th className="py-3 px-3 text-center">W</th>
                    <th className="py-3 px-3 text-center">D</th>
                    <th className="py-3 px-3 text-center">L</th>
                    <th className="py-3 px-3 text-center">Win Rate</th>
                    <th className="py-3 px-3 text-right">ELO Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {globalProfiles.map((p, idx) => {
                    const isCurrentUser = user && p.userId === user.id;
                    const winRate = p.gamesPlayed > 0 
                      ? Math.round((p.wins / p.gamesPlayed) * 100) 
                      : 0;

                    return (
                      <tr
                        key={p.id}
                        className={`transition hover:bg-[#12182D] ${
                          isCurrentUser ? 'bg-[#FF1744]/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-black">
                          {idx === 0 && <span className="text-[#FF1744] text-base">🥇 #1</span>}
                          {idx === 1 && <span className="text-slate-300 text-base">🥈 #2</span>}
                          {idx === 2 && <span className="text-amber-500 text-base">🥉 #3</span>}
                          {idx > 2 && <span className="text-slate-400">#{idx + 1}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#FF1744]/20 text-[#FF1744] font-bold flex items-center justify-center text-xs border border-[#FF1744]/40 shadow-glow-cyan">
                              {p.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white block">
                                {p.displayName} {isCurrentUser && <span className="text-[10px] text-[#FF1744] font-black uppercase">(YOU)</span>}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">@{p.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{p.gamesPlayed}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{p.wins}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-400">{p.draws}</td>
                        <td className="py-3 px-3 text-center font-mono text-rose-400">{p.losses}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            winRate >= 60 ? 'bg-[#FF1744]/20 text-[#FF1744]' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {winRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-black text-sm font-mono text-[#FF1744] text-glow-cyan">
                            {p.totalPoints} pts
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURRENT GAME SESSION LEADERBOARD */}
      {activeTab === 'session' && (
        <div className="bg-[#0E1324] rounded-3xl border border-[#FF1744]/20 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
                ACTIVE TOURNAMENT STANDINGS
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room Code: <span className="text-[#FF1744] font-mono font-bold">{currentSession?.sessionCode || 'OFFLINE'}</span>
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              WIN = 3PTS • DRAW = 1PT • LOSS = 0PTS
            </span>
          </div>

          {sessionStandings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-mono">NO MATCHES PLAYED IN THIS ROOM YET.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-3 px-3">Pos</th>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-3 text-center">P</th>
                    <th className="py-3 px-3 text-center">W</th>
                    <th className="py-3 px-3 text-center">D</th>
                    <th className="py-3 px-3 text-center">L</th>
                    <th className="py-3 px-3 text-center">GF</th>
                    <th className="py-3 px-3 text-center">GA</th>
                    <th className="py-3 px-3 text-center">GD</th>
                    <th className="py-3 px-3 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessionStandings.map((s, idx) => {
                    return (
                      <tr
                        key={s.teamId}
                        className="transition hover:bg-[#12182D]"
                      >
                        <td className="py-3 px-3 font-mono font-black">
                          {idx === 0 && <span className="text-[#FF1744]">🥇 #1</span>}
                          {idx === 1 && <span className="text-slate-300">🥈 #2</span>}
                          {idx === 2 && <span className="text-amber-500">🥉 #3</span>}
                          {idx > 2 && <span className="text-slate-400">#{idx + 1}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{s.badge || s.badgeIcon || '⚡'}</span>
                            <span className="font-extrabold text-white">{s.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{s.played}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{s.won}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-400">{s.drawn}</td>
                        <td className="py-3 px-3 text-center font-mono text-rose-400">{s.lost}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{s.goalsFor}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{s.goalsAgainst}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                          {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-[#FF1744] text-sm text-glow-cyan">
                          {s.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
