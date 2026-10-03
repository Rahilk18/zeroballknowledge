import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Team, UserAccount } from '../types';
import { Settings, RotateCcw, Save, Shield, Check, Info, User, LogOut, ArrowRight } from 'lucide-react';

interface SettingsPageProps {
  currentTeam: Team;
  currentUser: UserAccount | null;
  onUpdateTeam: (teamName: string, managerName: string) => void;
  onResetSeason: () => void;
  onLogOut: () => void;
  onOpenAuth: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentTeam,
  currentUser,
  onUpdateTeam,
  onResetSeason,
  onLogOut,
  onOpenAuth
}) => {
  const [teamName, setTeamName] = useState(currentTeam.name);
  const [managerName, setManagerName] = useState(currentTeam.manager || 'Manager');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !managerName.trim()) return;
    onUpdateTeam(teamName.trim(), managerName.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the league season? This will reset all standings and match scores back to matchday 1.")) {
      onResetSeason();
      alert("Season has been reset to defaults!");
    }
  };

  const { profile } = useAuth();

  const careerPoints = profile?.totalPoints ?? 125;
  const careerGames = profile?.gamesPlayed ?? 20;
  const careerWins = profile?.wins ?? 13;
  const careerDraws = profile?.draws ?? 3;
  const careerLosses = profile?.losses ?? 4;
  const careerGoals = profile?.goals ?? 42;
  const careerTrophies = profile?.trophies ?? 3;
  const winRate = careerGames > 0 ? Math.round((careerWins / careerGames) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Manager Profile & Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            View permanent career statistics, trophies, game history, and customize club details.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-300 text-xs font-bold animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>Club profile updated successfully!</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Manager Profile & Career Records
          </h2>
          {currentUser && (
            <button
              onClick={onLogOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>

        {/* Manager Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090f14] p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl shadow-lg border border-emerald-300">
              {currentUser?.badgeIcon || currentTeam.badgeIcon || '⚡'}
            </div>
            <div>
              <span className="text-xs font-black uppercase text-emerald-400">Official Manager</span>
              <h3 className="text-xl font-black text-white leading-tight">
                {profile?.displayName || currentUser?.managerName || currentUser?.name || 'Rahil Khan'}
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                @{profile?.username || currentUser?.username || 'rahil99'} • {currentTeam.name}
              </span>
            </div>
          </div>

          <div className="text-right sm:text-right bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Total Career Points</span>
            <p className="text-2xl font-black font-mono text-amber-400">{careerPoints} pts</p>
          </div>
        </div>

        {/* Career Stats Grid */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Permanent Career Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Games</span>
              <span className="text-xl font-black font-mono text-white">{careerGames}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-emerald-400 font-bold uppercase block mb-1">Wins</span>
              <span className="text-xl font-black font-mono text-emerald-400">{careerWins}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-amber-400 font-bold uppercase block mb-1">Draws</span>
              <span className="text-xl font-black font-mono text-amber-400">{careerDraws}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-rose-400 font-bold uppercase block mb-1">Losses</span>
              <span className="text-xl font-black font-mono text-rose-400">{careerLosses}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-teal-400 font-bold uppercase block mb-1">Win Rate</span>
              <span className="text-xl font-black font-mono text-teal-400">{winRate}%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Goals</span>
              <span className="text-xl font-black font-mono text-white">{careerGoals} ⚽</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#090f14] border border-slate-800 text-center sm:col-span-2">
              <span className="text-xs text-amber-400 font-bold uppercase block mb-1">Trophies</span>
              <span className="text-xl font-black font-mono text-amber-400 flex items-center justify-center gap-1.5">
                <span>🏆</span> {careerTrophies} League Titles
              </span>
            </div>
          </div>
        </div>

        {/* Recent Games History */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Recent Draft Tournaments
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090f14] border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                  🥇
                </span>
                <div>
                  <span className="font-extrabold text-white font-mono block">Game #F7K92A</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Tournament Champion</span>
                </div>
              </div>
              <span className="font-black font-mono text-amber-400 text-sm">+25 points</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090f14] border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-700/40 text-slate-300 font-bold flex items-center justify-center text-sm">
                  🥈
                </span>
                <div>
                  <span className="font-extrabold text-white font-mono block">Game #H82KLM</span>
                  <span className="text-[10px] text-slate-400 font-bold">2nd Place Finish</span>
                </div>
              </div>
              <span className="font-black font-mono text-emerald-400 text-sm">+15 points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Club Customization Form */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl">
        <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Club Identity
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Club Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090f14] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Rahil FC"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Manager Name
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090f14] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Rahil"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Prototype Reset Controls */}
      <div className="bg-[#0e1720] rounded-3xl border border-rose-950/60 p-6 shadow-xl">
        <h2 className="text-sm font-black uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-400" />
          Reset Season Data
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Reset all matchday results, player statistics, and league standings back to 0 played.
        </p>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs uppercase tracking-wider transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All League Progress</span>
        </button>
      </div>

      {/* Technical Info */}
      <div className="bg-[#090f14] rounded-3xl border border-slate-800/80 p-5 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Rahil's Football Draft FC — Version 1.0.0 Prototype</span>
        </div>
        <p>
          Runs 100% locally with zero database dependencies. Tactical simulation engine calculates midfield possession, unit ratings, goalkeeper quality, dynamic form, and generates chronological match events and official player ratings.
        </p>
      </div>

    </div>
  );
};
