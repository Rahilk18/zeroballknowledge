import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { Trophy, Award, Globe, Users, Shield, ArrowUpRight, Flame } from 'lucide-react';
import type { UserProfile, LeagueStanding, ProfileRow } from '../types';
import { profileFromRow } from '../services/sessionService';

interface LeaderboardPageProps {
  sessionStandings?: LeagueStanding[];
  onBackToDashboard?: () => void;
}

export function LeaderboardPage({ sessionStandings = [], onBackToDashboard }: LeaderboardPageProps) {
  const { user, profile } = useAuth();
  const { currentSession, allTeams } = useSession();
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
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0e1720] to-teal-950/40 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                HALL OF FAME & RANKINGS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Leaderboards</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track global career manager points and active game standings
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'global'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              Global Career
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'session'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Current Game
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: GLOBAL CAREER LEADERBOARD */}
      {activeTab === 'global' && (
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Permanent Manager Leaderboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Points persist across all draft tournaments and seasons
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              {globalProfiles.length} Ranked Managers
            </span>
          </div>

          {globalProfiles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-50" />
              <p className="text-base font-bold text-white mb-1">No ranked managers yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Play and complete match sessions to earn career points and claim your spot on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
                    <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Manager</th>
                  <th className="py-3 px-3 text-center">Games</th>
                  <th className="py-3 px-3 text-center">W</th>
                  <th className="py-3 px-3 text-center">D</th>
                  <th className="py-3 px-3 text-center">L</th>
                  <th className="py-3 px-3 text-center">Win Rate</th>
                  <th className="py-3 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {globalProfiles.map((p, idx) => {
                  const isCurrentUser = user && p.userId === user.id;
                  const winRate = p.gamesPlayed > 0 
                    ? Math.round((p.wins / p.gamesPlayed) * 100) 
                    : 0;

                  return (
                    <tr
                      key={p.id}
                      className={`transition hover:bg-slate-900/60 ${
                        isCurrentUser ? 'bg-emerald-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-black">
                        {idx === 0 && <span className="text-amber-400 text-base">🥇 1</span>}
                        {idx === 1 && <span className="text-slate-300 text-base">🥈 2</span>}
                        {idx === 2 && <span className="text-amber-600 text-base">🥉 3</span>}
                        {idx > 2 && <span className="text-slate-400">#{idx + 1}</span>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block">
                              {p.displayName} {isCurrentUser && <span className="text-[10px] text-emerald-400 font-black">(You)</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">@{p.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{p.gamesPlayed}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{p.wins}</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400">{p.draws}</td>
                      <td className="py-3 px-3 text-center font-mono text-rose-400">{p.losses}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          winRate >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {winRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-sm font-mono text-amber-400">
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
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Active Game Session Standings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Session Code: <span className="text-emerald-400 font-mono font-bold">{currentSession?.sessionCode || 'OFFLINE'}</span>
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Win = 3pts • Draw = 1pt • Loss = 0pts
            </span>
          </div>

          {sessionStandings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No matches played yet in this session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
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
                <tbody className="divide-y divide-slate-800/50">
                  {sessionStandings.map((s, idx) => {
                    return (
                      <tr
                        key={s.teamId}
                        className="transition hover:bg-slate-900/60"
                      >
                        <td className="py-3 px-3 font-mono font-black">
                          {idx === 0 && <span className="text-amber-400">🥇 1</span>}
                          {idx === 1 && <span className="text-slate-300">🥈 2</span>}
                          {idx === 2 && <span className="text-amber-600">🥉 3</span>}
                          {idx > 2 && <span className="text-slate-400">{idx + 1}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{s.badge || s.badgeIcon || '⚽'}</span>
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
                        <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-sm">
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
