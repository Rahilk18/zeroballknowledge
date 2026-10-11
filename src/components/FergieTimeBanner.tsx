import React, { useMemo } from 'react';
import { MatchEvent } from '../types';
import { 
  Clock, 
  Flame, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Radio, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface FergieTimeBannerProps {
  currentMinute: number;
  stoppageMinutes: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  recentEvent?: MatchEvent;
  wentToExtraTime?: boolean;
  isFinished?: boolean;
}

export const FergieTimeBanner: React.FC<FergieTimeBannerProps> = ({
  currentMinute,
  stoppageMinutes = 4,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  recentEvent,
  wentToExtraTime = false,
  isFinished = false
}) => {
  // If in extra time after 90 (like 120min cup matches), return null or specific banner
  if (wentToExtraTime || isFinished || currentMinute < 90) return null;

  const stoppageElapsed = Math.max(0, currentMinute - 90);
  const isPastAllotted = stoppageElapsed > stoppageMinutes;

  // Context-aware commentary for high-stakes stoppage time
  const clutchCommentary = useMemo(() => {
    if (recentEvent && recentEvent.isFergieTime) {
      if (recentEvent.type === 'goal') {
        return `⚡ UNBELIEVABLE SCENES! ${recentEvent.playerName} scores in stoppage time to ignite the stadium into delirium!`;
      }
      if (recentEvent.type === 'save') {
        return `🧤 HEROIC GOALKEEPING! Sensational reflex save keeps dreams alive in Fergie Time!`;
      }
      if (recentEvent.type === 'yellow_card' || recentEvent.type === 'red_card') {
        return `⚠️ TENSIONS BOILING OVER! Card issued as nerves fray in the final moments!`;
      }
    }

    const scoreDiff = homeScore - awayScore;
    if (scoreDiff === 0) {
      return `🔥 DEADLOCK IN STOPPAGE TIME! Any strike now is an unforgettable last-gasp winner!`;
    } else if (scoreDiff === 1) {
      return `🚨 DESPERATION CLOCK TICKING! ${awayTeamName} throwing every body into the box in frantic equalizer bid!`;
    } else if (scoreDiff === -1) {
      return `🚨 ALL-OUT ATTACK! ${homeTeamName} pushing keeper and defense forward searching for a miracle!`;
    } else {
      return `⚡ FINAL SECONDS! Relentless pressure as referee checks the stopwatch for the final whistle!`;
    }
  }, [homeScore, awayScore, homeTeamName, awayTeamName, recentEvent]);

  // Dynamic Momentum calculation for stoppage time
  const { homeMomentum, awayMomentum } = useMemo(() => {
    if (homeScore < awayScore) {
      // Home is desperate to equalize, high home momentum
      return { homeMomentum: 68, awayMomentum: 32 };
    } else if (awayScore < homeScore) {
      // Away is desperate to equalize
      return { homeMomentum: 32, awayMomentum: 68 };
    } else {
      // Tied: 50-50 volatile swing
      return { homeMomentum: 50, awayMomentum: 50 };
    }
  }, [homeScore, awayScore]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-red-600/90 bg-gradient-to-r from-red-950/90 via-slate-950/95 to-red-950/90 shadow-[0_0_35px_rgba(239,68,68,0.45)] animate-fadeIn">
      {/* Dynamic scanlines & red glow background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full cyber-grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-amber-500/10 to-red-600/10 animate-pulse" />
      </div>

      <div className="relative z-10 p-3 sm:p-4 space-y-3">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-red-600/40">
          {/* Main Pulsing Badge */}
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <div className="flex items-center gap-1.5 font-display font-black text-xs sm:text-sm tracking-wider uppercase text-red-100">
              <Clock className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>⏱️ 90+ MIN • FERGIE TIME STOPPAGE</span>
            </div>
          </div>

          {/* 4th Official LED Stoppage Board Graphic */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)] font-mono font-black text-xs text-emerald-400">
              <span className="text-[10px] text-emerald-500/70 uppercase">4TH OFFICIAL:</span>
              <span className="text-sm tracking-widest text-emerald-300">+{stoppageMinutes} MINS</span>
            </div>

            {/* Current Stoppage Clock */}
            <div className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs border ${
              isPastAllotted
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-red-950/80 border-red-500 text-red-300'
            }`}>
              90+{stoppageElapsed}'
            </div>
          </div>
        </div>

        {/* High-Stakes Commentary & Surge Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-900/60 border border-red-500/60 flex items-center justify-center flex-shrink-0 text-red-300 shadow-glow-red mt-0.5">
              <Flame className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                  CLUTCH MOMENT COMMENTARY
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold">
                  +15 ATK SURGE ACTIVE
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate mt-0.5">
                {clutchCommentary}
              </p>
            </div>
          </div>
        </div>

        {/* Stadium Pressure & Momentum Indicator Bar */}
        <div className="pt-1 border-t border-red-600/30 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {homeTeamName} Pressure: {homeMomentum}%
            </span>
            <span className="text-amber-400 uppercase tracking-widest font-black flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              STADIUM PRESSURE GAUGE
            </span>
            <span className="text-blue-400 flex items-center gap-1">
              {awayTeamName} Pressure: {awayMomentum}%
              <TrendingUp className="w-3 h-3" />
            </span>
          </div>

          <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-red-600/40 flex p-0.5 gap-0.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
              style={{ width: `${homeMomentum}%` }}
            />
            <div 
              className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-r-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.7)]"
              style={{ width: `${awayMomentum}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
