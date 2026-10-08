import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MatchResult, MatchEvent, Player, PlayerMatchRating } from '../types';
import { getPositionBadgeColor } from '../utils/formatters';
import { getPlayerAvatarUrl } from '../data/playerAvatars';
import { sound } from '../utils/audioSynth';
import { 
  Flame, 
  Shield, 
  Award, 
  Volume2, 
  VolumeX, 
  Activity, 
  Sparkles,
  Eye,
  ChevronRight,
  X,
  Target
} from 'lucide-react';

interface MatchPitchVisualizerProps {
  matchResult: MatchResult;
  currentMinute: number;
  isPlaying: boolean;
  speedMultiplier: number;
  allPlayers: Player[];
  onPlayerSelect?: (player: Player, rating?: PlayerMatchRating) => void;
  isAudioHandledByParent?: boolean;
}

interface PitchPlayer {
  id: string;
  name: string;
  shortName: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  overall: number;
  teamId: string;
  teamSide: 'home' | 'away';
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  rating: number;
  goals: number;
  assists: number;
  hasYellowCard: boolean;
  hasRedCard: boolean;
  isPOTM: boolean;
  avatarUrl?: string;
  playerObj?: Player;
}

interface BallState {
  x: number;
  y: number;
  z: number; // height for lob/shot
  targetPlayerId?: string;
  action: 'idle' | 'pass' | 'shot' | 'goal' | 'save' | 'corner' | 'foul';
  trail: { x: number; y: number }[];
}

export const MatchPitchVisualizer: React.FC<MatchPitchVisualizerProps> = ({
  matchResult,
  currentMinute,
  isPlaying,
  speedMultiplier: _speedMultiplier,
  allPlayers,
  onPlayerSelect,
  isAudioHandledByParent = true
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<PitchPlayer | null>(null);
  const [showTacticalLanes, setShowTacticalLanes] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeBanner, setActiveBanner] = useState<{
    text: string;
    subtext?: string;
    type: 'goal' | 'save' | 'card' | 'corner' | 'action';
  } | null>(null);

  const prevMinuteRef = useRef(currentMinute);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Resolve 7 Home & 7 Away Players from playerRatings & allPlayers
  const { homePlayers, awayPlayers, allPitchPlayers } = useMemo(() => {
    const ratings = Object.values(matchResult.playerRatings || {});
    const homeRatings = ratings.filter(r => r.teamId === matchResult.homeTeamId);
    const awayRatings = ratings.filter(r => r.teamId === matchResult.awayTeamId);

    const buildRoster = (teamRatings: PlayerMatchRating[], side: 'home' | 'away'): PitchPlayer[] => {
      // Group by position
      const gks = teamRatings.filter(r => r.position === 'GK');
      const defs = teamRatings.filter(r => r.position === 'DEF');
      const mids = teamRatings.filter(r => r.position === 'MID');
      const atts = teamRatings.filter(r => r.position === 'ATT');

      // Guarantee 7 players
      const ordered: PlayerMatchRating[] = [];
      if (gks.length > 0) ordered.push(gks[0]);
      ordered.push(...defs);
      ordered.push(...mids);
      ordered.push(...atts);

      // If missing GK, place one
      if (!ordered.some(p => p.position === 'GK')) {
        const first = teamRatings[0];
        if (first) {
          ordered.unshift({ ...first, position: 'GK' });
        }
      }

      // Slice to 7
      const final7 = ordered.slice(0, 7);

      // Calculate anchor positions on pitch (1000 x 600)
      const gkX = side === 'home' ? 75 : 925;
      const defX = side === 'home' ? 220 : 780;
      const midX = side === 'home' ? 350 : 650;
      const attX = side === 'home' ? 450 : 550;

      const teamDefs = final7.filter(p => p.position === 'DEF');
      const teamMids = final7.filter(p => p.position === 'MID');
      const teamAtts = final7.filter(p => p.position === 'ATT');

      const getYPositions = (count: number): number[] => {
        if (count === 1) return [300];
        if (count === 2) return [200, 400];
        if (count === 3) return [170, 300, 430];
        if (count === 4) return [140, 245, 355, 460];
        return Array.from({ length: count }, (_, i) => 150 + (i * 300) / (count - 1));
      };

      const defYs = getYPositions(teamDefs.length);
      const midYs = getYPositions(teamMids.length);
      const attYs = getYPositions(teamAtts.length);

      let defIdx = 0;
      let midIdx = 0;
      let attIdx = 0;

      return final7.map((pr) => {
        const fullObj = allPlayers.find(p => p.id === pr.playerId);
        let posX = side === 'home' ? 300 : 700;
        let posY = 300;

        if (pr.position === 'GK') {
          posX = gkX;
          posY = 300;
        } else if (pr.position === 'DEF') {
          posX = defX;
          posY = defYs[defIdx] || 300;
          defIdx++;
        } else if (pr.position === 'MID') {
          posX = midX;
          posY = midYs[midIdx] || 300;
          midIdx++;
        } else if (pr.position === 'ATT') {
          posX = attX;
          posY = attYs[attIdx] || 300;
          attIdx++;
        }

        const events = matchResult.events.filter(e => e.minute <= currentMinute && e.playerId === pr.playerId);
        const hasYellow = events.some(e => e.type === 'yellow_card' || e.type === 'YELLOW_CARD');
        const hasRed = events.some(e => e.type === 'red_card' || e.type === 'RED_CARD');
        const goalsCount = events.filter(e => e.type === 'goal' || e.type === 'GOAL').length;

        const isPOTM = matchResult.playerOfTheMatch?.playerId === pr.playerId;
        const avatarUrl = fullObj ? getPlayerAvatarUrl(fullObj) : undefined;

        const nameParts = pr.playerName.trim().split(' ');
        const shortName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : pr.playerName;

        return {
          id: pr.playerId,
          name: pr.playerName,
          shortName: shortName.slice(0, 10),
          position: (pr.position as any) || 'MID',
          overall: fullObj?.overall || 80,
          teamId: pr.teamId || (side === 'home' ? matchResult.homeTeamId : matchResult.awayTeamId),
          teamSide: side,
          baseX: posX,
          baseY: posY,
          currentX: posX,
          currentY: posY,
          rating: pr.rating || 7.0,
          goals: goalsCount,
          assists: pr.assists || 0,
          hasYellowCard: hasYellow,
          hasRedCard: hasRed,
          isPOTM,
          avatarUrl,
          playerObj: fullObj,
        };
      });
    };

    const home = buildRoster(homeRatings, 'home');
    const away = buildRoster(awayRatings, 'away');
    return {
      homePlayers: home,
      awayPlayers: away,
      allPitchPlayers: [...home, ...away],
    };
  }, [matchResult, allPlayers, currentMinute]);

  // 2. Compute dynamic live ball & player displacement
  const { ball, activePlayerId, netBulge } = useMemo(() => {
    // Current event occurring at this exact minute
    const currentEvent = matchResult.events.find(e => e.minute === currentMinute);
    const phaseRatio = (currentMinute % 6) / 6;

    let ballX = 500;
    let ballY = 300;
    let ballZ = 0;
    let targetId: string | undefined;
    let action: BallState['action'] = 'pass';
    let activeId: string | undefined;
    let bulge: 'home' | 'away' | null = null;

    if (currentMinute === 0) {
      // Kickoff center
      ballX = 500;
      ballY = 300;
      action = 'idle';
    } else if (currentEvent && (currentEvent.type === 'goal' || currentEvent.type === 'GOAL')) {
      // Goal event! Ball in net
      const isHomeGoal = currentEvent.teamId === matchResult.homeTeamId;
      ballX = isHomeGoal ? 995 : 5;
      ballY = 270 + (currentMinute % 5) * 15;
      ballZ = 0;
      action = 'goal';
      bulge = isHomeGoal ? 'away' : 'home';
      activeId = currentEvent.playerId;
    } else if (currentEvent && (currentEvent.type === 'save' || currentEvent.type === 'SHOT_SAVED')) {
      // Shot saved by GK
      const isHomeDefending = currentEvent.teamId !== matchResult.homeTeamId;
      ballX = isHomeDefending ? 85 : 915;
      ballY = 285 + ((currentMinute % 3) - 1) * 35;
      action = 'save';
      const defendingTeam = isHomeDefending ? homePlayers : awayPlayers;
      const gk = defendingTeam.find(p => p.position === 'GK');
      activeId = gk?.id;
    } else if (currentEvent && (currentEvent.type === 'corner' || currentEvent.type === 'CORNER')) {
      // Corner kick
      const isHomeCorner = currentEvent.teamId === matchResult.homeTeamId;
      ballX = isHomeCorner ? 990 : 10;
      ballY = currentMinute % 2 === 0 ? 15 : 585;
      action = 'corner';
      activeId = currentEvent.playerId;
    } else if (currentEvent && (currentEvent.type === 'shot' || currentEvent.type === 'SHOT_MISSED' || currentEvent.type === 'NEAR_MISS')) {
      // Shot wide
      const isHomeShot = currentEvent.teamId === matchResult.homeTeamId;
      ballX = isHomeShot ? 980 : 20;
      ballY = 210 + (currentMinute % 2) * 180;
      action = 'shot';
      activeId = currentEvent.playerId;
    } else {
      // Regular open play passing chain
      // Alternates attacking momentum between home and away based on match stats
      const homePossession = matchResult.stats?.home?.possession || 50;
      const isHomeAttacking = (currentMinute % 10) < Math.round((homePossession / 100) * 10);
      const attackingSide = isHomeAttacking ? homePlayers : awayPlayers;

      // Select passer and receiver from outfield
      const outfield = attackingSide.filter(p => p.position !== 'GK');
      if (outfield.length > 0) {
        const passerIdx = Math.floor(currentMinute * 1.3) % outfield.length;
        const receiverIdx = (passerIdx + 1) % outfield.length;
        const passer = outfield[passerIdx];
        const receiver = outfield[receiverIdx];

        if (passer && receiver) {
          ballX = passer.baseX + (receiver.baseX - passer.baseX) * phaseRatio;
          ballY = passer.baseY + (receiver.baseY - passer.baseY) * phaseRatio;
          targetId = receiver.id;
          activeId = phaseRatio > 0.5 ? receiver.id : passer.id;
        }
      }
    }

    // Dynamic wave trail
    const trail = [
      { x: ballX - 12, y: ballY - 4 },
      { x: ballX - 22, y: ballY - 6 }
    ];

    return {
      ball: {
        x: Math.max(5, Math.min(995, ballX)),
        y: Math.max(10, Math.min(590, ballY)),
        z: ballZ,
        targetPlayerId: targetId,
        action,
        trail,
      },
      activePlayerId: activeId,
      netBulge: bulge,
    };
  }, [matchResult, currentMinute, homePlayers, awayPlayers]);

  // 3. Sound effects & Broadcast Event Banners on Minute Change
  useEffect(() => {
    if (prevMinuteRef.current === currentMinute) return;
    prevMinuteRef.current = currentMinute;

    const event = matchResult.events.find(e => e.minute === currentMinute);
    if (!event) return;

    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);

    const shouldPlaySound = soundEnabled && !isAudioHandledByParent;

    if (event.type === 'goal' || event.type === 'GOAL') {
      if (shouldPlaySound) {
        sound.playGoalRoar();
        sound.playGoalHorn();
      }
      setActiveBanner({
        text: `⚽ GOAL! ${event.playerName || 'Superstar'} scores!`,
        subtext: event.assistPlayerName ? `Assist by ${event.assistPlayerName}` : event.description,
        type: 'goal'
      });
    } else if (event.type === 'save' || event.type === 'SHOT_SAVED') {
      if (shouldPlaySound) {
        sound.playSave();
        sound.playCrowdGasp();
      }
      setActiveBanner({
        text: `🧤 SENSATIONAL SAVE!`,
        subtext: event.description,
        type: 'save'
      });
    } else if (event.type === 'yellow_card' || event.type === 'YELLOW_CARD') {
      if (shouldPlaySound) sound.playWhistle('foul');
      setActiveBanner({
        text: `🟨 YELLOW CARD: ${event.playerName}`,
        subtext: event.description,
        type: 'card'
      });
    } else if (event.type === 'red_card' || event.type === 'RED_CARD') {
      if (shouldPlaySound) sound.playWhistle('foul');
      setActiveBanner({
        text: `🟥 RED CARD ISSUED: ${event.playerName}`,
        subtext: event.description,
        type: 'card'
      });
    } else if (event.type === 'corner' || event.type === 'CORNER') {
      if (shouldPlaySound) sound.playKick('pass');
      setActiveBanner({
        text: `🚩 CORNER KICK: ${event.teamName || 'Attacking Team'}`,
        subtext: 'Dangerous set-piece whipped into the 6-yard box!',
        type: 'corner'
      });
    }

    bannerTimeoutRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 3800);
  }, [currentMinute, matchResult.events, soundEnabled]);

  const handlePlayerTokenClick = (p: PitchPlayer) => {
    sound.playClick();
    setSelectedPlayer(p);
    if (onPlayerSelect && p.playerObj) {
      const ratingObj = matchResult.playerRatings[p.id];
      onPlayerSelect(p.playerObj, ratingObj);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-[#06140b] shadow-2xl select-none">
      
      {/* ===== STADIUM ATMOSPHERIC LIGHTING & FLOODLIGHTS ===== */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ===== TOP PITCH CONTROLS & LIVE RADAR HUD ===== */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-black">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>2D TACTICAL MATCH RADAR</span>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            7v7 Real-Time Simulation
          </span>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setShowTacticalLanes(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              showTacticalLanes
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
            title="Toggle Tactical Pressure Lanes"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tactical Lanes</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setSoundEnabled(prev => !prev);
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title={soundEnabled ? 'Mute Pitch Audio' : 'Unmute Pitch Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ===== LIVE EVENT TOAST BANNER ===== */}
      {activeBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 animate-bounce duration-300">
          <div className={`px-5 py-2.5 rounded-2xl backdrop-blur-xl border-2 shadow-2xl flex items-center gap-3 ${
            activeBanner.type === 'goal'
              ? 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-emerald-400 text-white shadow-emerald-500/40'
              : activeBanner.type === 'save'
              ? 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border-blue-400 text-white shadow-blue-500/40'
              : 'bg-gradient-to-r from-amber-950/90 to-slate-900/90 border-amber-400 text-amber-200'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">{activeBanner.text}</p>
              {activeBanner.subtext && (
                <p className="text-[10px] text-slate-300 font-medium">{activeBanner.subtext}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN 2D FOOTBALL PITCH SVG ===== */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[1.8/1] max-h-[620px] overflow-hidden">
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full object-cover"
          style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.7))' }}
        >
          <defs>
            {/* Turf Gradient */}
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#124024" />
              <stop offset="50%" stopColor="#1a5531" />
              <stop offset="100%" stopColor="#103c20" />
            </linearGradient>

            {/* Alternating Grass Mowing Stripes */}
            <pattern id="mowingStripes" width="100" height="600" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="50" height="600" fill="#1b5a34" fillOpacity="0.45" />
              <rect x="50" y="0" width="50" height="600" fill="#154728" fillOpacity="0.45" />
            </pattern>

            {/* Ball Glow Filter */}
            <filter id="ballGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00FF66" floodOpacity="0.6" />
            </filter>

            {/* Home Glow */}
            <filter id="homeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10B981" floodOpacity="0.8" />
            </filter>

            {/* Away Glow */}
            <filter id="awayGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3B82F6" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Turf Surface */}
          <rect x="0" y="0" width="1000" height="600" fill="url(#grassGrad)" />
          <rect x="0" y="0" width="1000" height="600" fill="url(#mowingStripes)" />

          {/* Pitch Markings (White Lines) */}
          <g stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.88">
            {/* Outer Perimeter */}
            <rect x="20" y="20" width="960" height="560" rx="8" />

            {/* Halfway Line */}
            <line x1="500" y1="20" x2="500" y2="580" strokeWidth="3" />

            {/* Center Circle & Spot */}
            <circle cx="500" cy="300" r="85" />
            <circle cx="500" cy="300" r="5" fill="#ffffff" />

            {/* Left Penalty Area (18-yard equivalent) */}
            <rect x="20" y="140" width="160" height="320" />
            {/* Left 6-Yard Box */}
            <rect x="20" y="220" width="60" height="160" />
            {/* Left Penalty Spot */}
            <circle cx="120" cy="300" r="4" fill="#ffffff" />
            {/* Left Penalty Arc */}
            <path d="M 180 240 A 75 75 0 0 1 180 360" />

            {/* Right Penalty Area */}
            <rect x="820" y="140" width="160" height="320" />
            {/* Right 6-Yard Box */}
            <rect x="920" y="220" width="60" height="160" />
            {/* Right Penalty Spot */}
            <circle cx="880" cy="300" r="4" fill="#ffffff" />
            {/* Right Penalty Arc */}
            <path d="M 820 240 A 75 75 0 0 0 820 360" />

            {/* Corner Arcs */}
            <path d="M 20 40 A 20 20 0 0 0 40 20" />
            <path d="M 960 20 A 20 20 0 0 0 980 40" />
            <path d="M 20 560 A 20 20 0 0 1 40 580" />
            <path d="M 960 580 A 20 20 0 0 1 980 560" />
          </g>

          {/* Left Goal Net Depth (Outside goal line) */}
          <g
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="#ffffff"
            fillOpacity={netBulge === 'home' ? '0.25' : '0.08'}
            opacity="0.8"
          >
            <rect x="-15" y="235" width="35" height="130" strokeDasharray="3 3" />
            <line x1="-15" y1="235" x2="20" y2="235" strokeWidth="4" />
            <line x1="-15" y1="365" x2="20" y2="365" strokeWidth="4" />
            <line x1="-15" y1="235" x2="-15" y2="365" strokeWidth="4" />
          </g>

          {/* Right Goal Net Depth */}
          <g
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="#ffffff"
            fillOpacity={netBulge === 'away' ? '0.25' : '0.08'}
            opacity="0.8"
          >
            <rect x="980" y="235" width="35" height="130" strokeDasharray="3 3" />
            <line x1="980" y1="235" x2="1015" y2="235" strokeWidth="4" />
            <line x1="980" y1="365" x2="1015" y2="365" strokeWidth="4" />
            <line x1="1015" y1="235" x2="1015" y2="365" strokeWidth="4" />
          </g>

          {/* Tactical Momentum Lanes (Optional Toggle) */}
          {showTacticalLanes && (
            <g opacity="0.18">
              <path
                d="M 220 20 L 220 580 M 350 20 L 350 580 M 450 20 L 450 580"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <path
                d="M 550 20 L 550 580 M 650 20 L 650 580 M 780 20 L 780 580"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              {/* Attacking Arrow */}
              <path
                d="M 450 300 L 550 300"
                stroke="#00FF66"
                strokeWidth="4"
                markerEnd="url(#arrow)"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Ball Motion Trail */}
          {ball.trail.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={5 - i * 1.5}
              fill="#ffffff"
              opacity={0.35 - i * 0.12}
            />
          ))}

          {/* Animated Football */}
          <g
            transform={`translate(${ball.x}, ${ball.y})`}
            filter="url(#ballGlow)"
            className="transition-all duration-300 ease-out"
          >
            {/* Drop Shadow */}
            <ellipse cx="0" cy="5" rx="7" ry="3" fill="#000000" opacity="0.6" />
            {/* Ball Body */}
            <circle cx="0" cy="0" r="7.5" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
            {/* Football pentagon pattern */}
            <circle cx="0" cy="0" r="3" fill="#111827" />
          </g>

          {/* 14 Tactical Player Tokens */}
          {allPitchPlayers.map((p) => {
            const isSelected = selectedPlayer?.id === p.id;
            const isBallCarrier = activePlayerId === p.id;
            const badge = getPositionBadgeColor(p.position);

            return (
              <g
                key={p.id}
                transform={`translate(${p.baseX}, ${p.baseY})`}
                onClick={() => handlePlayerTokenClick(p)}
                className="cursor-pointer transition-transform duration-300 hover:scale-110"
              >
                {/* Active Player Beacon Ring */}
                {(isBallCarrier || isSelected) && (
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill="none"
                    stroke={isBallCarrier ? '#00FF66' : '#FFD700'}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="animate-spin"
                    opacity="0.9"
                  />
                )}

                {/* Outer Colored Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill={p.teamSide === 'home' ? '#064e3b' : '#1e3a8a'}
                  stroke={p.teamSide === 'home' ? '#10B981' : '#3B82F6'}
                  strokeWidth="2.5"
                  filter={p.teamSide === 'home' ? 'url(#homeGlow)' : 'url(#awayGlow)'}
                />

                {/* Inner Badge / Avatar */}
                {p.avatarUrl ? (
                  <image
                    href={p.avatarUrl}
                    x="-14"
                    y="-14"
                    width="28"
                    height="28"
                    clipPath="circle(13px at 14px 14px)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {p.position}
                  </text>
                )}

                {/* Role / Rating Tag */}
                <rect
                  x="-12"
                  y="18"
                  width="24"
                  height="12"
                  rx="4"
                  fill="#0a0f1d"
                  stroke={p.teamSide === 'home' ? '#10B981' : '#3B82F6'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="27"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {p.overall}
                </text>

                {/* Player Short Name */}
                <text
                  x="0"
                  y="40"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {p.shortName}
                </text>

                {/* Live Goal Tag if player scored */}
                {p.goals > 0 && (
                  <g transform="translate(11, -12)">
                    <circle cx="0" cy="0" r="7" fill="#000000" stroke="#00FF66" strokeWidth="1" />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="8">
                      ⚽
                    </text>
                  </g>
                )}

                {/* Card Tag if yellow/red */}
                {(p.hasYellowCard || p.hasRedCard) && (
                  <rect
                    x="-18"
                    y="-16"
                    width="6"
                    height="9"
                    rx="1"
                    fill={p.hasRedCard ? '#EF4444' : '#EAB308'}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                  />
                )}

                {/* POTM Star */}
                {p.isPOTM && (
                  <text x="-15" y="-14" fontSize="12" fill="#FBBF24">
                    ★
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ===== INTERACTIVE PLAYER SPOTLIGHT OVERLAY (ON TOKEN CLICK) ===== */}
        {selectedPlayer && (
          <div className="absolute bottom-4 left-4 z-40 max-w-sm w-[90%] sm:w-80 bg-slate-950/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getPositionBadgeColor(selectedPlayer.position).bg} ${getPositionBadgeColor(selectedPlayer.position).text} ${getPositionBadgeColor(selectedPlayer.position).border}`}>
                  {selectedPlayer.position}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {selectedPlayer.teamSide === 'home' ? matchResult.homeTeamName : matchResult.awayTeamName}
                </span>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                {selectedPlayer.avatarUrl ? (
                  <img
                    src={selectedPlayer.avatarUrl}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-xl text-emerald-400">
                    {selectedPlayer.position}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white leading-tight">{selectedPlayer.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {selectedPlayer.overall} OVR
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    ★ {selectedPlayer.rating} Rating
                  </span>
                </div>
              </div>
            </div>

            {/* In-Match Stats */}
            <div className="grid grid-cols-3 gap-2 bg-[#0A0D1A] rounded-xl p-2.5 text-center text-xs">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">GOALS</p>
                <p className="text-sm font-black text-white">{selectedPlayer.goals}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">ASSISTS</p>
                <p className="text-sm font-black text-teal-300">{selectedPlayer.assists}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">IMPACT</p>
                <p className="text-sm font-black text-amber-400 font-mono">
                  {selectedPlayer.rating >= 8.0 ? 'Elite' : selectedPlayer.rating >= 7.0 ? 'Solid' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===== BOTTOM MOMENTUM BAR ===== */}
      <div className="relative z-20 px-5 py-3 bg-slate-950/90 border-t border-emerald-500/30 flex items-center justify-between text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>{matchResult.homeTeamName}</span>
          <span className="text-emerald-400 font-mono font-black">
            {matchResult.stats?.home?.possession || 50}% Poss.
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>Shots: {matchResult.stats?.home?.shots || 0} - {matchResult.stats?.away?.shots || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-mono font-black">
            {matchResult.stats?.away?.possession || 50}% Poss.
          </span>
          <span>{matchResult.awayTeamName}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        </div>
      </div>

    </div>
  );
};
