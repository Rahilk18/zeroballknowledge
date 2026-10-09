import React from 'react';
import { 
  LayoutDashboard, 
  Gavel, 
  Users, 
  Database, 
  Swords, 
  Trophy, 
  BarChart3, 
  Settings,
  Sparkles,
  Globe,
  Radio,
  Zap,
  Glasses,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'BATTLE HUB', icon: LayoutDashboard },
    { id: 'lobby', label: 'ROOMS', icon: Radio, badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    { id: 'auction', label: '3D AUCTION', icon: Gavel, badge: 'ARENA 🥽', badgeColor: 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40' },
    { id: 'my-team', label: 'MY ROSTER', icon: Users, badge: '7v7' },
    { id: 'lineup', label: 'PLAYING 7', icon: Shield, badge: 'TACTICS', badgeColor: 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40' },
    { id: 'players', label: 'PLAYERS', icon: Database },
    { id: 'matches', label: 'BATTLE ARENA', icon: Swords, badge: 'PVP', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'league', label: 'LEAGUE', icon: Trophy },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: Globe, badge: 'WEEKLY' },
    { id: 'statistics', label: 'STATS', icon: BarChart3 },
    { id: 'admin', label: 'ADMIN 🛡️', icon: ShieldCheck, badge: 'PANEL', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Top Cyber Navigation Bar */}
      <nav className="hidden lg:block bg-[#0A0A14] border-b border-[#FF1744]/15 sticky top-14 sm:top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center space-x-1 py-1.5 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all whitespace-nowrap uppercase ${
                    isActive
                      ? 'text-[#FF1744] bg-[#0E1324] border border-[#FF1744]/50 shadow-glow-cyan text-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-[#0E1324]/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF1744]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#FF1744] to-blue-500 rounded-full shadow-glow-cyan" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation (When hamburger is tapped) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end">
          <div 
            className="absolute inset-0" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative bg-[#0E1324] border-t border-[#FF1744]/30 p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-glow-cyan">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0E1324] border border-[#FF1744]/40 p-1 flex items-center justify-center shadow-glow-cyan">
                  <img src="/logo.png" alt="ZBK Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,23,68,0.7)]" />
                </div>
                <span className="text-base font-extrabold text-white uppercase tracking-wider font-display text-glow-cyan">
                  ZEROBALLKNOWLEDGE MENU
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 uppercase font-bold hover:text-white px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-[#FF1744]/10 border-[#FF1744]/60 text-[#FF1744] shadow-glow-cyan'
                        : 'bg-[#0A0A14] border-slate-800 text-slate-300 hover:bg-[#12182D]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-[#FF1744]' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                    {item.badge && (
                      <span className="mt-1 text-[9px] font-black px-1.5 py-0.5 rounded border border-[#FF1744]/30 bg-[#FF1744]/10 text-[#FF1744]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A14]/95 backdrop-blur-md border-t border-[#FF1744]/20 px-3 py-2 flex items-center justify-around shadow-2xl">
        {[
          { id: 'dashboard', label: 'Hub', icon: LayoutDashboard },
          { id: 'auction', label: '3D Arena', icon: Gavel },
          { id: 'my-team', label: 'Roster', icon: Users },
          { id: 'matches', label: 'Battle', icon: Swords },
          { id: 'leaderboard', label: 'Ranks', icon: Trophy },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id as ActiveTab)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-[#FF1744] text-glow-cyan' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF1744] mt-0.5 shadow-glow-cyan" />}
            </button>
          );
        })}
      </nav>
    </>
  );
};

