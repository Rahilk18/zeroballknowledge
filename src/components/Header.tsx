import React from 'react';
import { Shield, Coins, Award, Menu, X, Trophy, LogOut, User } from 'lucide-react';
import { Team, ActiveTab, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  currentTeam?: Team | null;
  teamOverall: number;
  currentUser: UserAccount | null;
  onLogOut: () => void;
  onOpenAuth: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onQuickSimulate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTeam,
  teamOverall,
  currentUser,
  onLogOut,
  onOpenAuth,
  activeTab: _activeTab,
  setActiveTab: _setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  onQuickSimulate
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090f14]/95 backdrop-blur-md border-b border-emerald-950/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-md shadow-emerald-500/20 text-slate-950 font-black text-xl border border-emerald-300/40">
              <span className="tracking-tighter">⚡</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-wider uppercase text-white">
                  Football Draft
                </span>
                <span className="text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Multiplayer Draft Auction & Tactical League
              </p>
            </div>
          </div>

          {/* Quick Team Status Chips */}
          <div className="hidden md:flex items-center gap-3">
            {currentTeam ? (
              <>
                {/* Team Name Chip */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{currentTeam.name}</span>
                </div>

                {/* Overall Rating Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>OVR:</span>
                  <span className="text-sm font-black text-white">{teamOverall || '--'}</span>
                </div>

                {/* Budget Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs font-semibold text-amber-300">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Budget:</span>
                  <span className="text-sm font-black text-white">{formatCurrency(currentTeam.budget)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>No active game session</span>
              </div>
            )}

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-base leading-none">{currentUser.badgeIcon || '⚡'}</span>
                  <div className="text-left">
                    <span className="font-extrabold text-white block leading-tight">{currentUser.managerName || currentUser.name}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block leading-none">{currentUser.clubName || currentTeam?.name || 'Manager'}</span>
                  </div>
                </div>
                <button
                  onClick={onLogOut}
                  title="Sign Out / Switch Manager"
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In / Sign In</span>
              </button>
            )}

            {/* Quick Match Action */}
            {onQuickSimulate && currentTeam && (
              <button
                onClick={onQuickSimulate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-md shadow-emerald-500/25 active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5" />
                Match Day
              </button>
            )}
          </div>

          {/* Mobile Right Bar: User badge / Log In, Budget & Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {currentUser ? (
              <button
                onClick={onLogOut}
                title="Switch Manager"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300"
              >
                <span>{currentUser.badgeIcon || '⚡'}</span>
                <span className="max-w-[65px] truncate">{currentUser.managerName || currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2 py-1 rounded-md bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider"
              >
                Log In
              </button>
            )}

            {currentTeam && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 text-xs font-bold text-amber-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatCurrency(currentTeam.budget)}</span>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
