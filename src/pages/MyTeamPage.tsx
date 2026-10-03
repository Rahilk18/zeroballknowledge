import React, { useState, useEffect } from 'react';
import { Team, Player, ActiveTab } from '../types';
import { PitchView } from '../components/PitchView';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { LineupEditorModal } from '../components/LineupEditorModal';
import { formatCurrency, calculateTeamOverall } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserTeams, fetchTeamSquad, UserPastTeamItem } from '../services/userService';
import { 
  Shield, 
  Users, 
  Coins, 
  SlidersHorizontal, 
  Eye, 
  ArrowLeftRight, 
  Sparkles,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

interface MyTeamPageProps {
  currentTeam: Team | null;
  allPlayers: Player[];
  onUpdateLineup: (startingSeven: string[], bench: string[]) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const MyTeamPage: React.FC<MyTeamPageProps> = ({
  currentTeam,
  allPlayers,
  onUpdateLineup,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const [inspectModalPlayer, setInspectModalPlayer] = useState<Player | null>(null);
  const [isLineupEditorOpen, setIsLineupEditorOpen] = useState(false);
  const [showBenchSection, setShowBenchSection] = useState(true);

  // Past teams history for user
  const [pastTeams, setPastTeams] = useState<UserPastTeamItem[]>([]);
  const [selectedPastTeamId, setSelectedPastTeamId] = useState<string>('');
  const [pastTeamPlayers, setPastTeamPlayers] = useState<Player[]>([]);
  const [loadingPastSquad, setLoadingPastSquad] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserTeams(user.id).then(teams => {
        setPastTeams(teams);
      });
    }
  }, [user?.id]);

  // Load past team squad when selected
  useEffect(() => {
    if (!selectedPastTeamId || !user) return;
    const pt = pastTeams.find(t => t.teamId === selectedPastTeamId);
    if (!pt) return;

    setLoadingPastSquad(true);
    fetchTeamSquad(pt.teamId, pt.sessionId).then(squad => {
      const players = squad.map((s: any) => s.player).filter(Boolean);
      setPastTeamPlayers(players);
      setLoadingPastSquad(false);
    });
  }, [selectedPastTeamId]);

  // If viewing past team vs current session team
  const isViewingPast = Boolean(selectedPastTeamId && selectedPastTeamId !== currentTeam?.id);
  const activePastTeam = pastTeams.find(t => t.teamId === selectedPastTeamId);

  const displayTeam = isViewingPast && activePastTeam ? {
    id: activePastTeam.teamId,
    name: activePastTeam.teamName,
    teamName: activePastTeam.teamName,
    shortCode: activePastTeam.abbreviation,
    abbreviation: activePastTeam.abbreviation,
    manager: user?.user_metadata?.display_name || 'Manager',
    budget: activePastTeam.budget,
    badgeIcon: activePastTeam.badgeIcon,
    badge: activePastTeam.badgeIcon,
    startingSeven: pastTeamPlayers.slice(0, 7).map(p => p.id),
    bench: pastTeamPlayers.slice(7).map(p => p.id),
    formation: '1-2-2-2',
    createdAt: activePastTeam.createdAt
  } : currentTeam;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // If no team exists at all
  if (!displayTeam || !displayTeam.id) {
    return (
      <div className="space-y-6 animate-fadeIn pb-16 max-w-xl mx-auto py-16 text-center">
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-8 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-3xl mx-auto">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-white">No team yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Create or join a game to build your squad. You'll draft players and compete in tactical matches.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('dashboard') : null}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active player list
  const playerSourceList = isViewingPast ? pastTeamPlayers : allPlayers;

  // Starting players
  const startingPlayers = (displayTeam.startingSeven || [])
    .map((id) => playerSourceList.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  // Bench players
  const benchPlayers = (displayTeam.bench || [])
    .map((id) => playerSourceList.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const teamOverall = calculateTeamOverall(startingPlayers);
  const squadSize = startingPlayers.length + benchPlayers.length;
  const selectedPlayer = playerSourceList.find((p) => p.id === selectedPlayerId) || startingPlayers[0];

  const handleBenchOrSwap = (player: Player) => {
    if (isViewingPast) return;
    const isStarter = displayTeam.startingSeven.includes(player.id);
    if (isStarter) {
      if (benchPlayers.length > 0) {
        const firstBench = benchPlayers[0];
        const newStarters = displayTeam.startingSeven.map(id => id === player.id ? firstBench.id : id);
        const newBench = displayTeam.bench.map(id => id === firstBench.id ? player.id : id);
        onUpdateLineup(newStarters, newBench);
      } else {
        alert("No bench players available to swap with!");
      }
    } else {
      const targetStarterId = selectedPlayerId && displayTeam.startingSeven.includes(selectedPlayerId)
        ? selectedPlayerId
        : displayTeam.startingSeven[0];
      const newStarters = displayTeam.startingSeven.map(id => id === targetStarterId ? player.id : id);
      const newBench = displayTeam.bench.map(id => id === player.id ? targetStarterId : id);
      onUpdateLineup(newStarters, newBench);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Session / History Switcher Bar */}
      {pastTeams.length > 1 && (
        <div className="flex items-center justify-between bg-[#0e1720] border border-slate-800 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">View Session Team:</span>
          </div>
          <select
            value={selectedPastTeamId || currentTeam?.id || ''}
            onChange={(e) => setSelectedPastTeamId(e.target.value)}
            className="bg-[#090f14] border border-slate-700 text-xs font-bold text-white py-1.5 px-3 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            {currentTeam && (
              <option value={currentTeam.id}>
                Current Game: {currentTeam.name}
              </option>
            )}
            {pastTeams.filter(pt => pt.teamId !== currentTeam?.id).map((pt, idx) => (
              <option key={pt.teamId} value={pt.teamId}>
                Past Game: {pt.teamName} ({pt.sessionCode || `Session ${idx + 1}`})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Team Top Overview Bar */}
      <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 border border-emerald-300">
              {displayTeam.badgeIcon || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Manager: {displayTeam.manager || 'Manager'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  {displayTeam.shortCode || displayTeam.abbreviation}
                </span>
                {isViewingPast && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    Past Session
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {displayTeam.name}
              </h1>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="bg-[#090f14] px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Team Overall</span>
                <span className="text-xl font-black text-emerald-400 leading-none">{teamOverall || '--'} OVR</span>
              </div>
            </div>

            <div className="bg-[#090f14] px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget</span>
                <span className="text-xl font-black text-white leading-none">{formatCurrency(displayTeam.budget)}</span>
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

          {!isViewingPast && squadSize > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setIsLineupEditorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>EDIT LINEUP</span>
              </button>

              <button
                onClick={() => selectedPlayer && setInspectModalPlayer(selectedPlayer)}
                disabled={!selectedPlayer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>VIEW PLAYER</span>
              </button>

              <button
                onClick={() => selectedPlayer && handleBenchOrSwap(selectedPlayer)}
                disabled={!selectedPlayer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <span>BENCH / SWAP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EMPTY SQUAD STATE (When new game created but auction has not drafted players yet) */}
      {squadSize === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#0e1720] border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto">
            ⚽
          </div>
          <div>
            <h3 className="text-white font-black text-xl">Your Squad is Empty</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
              You haven't drafted any players for {displayTeam.name} yet. Enter the live auction room to bid on world-class footballers and build your starting lineup!
            </p>
          </div>
          {onNavigateTab && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('auction')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 inline-flex items-center gap-2"
              >
                <span>Enter Auction Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* PITCH AND SQUAD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tactical Pitch View */}
          <div className="lg:col-span-8 bg-[#090f14] rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Starting Seven (Active Formation)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any player on pitch to select
              </span>
            </div>

            <PitchView
              startingPlayers={startingPlayers}
              selectedPlayerId={selectedPlayerId}
              onPlayerClick={(p: Player) => setSelectedPlayerId(p.id)}
            />
          </div>

          {/* Player Card & Inspector */}
          <div className="lg:col-span-4 space-y-4">
            {selectedPlayer ? (
              <PlayerCard
                player={selectedPlayer}
                onView={() => setInspectModalPlayer(selectedPlayer)}
                isSelected={displayTeam.startingSeven.includes(selectedPlayer.id)}
                actionLabel="Bench / Swap"
                onSelect={() => handleBenchOrSwap(selectedPlayer)}
              />
            ) : (
              <div className="bg-[#0e1720] border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                Select a player on the pitch to inspect attributes
              </div>
            )}

            {/* Bench Toggle & List */}
            <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Bench Substitutes ({benchPlayers.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowBenchSection(!showBenchSection)}
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  {showBenchSection ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showBenchSection && (
                benchPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No substitutes on bench.</p>
                ) : (
                  <div className="space-y-2">
                    {benchPlayers.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          selectedPlayerId === p.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-[#090f14] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-slate-400 w-6 text-center">{p.position}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.nationality}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-400">{p.overall} OVR</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      )}

      {/* Inspect Modal */}
      {inspectModalPlayer && (
        <PlayerDetailModal
          player={inspectModalPlayer}
          onClose={() => setInspectModalPlayer(null)}
        />
      )}

      {/* Lineup Editor Modal */}
      {isLineupEditorOpen && (
        <LineupEditorModal
          team={displayTeam}
          allPlayers={playerSourceList}
          onSaveLineup={(newStarters: string[], newBench: string[]) => {
            onUpdateLineup(newStarters, newBench);
            setIsLineupEditorOpen(false);
          }}
          onClose={() => setIsLineupEditorOpen(false)}
        />
      )}

    </div>
  );
};

export default MyTeamPage;
