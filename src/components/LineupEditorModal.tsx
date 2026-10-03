import React, { useState } from 'react';
import { Player, Team } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { X, ArrowLeftRight, Check, AlertCircle, Shield } from 'lucide-react';

interface LineupEditorModalProps {
  team: Team;
  allPlayers: Player[];
  onClose: () => void;
  onSaveLineup: (newStartingSeven: string[], newBench: string[]) => void;
}

export const LineupEditorModal: React.FC<LineupEditorModalProps> = ({
  team,
  allPlayers,
  onClose,
  onSaveLineup
}) => {
  const [starting, setStarting] = useState<string[]>([...team.startingSeven]);
  const [bench, setBench] = useState<string[]>([...team.bench]);
  const [selectedToSwap, setSelectedToSwap] = useState<string | null>(null);

  const getPlayer = (id: string) => allPlayers.find(p => p.id === id);

  const handleSwap = (playerId: string) => {
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
    } else {
      // Both in starting or both on bench: just change selection
      setSelectedToSwap(playerId);
    }
  };

  const handleSave = () => {
    onSaveLineup(starting, bench);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0d151d] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-[#0e1a24] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Lineup & Tactical Editor
              </h2>
              <p className="text-xs text-slate-400">
                Click a starter, then click a bench player to swap them
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Swap instruction banner */}
        {selectedToSwap ? (
          <div className="bg-emerald-950/60 border-y border-emerald-500/40 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Selected: <strong className="text-white font-bold">{getPlayer(selectedToSwap)?.name}</strong>. Now tap another player to swap positions!
            </span>
            <button
              onClick={() => setSelectedToSwap(null)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border-y border-slate-800 px-5 py-2 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <span>Select any starting player or bench substitute to make a substitution.</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Starting 7 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Starting 7 Pitch Lineup ({starting.length}/7)
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Formation: 1-2-2-2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {starting.map((id) => {
                const p = getPlayer(id);
                if (!p) return null;
                const posBadge = getPositionBadgeColor(p.position);
                const isSelected = selectedToSwap === id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwap(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                        : 'bg-[#111c26] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                        {p.position}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">#{p.number} • Form: {p.form}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        {p.overall} OVR
                      </span>
                      <ArrowLeftRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bench Substitutes */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Bench Substitutes ({bench.length})
            </h3>

            {bench.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                No players on the bench. Purchase players in the Auction to grow squad depth!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bench.map((id) => {
                  const p = getPlayer(id);
                  if (!p) return null;
                  const posBadge = getPositionBadgeColor(p.position);
                  const isSelected = selectedToSwap === id;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSwap(p.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                          : 'bg-[#0f1720] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                          {p.position}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{p.name}</p>
                          <p className="text-[10px] text-slate-400">#{p.number} • Form: {p.form}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {p.overall} OVR
                        </span>
                        <ArrowLeftRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black tracking-wide uppercase transition shadow-md shadow-emerald-500/20"
          >
            Confirm Lineup
          </button>
        </div>

      </div>
    </div>
  );
};
