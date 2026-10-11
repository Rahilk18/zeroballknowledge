import React from 'react';
import { Player, Team } from '../types';
import { BarChart3, Trophy, Flame, Award, Shield, Target, Star } from 'lucide-react';
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
    .filter(p => (p.stats?.goals || 0) > 0 || (p.goals || 0) > 0 || p.overall >= 88)
    .sort((a, b) => ((b.stats?.goals || 0) - (a.stats?.goals || 0)) || (b.overall - a.overall))
    .slice(0, 8);

  const topAssists = [...players]
    .filter(p => (p.stats?.assists || 0) > 0 || (p.assists || 0) > 0 || p.passing >= 85)
    .sort((a, b) => ((b.stats?.assists || 0) - (a.stats?.assists || 0)) || (b.passing - a.passing))
    .slice(0, 8);

  const topMotm = [...players]
    .filter(p => (p.stats?.motm || 0) > 0 || (p.stats?.matches || 0) > 0 || p.overall >= 88)
    .sort((a, b) => ((b.stats?.motm || 0) - (a.stats?.motm || 0)) || ((b.stats?.avgRating || 0) - (a.stats?.avgRating || 0)) || (b.overall - a.overall))
    .slice(0, 8);

  const topRated = [...players]
    .sort((a, b) => (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0) || b.overall - a.overall)
    .slice(0, 8);

  return (
    <div className="space-y-3.5 animate-fadeIn pb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Player Season Statistics
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Official league leaders in goals, assists, clean sheets, and average player ratings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Top Goalscorers */}
        <div className="bg-[#0e1720] rounded-2xl border border-slate-800 p-3 sm:p-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Golden Boot Leaders
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Goals</span>
          </div>

          <div className="space-y-1.5">
            {topScorers.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 text-center font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block text-xs truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-slate-400 leading-tight truncate block max-w-[110px]">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-xs font-black text-rose-400 min-w-5 text-right font-mono">
                      {p.stats?.goals || p.goals || 0} ⚽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Playmakers (Assists) */}
        <div className="bg-[#0e1720] rounded-2xl border border-slate-800 p-3 sm:p-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Top Playmakers
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Assists</span>
          </div>

          <div className="space-y-1.5">
            {topAssists.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 text-center font-black text-xs ${idx === 0 ? 'text-teal-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block text-xs truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-slate-400 leading-tight truncate block max-w-[110px]">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-xs font-black text-teal-400 min-w-5 text-right font-mono">
                      {p.stats?.assists || p.assists || 0} 🎯
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOTM Leaders */}
        <div className="bg-[#0e1720] rounded-2xl border border-slate-800 p-3 sm:p-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                MOTM Honors
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Awards</span>
          </div>

          <div className="space-y-1.5">
            {topMotm.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 text-center font-black text-xs ${idx === 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block text-xs truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-slate-400 leading-tight truncate block max-w-[110px]">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-xs font-black text-purple-400 min-w-5 text-right font-mono">
                      {p.stats?.motm || 0} ⭐
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Rated (Avg Rating) */}
        <div className="bg-[#0e1720] rounded-2xl border border-slate-800 p-3 sm:p-3.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Highest Avg Rating
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Match Avg</span>
          </div>

          <div className="space-y-1.5">
            {topRated.map((p, idx) => {
              const badge = getPositionBadgeColor(p.position);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 text-center font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-white block text-xs truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-slate-400 leading-tight truncate block max-w-[110px]">{getTeamName(p.teamId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
                      {p.position}
                    </span>
                    <span className="text-xs font-black text-emerald-400 min-w-5 text-right font-mono">
                      {(p.stats?.avgRating || p.rating || 7.0).toFixed(1)} ★
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
