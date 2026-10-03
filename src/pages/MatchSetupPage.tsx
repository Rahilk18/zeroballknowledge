import React, { useState } from 'react';
import { Team, Player } from '../types';
import { calculateTeamOverall } from '../utils/formatters';
import { 
  Shield, 
  Play, 
  Swords, 
  ArrowLeft, 
  Flame, 
  Award,
  ChevronDown
} from 'lucide-react';

interface MatchSetupPageProps {
  currentTeam: Team;
  allTeams: Team[];
  allPlayers: Player[];
  preselectedOpponentId?: string;
  onSimulate: (opponentTeamId: string) => void;
  onBack: () => void;
}

export const MatchSetupPage: React.FC<MatchSetupPageProps> = ({
  currentTeam,
  allTeams,
  allPlayers,
  preselectedOpponentId,
  onSimulate,
  onBack
}) => {
  const opponentOptions = allTeams.filter((t) => t.id !== currentTeam.id);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(
    preselectedOpponentId && preselectedOpponentId !== currentTeam.id
      ? preselectedOpponentId
      : opponentOptions[0]?.id || 'team-aashish'
  );

  const opponentTeam = allTeams.find((t) => t.id === selectedOpponentId) || opponentOptions[0];

  // Starting players
  const homeStarters = currentTeam.startingSeven
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const awayStarters = opponentTeam.startingSeven
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const homeOvr = calculateTeamOverall(homeStarters);
  const awayOvr = calculateTeamOverall(awayStarters);

  // Unit calculations
  const calculateUnit = (players: Player[], pos: string, attr: keyof Player) => {
    const list = players.filter((p) => p.position === pos);
    if (list.length === 0) return 75;
    return Math.round(list.reduce((acc, p) => acc + (Number(p[attr]) || p.overall), 0) / list.length);
  };

  const homeAtt = calculateUnit(homeStarters, 'ATT', 'shooting');
  const homeMid = calculateUnit(homeStarters, 'MID', 'passing');
  const homeDef = calculateUnit(homeStarters, 'DEF', 'defending');
  const homeGk = calculateUnit(homeStarters, 'GK', 'goalkeeping');

  const awayAtt = calculateUnit(awayStarters, 'ATT', 'shooting');
  const awayMid = calculateUnit(awayStarters, 'MID', 'passing');
  const awayDef = calculateUnit(awayStarters, 'DEF', 'defending');
  const awayGk = calculateUnit(awayStarters, 'GK', 'goalkeeping');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      
      {/* Back button and Matchday header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Select Rival:</span>
          <div className="relative">
            <select
              value={selectedOpponentId}
              onChange={(e) => setSelectedOpponentId(e.target.value)}
              className="appearance-none bg-[#090f14] border border-slate-700 text-xs font-bold text-white py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-emerald-500"
            >
              {opponentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.manager})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* MATCH FIXTURE MAIN BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111e28] via-[#0c161e] to-[#080d12] border-2 border-emerald-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            OFFICIAL LEAGUE FIXTURE
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 tracking-tight">
            MATCH SETUP
          </h1>
        </div>

        {/* Head-to-Head Clash Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          
          {/* Home Team: RAHIL FC */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-3xl shadow-lg border border-emerald-300">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    HOME TEAM
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{currentTeam.name}</h2>
                  <p className="text-xs text-slate-400">Manager: {currentTeam.manager}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center">
                <span className="text-2xl font-black text-emerald-400 leading-none">{homeOvr}</span>
                <span className="text-[9px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-emerald-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1.5">
              {homeStarters.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-[10px] font-black text-slate-400">
                      #{p.number}
                    </span>
                    <span className="font-extrabold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {p.position}
                    </span>
                    <span className="font-black text-emerald-400">{p.overall}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400">{homeAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400">{homeMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400">{homeDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400">{homeGk}</span>
              </div>
            </div>
          </div>

          {/* VS Center Pillar */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-black text-lg text-emerald-400 shadow-xl">
              VS
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] uppercase font-black tracking-wider text-slate-400">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clash</span>
            </div>
          </div>

          {/* Away Team: AASHISH FC */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-5 sm:p-6 rounded-3xl border border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-3xl shadow-lg border border-blue-400">
                  {opponentTeam.badgeIcon}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    AWAY TEAM
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{opponentTeam.name}</h2>
                  <p className="text-xs text-slate-400">Manager: {opponentTeam.manager}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-center">
                <span className="text-2xl font-black text-blue-400 leading-none">{awayOvr}</span>
                <span className="text-[9px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-blue-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1.5">
              {awayStarters.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-[10px] font-black text-slate-400">
                      #{p.number}
                    </span>
                    <span className="font-extrabold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {p.position}
                    </span>
                    <span className="font-black text-blue-400">{p.overall}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400">{awayAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400">{awayMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400">{awayDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400">{awayGk}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Primary Call to Action */}
        <div className="mt-10 flex flex-col items-center justify-center">
          <button
            onClick={() => onSimulate(opponentTeam.id)}
            className="w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base uppercase tracking-wider transition-all duration-300 shadow-2xl shadow-emerald-500/30 active:scale-95 group"
          >
            <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-125" />
            <span>SIMULATE MATCH</span>
          </button>
          <p className="text-xs text-slate-400 mt-2.5">
            Real simulation engine evaluates tactical attributes, form, and match momentum.
          </p>
        </div>

      </div>

    </div>
  );
};
