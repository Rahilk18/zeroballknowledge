import React, { useState } from 'react';
import { Player, Team, PlayerPosition } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { FORMATIONS, getFormationInfo, autoPickBestLineup } from '../utils/formation';
import { PitchView } from './PitchView';
import { sound } from '../utils/audioSynth';
import { 
  X, 
  ArrowLeftRight, 
  Check, 
  AlertCircle, 
  Shield, 
  Sparkles, 
  Zap, 
  MoveHorizontal 
} from 'lucide-react';

interface LineupEditorModalProps {
  team: Team;
  allPlayers: Player[];
  onClose: () => void;
  onSaveLineup: (newStartingSeven: string[], newBench: string[], formation: string) => void;
}

export const LineupEditorModal: React.FC<LineupEditorModalProps> = ({
  team,
  allPlayers,
  onClose,
  onSaveLineup,
}) => {
  const [formation, setFormation] = useState<string>(team.formation || '1-2-2-2');
  const [starting, setStarting] = useState<string[]>([...team.startingSeven]);
  const [bench, setBench] = useState<string[]>([...team.bench]);
  const [selectedToSwap, setSelectedToSwap] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pitch' | 'cards'>('pitch');

  const getPlayer = (id: string) => allPlayers.find(p => p.id === id);

  const activeFormationInfo = getFormationInfo(formation);

  // Auto pick best 7 players
  const handleAutoOptimize = () => {
    sound.playPowerUp();
    const result = autoPickBestLineup(allPlayers, formation);
    setStarting(result.startingSeven);
    setBench(result.bench);
    setSelectedToSwap(null);
  };

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
      // First is starter, second is bench -> swap
      setStarting(prev => prev.map(id => (id === selectedToSwap ? playerId : id)));
      setBench(prev => prev.map(id => (id === playerId ? selectedToSwap : id)));
      setSelectedToSwap(null);
    } else if (!isFirstInStarting && isSecondInStarting) {
      // First is bench, second is starter -> swap
      setStarting(prev => prev.map(id => (id === playerId ? selectedToSwap : id)));
      setBench(prev => prev.map(id => (id === selectedToSwap ? playerId : id)));
      setSelectedToSwap(null);
    } else if (isFirstInStarting && isSecondInStarting) {
      // Both in starting: swap their slot positions
      const firstIdx = starting.indexOf(selectedToSwap);
      const secondIdx = starting.indexOf(playerId);
      const newStarters = [...starting];
      newStarters[firstIdx] = playerId;
      newStarters[secondIdx] = selectedToSwap;
      setStarting(newStarters);
      setSelectedToSwap(null);
    } else {
      // Both in bench: select new player
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
      // Move from starting to bench
      setStarting(prev => prev.filter(id => id !== draggedId));
      if (!bench.includes(draggedId)) {
        setBench(prev => [...prev, draggedId]);
      }
      sound.playClick();
    }
  };

  const handleSave = () => {
    sound.playClick();
    onSaveLineup(starting, bench, formation);
    onClose();
  };

  const startingPlayerObjects = starting
    .map(id => getPlayer(id))
    .filter((p): p is Player => p !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#0d151d] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-900 via-[#0e1a24] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 shadow-glow-cyan">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-display">
                TACTICAL LINEUP & FORMATIONS
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose your best 7 starters, tactical shape, and bench substitutes
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formation Selection Pill Bar */}
        <div className="px-3.5 py-2 bg-[#0A0D1A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">
              FORMATION:
            </span>
            {FORMATIONS.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  sound.playClick();
                  setFormation(f.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                  formation === f.id
                    ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan font-black scale-105'
                    : 'bg-[#12182D] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {f.id}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoOptimize}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95"
            >
              <Zap className="w-3 h-3 fill-slate-950" />
              <span>AUTO-OPTIMIZE</span>
            </button>

            <button
              onClick={() => setViewMode(prev => prev === 'pitch' ? 'cards' : 'pitch')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase transition"
            >
              {viewMode === 'pitch' ? '📋 CARDS' : '🏟️ PITCH'}
            </button>
          </div>
        </div>

        {/* Tactical Explanation */}
        <div className="px-3.5 py-1 bg-rose-950/20 border-b border-rose-500/20 flex items-center justify-between text-[11px] text-slate-300">
          <span className="text-rose-400 font-bold">{activeFormationInfo.label}:</span>
          <span className="text-slate-400 truncate ml-2">{activeFormationInfo.description}</span>
        </div>

        {/* Swap instruction banner */}
        {selectedToSwap ? (
          <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Selected: <strong className="text-white font-bold">{getPlayer(selectedToSwap)?.name}</strong>. Now tap another player to swap positions!
            </span>
            <button
              onClick={() => setSelectedToSwap(null)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline ml-2"
            >
              Cancel Selection
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-1 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-[#FF1744]" />
            <span>Drag & drop or tap a starter and bench player to swap positions.</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          
          {viewMode === 'pitch' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Left Column: Interactive Pitch */}
              <div className="lg:col-span-7">
                <PitchView
                  startingPlayers={startingPlayerObjects}
                  formation={formation}
                  selectedPlayerId={selectedToSwap}
                  onPlayerClick={(player) => handleSwap(player.id)}
                  onSwap={handleDropOnPlayer}
                  interactive={true}
                />
              </div>

              {/* Right Column: Bench Substitutes & Starters Roster */}
              <div className="lg:col-span-5 space-y-3">
                {/* Bench Substitutes */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={handleDropOnBench}
                  className="bg-[#0A0D1A] rounded-2xl border border-slate-800 p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      BENCH SUBSTITUTES ({bench.length})
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">DROP HERE TO BENCH</span>
                  </div>

                  {bench.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs italic bg-[#0d1420] rounded-xl border border-dashed border-slate-800">
                      No players on bench. Draft up to 10 players to build reserve depth!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]'
                                : 'bg-[#101826] border-slate-800 hover:border-[#FF1744]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
                                {p.overall}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                                {p.position}
                              </span>
                              <div className="truncate">
                                <p className="text-xs font-black text-white truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">#{p.number} • Form: {p.form}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
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

                {/* Starting 7 Roster List */}
                <div className="bg-[#0A0D1A] rounded-2xl border border-[#FF1744]/30 p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#FF1744] flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#FF1744]" />
                      STARTING 7 ({starting.length}/7)
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">{formation}</span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
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
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]'
                              : 'bg-[#101826] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black font-mono bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
                              {p.overall}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                              {p.position}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{p.shortName}</span>
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
            /* Cards View */
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#FF1744] mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  STARTING 7 PLAYERS ({starting.length}/7)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {starting.map(id => {
                    const p = getPlayer(id);
                    if (!p) return null;
                    const badge = getPositionBadgeColor(p.position);
                    const isSelected = selectedToSwap === id;

                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSwap(p.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                            : 'bg-[#111c26] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
                            {p.overall}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                            {p.position}
                          </span>
                          <div>
                            <p className="text-xs font-black text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-400">#{p.number} • Form: {p.form}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-400 font-mono">{p.overall} OVR</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  BENCH SUBSTITUTES ({bench.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {bench.map(id => {
                    const p = getPlayer(id);
                    if (!p) return null;
                    const badge = getPositionBadgeColor(p.position);
                    const isSelected = selectedToSwap === id;

                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSwap(p.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                            : 'bg-[#0f1720] border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
                            {p.overall}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                            {p.position}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{p.name}</p>
                            <p className="text-[10px] text-slate-400">#{p.number} • Form: {p.form}</p>
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

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Lineup: <strong className="text-white">{starting.length}</strong> Starters • <strong className="text-white">{bench.length}</strong> Bench • Formation <strong className="text-[#FF1744]">{formation}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-glow-cyan active:scale-95"
            >
              CONFIRM LINEUP & TACTICS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
