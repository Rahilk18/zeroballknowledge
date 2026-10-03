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
  Globe
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
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lobby', label: 'Multiplayer Lobby', icon: Users, badge: 'LIVE' },
    { id: 'auction', label: 'Auction', icon: Gavel, badge: 'HOT' },
    { id: 'my-team', label: 'My Team', icon: Users, badge: '7' },
    { id: 'players', label: 'Players', icon: Database },
    { id: 'matches', label: 'Matches', icon: Swords },
    { id: 'league', label: 'League', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Globe },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <nav className="hidden lg:block bg-[#0b131a] border-b border-slate-800/80 sticky top-16 sm:top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badge === 'HOT'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation (When hamburger is tapped) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div 
            className="absolute inset-0" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative bg-[#0c141c] border-t border-slate-800 p-6 rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-bold text-white uppercase tracking-wider">Navigation Menu</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 uppercase font-bold hover:text-white px-2 py-1 bg-slate-800 rounded"
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
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
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

      {/* Mobile Fixed Bottom Bar (4 primary quick actions on phone) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090f14]/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'my-team', label: 'My Team', icon: Users },
          { id: 'matches', label: 'Match', icon: Swords },
          { id: 'players', label: 'Players', icon: Database },
          { id: 'league', label: 'League', icon: Trophy },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id as ActiveTab)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />}
            </button>
          );
        })}
      </nav>
    </>
  );
};
