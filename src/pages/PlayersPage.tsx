import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { Search, Filter, ArrowUpDown, Database, UserCheck, Flame } from 'lucide-react';

interface PlayersPageProps {
  players: Player[];
  userTeamId: string;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({ players, userTeamId: _userTeamId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'overall' | 'form' | 'pace' | 'marketValue'>('overall');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPosition =
          selectedPosition === 'ALL' ||
          (selectedPosition === 'ATT' && p.position === 'ATT') ||
          (selectedPosition === 'MID' && p.position === 'MID') ||
          (selectedPosition === 'DEF' && p.position === 'DEF') ||
          (selectedPosition === 'GK' && p.position === 'GK');

        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => {
        if (sortBy === 'overall') return b.overall - a.overall;
        if (sortBy === 'form') return b.form - a.form;
        if (sortBy === 'pace') return b.pace - a.pace;
        if (sortBy === 'marketValue') return (b.marketValue ?? b.marketValueM ?? 0) - (a.marketValue ?? a.marketValueM ?? 0);
        return 0;
      });
  }, [players, searchQuery, selectedPosition, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Player Database
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Scout world-class talents, analyze ratings, and monitor player match forms.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            Total Players: <strong className="text-emerald-400">{players.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            Showing: <strong className="text-white">{filteredPlayers.length}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0e1720] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name, country (e.g. Mbappé, Messi, Bellingham)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090f14] border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Position Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Players' },
            { id: 'ATT', label: 'Attackers' },
            { id: 'MID', label: 'Midfielders' },
            { id: 'DEF', label: 'Defenders' },
            { id: 'GK', label: 'Goalkeepers' },
          ].map((pos) => {
            const isActive = selectedPosition === pos.id;
            return (
              <button
                key={pos.id}
                onClick={() => setSelectedPosition(pos.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-[#090f14] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pos.label}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#090f14] border border-slate-800 text-xs font-semibold text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-emerald-500"
          >
            <option value="overall">Highest Overall (OVR)</option>
            <option value="form">Highest Form (HOT)</option>
            <option value="pace">Highest Pace (PAC)</option>
            <option value="marketValue">Highest Market Value</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16 bg-[#0e1720] rounded-3xl border border-dashed border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No players found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or changing the position filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={(p) => setSelectedPlayer(p)}
            />
          ))}
        </div>
      )}

      {/* Detailed Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};
