import React, { useState } from 'react';
import { Shield, Coins, Award, Menu, X, Trophy, LogOut, User, Volume2, VolumeX, Glasses, Zap } from 'lucide-react';
import { Team, ActiveTab, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { sound } from '../utils/audioSynth';

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
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  onQuickSimulate
}) => {
  const [isAudioOn, setIsAudioOn] = useState(false);

  const handleToggleAudio = () => {
    const nextState = sound.toggleMusic();
    setIsAudioOn(nextState);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A14]/95 backdrop-blur-md border-b border-[#00E5FF]/20 shadow-glow-cyan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* ZeroBallKnowledge Brand Logo & Identity */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#3B82F6] shadow-glow-cyan text-slate-950 font-black text-xl border border-[#00E5FF]/40 group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">⚡</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00E5FF] rounded-full animate-ping opacity-80" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white font-display text-glow-cyan">
                  ZEROBALLKNOWLEDGE
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 tracking-wider">
                  FOOTBALL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-bold tracking-widest uppercase">
                REAL-TIME MULTIPLAYER AUCTION BATTLE
              </p>
            </div>
          </div>

          {/* Quick Team Status Chips & HeroBid Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Audio Ambient Beat Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-xl border transition-all ${
                isAudioOn
                  ? 'bg-[#00E5FF]/20 border-[#00E5FF]/50 text-[#00E5FF] shadow-glow-cyan'
                  : 'bg-[#0E1324] border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isAudioOn ? 'Mute Cyber Audio' : 'Play Cyber Ambient Music'}
            >
              {isAudioOn ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* 3D Arena Fast Jump Button */}
            <button
              onClick={() => setActiveTab('auction')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-[#0E1324] border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold uppercase tracking-wider transition hover:border-purple-400 shadow-glow-purple"
              title="Enter AR/VR 3D Bidding Arena"
            >
              <Glasses className="w-4 h-4 text-purple-400" />
              <span>3D ARENA 🥽</span>
            </button>

            {/* Super Admin Control Panel Shortcut */}
            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/50 to-[#0E1324] border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold uppercase tracking-wider transition hover:border-rose-400"
              title="Open Super Admin Command Deck"
            >
              <Shield className="w-4 h-4 text-rose-400" />
              <span>ADMIN 🛡️</span>
            </button>

            {currentTeam ? (
              <>
                {/* Team Name Chip */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-[#00E5FF]/25 text-xs font-medium text-slate-300">
                  <span className="text-base">{currentTeam.badgeIcon || '⚡'}</span>
                  <span className="font-bold text-white tracking-wide">{currentTeam.name}</span>
                </div>

                {/* Overall Rating Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-[#00E5FF]/40 text-xs font-semibold text-[#00E5FF]">
                  <Award className="w-4 h-4 text-[#00E5FF]" />
                  <span>OVR:</span>
                  <span className="text-sm font-black text-white">{teamOverall || '--'}</span>
                </div>

                {/* Budget Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-amber-500/30 text-xs font-semibold text-amber-300">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>BUDGET:</span>
                  <span className="text-sm font-black text-white font-mono">{formatCurrency(currentTeam.budget)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-slate-800 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>NO ACTIVE ROOM</span>
              </div>
            )}

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0E1324] border border-[#00E5FF]/30 text-xs">
                  <span className="text-base leading-none">{currentUser.badgeIcon || '⚡'}</span>
                  <div className="text-left">
                    <span className="font-extrabold text-white block leading-tight">{currentUser.managerName || currentUser.name}</span>
                    <span className="text-[10px] text-[#00E5FF] font-semibold block leading-none">{currentUser.clubName || currentTeam?.name || 'Manager'}</span>
                  </div>
                </div>
                <button
                  onClick={onLogOut}
                  title="Sign Out / Switch Manager"
                  className="p-1.5 rounded-xl bg-[#0E1324] hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-glow-cyan"
              >
                <User className="w-3.5 h-3.5" />
                <span>LOG IN</span>
              </button>
            )}

            {/* Quick Match Action */}
            {onQuickSimulate && currentTeam && (
              <button
                onClick={onQuickSimulate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-glow-cyan active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5" />
                CLASH
              </button>
            )}
          </div>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={handleToggleAudio}
              className={`p-1.5 rounded-lg border text-xs ${
                isAudioOn ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-[#0E1324] border-slate-800 text-slate-400'
              }`}
            >
              {isAudioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <button
                onClick={onLogOut}
                title="Switch Manager"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0E1324] border border-[#00E5FF]/20 text-[11px] font-bold text-slate-300"
              >
                <span>{currentUser.badgeIcon || '⚡'}</span>
                <span className="max-w-[65px] truncate">{currentUser.managerName || currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-lg bg-[#00E5FF] text-slate-950 font-black text-[11px] uppercase tracking-wider"
              >
                LOG IN
              </button>
            )}

            {currentTeam && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0E1324] border border-amber-500/30 text-xs font-bold text-amber-300 font-mono">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{formatCurrency(currentTeam.budget)}</span>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#0E1324] border border-[#00E5FF]/20 text-slate-300 hover:text-white"
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

