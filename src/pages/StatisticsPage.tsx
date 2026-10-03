import React from 'react';
import { Player, Team } from '../types';
import { BarChart3, Trophy, Flame, Award, Shield, Target } from 'lucide-react';
import { getPositionBadgeColor } from '../utils/formatters';

interface StatisticsPageProps {
  players: Player[];
  teams: Team[];
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ players, teams }) => {
  const getTeamName = (teamId?: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Free Agent';
  };

  const topScorers = [...players]
    .filter(p => p.stats.goals > 0 || p.overall >= 88)
    .sort((a, b) => b.stats.goals - a.stats.goals || b.overall - a.overall)
    .slice(0, 8);

  const topAssists = [...players]
    .filter(p => p.stats.assists > 0 || p.passing >= 85)
    .sort((a, b) => b.stats.assists - a.stats.assists || b.passing - a.passing)
    .slice(0, 8);

  const topRated = [...players]
    .sort((a, b) => b.stats.avgRating - a.stats.avgRating || b.overall - a.overall)
    .slice(0, 8);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Player Season Statistics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Official league leaders in goals, assists, clean sheets, and average player ratings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Goalscorers */}
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Golden Boot Leaders
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Goals</span>
          </div>

          <div className="space-y-2">
            {topScorers.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center font-black ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-sm font-black text-rose-400 min-w-6 text-right">
                      {p.stats.goals} ⚽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Playmakers (Assists) */}
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Top Playmakers
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Assists</span>
          </div>

          <div className="space-y-2">
            {topAssists.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center font-black ${idx === 0 ? 'text-teal-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-sm font-black text-teal-400 min-w-6 text-right">
                      {p.stats.assists} 🎯
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Rated (Avg Rating) */}
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Highest Average Rating
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Match Avg</span>
          </div>

          <div className="space-y-2">
            {topRated.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center font-black ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-xs font-black text-emerald-400 min-w-6 text-right">
                      {p.stats.avgRating.toFixed(1)} ★
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
