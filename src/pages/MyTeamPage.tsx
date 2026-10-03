import React, { useState, useEffect } from 'react';
import { Team, Player, ActiveTab } from '../types';
import { PitchView } from '../components/PitchView';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { LineupEditorModal } from '../components/LineupEditorModal';
import { formatCurrency, calculateTeamOverall } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserTeams, fetchTeamSquad, UserPastTeamItem } from '../services/userService';
import { FOOTBALL_GEARS, FootballGear } from '../data/gearData';
import { sound } from '../utils/audioSynth';
import { 
  Shield, 
  Users, 
  Coins, 
  SlidersHorizontal, 
  Eye, 
  ArrowLeftRight, 
  Sparkles, 
  Zap, 
  Clock, 
  ArrowRight,
  Flame,
  Glasses
} from 'lucide-react';
import { FORMATIONS, getFormationInfo, autoPickBestLineup } from '../utils/formation';

interface MyTeamPageProps {
  currentTeam: Team | null;
  allPlayers: Player[];
  onUpdateLineup: (startingSeven: string[], bench: string[], formation?: string) => void;
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
  const [equippedGear, setEquippedGear] = useState<FootballGear>(FOOTBALL_GEARS[0]);

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

  if (!displayTeam || !displayTeam.id) {
    return (
      <div className="space-y-6 animate-fadeIn pb-16 max-w-xl mx-auto py-16 text-center">
        <div className="bg-[#0E1324] rounded-3xl border border-[#00E5FF]/30 p-8 shadow-glow-cyan space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-3xl mx-auto shadow-glow-cyan">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
            NO ROSTER CREATED YET
          </h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Host or join an arena room to draft your football superstars and command them in tactical league battles.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('dashboard') : null}
              className="px-6 py-3 bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
            >
              Return to Battle Hub →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const playerSourceList = isViewingPast ? pastTeamPlayers : allPlayers;

  const startingPlayers = (displayTeam.startingSeven || [])
    .map((id) => playerSourceList.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const benchPlayers = (displayTeam.bench || [])
    .map((id) => playerSourceList.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const teamOverall = calculateTeamOverall(startingPlayers);
  const squadSize = startingPlayers.length + benchPlayers.length;
  const selectedPlayer = playerSourceList.find((p) => p.id === selectedPlayerId) || startingPlayers[0];

  const handleBenchOrSwap = (player: Player) => {
    if (isViewingPast) return;
    sound.playClick();
    const isStarter = displayTeam.startingSeven.includes(player.id);
    if (isStarter) {
      if (benchPlayers.length > 0) {
        const firstBench = benchPlayers[0];
        const newStarters = displayTeam.startingSeven.map(id => id === player.id ? firstBench.id : id);
        const newBench = displayTeam.bench.map(id => id === firstBench.id ? player.id : id);
        onUpdateLineup(newStarters, newBench, displayTeam.formation);
      } else {
        alert("No bench substitutes available to swap!");
      }
    } else {
      const targetStarterId = selectedPlayerId && displayTeam.startingSeven.includes(selectedPlayerId)
        ? selectedPlayerId
        : displayTeam.startingSeven[0];
      const newStarters = displayTeam.startingSeven.map(id => id === targetStarterId ? player.id : id);
      const newBench = displayTeam.bench.map(id => id === player.id ? targetStarterId : id);
      onUpdateLineup(newStarters, newBench, displayTeam.formation);
    }
  };

  const handleDirectSwap = (playerAId: string, playerBId: string) => {
    if (isViewingPast || playerAId === playerBId) return;
    sound.playClick();
    const isAInStarters = displayTeam.startingSeven.includes(playerAId);
    const isBInStarters = displayTeam.startingSeven.includes(playerBId);

    if (isAInStarters && !isBInStarters) {
      const newStarters = displayTeam.startingSeven.map(id => id === playerAId ? playerBId : id);
      const newBench = displayTeam.bench.map(id => id === playerBId ? playerAId : id);
      onUpdateLineup(newStarters, newBench, displayTeam.formation);
    } else if (!isAInStarters && isBInStarters) {
      const newStarters = displayTeam.startingSeven.map(id => id === playerBId ? playerAId : id);
      const newBench = displayTeam.bench.map(id => id === playerAId ? playerBId : id);
      onUpdateLineup(newStarters, newBench, displayTeam.formation);
    } else if (isAInStarters && isBInStarters) {
      const idxA = displayTeam.startingSeven.indexOf(playerAId);
      const idxB = displayTeam.startingSeven.indexOf(playerBId);
      const newStarters = [...displayTeam.startingSeven];
      newStarters[idxA] = playerBId;
      newStarters[idxB] = playerAId;
      onUpdateLineup(newStarters, displayTeam.bench, displayTeam.formation);
    }
  };

  const handleChangeFormation = (newFmt: string) => {
    if (isViewingPast) return;
    sound.playClick();
    onUpdateLineup(displayTeam.startingSeven, displayTeam.bench, newFmt);
  };

  const handleAutoOptimize = () => {
    if (isViewingPast) return;
    sound.playPowerUp();
    const result = autoPickBestLineup(playerSourceList, displayTeam.formation || '1-2-2-2');
    onUpdateLineup(result.startingSeven, result.bench, displayTeam.formation);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      
      {/* Session Switcher if multiple past games exist */}
      {pastTeams.length > 1 && (
        <div className="flex items-center justify-between bg-[#0E1324] border border-[#00E5FF]/20 rounded-2xl px-5 py-3 shadow-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold text-slate-300">SWITCH SQUAD SESSION:</span>
          </div>
          <select
            value={selectedPastTeamId || currentTeam?.id || ''}
            onChange={(e) => setSelectedPastTeamId(e.target.value)}
            className="bg-[#0A0A14] border border-slate-700 text-xs font-bold text-white py-1.5 px-3 rounded-xl focus:outline-none focus:border-[#00E5FF]"
          >
            {currentTeam && (
              <option value={currentTeam.id}>
                Current Room: {currentTeam.name}
              </option>
            )}
            {pastTeams.filter(pt => pt.teamId !== currentTeam?.id).map((pt, idx) => (
              <option key={pt.teamId} value={pt.teamId}>
                Past Session: {pt.teamName} ({pt.sessionCode || `Session ${idx + 1}`})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* HeroBid Cyber Squad Overview Bar */}
      <div className="bg-[#0E1324] rounded-3xl border border-[#00E5FF]/30 p-6 shadow-glow-cyan relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-blue-600 flex items-center justify-center text-3xl sm:text-4xl shadow-glow-cyan border border-[#00E5FF]/60 flex-shrink-0">
              {displayTeam.badgeIcon || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 tracking-wider">
                  TACTICAL ROSTER
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  [{displayTeam.shortCode || displayTeam.abbreviation}]
                </span>
                {isViewingPast && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    PAST ARCHIVE
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                {displayTeam.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Head Coach: <strong className="text-white">{displayTeam.manager || 'Manager'}</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="bg-[#0A0A14] px-4 py-2.5 rounded-2xl border border-[#00E5FF]/30 flex items-center gap-3 shadow-glow-cyan">
              <Shield className="w-5 h-5 text-[#00E5FF]" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">TEAM OVR</span>
                <span className="text-2xl font-black text-[#00E5FF] leading-none font-display text-glow-cyan">{teamOverall || '--'}</span>
              </div>
            </div>

            <div className="bg-[#0A0A14] px-4 py-2.5 rounded-2xl border border-amber-500/30 flex items-center gap-3">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">RESERVE BUDGET</span>
                <span className="text-xl font-black text-white leading-none font-mono">{formatCurrency(displayTeam.budget)}</span>
              </div>
            </div>

            <div className="bg-[#0A0A14] px-4 py-2.5 rounded-2xl border border-purple-500/30 flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">SQUAD SIZE</span>
                <span className="text-xl font-black text-purple-300 leading-none font-mono">{squadSize} Players</span>
              </div>
            </div>
          </div>
        </div>

        {/* HeroBid Equipped Gear Slot Bar */}
        <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 p-2 bg-[#0A0A14] border border-[#00E5FF]/25 rounded-2xl">
              <span className="text-xl">{equippedGear.icon}</span>
              <div>
                <span className="text-[9px] text-[#00E5FF] font-black uppercase tracking-wider block">EQUIPPED PERK</span>
                <span className="text-xs font-bold text-white">{equippedGear.name}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">
                +{equippedGear.statBoost.amount} {equippedGear.statBoost.stat.slice(0, 3).toUpperCase()}
              </span>
            </div>

            {/* Gear Selector */}
            <select
              value={equippedGear.id}
              onChange={(e) => {
                sound.playClick();
                const found = FOOTBALL_GEARS.find(g => g.id === e.target.value);
                if (found) setEquippedGear(found);
              }}
              className="bg-[#0A0A14] border border-slate-700 text-xs font-bold text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-[#00E5FF]"
            >
              {FOOTBALL_GEARS.map(g => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.name} (+{g.statBoost.amount} {g.statBoost.stat})
                </option>
              ))}
            </select>
          </div>

          {!isViewingPast && squadSize > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigateTab ? onNavigateTab('lineup') : setIsLineupEditorOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-glow-cyan active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>CHOOSE PLAYING 7</span>
              </button>

              <button
                onClick={() => selectedPlayer && setInspectModalPlayer(selectedPlayer)}
                disabled={!selectedPlayer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0A14] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <Glasses className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>3D STAGE 🥽</span>
              </button>

              <button
                onClick={() => selectedPlayer && handleBenchOrSwap(selectedPlayer)}
                disabled={!selectedPlayer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0A14] hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>BENCH / SWAP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EMPTY SQUAD STATE */}
      {squadSize === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#0E1324] border border-[#00E5FF]/20 space-y-4 shadow-glow-cyan">
          <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-3xl mx-auto shadow-glow-cyan">
            ⚽
          </div>
          <div>
            <h3 className="text-white font-black text-xl uppercase tracking-wider font-display text-glow-cyan">
              ROSTER UNPOPULATED
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
              Draft your superstars in the live 3D Bidding Arena to fill your starting 7 lineup!
            </p>
          </div>
          {onNavigateTab && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('auction')}
                className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan inline-flex items-center gap-2"
              >
                <span>ENTER 3D AUCTION ARENA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* PITCH AND SQUAD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tactical Pitch View */}
          <div className="lg:col-span-8 bg-[#0E1324] rounded-3xl border border-[#00E5FF]/20 p-4 sm:p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-white font-display text-glow-cyan">
                  STARTING SEVEN TACTICAL RADAR
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Drag & drop or tap to swap
              </span>
            </div>

            {/* Tactical Formation Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 p-3 bg-[#0A0D1A] rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">
                  TACTIC:
                </span>
                {FORMATIONS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleChangeFormation(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                      (displayTeam.formation || '1-2-2-2') === f.id
                        ? 'bg-[#00E5FF] text-slate-950 font-black shadow-glow-cyan scale-105'
                        : 'bg-[#12182D] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f.id}
                  </button>
                ))}
              </div>

              {!isViewingPast && (
                <button
                  onClick={handleAutoOptimize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>AUTO-OPTIMIZE</span>
                </button>
              )}
            </div>

            <PitchView
              startingPlayers={startingPlayers}
              formation={displayTeam.formation || '1-2-2-2'}
              selectedPlayerId={selectedPlayerId}
              onPlayerClick={(p: Player) => {
                if (selectedPlayerId && selectedPlayerId !== p.id) {
                  handleDirectSwap(selectedPlayerId, p.id);
                  setSelectedPlayerId(null);
                } else {
                  setSelectedPlayerId(p.id);
                }
              }}
              onSwap={handleDirectSwap}
              interactive={!isViewingPast}
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
              <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
                Select a footballer on the pitch to inspect
              </div>
            )}

            {/* Bench Substitutes */}
            <div className="bg-[#0E1324] border border-[#00E5FF]/20 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white font-display">
                    BENCH RESERVES ({benchPlayers.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowBenchSection(!showBenchSection)}
                  className="text-xs text-[#00E5FF] font-bold uppercase tracking-wider hover:underline"
                >
                  {showBenchSection ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showBenchSection && (
                benchPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No substitutes on bench.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {benchPlayers.map(p => (
                      <div
                        key={p.id}
                        draggable={!isViewingPast}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                        onClick={() => {
                          if (selectedPlayerId) {
                            handleDirectSwap(selectedPlayerId, p.id);
                            setSelectedPlayerId(null);
                          } else {
                            setSelectedPlayerId(p.id);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          selectedPlayerId === p.id ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-glow-cyan' : 'bg-[#0A0A14] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-slate-400 w-6 text-center">{p.position}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.nationality}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-[#00E5FF]">{p.overall} OVR</span>
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
          onSaveLineup={(newStarters: string[], newBench: string[], newFormation: string) => {
            onUpdateLineup(newStarters, newBench, newFormation);
            setIsLineupEditorOpen(false);
          }}
          onClose={() => setIsLineupEditorOpen(false)}
        />
      )}

    </div>
  );
};

export default MyTeamPage;
