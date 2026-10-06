import React, { useState, useEffect, useMemo } from 'react';
import { Team, Player, ActiveTab } from '../types';
import { PitchView } from '../components/PitchView';
import { getPositionBadgeColor, calculateTeamOverall } from '../utils/formatters';
import { FORMATIONS, getFormationInfo, autoPickBestLineup } from '../utils/formation';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import { sound } from '../utils/audioSynth';
import {
  Shield,
  Users,
  Zap,
  Check,
  AlertCircle,
  ArrowLeftRight,
  Sparkles,
  Trophy,
  Swords,
  Layers,
  ArrowRight,
  Lock,
  RefreshCw
} from 'lucide-react';

interface LineupBuilderPageProps {
  currentTeam: Team | null;
  allPlayers: Player[];
  onUpdateLineup: (startingSeven: string[], bench: string[], formation?: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  isHost: boolean;
}

export const LineupBuilderPage: React.FC<LineupBuilderPageProps> = ({
  currentTeam,
  allPlayers,
  onUpdateLineup,
  setActiveTab,
  isHost: isHostProp
}) => {
  const { user } = useAuth();
  const {
    currentSession,
    lobbyMembers,
    broadcastNavigation,
    sessionPlayers,
    allTeams,
    finalizeAiLineups,
    updateSessionStatus,
  } = useSession();

  const isHost = Boolean(
    isHostProp ||
    currentSession?.gameMode === 'ai' ||
    !currentSession ||
    currentSession?.hostUserId === 'human-user' ||
    currentSession?.hostUserId === user?.id
  );

  const [formation, setFormation] = useState<string>(currentTeam?.formation || '1-2-2-2');
  const [starting, setStarting] = useState<string[]>(currentTeam?.startingSeven || []);
  const [bench, setBench] = useState<string[]>(currentTeam?.bench || []);
  const [selectedToSwap, setSelectedToSwap] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pitch' | 'cards'>('pitch');
  const [isLockedIn, setIsLockedIn] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');
  const [advancingToMatches, setAdvancingToMatches] = useState<boolean>(false);
  const [squadPoolIds, setSquadPoolIds] = useState<string[]>([]);

  // Synchronize squad IDs from squads table to guarantee all acquired players appear
  useEffect(() => {
    if (!currentSession || !currentTeam?.id || currentSession.gameMode === 'ai') {
      const existingIds = Array.from(new Set([
        ...(currentTeam?.startingSeven || []),
        ...(currentTeam?.bench || [])
      ].filter(Boolean)));

      if (existingIds.length > 0) {
        setSquadPoolIds(existingIds);
        if (starting.length < 7) {
          const availablePlayers = existingIds
            .map(id => allPlayers.find(p => p.id === id) || sessionPlayers.find(p => p.id === id))
            .filter((p): p is Player => p !== undefined);

          if (availablePlayers.length >= 7) {
            const optimized = autoPickBestLineup(availablePlayers, formation);
            setStarting(optimized.startingSeven);
            setBench(optimized.bench);
            onUpdateLineup(optimized.startingSeven, optimized.bench, formation);
          } else {
            const newStarters = existingIds.slice(0, 7);
            const newBench = existingIds.slice(7);
            setStarting(newStarters);
            setBench(newBench);
            onUpdateLineup(newStarters, newBench, formation);
          }
        }
      }
      return;
    }

    // In a multiplayer session: ALWAYS query squads table to get all acquired players!
    supabase
      .from('squads')
      .select('player_id')
      .eq('session_id', currentSession.id)
      .eq('team_id', currentTeam.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const ids = data.map((d: any) => d.player_id).filter(Boolean);
          setSquadPoolIds(ids);
          setStarting(prev => {
            if (prev.length === 7 && prev.every(id => ids.includes(id))) return prev;
            return ids.slice(0, 7);
          });
          setBench(prev => {
            if (prev.length > 0 && prev.every(id => ids.includes(id))) return prev;
            return ids.slice(7);
          });
        } else {
          const fallbackIds = [
            ...(currentTeam?.startingSeven || []),
            ...(currentTeam?.bench || [])
          ].filter(Boolean);
          if (fallbackIds.length > 0) {
            setSquadPoolIds(fallbackIds);
            setStarting(fallbackIds.slice(0, 7));
            setBench(fallbackIds.slice(7));
          }
        }
      });
  }, [currentTeam?.id, currentSession?.id]);

  // Combine all player objects available to this team's squad
  const squadPlayers = useMemo(() => {
    const pool = squadPoolIds.length > 0
      ? squadPoolIds
      : [...starting, ...bench];

    const map = new Map<string, Player>();
    allPlayers.forEach(p => map.set(p.id, p));
    sessionPlayers.forEach(p => map.set(p.id, p));

    return pool
      .map(id => map.get(id))
      .filter((p): p is Player => p !== undefined);
  }, [squadPoolIds, starting, bench, allPlayers, sessionPlayers]);

  const getPlayer = (id: string) => {
    return squadPlayers.find(p => p.id === id) || allPlayers.find(p => p.id === id);
  };

  const activeFormationInfo = getFormationInfo(formation);

  const startingPlayerObjects = useMemo(() => {
    return starting
      .map(id => getPlayer(id))
      .filter((p): p is Player => p !== undefined);
  }, [starting, squadPlayers]);

  const teamOvr = useMemo(() => {
    return startingPlayerObjects.length > 0
      ? calculateTeamOverall(startingPlayerObjects)
      : 0;
  }, [startingPlayerObjects]);

  // Tactical department ratings
  const tacticalRatings = useMemo(() => {
    if (startingPlayerObjects.length === 0) return { def: 0, mid: 0, att: 0 };
    const defs = startingPlayerObjects.filter(p => p.position === 'DEF');
    const mids = startingPlayerObjects.filter(p => p.position === 'MID');
    const atts = startingPlayerObjects.filter(p => p.position === 'ATT');

    const avg = (arr: Player[], fallback: number) =>
      arr.length > 0
        ? Math.round(arr.reduce((s, p) => s + p.overall, 0) / arr.length)
        : fallback;

    return {
      def: avg(defs, teamOvr),
      mid: avg(mids, teamOvr),
      att: avg(atts, teamOvr),
    };
  }, [startingPlayerObjects, teamOvr]);

  // Auto-optimize starting 7 according to chosen formation
  const handleAutoOptimize = () => {
    sound.playPowerUp();
    if (squadPlayers.length === 0) return;
    const result = autoPickBestLineup(squadPlayers, formation);
    setStarting(result.startingSeven);
    setBench(result.bench);
    setSelectedToSwap(null);
    setSaveSuccessNotice('⚡ Lineup auto-optimized for best chemistry!');
    setTimeout(() => setSaveSuccessNotice(''), 3000);
  };

  // Swap handler (tap or click)
  const handleSwap = (playerId: string) => {
    sound.playClick();

    if (!selectedToSwap) {
      setSelectedToSwap(playerId);
      return;
    }

    if (selectedToSwap === playerId) {
      setSelectedToSwap(null);
      return;
    }

    const isFirstInStarting = starting.includes(selectedToSwap);
    const isSecondInStarting = starting.includes(playerId);

    if (isFirstInStarting && !isSecondInStarting) {
      setStarting(prev => prev.map(id => (id === selectedToSwap ? playerId : id)));
      setBench(prev => prev.map(id => (id === playerId ? selectedToSwap : id)));
      setSelectedToSwap(null);
    } else if (!isFirstInStarting && isSecondInStarting) {
      setStarting(prev => prev.map(id => (id === playerId ? selectedToSwap : id)));
      setBench(prev => prev.map(id => (id === selectedToSwap ? playerId : id)));
      setSelectedToSwap(null);
    } else if (isFirstInStarting && isSecondInStarting) {
      const firstIdx = starting.indexOf(selectedToSwap);
      const secondIdx = starting.indexOf(playerId);
      const newStarters = [...starting];
      newStarters[firstIdx] = playerId;
      newStarters[secondIdx] = selectedToSwap;
      setStarting(newStarters);
      setSelectedToSwap(null);
    } else {
      setSelectedToSwap(playerId);
    }
  };

  // Drag and drop handlers
  const handleDropOnPlayer = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    sound.playClick();

    const isDraggedInStarting = starting.includes(draggedId);
    const isTargetInStarting = starting.includes(targetId);

    if (isDraggedInStarting && !isTargetInStarting) {
      setStarting(prev => prev.map(id => (id === draggedId ? targetId : id)));
      setBench(prev => prev.map(id => (id === targetId ? draggedId : id)));
    } else if (!isDraggedInStarting && isTargetInStarting) {
      setStarting(prev => prev.map(id => (id === targetId ? draggedId : id)));
      setBench(prev => prev.map(id => (id === draggedId ? targetId : id)));
    } else if (isDraggedInStarting && isTargetInStarting) {
      const firstIdx = starting.indexOf(draggedId);
      const secondIdx = starting.indexOf(targetId);
      const newStarters = [...starting];
      newStarters[firstIdx] = targetId;
      newStarters[secondIdx] = draggedId;
      setStarting(newStarters);
    }
  };

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    if (starting.includes(draggedId) && starting.length > 1) {
      setStarting(prev => prev.filter(id => id !== draggedId));
      if (!bench.includes(draggedId)) {
        setBench(prev => [...prev, draggedId]);
      }
      sound.playClick();
    }
  };

  // Confirm & Lock In Lineup
  const handleLockInLineup = async () => {
    sound.playVictorySound();
    let finalStarting = [...starting];
    let finalBench = [...bench];
    if (finalStarting.length < 7 && squadPlayers.length >= 7) {
      const optimized = autoPickBestLineup(squadPlayers, formation);
      finalStarting = optimized.startingSeven;
      finalBench = optimized.bench;
      setStarting(finalStarting);
      setBench(finalBench);
    }
    onUpdateLineup(finalStarting, finalBench, formation);
    setIsLockedIn(true);
    setSaveSuccessNotice('✓ Playing 7 locked in! Ready for matchday.');

    if (currentSession && user && currentSession.gameMode !== 'ai') {
      try {
        await supabase
          .from('session_players')
          .update({ is_ready: true })
          .eq('session_id', currentSession.id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error marking player ready:', err);
      }
    }

    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  // Return to auction if clicked by mistake or more players are needed
  const handleReturnToAuction = async () => {
    sound.playClick();
    if (currentSession && isHost && currentSession.gameMode !== 'ai') {
      await supabase
        .from('game_sessions')
        .update({ status: 'AUCTION' })
        .eq('id', currentSession.id);
      await broadcastNavigation('auction');
    }
    setActiveTab('auction');
  };

  // Host launches the match arena
  const handleHostLaunchMatches = async () => {
    if (!currentSession || !isHost) return;
    setAdvancingToMatches(true);
    sound.playPowerUp();

    // Ensure we have a valid 7 starters if the pool has enough players
    let finalStarting = [...starting];
    let finalBench = [...bench];
    if (finalStarting.length < 7 && squadPlayers.length >= 7) {
      const optimized = autoPickBestLineup(squadPlayers, formation);
      finalStarting = optimized.startingSeven;
      finalBench = optimized.bench;
      setStarting(finalStarting);
      setBench(finalBench);
    }

    if (currentSession.gameMode === 'ai') {
      if (typeof finalizeAiLineups === 'function') {
        finalizeAiLineups();
      }
      onUpdateLineup(finalStarting, finalBench, formation);
      if (typeof updateSessionStatus === 'function') {
        await updateSessionStatus('MATCHES');
      }
      setAdvancingToMatches(false);
      setActiveTab('league');
      return;
    }

    // Check that all teams have minimum 7 players before allowing simulation
    const { data: squadRows } = await supabase
      .from('squads')
      .select('team_id')
      .eq('session_id', currentSession.id);

    const counts: Record<string, number> = {};
    (squadRows || []).forEach((r: any) => {
      counts[r.team_id] = (counts[r.team_id] || 0) + 1;
    });

    const incomplete = (allTeams || []).filter(t => (counts[t.id] || 0) < 7);
    if (incomplete.length > 0) {
      const summary = incomplete
        .map(t => `${t.name || t.teamName || 'Team'}: ${counts[t.id] || 0}/7`)
        .join(', ');
      alert(`Simulation Locked: Every team must have at least 7 players before matches can be launched! (Deficit: ${summary}). Returning to auction...`);
      setAdvancingToMatches(false);
      handleReturnToAuction();
      return;
    }

    // Ensure host lineup is saved
    onUpdateLineup(starting, bench, formation);

    try {
      await supabase
        .from('game_sessions')
        .update({ status: 'MATCHES' })
        .eq('id', currentSession.id);

      await broadcastNavigation('matches');
      setActiveTab('matches');
    } catch (err) {
      console.error('Error advancing to matches:', err);
      setAdvancingToMatches(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* ===== HERO BANNER: STAGE INFORMATION & ROOM CODE ===== */}
      <div className="bg-gradient-to-r from-[#0E1324] via-[#10182E] to-[#0E1324] border border-[#FF1744]/30 rounded-3xl p-5 sm:p-6 shadow-glow-cyan">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                STAGE 2: TACTICAL ROSTER SETUP
              </span>
              {currentSession && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ROOM: {currentSession.sessionCode}
                </span>
              )}
              {isLockedIn && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  LINEUP LOCKED IN
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
              SELECT YOUR PLAYING 7
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              From your 10 acquired superstars, select your best 7 starters and 3 bench reserves.
              Configure your tactical formation, drag & drop or tap to swap, and lock in your roster.
            </p>
          </div>

          {/* Quick Squad Metrics */}
          <div className="flex items-center gap-3 bg-[#0A0D1A] border border-slate-800 rounded-2xl p-3 sm:p-4">
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">STARTERS</p>
              <p className="text-xl font-black text-[#FF1744] font-mono">{starting.length}/7</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">BENCH</p>
              <p className="text-xl font-black text-amber-400 font-mono">{bench.length}/3</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">TEAM OVR</p>
              <p className="text-xl font-black text-emerald-400 font-mono">{teamOvr}</p>
            </div>
          </div>
        </div>

        {/* Tactical Rating Breakdown Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="bg-[#080B14] p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400">FORMATION</span>
            <p className="text-xs font-black text-white font-mono">{formation}</p>
          </div>
          <div className="bg-[#080B14] p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] uppercase font-bold text-blue-400">DEFENSE</span>
            <p className="text-xs font-black text-blue-300 font-mono">{tacticalRatings.def}</p>
          </div>
          <div className="bg-[#080B14] p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] uppercase font-bold text-emerald-400">MIDFIELD</span>
            <p className="text-xs font-black text-emerald-300 font-mono">{tacticalRatings.mid}</p>
          </div>
          <div className="bg-[#080B14] p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] uppercase font-bold text-rose-400">ATTACK</span>
            <p className="text-xs font-black text-rose-300 font-mono">{tacticalRatings.att}</p>
          </div>
          <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
            <button
              onClick={handleAutoOptimize}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase rounded-xl transition shadow-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>AUTO-OPTIMIZE</span>
            </button>
            <button
              onClick={() => setViewMode(prev => prev === 'pitch' ? 'cards' : 'pitch')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded-xl transition"
            >
              {viewMode === 'pitch' ? '📋 CARDS' : '🏟️ PITCH'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== FORMATION SELECTOR BAR ===== */}
      <div className="bg-[#0E1324] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF1744]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              CHOOSE TACTICAL SHAPE & FORMATION
            </h2>
          </div>
          <span className="text-xs text-[#FF1744] font-medium">
            {activeFormationInfo.label} — <span className="text-slate-400">{activeFormationInfo.description}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {FORMATIONS.map(f => {
            const isSelected = formation === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  sound.playClick();
                  setFormation(f.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#FF1744]/15 border-[#FF1744] shadow-glow-cyan ring-1 ring-[#FF1744]'
                    : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700 hover:bg-[#10182D]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-black font-mono ${isSelected ? 'text-[#FF1744]' : 'text-white'}`}>
                    {f.id}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#FF1744]" />}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{f.name}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  1 GK • {f.defCount} DEF • {f.midCount} MID • {f.attCount} ATT
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== SWAP BANNER / INSTRUCTIONS ===== */}
      {selectedToSwap ? (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl px-5 py-3 flex items-center justify-between text-xs text-emerald-300 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>
              Selected: <strong className="text-white font-bold">{getPlayer(selectedToSwap)?.name}</strong>.
              Now tap another player or bench reserve to swap positions!
            </span>
          </div>
          <button
            onClick={() => setSelectedToSwap(null)}
            className="text-xs font-bold text-slate-400 hover:text-white underline ml-3"
          >
            Cancel Selection
          </button>
        </div>
      ) : (
        <div className="bg-[#0E1324] border border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#FF1744]" />
          <span>Tap any starter to swap with another player or bench reserve, or drag & drop directly on the pitch.</span>
        </div>
      )}

      {saveSuccessNotice && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* ===== MAIN PLAYING 7 INTERACTIVE PITCH & BENCH DOCK ===== */}
      {viewMode === 'pitch' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tactical Pitch (7 Starting Slots) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF1744]" />
                TACTICAL PITCH ({starting.length}/7 STARTERS)
              </h3>
              <span className="text-[10px] font-mono text-[#FF1744]">FORMATION: {formation}</span>
            </div>

            <PitchView
              startingPlayers={startingPlayerObjects}
              formation={formation}
              selectedPlayerId={selectedToSwap}
              onPlayerClick={(player) => handleSwap(player.id)}
              onSwap={handleDropOnPlayer}
              interactive={true}
            />
          </div>

          {/* Right Column: Bench Dock & Starting List */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Bench Substitutes Dock */}
            <div
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={handleDropOnBench}
              className="bg-[#0E1324] rounded-3xl border border-amber-500/30 p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  BENCH RESERVES ({bench.length}/3)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">TAP TO SWAP</span>
              </div>

              {bench.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic bg-[#0A0D1A] rounded-2xl border border-dashed border-slate-800">
                  No players currently on bench. Your starting 7 occupies all slots!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bench.map(id => {
                    const p = getPlayer(id);
                    if (!p) return null;
                    const badge = getPositionBadgeColor(p.position);
                    const isSelected = selectedToSwap === id;

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                        onClick={() => handleSwap(p.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]'
                            : 'bg-[#0A0D1A] border-slate-800 hover:border-amber-400/50 hover:bg-[#12182D]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {p.position}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-black text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">#{p.number ?? '10'} • Form: {p.form}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-xs font-black text-slate-200 bg-slate-800 px-2 py-0.5 rounded font-mono">
                            {p.overall} OVR
                          </span>
                          <ArrowLeftRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Starting Roster Quick View */}
            <div className="bg-[#0E1324] rounded-3xl border border-[#FF1744]/25 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#FF1744] flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#FF1744]" />
                  STARTING ROSTER ({starting.length}/7)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">{formation}</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {starting.map(id => {
                  const p = getPlayer(id);
                  if (!p) return null;
                  const badge = getPositionBadgeColor(p.position);
                  const isSelected = selectedToSwap === id;

                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                      onClick={() => handleSwap(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md scale-[1.01]'
                          : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {p.position}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#FF1744]">{p.overall} OVR</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Alternative Cards View */
        <div className="space-y-6">
          <div className="bg-[#0E1324] border border-[#FF1744]/30 rounded-3xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#FF1744] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              STARTING 7 PLAYERS ({starting.length}/7)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {starting.map(id => {
                const p = getPlayer(id);
                if (!p) return null;
                const badge = getPositionBadgeColor(p.position);
                const isSelected = selectedToSwap === id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwap(p.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                        : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {p.position}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">#{p.number ?? '10'} • Form: {p.form}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF1744] font-mono">{p.overall} OVR</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0E1324] border border-amber-500/30 rounded-3xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              BENCH RESERVES ({bench.length}/3)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {bench.map(id => {
                const p = getPlayer(id);
                if (!p) return null;
                const badge = getPositionBadgeColor(p.position);
                const isSelected = selectedToSwap === id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwap(p.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                        : 'bg-[#0A0D1A] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {p.position}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{p.name}</p>
                        <p className="text-[10px] text-slate-400">#{p.number ?? '10'} • Form: {p.form}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-300 font-mono">{p.overall} OVR</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM ACTION PANEL & MULTIPLAYER READY SYNC ===== */}
      <div className="bg-[#0E1324] border border-[#FF1744]/30 rounded-3xl p-5 sm:p-6 shadow-glow-cyan flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Lock-in Summary */}
        <div className="space-y-1 text-center md:text-left">
          <p className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 justify-center md:justify-start">
            <Lock className="w-3.5 h-3.5 text-[#FF1744]" />
            CONFIRMATION & MATCH LAUNCH
          </p>
          <p className="text-xs text-slate-400">
            {isLockedIn
              ? '✓ Lineup locked in! Ready to face league competitors.'
              : 'Lock in your 7 starters. You can readjust formations before matches start.'}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          
          <button
            onClick={handleLockInLineup}
            className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-md ${
              isLockedIn
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                : 'bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 shadow-glow-cyan'
            }`}
          >
            {isLockedIn ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>LINEUP LOCKED IN ✓</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>CONFIRM & LOCK IN PLAYING 7</span>
              </>
            )}
          </button>

          {/* Host Launch Match Arena Button */}
          {isHost ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleReturnToAuction}
                className="px-5 py-3.5 bg-[#0A0D1A] hover:bg-slate-800 border border-[#FF1744]/40 text-[#FF1744] text-xs font-bold uppercase tracking-wider rounded-2xl transition flex items-center gap-2 active:scale-95"
              >
                <span>🔙 RETURN TO LIVE AUCTION</span>
              </button>
              <button
                onClick={handleHostLaunchMatches}
                disabled={advancingToMatches}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Swords className="w-4 h-4" />
                <span>{advancingToMatches ? 'LAUNCHING ARENA...' : '⚔️ LAUNCH MATCH ARENA →'}</span>
              </button>
            </div>
          ) : (
            currentSession && (
              <div className="px-4 py-3 bg-[#0A0D1A] border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#FF1744] animate-spin" />
                <span>Waiting for Host to launch fixtures...</span>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
};
