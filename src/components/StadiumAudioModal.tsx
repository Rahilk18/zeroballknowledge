import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  X, 
  Sliders, 
  Flame, 
  Sparkles,
  Play
} from 'lucide-react';
import { sound } from '../utils/audioSynth';

interface StadiumAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StadiumAudioModal: React.FC<StadiumAudioModalProps> = ({ isOpen, onClose }) => {
  const [volume, setVolume] = useState<number>(() => Math.round(sound.getMasterVolume() * 100));
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => sound.getSfxEnabled());
  const [ambienceEnabled, setAmbienceEnabled] = useState<boolean>(() => sound.getAmbienceEnabled());
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState<boolean>(() => sound.getIsAmbienceRunning());
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());

  useEffect(() => {
    if (isOpen) {
      setVolume(Math.round(sound.getMasterVolume() * 100));
      setSfxEnabled(sound.getSfxEnabled());
      setAmbienceEnabled(sound.getAmbienceEnabled());
      setIsAmbiencePlaying(sound.getIsAmbienceRunning());
      setIsMuted(sound.getIsMuted());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    sound.setMasterVolume(newVol / 100);
    if (isMuted && newVol > 0) {
      sound.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    sound.setSfxEnabled(next);
    if (next) sound.playClick();
  };

  const handleToggleAmbience = () => {
    const next = !ambienceEnabled;
    setAmbienceEnabled(next);
    sound.setAmbienceEnabled(next);
    if (next) {
      sound.startStadiumAmbiance();
      setIsAmbiencePlaying(true);
    } else {
      sound.stopStadiumAmbiance();
      setIsAmbiencePlaying(false);
    }
  };

  const handleToggleAmbiencePlayback = () => {
    if (isAmbiencePlaying) {
      sound.stopStadiumAmbiance();
      setIsAmbiencePlaying(false);
    } else {
      sound.startStadiumAmbiance();
      setIsAmbiencePlaying(true);
    }
  };

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-[#0A0D18] border-2 border-[#FF1744]/40 shadow-2xl p-4 sm:p-6 overflow-hidden text-white my-auto max-h-[92vh] flex flex-col">
        
        {/* Stadium Floodlight Accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF1744]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF1744] to-rose-700 flex items-center justify-center shadow-lg">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider font-display text-white">
                STADIUM AUDIO & SFX
              </h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Procedural Crowd Ambience & Broadcast FX
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Container */}
        <div className="relative z-10 space-y-6">

          {/* Master Volume Slider */}
          <div className="p-4 rounded-2xl bg-[#0E1324] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FF1744]" />
                Master Stadium Volume
              </span>
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isMuted ? 'MUTED' : `${volume}%`}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF1744]"
            />
          </div>

          {/* Audio Channels Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Stadium Crowd Atmosphere */}
            <div className={`p-4 rounded-2xl border transition-all ${
              ambienceEnabled
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-[#0E1324] border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  🏟️ Crowd Ambience
                </span>
                <input
                  type="checkbox"
                  checked={ambienceEnabled}
                  onChange={handleToggleAmbience}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mb-3">
                Continuous living stadium murmur, chants & fan wave acoustics.
              </p>
              <button
                onClick={handleToggleAmbiencePlayback}
                disabled={!ambienceEnabled}
                className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                  isAmbiencePlaying
                    ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                }`}
              >
                <Radio className="w-3 h-3" />
                {isAmbiencePlaying ? 'Crowd Playing Live' : 'Test Ambiance'}
              </button>
            </div>

            {/* Match Action SFX */}
            <div className={`p-4 rounded-2xl border transition-all ${
              sfxEnabled
                ? 'bg-[#FF1744]/10 border-[#FF1744]/40'
                : 'bg-[#0E1324] border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#FF1744] flex items-center gap-1.5">
                  ⚡ Match Action SFX
                </span>
                <input
                  type="checkbox"
                  checked={sfxEnabled}
                  onChange={handleToggleSfx}
                  className="w-4 h-4 rounded accent-[#FF1744] cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mb-3">
                Goal roars, horns, referee whistles, woodwork clangs & auction gavels.
              </p>
              <button
                onClick={() => sound.playGoalRoar()}
                disabled={!sfxEnabled}
                className="w-full py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 hover:bg-[#FF1744]/30 transition"
              >
                <Flame className="w-3 h-3" />
                Test Goal Roar
              </button>
            </div>
          </div>

          {/* Interactive Soundboard Test Pad */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              STADIUM BROADCAST SOUNDBOARD (CLICK TO PREVIEW)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              
              <button
                onClick={() => sound.playWhistle('kickoff')}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                  <span>📢 Kickoff Whistle</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Fox 40 double chirp</span>
              </button>

              <button
                onClick={() => sound.playWhistle('fulltime')}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                  <span>📢 Full-Time Whistle</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Triple match end blast</span>
              </button>

              <button
                onClick={() => {
                  sound.playGoalRoar();
                  sound.playGoalHorn();
                }}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-[#FF1744]">
                  <span>⚽ Goal Roar & Horn</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">50k fan arena eruption</span>
              </button>

              <button
                onClick={() => sound.playCrossbarSound()}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-cyan-400">
                  <span>🥅 Woodwork Ping</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Metallic crossbar clang</span>
              </button>

              <button
                onClick={() => {
                  sound.playSave();
                  sound.playCrowdGasp();
                }}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-emerald-400">
                  <span>🧤 Save & Gasp</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Keeper parry + "Ooh!"</span>
              </button>

              <button
                onClick={() => sound.playCrowdChant()}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-purple-400">
                  <span>👏 Supporter Chant</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Rhythmic stadium claps</span>
              </button>

              <button
                onClick={() => {
                  sound.playGavelHammer();
                  sound.playVictorySound();
                }}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                  <span>🔨 Auction Gavel</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Wood hammer + sold chime</span>
              </button>

              <button
                onClick={() => sound.playAuctionCountdownBeep(0)}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-rose-400">
                  <span>⏰ Timer Buzzer</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Draft clock zero buzzer</span>
              </button>

              <button
                onClick={() => sound.playOutbidWarning()}
                className="p-2.5 rounded-xl bg-[#0E1324] hover:bg-slate-800 border border-slate-800 text-left transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-red-500">
                  <span>🚨 Outbid Warning</span>
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="text-[9px] text-slate-500">Urgent alarm chirp</span>
              </button>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            ZeroBallKnowledge Web Audio Engine
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-glow-cyan"
          >
            Done
          </button>
        </div>

      </div>
    </div>,
    document.body
  ) : null;
};
