import { supabase } from '../lib/supabase';
import type { Team, GameSession } from '../types';

export interface UserGameHistoryItem {
  id: string;
  gameNumber: number;
  sessionId: string;
  sessionCode: string;
  teamId: string;
  teamName: string;
  teamBadge: string;
  finalPosition: number;
  pointsEarned: number;
  createdAt: string;
}

export interface UserPastTeamItem {
  teamId: string;
  teamName: string;
  abbreviation: string;
  badgeIcon: string;
  budget: number;
  sessionId: string;
  sessionCode?: string;
  sessionStatus?: string;
  createdAt: string;
}

/**
 * Fetch only the logged-in user's personal game history
 */
export async function fetchUserGameHistory(userId: string): Promise<UserGameHistoryItem[]> {
  try {
    const { data: results, error } = await supabase
      .from('game_results')
      .select('id, session_id, team_id, final_position, points_earned, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !results || results.length === 0) {
      return [];
    }

    const sessionIds = [...new Set(results.map(r => r.session_id).filter(Boolean))];
    const teamIds = [...new Set(results.map(r => r.team_id).filter(Boolean))];

    // Load sessions
    const { data: sessionRows } = await supabase
      .from('game_sessions')
      .select('id, session_code')
      .in('id', sessionIds);

    const sessionMap = new Map<string, string>();
    if (sessionRows) {
      sessionRows.forEach(s => sessionMap.set(s.id, s.session_code));
    }

    // Load teams
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, team_name, badge_icon')
      .in('id', teamIds);

    const teamMap = new Map<string, { name: string; badge: string }>();
    if (teamRows) {
      teamRows.forEach(t => teamMap.set(t.id, { name: t.team_name, badge: t.badge_icon || '⚡' }));
    }

    // Results in chronological reverse order, assign Game #1, Game #2 based on oldest to newest
    const total = results.length;
    return results.map((r, index) => {
      const teamInfo = teamMap.get(r.team_id) || { name: 'My Team', badge: '⚡' };
      const sessionCode = sessionMap.get(r.session_id) || 'GAME';
      return {
        id: r.id,
        gameNumber: total - index,
        sessionId: r.session_id,
        sessionCode,
        teamId: r.team_id,
        teamName: teamInfo.name,
        teamBadge: teamInfo.badge,
        finalPosition: r.final_position,
        pointsEarned: r.points_earned,
        createdAt: r.created_at,
      };
    });
  } catch (err) {
    console.error('Failed to fetch user game history:', err);
    return [];
  }
}

/**
 * Fetch all teams created by the logged-in user across their game sessions
 */
export async function fetchUserTeams(userId: string): Promise<UserPastTeamItem[]> {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, session_id, team_name, abbreviation, badge_icon, budget, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !teams) return [];

    const sessionIds = [...new Set(teams.map(t => t.session_id))];
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('id, session_code, status')
      .in('id', sessionIds);

    const sessionMap = new Map<string, { code: string; status: string }>();
    if (sessions) {
      sessions.forEach(s => sessionMap.set(s.id, { code: s.session_code, status: s.status }));
    }

    return teams.map(t => {
      const s = sessionMap.get(t.session_id);
      return {
        teamId: t.id,
        teamName: t.team_name,
        abbreviation: t.abbreviation,
        badgeIcon: t.badge_icon || '⚡',
        budget: t.budget,
        sessionId: t.session_id,
        sessionCode: s?.code,
        sessionStatus: s?.status,
        createdAt: t.created_at,
      };
    });
  } catch (err) {
    console.error('Failed to fetch user teams:', err);
    return [];
  }
}

/**
 * Fetch a specific squad for a team in a session
 */
export async function fetchTeamSquad(teamId: string, sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('squads')
      .select('*, players(*)')
      .eq('team_id', teamId)
      .eq('session_id', sessionId);

    if (error || !data) return [];
    return data.map((row: any) => {
      let p = row.players;
      if (Array.isArray(p)) p = p[0];
      return {
        squadId: row.id,
        purchasePrice: row.purchase_price,
        acquiredAt: row.acquired_at,
        player: p,
      };
    });
  } catch (err) {
    console.error('Failed to fetch squad:', err);
    return [];
  }
}
