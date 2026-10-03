import React from 'react';
import { LeagueStanding, Team, MatchResult } from '../types';
import { Trophy, Swords, Shield, Award, Calendar, ArrowRight, Play } from 'lucide-react';

interface LeaguePageProps {
  standings: LeagueStanding[];
  currentTeam?: Team | null;
  allTeams: Team[];
  recentMatches: MatchResult[];
  onPlayNextMatch: () => void;
  onViewSeasonComplete?: () => void;
}

export const LeaguePage: React.FC<LeaguePageProps> = ({
  standings,
  currentTeam,
  allTeams,
  recentMatches,
  onPlayNextMatch,
  onViewSeasonComplete
}) => {
  const userStanding = currentTeam ? standings.find((s) => s.teamId === currentTeam.id) : null;
  const currentLeader = standings[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      
      {/* League Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              League Standings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Season 1 • 38-Match League Championship. Top team wins the trophy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewSeasonComplete && (
            <button
              onClick={onViewSeasonComplete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider transition border border-amber-500/40 active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Season Awards</span>
            </button>
          )}

          <button
            onClick={onPlayNextMatch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95 w-fit"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Play Next Fixture</span>
          </button>
        </div>
      </div>

      {/* Season Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0e1720] p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">League Leader</span>
            <span className="text-sm font-black text-white">{currentLeader?.teamName}</span>
            <span className="text-[11px] text-amber-400 font-semibold block">{currentLeader?.points} Points</span>
          </div>
        </div>

        <div className="bg-[#0e1720] p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Position</span>
            <span className="text-sm font-black text-white">
              {currentTeam ? `#${Math.max(1, standings.findIndex(s => s.teamId === currentTeam.id) + 1)} (${currentTeam.name})` : '--'}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold block">{userStanding?.points ?? 0} Points</span>
          </div>
        </div>

        <div className="bg-[#0e1720] p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Season Progress</span>
            <span className="text-sm font-black text-white">Matchday {userStanding?.played || 0} / 38</span>
            <span className="text-[11px] text-slate-400 font-semibold block">38 Total Matches</span>
          </div>
        </div>
      </div>

      {/* OFFICIAL LEAGUE TABLE */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Elite Division Table
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
            <span>Win: <strong className="text-emerald-400">3 pts</strong></span>
            <span>Draw: <strong className="text-slate-300">1 pt</strong></span>
            <span>Loss: <strong className="text-rose-400">0 pts</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-[#090f14]/60">
                <th className="py-3 px-3">POS</th>
                <th className="py-3 px-3">TEAM</th>
                <th className="py-3 px-3 text-center">P</th>
                <th className="py-3 px-3 text-center text-emerald-400">W</th>
                <th className="py-3 px-3 text-center text-slate-400">D</th>
                <th className="py-3 px-3 text-center text-rose-400">L</th>
                <th className="py-3 px-3 text-center hidden sm:table-cell">GF</th>
                <th className="py-3 px-3 text-center hidden sm:table-cell">GA</th>
                <th className="py-3 px-3 text-center">GD</th>
                <th className="py-3 px-3 text-center font-black text-white text-sm">PTS</th>
                <th className="py-3 px-3 text-center hidden md:table-cell">FORM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.map((team, idx) => {
                const isUser = Boolean(currentTeam && team.teamId === currentTeam.id);
                const teamObj = allTeams.find(t => t.id === team.teamId);

                return (
                  <tr
                    key={team.teamId}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-emerald-950/40 text-emerald-300 font-bold border-l-4 border-l-emerald-400'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    {/* Position */}
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs ${
                        idx === 0 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : idx === 1 
                          ? 'bg-slate-700/50 text-slate-200' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>

                    {/* Team Name */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{teamObj?.badgeIcon || '⚽'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm sm:text-base">
                              {team.teamName}
                            </span>
                            {isUser && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase font-black border border-emerald-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            Mgr: {teamObj?.manager || 'AI'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* P / W / D / L */}
                    <td className="py-4 px-3 text-center font-bold text-slate-200">{team.played}</td>
                    <td className="py-4 px-3 text-center font-bold text-emerald-400">{team.won}</td>
                    <td className="py-4 px-3 text-center font-bold text-slate-400">{team.drawn}</td>
                    <td className="py-4 px-3 text-center font-bold text-rose-400">{team.lost}</td>

                    {/* GF / GA */}
                    <td className="py-4 px-3 text-center text-slate-300 hidden sm:table-cell">{team.goalsFor}</td>
                    <td className="py-4 px-3 text-center text-slate-400 hidden sm:table-cell">{team.goalsAgainst}</td>

                    {/* GD */}
                    <td className="py-4 px-3 text-center font-bold">
                      <span className={team.goalDifference > 0 ? 'text-emerald-400' : team.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </span>
                    </td>

                    {/* PTS */}
                    <td className="py-4 px-3 text-center font-black text-base text-white">
                      {team.points}
                    </td>

                    {/* Recent Form */}
                    <td className="py-4 px-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {team.recentForm.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">—</span>
                        ) : (
                          team.recentForm.map((res, fIdx) => (
                            <span
                              key={fIdx}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                res === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : res === 'D'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches Log */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Recent League Match Results
            </h3>
          </div>
          <span className="text-xs text-slate-400">Total Simulated: {recentMatches.length}</span>
        </div>

        {recentMatches.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No league matches played yet. Click [Play Next Fixture] above to simulate your first game!
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.slice().reverse().map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">{m.date}</span>
                  <span className="font-extrabold text-white">{m.homeTeamName}</span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-black text-sm text-emerald-400 tracking-wider">
                  {m.homeScore} - {m.awayScore}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{m.awayTeamName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold hidden sm:inline">
                    FT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
