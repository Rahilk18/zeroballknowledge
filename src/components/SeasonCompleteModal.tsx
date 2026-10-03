import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Medal, ArrowRight, RotateCcw, Globe, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import type { LeagueStanding, ActiveTab } from '../types';

interface SeasonCompleteModalProps {
  standings: LeagueStanding[];
  onStartNewGame: () => void;
  onJoinAnotherGame: () => void;
  onViewLeaderboard: () => void;
}

export function SeasonCompleteModal({
  standings,
  onStartNewGame,
  onJoinAnotherGame,
  onViewLeaderboard
}: SeasonCompleteModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { currentSession, myTeam } = useSession();
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);
  const [awardedSuccess, setAwardedSuccess] = useState(false);
  const awardProcessed = useRef(false);

  // Sort standings by points, GD, GF
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  const champion = sorted[0];
  const runnerUp = sorted[1];
  const thirdPlace = sorted[2];

  const myTeamId = myTeam?.id;
  const myPosition = sorted.findIndex(s => s.teamId === myTeamId) + 1;

  useEffect(() => {
    // Fire festive victory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch {}

    // Calculate points to award
    if (!awardProcessed.current && user) {
      awardProcessed.current = true;
      let pts = 0;
      if (myPosition === 1) pts = 25;
      else if (myPosition === 2) pts = 15;
      else if (myPosition === 3) pts = 10;
      else pts = 5;

      const myStanding = sorted.find(s => s.teamId === myTeamId);
      if (myStanding) {
        pts += (myStanding.won * 3) + myStanding.drawn;
      }

      setPointsAwarded(pts);

      // Save to Supabase
      saveResultsToSupabase(pts, myPosition);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveResultsToSupabase = async (pts: number, position: number) => {
    if (!user) return;
    try {
      // 1. Insert into game_results
      if (currentSession) {
        await supabase.from('game_results').insert({
          session_id: currentSession.id,
          user_id: user.id,
          team_id: myTeam?.id,
          final_position: position,
          points_earned: pts
        });

        // 2. Mark session as COMPLETED
        await supabase
          .from('game_sessions')
          .update({ status: 'COMPLETED', ended_at: new Date().toISOString() })
          .eq('id', currentSession.id);
      }

      // 3. Update user profile permanent career points (fetch latest to avoid stale data)
      const { data: currentProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const basePoints = currentProf?.total_points ?? profile?.totalPoints ?? 0;
      const baseGames = currentProf?.games_played ?? profile?.gamesPlayed ?? 0;
      const baseWins = currentProf?.wins ?? profile?.wins ?? 0;
      const baseDraws = currentProf?.draws ?? profile?.draws ?? 0;
      const baseLosses = currentProf?.losses ?? profile?.losses ?? 0;
      const baseGoals = currentProf?.goals ?? profile?.goals ?? 0;

      const myStanding = sorted.find(s => s.teamId === myTeamId);
      const wins = myStanding?.won || 0;
      const draws = myStanding?.drawn || 0;
      const losses = myStanding?.lost || 0;
      const goals = myStanding?.goalsFor || 0;

      const { error: profUpdateErr } = await supabase
        .from('profiles')
        .update({
          total_points: basePoints + pts,
          games_played: baseGames + 1,
          wins: baseWins + wins,
          draws: baseDraws + draws,
          losses: baseLosses + losses,
          goals: baseGoals + goals,
        })
        .eq('user_id', user.id);

      if (profUpdateErr) {
        console.error('Error updating profile career stats:', profUpdateErr);
      }

      await refreshProfile();
      setAwardedSuccess(true);
    } catch (e) {
      console.error('Error saving game results:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#111e28] via-[#0c141c] to-[#070b0e] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn my-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 rounded-3xl text-4xl shadow-xl shadow-amber-500/30 border border-amber-300 mb-1">
            🏆
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block">
            SEASON OFFICIAL RESULTS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
            SEASON COMPLETE
          </h1>
          <p className="text-xs text-slate-300">
            Tournament concluded • Permanent manager career points have been awarded
          </p>
        </div>

        {/* Podium: 1st, 2nd, 3rd */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {/* Runner-up (2nd) */}
          <div className="bg-[#121c24] border border-slate-700/60 rounded-2xl p-4 text-center flex flex-col justify-between order-1 sm:order-1">
            <div>
              <span className="text-2xl mb-1 block">🥈</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                RUNNER-UP
              </span>
              <h3 className="font-extrabold text-white text-sm mt-1 truncate">
                {runnerUp?.teamName || '—'}
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-amber-400 font-bold">{runnerUp?.points || 0} pts</span>
              <p className="text-[10px] text-slate-500">{runnerUp?.won || 0}W • {runnerUp?.goalsFor || 0}GF</p>
            </div>
          </div>

          {/* Champion (1st) */}
          <div className="bg-gradient-to-b from-amber-950/40 via-[#18232c] to-amber-950/30 border-2 border-amber-500/80 rounded-2xl p-4 text-center flex flex-col justify-between shadow-xl shadow-amber-500/10 order-2 sm:order-2 transform -translate-y-2">
            <div>
              <span className="text-3xl mb-1 block animate-bounce">👑</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                CHAMPION
              </span>
              <h3 className="font-black text-white text-base mt-1.5 truncate">
                {champion?.teamName || '—'}
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-500/30 text-xs font-mono">
              <span className="text-amber-300 font-black text-sm">{champion?.points || 0} pts</span>
              <p className="text-[10px] text-amber-400/80 font-bold">{champion?.won || 0} Wins • {champion?.goalsFor || 0} Goals</p>
            </div>
          </div>

          {/* Third Place (3rd) */}
          <div className="bg-[#121c24] border border-slate-700/60 rounded-2xl p-4 text-center flex flex-col justify-between order-3 sm:order-3">
            <div>
              <span className="text-2xl mb-1 block">🥉</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                3RD PLACE
              </span>
              <h3 className="font-extrabold text-white text-sm mt-1 truncate">
                {thirdPlace?.teamName || '—'}
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-amber-400 font-bold">{thirdPlace?.points || 0} pts</span>
              <p className="text-[10px] text-slate-500">{thirdPlace?.won || 0}W • {thirdPlace?.goalsFor || 0}GF</p>
            </div>
          </div>
        </div>

        {/* User Reward Card */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg">
              +{pointsAwarded}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                Career Points Earned
              </h4>
              <p className="text-xs text-emerald-300">
                Finish Position: #{myPosition} • Added permanently to profile
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs rounded-lg border border-emerald-500/30">
            SAVED ✓
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={onStartNewGame}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Create New Game</span>
          </button>

          <button
            onClick={onJoinAnotherGame}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-700"
          >
            <Users className="w-4 h-4" />
            <span>Join Another Game</span>
          </button>

          <button
            onClick={onViewLeaderboard}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20"
          >
            <Globe className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          💰 The €100M transfer budget was for this room only and resets to fresh €100.0M for your next game. Your manager career ELO points persist permanently!
        </p>
      </div>
    </div>
  );
}

export default SeasonCompleteModal;
