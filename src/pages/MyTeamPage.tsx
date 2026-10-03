import React, { useState } from 'react';
import { Team, Player } from '../types';
import { PitchView } from '../components/PitchView';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { LineupEditorModal } from '../components/LineupEditorModal';
import { formatCurrency, calculateTeamOverall } from '../utils/formatters';
import { 
  Shield, 
  Users, 
  Coins, 
  SlidersHorizontal, 
  Eye, 
  ArrowLeftRight, 
  Sparkles,
  Info
} from 'lucide-react';

interface MyTeamPageProps {
  currentTeam: Team;
  allPlayers: Player[];
  onUpdateLineup: (startingSeven: string[], bench: string[]) => void;
}

export const MyTeamPage: React.FC<MyTeamPageProps> = ({
  currentTeam,
  allPlayers,
  onUpdateLineup
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    currentTeam.startingSeven[currentTeam.startingSeven.length - 1] || null // Mbappé by default
  );
  const [inspectModalPlayer, setInspectModalPlayer] = useState<Player | null>(null);
  const [isLineupEditorOpen, setIsLineupEditorOpen] = useState(false);
  const [showBenchSection, setShowBenchSection] = useState(true);

  // Starting players
  const startingPlayers = currentTeam.startingSeven
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  // Bench players
  const benchPlayers = currentTeam.bench
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const teamOverall = calculateTeamOverall(startingPlayers);
  const squadSize = startingPlayers.length + benchPlayers.length;

  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId) || startingPlayers[0];

  const handleBenchOrSwap = (player: Player) => {
    const isStarter = currentTeam.startingSeven.includes(player.id);
    if (isStarter) {
      if (benchPlayers.length > 0) {
        // Swap with first bench player
        const firstBench = benchPlayers[0];
        const newStarters = currentTeam.startingSeven.map(id => id === player.id ? firstBench.id : id);
        const newBench = currentTeam.bench.map(id => id === firstBench.id ? player.id : id);
        onUpdateLineup(newStarters, newBench);
      } else {
        alert("No bench players available to swap with!");
      }
    } else {
      // Is bench player -> swap with selected starter or last starter
      const targetStarterId = selectedPlayerId && currentTeam.startingSeven.includes(selectedPlayerId)
        ? selectedPlayerId
        : currentTeam.startingSeven[0];
      const newStarters = currentTeam.startingSeven.map(id => id === targetStarterId ? player.id : id);
      const newBench = currentTeam.bench.map(id => id === player.id ? targetStarterId : id);
      onUpdateLineup(newStarters, newBench);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Team Top Overview Bar */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 border border-emerald-300">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Manager: {currentTeam.manager}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Club ID: {currentTeam.shortCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {currentTeam.name}
              </h1>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="bg-[#090f14] px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Team Overall</span>
                <span className="text-xl font-black text-emerald-400 leading-none">{teamOverall} OVR</span>
              </div>
            </div>

            <div className="bg-[#090f14] px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget</span>
                <span className="text-xl font-black text-white leading-none">{formatCurrency(currentTeam.budget)}</span>
              </div>
            </div>

            <div className="bg-[#090f14] px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Users className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Squad Size</span>
                <span className="text-xl font-black text-white leading-none">{squadSize} Players</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Tactical Preset:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              7-Player Pitch (2-2-2 + GK)
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* EDIT LINEUP Button */}
            <button
              onClick={() => setIsLineupEditorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>EDIT LINEUP</span>
            </button>

            {/* VIEW PLAYER Button */}
            <button
              onClick={() => selectedPlayer && setInspectModalPlayer(selectedPlayer)}
              disabled={!selectedPlayer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95 disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>VIEW PLAYER</span>
            </button>

            {/* BENCH Button */}
            <button
              onClick={() => selectedPlayer && handleBenchOrSwap(selectedPlayer)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
              <span>BENCH</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Pitch View & Selected Player Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Center: The Interactive 7-a-Side Pitch */}
        <div className="lg:col-span-8 bg-[#0c141c] rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pitch Formation: Starting 7
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-emerald-400">{selectedPlayer?.name}</strong>
            </span>
          </div>

          <PitchView
            startingPlayers={startingPlayers}
            onPlayerClick={(p) => setSelectedPlayerId(p.id)}
            selectedPlayerId={selectedPlayerId}
            interactive={true}
          />
        </div>

        {/* Right Side: Selected Player Focus Inspector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Selected Player Card
              </span>
              <button
                onClick={() => selectedPlayer && setInspectModalPlayer(selectedPlayer)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Full Details</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedPlayer && (
              <PlayerCard
                player={selectedPlayer}
                onView={(p) => setInspectModalPlayer(p)}
                onSelect={(p) => handleBenchOrSwap(p)}
                actionLabel={currentTeam.startingSeven.includes(selectedPlayer.id) ? "Send To Bench" : "Start In 7"}
                isSelected={true}
              />
            )}
          </div>

          {/* Quick Lineup Summary Checklist */}
          <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              Starting 7 Roster List
            </h3>
            <div className="space-y-2">
              {startingPlayers.map((p) => {
                const isSelected = p.id === selectedPlayerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 text-white font-bold'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 text-[10px] font-black uppercase px-1 py-0.2 rounded bg-slate-800 text-center">
                        {p.position}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="font-black text-emerald-400">{p.overall}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Bench Substitutes Squad Section */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Bench Substitutes ({benchPlayers.length})
            </h2>
          </div>
          <button
            onClick={() => setShowBenchSection(!showBenchSection)}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            {showBenchSection ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showBenchSection && (
          benchPlayers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No substitutes currently on the bench. Use the Auction page to acquire more players!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {benchPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onView={(p) => setInspectModalPlayer(p)}
                  onSelect={(p) => handleBenchOrSwap(p)}
                  actionLabel="Promote to Starter"
                  isSelected={player.id === selectedPlayerId}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Detailed Modal */}
      {inspectModalPlayer && (
        <PlayerDetailModal
          player={inspectModalPlayer}
          onClose={() => setInspectModalPlayer(null)}
          onSwapLineup={(p) => handleBenchOrSwap(p)}
          isStartingLineup={currentTeam.startingSeven.includes(inspectModalPlayer.id)}
        />
      )}

      {/* Lineup Editor Modal */}
      {isLineupEditorOpen && (
        <LineupEditorModal
          team={currentTeam}
          allPlayers={allPlayers}
          onClose={() => setIsLineupEditorOpen(false)}
          onSaveLineup={(newStarters, newBench) => onUpdateLineup(newStarters, newBench)}
        />
      )}

    </div>
  );
};
