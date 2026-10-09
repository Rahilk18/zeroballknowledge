import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { MatchResult, MatchEvent, Player } from '../types';
import { 
  Trophy, 
  Play, 
  Pause, 
  FastForward, 
  CheckCircle, 
  Flame, 
  Shield, 
  Clock, 
  Award, 
  ArrowRight,
  RotateCcw,
  Swords,
  Zap,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { getPositionBadgeColor } from '../utils/formatters';
import { sound } from '../utils/audioSynth';
import { MatchPitchVisualizer } from '../components/MatchPitchVisualizer';
import { StadiumAudioModal } from '../components/StadiumAudioModal';

interface MatchSimulationPageProps {
  matchResult: MatchResult;
  allPlayers: Player[];
  onFinishMatch: () => void;
  onGoToLeague: () => void;
  onReturnToAuction?: () => void;
}

export const MatchSimulationPage: React.FC<MatchSimulationPageProps> = ({
  matchResult,
  allPlayers: _allPlayers,
  onFinishMatch,
  onGoToLeague,
  onReturnToAuction
}) => {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zeroball_match_speed');
      if (saved) {
        const val = parseFloat(saved);
        if ([0.5, 1, 2, 4].includes(val)) return val;
      }
    } catch {
      // ignore
    }
    return 1; // Default to 1x
  });

  const handleSpeedChange = (s: number) => {
    sound.playClick();
    setSpeedMultiplier(s);
    try {
      localStorage.setItem('zeroball_match_speed', String(s));
    } catch {
      // ignore
    }
  };
  const [isFinished, setIsFinished] = useState(false);
  const [activeTab, setActiveTab] = useState<'pitch' | 'overview' | 'events' | 'stats' | 'players'>('pitch');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Trigger win confetti once
  const confettiFired = useRef(false);
  const prevGoalCount = useRef(0);
  const prevProcessedMinute = useRef<number>(-1);

  // Filter events up to current minute
  const visibleEvents = matchResult.events.filter((e) => e.minute <= currentMinute);

  // Compute live score based on visible events
  const currentHomeScore = visibleEvents.filter(
    (e) => e.type === 'goal' && e.teamId === matchResult.homeTeamId
  ).length;
  const currentAwayScore = visibleEvents.filter(
    (e) => e.type === 'goal' && e.teamId === matchResult.awayTeamId
  ).length;

  // Stadium crowd ambience loop: runs whenever match is active & not finished
  useEffect(() => {
    if (isPlaying && !isFinished) {
      sound.startStadiumAmbiance();
    } else {
      sound.stopStadiumAmbiance();
    }
    return () => {
      sound.stopStadiumAmbiance();
    };
  }, [isPlaying, isFinished]);

  const maxMinute = matchResult.wentToExtraTime ? 120 : 90;

  // Event & Whistle Audio Triggers per minute change
  useEffect(() => {
    if (prevProcessedMinute.current === currentMinute) return;
    prevProcessedMinute.current = currentMinute;

    // Kickoff Whistle
    if (currentMinute === 1) {
      sound.playWhistle('kickoff');
    }
    // Halftime Whistle
    else if (currentMinute === 45) {
      sound.playWhistle('halftime');
    }
    // Extra Time Start Whistle
    else if (currentMinute === 90 && matchResult.wentToExtraTime) {
      sound.playWhistle('foul');
    }
    // Penalty Shootout Start Whistle
    else if (currentMinute === 120 && matchResult.wentToPenalties) {
      sound.playWhistle('kickoff');
    }

    // Process specific events occurring in this minute
    const eventsThisMinute = matchResult.events.filter((e) => e.minute === currentMinute);
    for (const ev of eventsThisMinute) {
      const type = (ev.type || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();

      if (type.includes('goal') || desc.includes('goal')) {
        sound.playGoalRoar();
        sound.playGoalHorn();
      } else if (desc.includes('crossbar') || desc.includes('post') || desc.includes('woodwork')) {
        sound.playCrossbarSound();
        sound.playCrowdGasp();
      } else if (type.includes('save') || desc.includes('save') || desc.includes('saved')) {
        sound.playSave();
        sound.playCrowdGasp();
      } else if (type.includes('card') || type.includes('foul')) {
        sound.playWhistle('foul');
      } else if (type.includes('penalty_scored')) {
        sound.playKick('shot');
        sound.playGoalRoar();
      } else if (type.includes('penalty_saved')) {
        sound.playSave();
        sound.playCrowdGasp();
      }
    }
  }, [currentMinute, matchResult]);

  // Timer loop
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    // Base interval is 200ms per match minute:
    // 0.5x = 400ms per minute (~36s for 90min match, relaxed and easy to watch)
    // 1x   = 200ms per minute (~18s for 90min match)
    // 2x   = 100ms per minute (~9s for 90min match)
    // 4x   = 50ms per minute (~4.5s for 90min match)
    const intervalTime = Math.max(35, Math.round(200 / speedMultiplier));

    const timer = setInterval(() => {
      setCurrentMinute((prev) => {
        if (prev >= maxMinute) {
          clearInterval(timer);
          setIsFinished(true);
          setIsPlaying(false);
          sound.stopStadiumAmbiance();
          sound.playWhistle('fulltime');
          sound.playVictorySound();
          return maxMinute;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, isFinished, speedMultiplier, maxMinute]);

  // When finished, fire confetti if home won
  useEffect(() => {
    if (isFinished && !confettiFired.current) {
      const homeWon = matchResult.wentToPenalties && matchResult.penaltyScore
        ? matchResult.penaltyScore.home > matchResult.penaltyScore.away
        : matchResult.homeScore > matchResult.awayScore;
      if (homeWon) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        confettiFired.current = true;
      }
    }
  }, [isFinished, matchResult.homeScore, matchResult.awayScore, matchResult.wentToPenalties, matchResult.penaltyScore]);

  const handleInstantSkip = () => {
    sound.playClick();
    sound.stopStadiumAmbiance();
    sound.playWhistle('fulltime');
    sound.playVictorySound();
    setCurrentMinute(maxMinute);
    setIsFinished(true);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    sound.playClick();
    setCurrentMinute(0);
    setIsFinished(false);
    setIsPlaying(true);
    confettiFired.current = false;
    prevGoalCount.current = 0;
    prevProcessedMinute.current = -1;
    sound.startStadiumAmbiance();
  };

  const potm = matchResult.playerOfTheMatch;

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto space-y-3 pb-6 animate-fadeIn">
      
      {/* SCOREBOARD HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0E1324] via-[#0A0A14] to-[#12182D] border-2 border-[#FF1744]/40 p-3 sm:p-4 shadow-glow-cyan">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        {/* Top Match Status and Clock */}
        <div className="relative z-10 flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-slate-500' : 'bg-[#FF1744] animate-ping'}`} />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF1744] font-display text-glow-cyan">
              {isFinished
                ? (matchResult.wentToPenalties
                    ? 'FULL TIME (PENALTIES DECIDED)'
                    : matchResult.wentToExtraTime
                    ? 'AFTER EXTRA TIME (120\')'
                    : 'FULL TIME BATTLE END')
                : currentMinute > 90
                ? 'EXTRA TIME IN PROGRESS'
                : currentMinute < 45
                ? '1ST HALF IN PROGRESS'
                : '2ND HALF CLASH'}
            </span>
          </div>

          {/* Clock Display */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0A0A14] border border-[#FF1744]/30 font-mono font-black text-xs text-[#FF1744] shadow-glow-cyan">
            <Clock className="w-3.5 h-3.5 text-[#FF1744]" />
            <span>{String(currentMinute).padStart(2, '0')}:00</span>
          </div>

          {/* Simulation Speed, Audio & Skip Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Play / Pause Toggle */}
            {!isFinished && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsPlaying(prev => !prev);
                }}
                className={`p-1 rounded-lg border transition active:scale-95 ${
                  isPlaying 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-glow-emerald'
                }`}
                title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              </button>
            )}

            {/* Stadium Audio Quick Controller */}
            <button
              onClick={() => {
                sound.playClick();
                setIsAudioModalOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-black hover:bg-emerald-900/50 transition shadow-glow-emerald"
              title="Adjust Stadium Crowd Audio & SFX"
            >
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              <span className="hidden md:inline">AUDIO</span>
            </button>

            {/* Speed Options: 0.5x, 1x, 2x, 4x */}
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] font-black transition active:scale-95 ${
                  speedMultiplier === s 
                    ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan' 
                    : 'bg-[#0A0A14] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
                title={`Simulation Speed ${s}x`}
              >
                {s}x
              </button>
            ))}
            {!isFinished && (
              <button
                onClick={handleInstantSkip}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-black hover:bg-purple-500/30 transition shadow-glow-purple active:scale-95"
                title="Instant skip to match conclusion"
              >
                <FastForward className="w-3 h-3" />
                <span className="hidden sm:inline">SKIP</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Scoreboard Display */}
        <div className="flex items-center justify-between gap-2 py-1">
          {/* Home Team */}
          <div className="flex-1 text-center sm:text-left flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-2xl shadow-lg border border-emerald-300 flex-shrink-0">
              ⚡
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-emerald-400">HOME</span>
              <h2 className="text-sm sm:text-lg font-black text-white">{matchResult.homeTeamName}</h2>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Tactical 7 Lineup</span>
            </div>
          </div>

          {/* Central Score Digits */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {currentHomeScore}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-600">-</span>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {currentAwayScore}
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
              {isFinished ? 'FINAL SCORE' : 'LIVE MATCH'}
            </span>
            {matchResult.wentToPenalties && (isFinished || currentMinute >= 120) && matchResult.penaltyScore && (
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-black animate-pulse flex items-center gap-1 shadow-glow-amber">
                <span>🎯 PENALTIES:</span>
                <span>{matchResult.penaltyScore.home} - {matchResult.penaltyScore.away}</span>
              </div>
            )}
            {!matchResult.wentToPenalties && matchResult.wentToExtraTime && (isFinished || currentMinute >= 90) && (
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mt-0.5">
                (AET • 120 MINS)
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center sm:text-right flex items-center justify-end gap-2.5 sm:gap-3 flex-row-reverse sm:flex-row">
            <div>
              <span className="text-[9px] font-black uppercase text-blue-400">AWAY</span>
              <h2 className="text-sm sm:text-lg font-black text-white">{matchResult.awayTeamName}</h2>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Tactical 7 Lineup</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-2xl shadow-lg border border-blue-400 flex-shrink-0">
              🦅
            </div>
          </div>
        </div>

        {/* Progress Bar of the Match */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 transition-all duration-200"
              style={{ width: `${Math.min(100, (currentMinute / maxMinute) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-500 mt-0.5">
            <span>0' Kickoff</span>
            <span>45' Halftime</span>
            <span>90' Full Time</span>
            {matchResult.wentToExtraTime && <span className="text-purple-400">120' ET</span>}
          </div>
        </div>

        {/* Finished Action Options */}
        {isFinished && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                Match Complete • Results Official
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay</span>
              </button>
              <button
                onClick={onGoToLeague}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>VIEW LEAGUE TABLE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Tabs: Pitch / Overview / Events / Stats / Players */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pitch')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pitch'
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/60 text-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>2D Live Pitch</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Events ({visibleEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'players'
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Players
        </button>
      </div>

      {/* TAB 0: 2D PITCH VISUALIZER */}
      {activeTab === 'pitch' && (
        <div className="animate-fadeIn">
          <MatchPitchVisualizer
            matchResult={matchResult}
            currentMinute={currentMinute}
            isPlaying={isPlaying}
            speedMultiplier={speedMultiplier}
            allPlayers={_allPlayers}
          />
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Goalscorers & Key Events summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Goals */}
            <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 pb-2 border-b border-slate-800 mb-3">
                {matchResult.homeTeamName} Goals
              </h4>
              {visibleEvents.filter(e => e.type === 'goal' && e.teamId === matchResult.homeTeamId).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No goals scored yet</p>
              ) : (
                <div className="space-y-2">
                  {visibleEvents
                    .filter(e => e.type === 'goal' && e.teamId === matchResult.homeTeamId)
                    .map(e => (
                      <div key={e.id || `${e.minute}-${e.playerId}`} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>⚽</span> {e.playerName || 'Player'}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">{e.minute}'</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Away Goals */}
            <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 pb-2 border-b border-slate-800 mb-3">
                {matchResult.awayTeamName} Goals
              </h4>
              {visibleEvents.filter(e => e.type === 'goal' && e.teamId === matchResult.awayTeamId).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No goals scored yet</p>
              ) : (
                <div className="space-y-2">
                  {visibleEvents
                    .filter(e => e.type === 'goal' && e.teamId === matchResult.awayTeamId)
                    .map(e => (
                      <div key={e.id || `${e.minute}-${e.playerId}`} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>⚽</span> {e.playerName || 'Player'}
                        </span>
                        <span className="font-mono text-blue-400 font-bold">{e.minute}'</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Penalty Shootout Summary in Overview */}
          {matchResult.wentToPenalties && matchResult.penaltyShootout && (isFinished || currentMinute >= 120) && (
            <div className="bg-[#0e1720] border-2 border-amber-500/50 rounded-3xl p-5 shadow-glow-amber space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-300">
                    Penalty Shootout Breakdown
                  </h4>
                </div>
                {matchResult.penaltyScore && (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs">
                    {matchResult.penaltyScore.home} - {matchResult.penaltyScore.away}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Penalties */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs font-black uppercase text-emerald-400 block mb-2">
                    {matchResult.homeTeamName} Takers
                  </span>
                  <div className="space-y-1.5">
                    {matchResult.penaltyShootout.homeShots.map((shot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">
                          R{shot.round}. {shot.playerName}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          shot.scored
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {shot.scored ? '✓ SCORED' : '✗ MISSED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Penalties */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs font-black uppercase text-blue-400 block mb-2">
                    {matchResult.awayTeamName} Takers
                  </span>
                  <div className="space-y-1.5">
                    {matchResult.penaltyShootout.awayShots.map((shot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">
                          R{shot.round}. {shot.playerName}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          shot.scored
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {shot.scored ? '✓ SCORED' : '✗ MISSED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Match Quick Stats Bar */}
          <div className="bg-[#0e1720] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Possession & Territory
            </h4>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-emerald-400">{matchResult.stats.home.possession}%</span>
              <span className="text-slate-500 uppercase text-[10px]">Possession</span>
              <span className="text-blue-400">{matchResult.stats.away.possession}%</span>
            </div>
            <div className="h-3 w-full bg-blue-500 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${matchResult.stats.home.possession}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS (TIMELINE) */}
      {activeTab === 'events' && (
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Live Key Events Timeline
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Chronological minute order</span>
          </div>

          {visibleEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              Kickoff! The match is underway. Key match events will appear here...
            </div>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((evt) => {
                const isHome = evt.teamId === matchResult.homeTeamId;
                const isGoal = evt.type === 'goal';
                const isCard = evt.type === 'yellow_card' || evt.type === 'red_card';
                const isSave = evt.type === 'save';
                const isET = evt.type === 'EXTRA_TIME_START';
                const isPenStart = evt.type === 'PENALTIES_START';
                const isPenScored = evt.type === 'PENALTY_SCORED';
                const isPenSaved = evt.type === 'PENALTY_SAVED';

                return (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all animate-fadeIn ${
                      isGoal || isPenScored
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : isCard || isPenSaved
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : isET || isPenStart
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-500/10'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Minute Badge */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-black text-white">
                        {evt.minute}'
                      </span>
                    </div>

                    {/* Event Icon */}
                    <div className="text-lg flex-shrink-0">
                      {isGoal && '⚽'}
                      {isCard && '🟨'}
                      {isSave && '🧤'}
                      {isET && '⏱️'}
                      {isPenStart && '🎯'}
                      {isPenScored && '⚽'}
                      {isPenSaved && '🧤'}
                      {!isGoal && !isCard && !isSave && !isET && !isPenStart && !isPenScored && !isPenSaved && '⚡'}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {evt.playerName && (
                          <span className="font-extrabold text-white text-xs sm:text-sm">
                            {evt.playerName}
                          </span>
                        )}
                        {evt.teamName && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                            {evt.teamName}
                          </span>
                        )}
                        {isGoal && (
                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            GOAL!
                          </span>
                        )}
                        {isPenScored && (
                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            PENALTY SCORED
                          </span>
                        )}
                        {isPenSaved && (
                          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                            PENALTY SAVED/MISSED
                          </span>
                        )}
                        {isET && (
                          <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                            EXTRA TIME
                          </span>
                        )}
                        {isPenStart && (
                          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                            SHOOTOUT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{evt.description}</p>
                    </div>

                    {/* Current Score After Event */}
                    {evt.scoreAfter && (
                      <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-black text-emerald-400">
                        {evt.scoreAfter.home} - {evt.scoreAfter.away}
                      </div>
                    )}
                  </div>
                );
              })}

              {isFinished && (
                <div className="flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-300 uppercase tracking-wider">
                  🏁 {matchResult.wentToPenalties ? '120\' (PENALTIES DECIDED)' : matchResult.wentToExtraTime ? '120\' AFTER EXTRA TIME' : '90\' FULL TIME'} — MATCH CONCLUDED
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCH STATISTICS */}
      {activeTab === 'stats' && (
        <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Technical Match Statistics
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-emerald-400">{matchResult.homeTeamName}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-blue-400">{matchResult.awayTeamName}</span>
            </div>
          </div>

          {/* Stat Comparators */}
          <div className="space-y-4">
            <StatComparisonRow
              label="Possession"
              homeValue={`${matchResult.stats.home.possession}%`}
              awayValue={`${matchResult.stats.away.possession}%`}
              homeRatio={matchResult.stats.home.possession}
              awayRatio={matchResult.stats.away.possession}
            />

            <StatComparisonRow
              label="Total Shots"
              homeValue={matchResult.stats.home.shots}
              awayValue={matchResult.stats.away.shots}
              homeRatio={matchResult.stats.home.shots}
              awayRatio={matchResult.stats.away.shots}
            />

            <StatComparisonRow
              label="Shots on Target"
              homeValue={matchResult.stats.home.shotsOnTarget}
              awayValue={matchResult.stats.away.shotsOnTarget}
              homeRatio={matchResult.stats.home.shotsOnTarget}
              awayRatio={matchResult.stats.away.shotsOnTarget}
            />

            <StatComparisonRow
              label="Pass Accuracy"
              homeValue={`${matchResult.stats.home.passAccuracy}%`}
              awayValue={`${matchResult.stats.away.passAccuracy}%`}
              homeRatio={matchResult.stats.home.passAccuracy}
              awayRatio={matchResult.stats.away.passAccuracy}
            />

            <StatComparisonRow
              label="Corner Kicks"
              homeValue={matchResult.stats.home.corners}
              awayValue={matchResult.stats.away.corners}
              homeRatio={matchResult.stats.home.corners}
              awayRatio={matchResult.stats.away.corners}
            />

            <StatComparisonRow
              label="Fouls Committed"
              homeValue={matchResult.stats.home.fouls}
              awayValue={matchResult.stats.away.fouls}
              homeRatio={matchResult.stats.home.fouls}
              awayRatio={matchResult.stats.away.fouls}
            />

            <StatComparisonRow
              label="Goalkeeper Saves"
              homeValue={matchResult.stats.home.saves ?? 0}
              awayValue={matchResult.stats.away.saves ?? 0}
              homeRatio={matchResult.stats.home.saves ?? 0}
              awayRatio={matchResult.stats.away.saves ?? 0}
            />
          </div>
        </div>
      )}

      {/* TAB 4: PLAYERS & PLAYER OF THE MATCH */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          
          {/* PLAYER OF THE MATCH AWARD BANNER */}
          {potm && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#161c22] to-amber-950/30 border-2 border-amber-500/50 p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl border border-amber-300 flex-shrink-0">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ★ OFFICIAL MAN OF THE MATCH
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{potm.playerName}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{potm.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg">
                  <span className="text-3xl leading-none">{potm.rating}</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold">MATCH RATING</span>
                </div>
              </div>
            </div>
          )}

          {/* Ratings Grid (Both Teams) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Home Ratings */}
            <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {matchResult.homeTeamName} Ratings
                </h4>
              </div>

              <div className="space-y-2">
                {Object.values(matchResult.playerRatings)
                  .filter((pr) => pr.teamId === matchResult.homeTeamId)
                  .sort((a, b) => b.rating - a.rating)
                  .map((pr) => {
                    const badge = getPositionBadgeColor(pr.position);
                    return (
                      <div
                        key={pr.playerId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {pr.position}
                          </span>
                          <span className="font-extrabold text-white">{pr.playerName}</span>
                          {pr.goals > 0 && <span className="text-[11px]">⚽ x{pr.goals}</span>}
                          {pr.assists > 0 && <span className="text-[11px] text-teal-400">🎯 x{pr.assists}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            pr.rating >= 8.0 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : pr.rating >= 7.0 
                              ? 'bg-teal-500/20 text-teal-300' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pr.rating}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Away Ratings */}
            <div className="bg-[#0e1720] rounded-3xl border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">
                  {matchResult.awayTeamName} Ratings
                </h4>
              </div>

              <div className="space-y-2">
                {Object.values(matchResult.playerRatings)
                  .filter((pr) => pr.teamId === matchResult.awayTeamId)
                  .sort((a, b) => b.rating - a.rating)
                  .map((pr) => {
                    const badge = getPositionBadgeColor(pr.position);
                    return (
                      <div
                        key={pr.playerId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {pr.position}
                          </span>
                          <span className="font-extrabold text-white">{pr.playerName}</span>
                          {pr.goals > 0 && <span className="text-[11px]">⚽ x{pr.goals}</span>}
                          {pr.assists > 0 && <span className="text-[11px] text-teal-400">🎯 x{pr.assists}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            pr.rating >= 8.0 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : pr.rating >= 7.0 
                              ? 'bg-teal-500/20 text-teal-300' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pr.rating}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onFinishMatch}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Return to Dashboard
          </button>
          {onReturnToAuction && (
            <button
              onClick={onReturnToAuction}
              className="px-4 py-2.5 rounded-xl bg-[#0A0D1A] hover:bg-slate-800 border border-[#FF1744]/40 text-[#FF1744] text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🔙 Return to Auction</span>
            </button>
          )}
        </div>
        <button
          onClick={onGoToLeague}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20"
        >
          <Trophy className="w-4 h-4" />
          <span>Go to League Table</span>
        </button>
      </div>

      {/* Stadium Audio & Crowd Soundboard Modal */}
      <StadiumAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

    </div>
  );
};

interface StatComparisonRowProps {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeRatio: number;
  awayRatio: number;
}

const StatComparisonRow: React.FC<StatComparisonRowProps> = ({
  label,
  homeValue,
  awayValue,
  homeRatio,
  awayRatio
}) => {
  const total = Math.max(1, homeRatio + awayRatio);
  const homePercent = Math.round((homeRatio / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
        <span className="text-emerald-400">{homeValue}</span>
        <span className="text-slate-400 uppercase text-[11px] font-black">{label}</span>
        <span className="text-blue-400">{awayValue}</span>
      </div>
      <div className="flex h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-[1px]">
        <div
          className="bg-emerald-500 h-full rounded-l-full transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-blue-500 h-full rounded-r-full transition-all duration-300"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
};
