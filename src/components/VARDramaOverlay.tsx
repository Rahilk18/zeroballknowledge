import React, { useState, useEffect, useRef } from 'react';
import { MatchEvent } from '../types';
import { sound } from '../utils/audioSynth';
import { 
  Tv, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Scan, 
  Radio, 
  Activity, 
  X, 
  Eye, 
  Flame,
  ArrowRight
} from 'lucide-react';

interface VARDramaOverlayProps {
  varEvent: MatchEvent;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  speedMultiplier?: number;
  onDismiss?: () => void;
}

export const VARDramaOverlay: React.FC<VARDramaOverlayProps> = ({
  varEvent,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  currentMinute: _currentMinute,
  speedMultiplier = 1,
  onDismiss
}) => {
  const isDecisionAvailable = varEvent.type === 'var_overturned' || varEvent.type === 'var_confirmed';
  const initialStage = isDecisionAvailable ? 'checking' : 'checking';
  const [stage, setStage] = useState<'checking' | 'verdict'>(initialStage);
  const [scanProgress, setScanProgress] = useState(15);
  const audioTriggered = useRef(false);

  const reviewType = varEvent.varDetails?.type || (
    varEvent.description.toLowerCase().includes('offside') ? 'offside' :
    varEvent.description.toLowerCase().includes('foul') ? 'foul_buildup' : 'handball'
  );

  const isOverturned = varEvent.type === 'var_overturned' || varEvent.varDetails?.decision === 'overturned';
  const isConfirmed = varEvent.type === 'var_confirmed' || varEvent.varDetails?.decision === 'confirmed';

  // Calculate score before overturn for visual rollback animation
  const isHomeAttacker = varEvent.teamName === homeTeamName || !varEvent.teamName;
  const scoreBeforeHome = isOverturned && isHomeAttacker ? homeScore + 1 : homeScore;
  const scoreBeforeAway = isOverturned && !isHomeAttacker ? awayScore + 1 : awayScore;

  // Staged tension progression
  useEffect(() => {
    if (!audioTriggered.current) {
      audioTriggered.current = true;
      sound.playVarTensionHeartbeat();
    }

    // Progress bar ticker during review
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 14 + 8);
      });
    }, Math.max(80, Math.round(180 / speedMultiplier)));

    // Transition to verdict if decision is known
    let verdictTimer: ReturnType<typeof setTimeout> | null = null;
    if (isDecisionAvailable) {
      const tensionDuration = Math.max(1200, Math.round(2400 / speedMultiplier));
      verdictTimer = setTimeout(() => {
        setStage('verdict');
        if (isOverturned) {
          sound.playVarDecision('overturned');
        } else if (isConfirmed) {
          sound.playVarDecision('confirmed');
        }
      }, tensionDuration);
    }

    return () => {
      clearInterval(progressInterval);
      if (verdictTimer) clearTimeout(verdictTimer);
    };
  }, [varEvent, isDecisionAvailable, isOverturned, isConfirmed, speedMultiplier]);

  const handleSkipToVerdict = () => {
    sound.playClick();
    setStage('verdict');
    if (isOverturned) {
      sound.playVarDecision('overturned');
    } else if (isConfirmed) {
      sound.playVarDecision('confirmed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Cinematic Television Broadcast Frame */}
      <div className={`relative w-full max-w-2xl rounded-3xl overflow-hidden border-2 transition-all duration-500 shadow-2xl ${
        stage === 'verdict'
          ? isOverturned
            ? 'border-rose-500 bg-gradient-to-b from-rose-950/90 via-[#0C060B] to-[#14080F] shadow-[0_0_50px_rgba(244,63,94,0.45)]'
            : 'border-emerald-500 bg-gradient-to-b from-emerald-950/90 via-[#05110E] to-[#081813] shadow-[0_0_50px_rgba(16,185,129,0.45)]'
          : 'border-purple-500/80 bg-gradient-to-b from-purple-950/90 via-[#0A0714] to-[#0E0C20] shadow-[0_0_50px_rgba(168,85,247,0.4)]'
      }`}>

        {/* Ambient CRT / Laser Scanline Background */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="w-full h-full cyber-grid-bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scanline" />
        </div>

        {/* Header Broadcast Ticker */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <div className="flex items-center gap-1.5 text-xs font-black tracking-widest uppercase font-display">
              <span className="text-white">VAR MATCH HUB</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400">STOCKLEY PARK HD FEED</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-300">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              60 FPS HAWK-EYE SYNC
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Dismiss VAR Overlay"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Central Drama Stage */}
        <div className="relative z-10 p-5 sm:p-8 space-y-6">

          {/* Broadcast Header Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-purple-400/50 shadow-glow-purple">
              <Tv className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-black font-display tracking-widest text-purple-200 uppercase">
                {stage === 'checking' ? '🖥️ REFEREE REVIEW AREA (RRA)' : 'OFFICIAL VAR VERDICT'}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white uppercase drop-shadow-md">
              {stage === 'checking' ? (
                reviewType === 'offside' 
                  ? 'CHECKING POSSIBLE OFFSIDE' 
                  : reviewType === 'foul_buildup'
                  ? 'CHECKING FOUL IN BUILDUP'
                  : 'CHECKING GOAL INCIDENT'
              ) : (
                isOverturned 
                  ? '❌ GOAL DISALLOWED' 
                  : '✅ GOAL STANDS'
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-medium">
              {varEvent.description}
            </p>
          </div>

          {/* STAGE 1: TENSION SCANNING GRAPHIC */}
          {stage === 'checking' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Virtual Pitch Graphic with Laser Scanning Lines */}
              <div className="relative h-36 sm:h-44 rounded-2xl bg-slate-950/80 border border-purple-500/40 p-3 overflow-hidden flex flex-col justify-between shadow-inner">
                {/* 3D Offside Line Simulation */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                  <div className="w-full h-[1px] bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                  <div className="w-full h-[1px] bg-rose-500 shadow-[0_0_12px_#f43f5e] translate-y-3" />
                </div>

                {/* Animated Scanner Laser */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] transition-all duration-300 pointer-events-none"
                  style={{ left: `${scanProgress}%` }}
                />

                {/* Top Telemetry */}
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 z-10">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Scan className="w-3.5 h-3.5 animate-spin" />
                    {reviewType === 'offside' ? 'CALIBRATING 3D VOLUMETRIC LINES' : 'SCRUBBING MULTI-ANGLE REPLAY'}
                  </span>
                  <span className="bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                    {scanProgress}% COMPLETED
                  </span>
                </div>

                {/* Referee Walking to Monitor Visual */}
                <div className="flex items-center justify-around z-10 py-1">
                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-400 flex items-center justify-center text-xl shadow-glow-purple animate-pulse">
                      🧑‍⚖️
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 uppercase font-black">
                      REF AT MONITOR
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                    <ArrowRight className="w-5 h-5" />
                    <ArrowRight className="w-5 h-5 -ml-2" />
                  </div>

                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-cyan-900/60 border border-cyan-400 flex items-center justify-center text-xl shadow-glow-cyan animate-pulse">
                      📺
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase font-black">
                      SLOW-MO 1000 FPS
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                    <ArrowRight className="w-5 h-5" />
                    <ArrowRight className="w-5 h-5 -ml-2" />
                  </div>

                  <div className="flex flex-col items-center text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-amber-900/60 border border-amber-400 flex items-center justify-center text-xl shadow-glow-amber animate-pulse">
                      ⚖️
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 uppercase font-black">
                      FINAL CALL
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="z-10 space-y-1">
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-purple-500/30">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold">
                    <span>FRAME 418 / 480</span>
                    <span className="text-cyan-300 animate-pulse">VAR OFFICIALS DELIBERATING...</span>
                    <span>DELTA: ±0.03s</span>
                  </div>
                </div>
              </div>

              {isDecisionAvailable && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleSkipToVerdict}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs font-display uppercase tracking-wider transition shadow-glow-purple active:scale-95 flex items-center gap-2"
                  >
                    <span>REVEAL OFFICIAL DECISION NOW</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: DRAMATIC VERDICT REVEAL */}
          {stage === 'verdict' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Verdict Announcement Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 text-center space-y-3 ${
                isOverturned
                  ? 'bg-rose-950/70 border-rose-500 shadow-glow-red'
                  : 'bg-emerald-950/70 border-emerald-500 shadow-glow-emerald'
              }`}>
                <div className="flex items-center justify-center gap-2.5">
                  {isOverturned ? (
                    <XCircle className="w-8 h-8 text-rose-400 animate-bounce" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
                  )}
                  <span className={`text-xl sm:text-2xl font-black font-display uppercase tracking-wider ${
                    isOverturned ? 'text-rose-200' : 'text-emerald-200'
                  }`}>
                    {isOverturned ? 'NO GOAL • DECISION OVERTURNED' : 'LEGAL GOAL • DECISION STANDS'}
                  </span>
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-black/50 border border-white/20 text-white">
                  {reviewType === 'offside' 
                    ? (isOverturned ? 'OFFSIDE BY 4.2 CM ON 3D GRID' : 'LEGAL POSITION - ATTACKER WAS ONSIDE') 
                    : reviewType === 'foul_buildup'
                    ? (isOverturned ? 'CLEAR FOUL IDENTIFIED IN ATTACK PHASE' : 'NO FOUL COMMITTED - LEGAL CONTACT')
                    : 'INCIDENT RESOLVED BY VIDEO ASSISTANT'
                  }
                </div>
              </div>

              {/* OVERTURNED SCORE ANIMATION */}
              <div className="rounded-2xl bg-black/60 border border-white/10 p-4 sm:p-5">
                <div className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 font-bold">
                  {isOverturned ? 'LIVE SCORE REVERSION IN EFFECT' : 'OFFICIAL SCORE VALIDATED'}
                </div>

                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  {/* Home Team */}
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-300 block mb-1">
                      {homeTeamName}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {isOverturned && isHomeAttacker ? (
                        <>
                          <span className="text-2xl sm:text-4xl font-mono font-black text-rose-400/60 line-through">
                            {scoreBeforeHome}
                          </span>
                          <ArrowRight className="w-4 h-4 text-rose-400" />
                          <span className="text-3xl sm:text-5xl font-mono font-black text-white animate-pulse">
                            {homeScore}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl sm:text-5xl font-mono font-black text-white">
                          {homeScore}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-2xl sm:text-4xl font-extrabold text-slate-600">-</span>

                  {/* Away Team */}
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-300 block mb-1">
                      {awayTeamName}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {isOverturned && !isHomeAttacker ? (
                        <>
                          <span className="text-2xl sm:text-4xl font-mono font-black text-rose-400/60 line-through">
                            {scoreBeforeAway}
                          </span>
                          <ArrowRight className="w-4 h-4 text-rose-400" />
                          <span className="text-3xl sm:text-5xl font-mono font-black text-white animate-pulse">
                            {awayScore}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl sm:text-5xl font-mono font-black text-white">
                          {awayScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOverturned && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      GOAL STRUCK FROM THE RECORD • PLAY RESUMES FROM FREE KICK
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
            <span className="font-mono">
              MATCH MINUTE: {varEvent.displayMinute || `${varEvent.minute}'`}
            </span>
            <button
              onClick={onDismiss || handleSkipToVerdict}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition text-[11px]"
            >
              {stage === 'checking' && isDecisionAvailable ? 'Skip Check' : 'Dismiss Alert'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
