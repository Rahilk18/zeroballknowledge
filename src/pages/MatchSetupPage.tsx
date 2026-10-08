import React, { useState, useEffect } from 'react';
import { Team, Player } from '../types';
import { calculateTeamOverall } from '../utils/formatters';
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      
      {/* Back button and Matchday header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-black hover:bg-emerald-900/40 transition shadow-glow-emerald"
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
                className="appearance-none bg-[#090f14] border border-slate-700 text-xs font-bold text-white py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-emerald-500"
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111e28] via-[#0c161e] to-[#080d12] border-2 border-emerald-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            OFFICIAL ARENA CLASH
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 tracking-tight">
            BATTLE ARENA SETUP
          </h1>
        </div>

        {/* Head-to-Head Clash Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          
          {/* Home Team */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-3xl shadow-lg border border-emerald-300">
                  {currentTeam.badgeIcon || currentTeam.badge || '⚡'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    HOME TEAM
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{currentTeam.name || currentTeam.teamName}</h2>
                  <p className="text-xs text-slate-400">Manager: {currentTeam.manager || 'You'}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center">
                <span className="text-2xl font-black text-emerald-400 leading-none">{homeOvr}</span>
                <span className="text-[9px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-emerald-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1.5">
              {displayHomeStarters.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-[10px] font-black text-slate-400">
                      #{p.number || 1}
                    </span>
                    <span className="font-extrabold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {p.position}
                    </span>
                    <span className="font-black text-emerald-400">{p.overall}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400">{homeAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400">{homeMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400">{homeDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400">{homeGk}</span>
              </div>
            </div>
          </div>

          {/* VS Center Pillar */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-black text-lg text-emerald-400 shadow-xl">
              VS
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] uppercase font-black tracking-wider text-slate-400">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clash</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="lg:col-span-5 bg-[#090f14]/90 p-5 sm:p-6 rounded-3xl border border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-3xl shadow-lg border border-blue-400">
                  {opponentTeam.badgeIcon || opponentTeam.badge || '🤖'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    AWAY TEAM
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{opponentTeam.name || opponentTeam.teamName}</h2>
                  <p className="text-xs text-slate-400">Manager: {opponentTeam.manager || 'AI'}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-center">
                <span className="text-2xl font-black text-blue-400 leading-none">{awayOvr}</span>
                <span className="text-[9px] font-black uppercase text-slate-400">OVR</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-semibold mb-3 flex items-center justify-between">
              <span>Formation: <strong className="text-white">1-2-2-2 (7 Players)</strong></span>
              <span className="text-blue-400 font-bold">100% Match Ready</span>
            </div>

            {/* Starting 7 Roster */}
            <div className="space-y-1.5">
              {displayAwayStarters.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center text-[10px] font-black text-slate-400">
                      #{p.number || 1}
                    </span>
                    <span className="font-extrabold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {p.position}
                    </span>
                    <span className="font-black text-blue-400">{p.overall}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unit Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">ATT</span>
                <span className="font-black text-rose-400">{awayAtt}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">MID</span>
                <span className="font-black text-emerald-400">{awayMid}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">DEF</span>
                <span className="font-black text-blue-400">{awayDef}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">GK</span>
                <span className="font-black text-amber-400">{awayGk}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Primary Call to Action */}
        <div className="mt-8 flex flex-col items-center justify-center space-y-4">
          {!canSimulate && (
            <div className="max-w-md w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center space-y-1.5 shadow-lg">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              {currentSession && (
                <button
                  onClick={handleReturnToAuction}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0A0D1A] hover:bg-slate-800 border border-[#FF1744]/40 text-[#FF1744] font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2"
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
                className={`w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all duration-300 shadow-2xl active:scale-95 group ${
                  canSimulate
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-125" />
                <span>{canSimulate ? 'SIMULATE MATCH' : 'ROSTERS INCOMPLETE'}</span>
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto min-w-[340px] flex flex-col items-center justify-center gap-2.5 px-8 py-5 rounded-2xl bg-[#0A0E1A] border border-[#FF1744]/40 text-center shadow-glow-cyan animate-pulse">
              <div className="flex items-center gap-2 text-[#FF1744] font-black text-xs uppercase tracking-wider font-display">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] animate-ping" />
                <span>LOBBY FIXTURE VIEW ONLY</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Waiting for room host to initiate match simulation...
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Only the host can launch and simulate arena matches
              </span>
            </div>
          )}
          {isHost && canSimulate && (
            <p className="text-xs text-slate-400">
              Real simulation engine evaluates tactical attributes, form, and match momentum.
            </p>
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
