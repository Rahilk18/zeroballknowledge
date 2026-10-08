import React, { useState } from 'react';
import { Shield, Coins, Award, Menu, X, Trophy, LogOut, User, Volume2, VolumeX, Glasses, Zap } from 'lucide-react';
import { Team, ActiveTab, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { sound } from '../utils/audioSynth';
import { StadiumAudioModal } from './StadiumAudioModal';

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
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const isMuted = sound.getIsMuted();

  const handleOpenAudioModal = () => {
    sound.playClick();
    setIsAudioModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A14]/95 backdrop-blur-md border-b border-[#FF1744]/20 shadow-glow-cyan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* ZeroBallKnowledge Brand Logo & Identity */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0E1324] border border-[#FF1744]/50 shadow-glow-cyan p-1.5 overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0">
              <img src="/logo.png" alt="ZBK" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,23,68,0.7)]" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF1744] rounded-full animate-ping opacity-80" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white font-display text-glow-cyan">
                  ZEROBALLKNOWLEDGE
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 tracking-wider">
                  FOOTBALL
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                  REAL-TIME MULTIPLAYER AUCTION BATTLE
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-[#FF1744]/30 text-[9px] font-medium tracking-wide shadow-[0_0_10px_rgba(255,23,68,0.18)]">
                  <span className="text-slate-400 font-normal lowercase text-[8.5px]">by</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF1744] via-rose-400 to-orange-500 drop-shadow-[0_0_6px_rgba(255,23,68,0.4)]">
                    Rahil Kirtikar
                  </span>
                </span>
              </div>
              <div className="flex sm:hidden items-center gap-1.5 mt-0.5">
                <span className="text-[8.5px] text-slate-400 font-bold tracking-wider uppercase">
                  AUCTION BATTLE
                </span>
                <span className="text-slate-600 text-[8px]">•</span>
                <span className="text-[8.5px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#FF1744] to-orange-500">
                  by Rahil Kirtikar
                </span>
              </div>
            </div>
          </div>

          {/* Quick Team Status Chips & HeroBid Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Stadium Audio & SFX Control */}
            <button
              onClick={handleOpenAudioModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                !isMuted
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-[#0E1324] border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Open Stadium Audio & SFX Soundboard"
            >
              {!isMuted ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-wider hidden lg:inline">
                {!isMuted ? 'STADIUM SFX' : 'MUTED'}
              </span>
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-[#FF1744]/25 text-xs font-medium text-slate-300">
                  <span className="text-base">{currentTeam.badgeIcon || '⚡'}</span>
                  <span className="font-bold text-white tracking-wide">{currentTeam.name}</span>
                </div>

                {/* Overall Rating Chip */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1324] border border-[#FF1744]/40 text-xs font-semibold text-[#FF1744]">
                  <Award className="w-4 h-4 text-[#FF1744]" />
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
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0E1324] border border-[#FF1744]/30 text-xs">
                  <span className="text-base leading-none">{currentUser.badgeIcon || '⚡'}</span>
                  <div className="text-left">
                    <span className="font-extrabold text-white block leading-tight">{currentUser.managerName || currentUser.name}</span>
                    <span className="text-[10px] text-[#FF1744] font-semibold block leading-none">{currentUser.clubName || currentTeam?.name || 'Manager'}</span>
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-glow-cyan"
              >
                <User className="w-3.5 h-3.5" />
                <span>LOG IN</span>
              </button>
            )}

            {/* Quick Match Action */}
            {onQuickSimulate && currentTeam && (
              <button
                onClick={onQuickSimulate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-glow-cyan active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5" />
                CLASH
              </button>
            )}
          </div>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={handleOpenAudioModal}
              className={`p-1.5 rounded-lg border text-xs transition ${
                !isMuted ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-[#0E1324] border-slate-800 text-slate-400'
              }`}
              title="Open Stadium Audio"
            >
              {!isMuted ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <button
                onClick={onLogOut}
                title="Switch Manager"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0E1324] border border-[#FF1744]/20 text-[11px] font-bold text-slate-300"
              >
                <span>{currentUser.badgeIcon || '⚡'}</span>
                <span className="max-w-[65px] truncate">{currentUser.managerName || currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-lg bg-[#FF1744] text-slate-950 font-black text-[11px] uppercase tracking-wider"
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
              className="p-2 rounded-lg bg-[#0E1324] border border-[#FF1744]/20 text-slate-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Stadium Audio & SFX Modal */}
      <StadiumAudioModal 
        isOpen={isAudioModalOpen} 
        onClose={() => setIsAudioModalOpen(false)} 
      />
    </header>
  );
};

