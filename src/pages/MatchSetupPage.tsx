import React, { useState, useEffect } from 'react';
import { Team, Player } from '../types';
import { calculateTeamOverall, getPositionBadgeColor, getRatingBadgeStyle } from '../utils/formatters';
import { useSession } from '../contexts/SessionContext';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Play, 
  Swords, 
  ArrowLeft, 
  ChevronDown,
  Users,
  Radio
} from 'lucide-react';
import { sound } from '../utils/audioSynth';
import { StadiumAudioModal } from '../components/StadiumAudioModal';

interface MatchSetupPageProps {
  currentTeam: Team | null;
  allTeams: Team[];
  allPlayers: Player[];
  preselectedOpponentId?: string;
  onSimulate: (opponentTeamId: string) => void;
  onBack: () => void;
  onGoToDashboard?: () => void;
  isHost?: boolean;
}

export const MatchSetupPage: React.FC<MatchSetupPageProps> = ({
  currentTeam,
  allTeams,
  allPlayers,
  preselectedOpponentId,
  onSimulate,
  onBack,
  onGoToDashboard,
  isHost: isHostProp = true,
}) => {
  const { currentSession, broadcastNavigation } = useSession();
  const isHost = Boolean(
    isHostProp ||
    currentSession?.gameMode === 'ai' ||
    !currentSession ||
    currentSession?.hostUserId === 'human-user'
  );
  const [squadCounts, setSquadCounts] = useState<Record<string, number>>({});
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  useEffect(() => {
    if (!currentSession) return;
    if (currentSession.gameMode === 'ai') {
      const counts: Record<string, number> = {};
      (allTeams || []).forEach((t: any) => {
        counts[t.id] = (t.startingSeven?.length || 0) + (t.bench?.length || 0);
      });
      setSquadCounts(counts);
      return;
    }
    supabase
      .from('squads')
      .select('team_id')
      .eq('session_id', currentSession.id)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          counts[r.team_id] = (counts[r.team_id] || 0) + 1;
        });
        setSquadCounts(counts);
      });
  }, [currentSession, allTeams]);

  const incompleteTeams = currentSession
    ? (allTeams || []).filter(t => (squadCounts[t.id] || 0) < 7)
    : [];
  const canSimulate = !currentSession || incompleteTeams.length === 0;

  const handleReturnToAuction = async () => {
    if (currentSession && isHost) {
      await supabase
        .from('game_sessions')
        .update({ status: 'AUCTION' })
        .eq('id', currentSession.id);
      await broadcastNavigation('auction');
    }
    if (onBack) onBack();
  };
  // If user hasn't created a squad or room yet, render an informative prompt instead of crashing
  if (!currentTeam) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center text-4xl shadow-glow-purple">
          ⚔️
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#FF1744] font-display">
            BATTLE ARENA • SQUAD REQUIRED
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase font-display">
            NO ACTIVE TEAM FOUND
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You need a club squad to enter the Battle Arena. Host a room or join with a room code to draft your superstar lineup!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onGoToDashboard || onBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF1744] to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow-cyan hover:brightness-110 active:scale-95 transition"
          >
            Go to Battle Hub
          </button>
        </div>
      </div>
    );
  }

  // Fallback Sparring Rival if no human opponent is currently in the room
  const fallbackOpponent: Team = {
    id: 'ai-sparring-bot',
    name: 'Apex AI Rivals',
    shortCode: 'AI',
    teamName: 'Apex AI Rivals',
    abbreviation: 'AI',
    manager: 'Sparring Bot',
    budget: 130,
    badgeIcon: '🤖',
    badge: '🤖',
    startingSeven: [],
    bench: [],
    formation: '1-2-2-2',
  };

  const opponentOptions = (allTeams || []).filter((t) => t && t.id !== currentTeam.id);
  const activeOpponents = opponentOptions.length > 0 ? opponentOptions : [fallbackOpponent];

  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(
    preselectedOpponentId && preselectedOpponentId !== currentTeam.id
      ? preselectedOpponentId
      : activeOpponents[0]?.id || fallbackOpponent.id
  );

  const opponentTeam =
    allTeams.find((t) => t && t.id === selectedOpponentId) ||
    activeOpponents.find((t) => t && t.id === selectedOpponentId) ||
    activeOpponents[0] ||
    fallbackOpponent;

  // Starting players
  const homeStarters = (currentTeam.startingSeven || [])
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const awayStarters = (opponentTeam.startingSeven || [])
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  // Guarantee 7-a-side lineup display even if drafted roster has open slots
  const getFullRoster = (team: Team | undefined, starters: Player[]): Player[] => {
    const teamId = team?.id || 'club';
    if (starters.length >= 7) return starters.slice(0, 7);
    const roles: Array<'GK' | 'DEF' | 'DEF' | 'MID' | 'MID' | 'ATT' | 'ATT'> = [
      'GK', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT'
    ];
    const result = [...starters];
    while (result.length < 7) {
      const idx = result.length;
      const pos = roles[idx] || 'MID';
      const label = pos === 'GK' ? 'Goalkeeper' : pos === 'DEF' ? 'Defender' : pos === 'MID' ? 'Midfielder' : 'Striker';
      result.push({
        id: `${teamId}-reserve-${idx + 1}`,
        name: `${label} #${idx + 1}`,
        shortName: `${label} #${idx + 1}`,
        number: idx + 1,
        position: pos,
        nationality: 'Club',
        overall: 76,
        pace: 75,
        shooting: pos === 'ATT' ? 80 : 70,
        passing: pos === 'MID' ? 80 : 72,
        dribbling: 74,
        defending: pos === 'DEF' ? 80 : (pos === 'GK' ? 30 : 65),
        physical: 75,
        goalkeeping: pos === 'GK' ? 80 : 15,
        form: 80,
        stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 7.0 }
      });
    }
    return result;
  };

  const displayHomeStarters = getFullRoster(currentTeam, homeStarters);
  const displayAwayStarters = getFullRoster(opponentTeam, awayStarters);

  const homeOvr = calculateTeamOverall(displayHomeStarters);
  const awayOvr = calculateTeamOverall(displayAwayStarters);

  // Unit calculations
  const calculateUnit = (players: Player[], pos: string, attr: keyof Player) => {
    const list = players.filter((p) => p.position === pos);
    if (list.length === 0) return 75;
    return Math.round(list.reduce((acc, p) => acc + (Number(p[attr]) || p.overall), 0) / list.length);
  };

  const homeAtt = calculateUnit(displayHomeStarters, 'ATT', 'shooting');
  const homeMid = calculateUnit(displayHomeStarters, 'MID', 'passing');
  const homeDef = calculateUnit(displayHomeStarters, 'DEF', 'defending');
  const homeGk = calculateUnit(displayHomeStarters, 'GK', 'goalkeeping');

  const awayAtt = calculateUnit(displayAwayStarters, 'ATT', 'shooting');
  const awayMid = calculateUnit(displayAwayStarters, 'MID', 'passing');
  const awayDef = calculateUnit(displayAwayStarters, 'DEF', 'defending');
  const awayGk = calculateUnit(displayAwayStarters, 'GK', 'goalkeeping');

  return (
    <div className="p-2 sm:p-4 max-w-5xl mx-auto space-y-3 pb-24 sm:pb-8 animate-fadeIn">
      
      {/* Back button and Matchday header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Standings</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setIsAudioModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-black hover:bg-emerald-900/40 transition shadow-glow-emerald"
            title="Adjust Stadium Crowd Audio & SFX"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="hidden sm:inline">STADIUM SOUND</span>
          </button>

          {isHost ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Select Rival:</span>
            <div className="relative">
              <select
                value={selectedOpponentId}
                onChange={(e) => setSelectedOpponentId(e.target.value)}
                className="appearance-none bg-[#090f14] border border-slate-700 text-xs font-bold text-white py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                {activeOpponents.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name || opt.teamName} ({opt.manager || 'Manager'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0D1A] border border-[#FF1744]/30 text-xs font-mono font-bold text-[#FF1744]">
            <span className="w-2 h-2 rounded-full bg-[#FF1744] animate-pulse" />
            <span>OFFICIAL ROOM FIXTURE</span>
          </div>
        )}
        </div>
      </div>

      {/* MATCH FIXTURE MAIN BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111e28] via-[#0c161e] to-[#080d12] border-2 border-emerald-500/40 p-3.5 sm:p-5 shadow-2xl">
        <div className="text-center mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            OFFICIAL ARENA CLASH
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            BATTLE ARENA SETUP
          </h1>
        </div>

        {/* Head-to-Head Clash Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 lg:gap-4 items-center">
          
          {/* Home Team */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-2xl shadow-lg border border-emerald-300">
                  {currentTeam.badgeIcon || currentTeam.badge || '⚡'}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    HOME TEAM
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">{currentTeam.name || currentTeam.teamName}</h2>
                  <p className="text-[11px] text-slate-400">Manager: {currentTeam.manager || 'You'}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center">
                <span className="text-xl font-black text-emerald-400 leading-none">{homeOvr}</span>
                <span className="text-[8px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 font-semibold mb-2 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-emerald-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1">
              {displayHomeStarters.map((p) => {
                const posBadge = getPositionBadgeColor(p.position);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-5 text-center text-[10px] font-black text-slate-400 flex-shrink-0">
                        #{p.number || 1}
                      </span>
                      <span className="font-extrabold text-white truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono border flex-shrink-0 ${getRatingBadgeStyle(p.overall)}`}>
                        {p.overall}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                        {p.position}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400 text-xs">{homeAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400 text-xs">{homeMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400 text-xs">{homeDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400 text-xs">{homeGk}</span>
              </div>
            </div>
          </div>

          {/* VS Center Pillar */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-1">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-black text-base text-emerald-400 shadow-xl">
              VS
            </div>
            <div className="flex items-center gap-1 mt-1 text-[9px] uppercase font-black tracking-wider text-slate-400">
              <Swords className="w-3 h-3 text-emerald-400" />
              <span>Clash</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-3.5 sm:p-4 rounded-2xl border border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-2xl shadow-lg border border-blue-400">
                  {opponentTeam.badgeIcon || opponentTeam.badge || '🤖'}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">
                    AWAY TEAM
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">{opponentTeam.name || opponentTeam.teamName}</h2>
                  <p className="text-[11px] text-slate-400">Manager: {opponentTeam.manager || 'AI'}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-blue-950/80 border border-blue-500/40 text-center">
                <span className="text-xl font-black text-blue-400 leading-none">{awayOvr}</span>
                <span className="text-[8px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 font-semibold mb-2 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-blue-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1">
              {displayAwayStarters.map((p) => {
                const posBadge = getPositionBadgeColor(p.position);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-5 text-center text-[10px] font-black text-slate-400 flex-shrink-0">
                        #{p.number || 1}
                      </span>
                      <span className="font-extrabold text-white truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono border flex-shrink-0 ${getRatingBadgeStyle(p.overall)}`}>
                        {p.overall}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${posBadge.bg} ${posBadge.text} ${posBadge.border}`}>
                        {p.position}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400 text-xs">{awayAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400 text-xs">{awayMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400 text-xs">{awayDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1 rounded-lg">
                <span className="text-slate-400 block text-[8px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400 text-xs">{awayGk}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Primary Call to Action */}
        <div className="mt-4 flex flex-col items-center justify-center space-y-2.5">
          {!canSimulate && (
            <div className="max-w-md w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center space-y-1 shadow-lg">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                ⚠️ SIMULATION LOCKED: MINIMUM 7 PLAYERS REQUIRED
              </span>
              <p className="text-[11px] text-slate-300">
                All teams must have at least 7 players before matches can be simulated.
                {incompleteTeams.length > 0 && (
                  <span className="block mt-1 text-amber-300 font-mono">
                    Short: {incompleteTeams.map(t => `${t.name || t.teamName || 'Team'}: ${squadCounts[t.id] || 0}/7`).join(', ')}
                  </span>
                )}
              </p>
            </div>
          )}

          {isHost ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
              {currentSession && (
                <button
                  onClick={handleReturnToAuction}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A0D1A] hover:bg-slate-800 border border-[#FF1744]/40 text-[#FF1744] font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>🔙 RETURN TO LIVE AUCTION</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (!canSimulate) return;
                  sound.playWhistle('kickoff');
                  sound.startStadiumAmbiance();
                  onSimulate(opponentTeam.id);
                }}
                disabled={!canSimulate}
                className={`w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl active:scale-95 group ${
                  canSimulate
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-125" />
                <span>{canSimulate ? 'SIMULATE MATCH' : 'ROSTERS INCOMPLETE'}</span>
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto min-w-[300px] flex flex-col items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-[#0A0E1A] border border-[#FF1744]/40 text-center shadow-glow-cyan animate-pulse">
              <div className="flex items-center gap-2 text-[#FF1744] font-black text-xs uppercase tracking-wider font-display">
                <span className="w-2 h-2 rounded-full bg-[#FF1744] animate-ping" />
                <span>LOBBY FIXTURE VIEW ONLY</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Waiting for room host to initiate match simulation...
              </p>
              <span className="text-[9px] text-slate-500 font-mono">
                Only the host can launch and simulate arena matches
              </span>
            </div>
          )}
          {isHost && canSimulate && (
            <p className="text-[11px] text-slate-400 text-center">
              Real simulation engine evaluates tactical attributes, form, and match momentum.
            </p>
          )}
        </div>

      </div>

      {/* STICKY BOTTOM ACTION BAR: Guarantees Simulate button is never hidden below screen fold on mobile & laptop */}
      <div className="sticky bottom-2 z-30 bg-[#0A0D1A]/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/90 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="truncate">
            <p className="text-xs font-black text-white uppercase tracking-wider font-display truncate">
              {currentTeam.name || currentTeam.teamName} <span className="text-emerald-400">VS</span> {opponentTeam.name || opponentTeam.teamName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {canSimulate ? 'Ready to kick off arena simulation' : 'Waiting for full rosters (7/7 min)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          {currentSession && isHost && (
            <button
              onClick={handleReturnToAuction}
              className="px-3.5 py-2.5 rounded-xl bg-[#0A0D1A] hover:bg-slate-800 border border-[#FF1744]/40 text-[#FF1744] font-bold text-xs uppercase tracking-wider transition active:scale-95 whitespace-nowrap"
            >
              🔙 AUCTION
            </button>
          )}
          {isHost ? (
            <button
              onClick={() => {
                if (!canSimulate) return;
                sound.playWhistle('kickoff');
                sound.startStadiumAmbiance();
                onSimulate(opponentTeam.id);
              }}
              disabled={!canSimulate}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 whitespace-nowrap ${
                canSimulate
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{canSimulate ? 'SIMULATE MATCH' : 'ROSTERS INCOMPLETE'}</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-[#0A0E1A] border border-[#FF1744]/40 text-[#FF1744] text-xs font-mono font-bold animate-pulse text-center">
              Waiting for Host to simulate...
            </div>
          )}
        </div>
      </div>

      {/* Stadium Audio & Crowd Soundboard Modal */}
      <StadiumAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

    </div>
  );
};
