import React, { useState, useMemo } from 'react';
import { Player, PlayerPosition } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { Search, Filter, ArrowUpDown, Database, UserCheck, Flame, Zap } from 'lucide-react';
import { sound } from '../utils/audioSynth';

interface PlayersPageProps {
  players: Player[];
  userTeamId: string;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({ players, userTeamId: _userTeamId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
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

        const matchesRarity =
          selectedRarity === 'ALL' ||
          (selectedRarity === 'MYTHIC' && p.overall >= 90) ||
          (selectedRarity === 'LEGENDARY' && p.overall >= 86 && p.overall < 90) ||
          (selectedRarity === 'EPIC' && p.overall >= 82 && p.overall < 86) ||
          (selectedRarity === 'RARE' && p.overall < 82);

        return matchesSearch && matchesPosition && matchesRarity;
      })
      .sort((a, b) => {
        if (sortBy === 'overall') return b.overall - a.overall;
        if (sortBy === 'form') return b.form - a.form;
        if (sortBy === 'pace') return b.pace - a.pace;
        if (sortBy === 'marketValue') return (b.marketValue ?? b.marketValueM ?? 0) - (a.marketValue ?? a.marketValueM ?? 0);
        return 0;
      });
  }, [players, searchQuery, selectedPosition, selectedRarity, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#0E1324] to-purple-950/40 border border-[#00E5FF]/30 p-6 sm:p-7 shadow-glow-cyan">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="w-5 h-5 text-[#00E5FF]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] font-display text-glow-cyan">
                ZEROBALLKNOWLEDGE FOOTBALL DATABASE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
              SUPERSTAR SCOUTING MATRIX
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Inspect football icons, view 3D holographic cards, and evaluate tactical attributes
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-3.5 py-2 rounded-2xl bg-[#0A0A14] border border-[#00E5FF]/30 text-slate-300">
              TOTAL: <strong className="text-[#00E5FF]">{players.length}</strong>
            </span>
            <span className="px-3.5 py-2 rounded-2xl bg-[#0A0A14] border border-purple-500/30 text-slate-300">
              FILTERED: <strong className="text-purple-300">{filteredPlayers.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0E1324] p-4 rounded-3xl border border-[#00E5FF]/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00E5FF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name, nationality (e.g. Messi, Haaland, Bellingham)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0A0A14] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition font-medium"
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
            { id: 'ALL', label: 'ALL' },
            { id: 'ATT', label: 'ATT' },
            { id: 'MID', label: 'MID' },
            { id: 'DEF', label: 'DEF' },
            { id: 'GK', label: 'GK' },
          ].map((pos) => {
            const isActive = selectedPosition === pos.id;
            return (
              <button
                key={pos.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPosition(pos.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#00E5FF] text-slate-950 shadow-glow-cyan'
                    : 'bg-[#0A0A14] hover:bg-[#12182D] text-slate-400 hover:text-white border border-slate-800'
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
            onChange={(e) => {
              sound.playClick();
              setSortBy(e.target.value as any);
            }}
            className="bg-[#0A0A14] border border-slate-700 text-xs font-bold text-slate-200 py-2.5 px-3 rounded-2xl focus:outline-none focus:border-[#00E5FF]"
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
        <div className="text-center py-16 bg-[#0E1324] rounded-3xl border border-dashed border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">NO PLAYERS MATCH FILTER</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or position filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={(p) => {
                sound.playClick();
                setSelectedPlayer(p);
              }}
            />
          ))}
        </div>
      )}

      {/* Detailed 3D Inspector Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default PlayersPage;
