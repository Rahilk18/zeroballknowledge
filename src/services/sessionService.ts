// ============================================================
// Session service — row converters shared across contexts
// ============================================================
import type {
  ProfileRow, UserProfile,
  GameSessionRow, GameSession,
  TeamRow, Team,
  AuctionRow, Auction,
  BidRow, Bid,
  PlayerRow, Player,
  SquadRow, SquadPlayer,
} from '../types';
import { getPlayerAvatarUrl } from '../data/playerAvatars';

export function profileFromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    totalPoints: row.total_points ?? 0,
    gamesPlayed: row.games_played ?? 0,
    wins: row.wins ?? 0,
    draws: row.draws ?? 0,
    losses: row.losses ?? 0,
    goals: row.goals ?? 0,
    trophies: row.trophies ?? 0,
    createdAt: row.created_at,
  };
}

export function sessionFromRow(row: GameSessionRow): GameSession {
  return {
    id: row.id,
    sessionCode: row.session_code,
    hostUserId: row.host_user_id,
    status: row.status,
    maxPlayers: row.max_players,
    startingBudget: row.starting_budget,
    squadSize: row.squad_size,
    seasonLength: row.season_length,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

export function teamFromRow(row: TeamRow): Team {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    name: row.team_name,
    teamName: row.team_name,
    shortCode: row.abbreviation,
    abbreviation: row.abbreviation,
    manager: 'Manager',
    budget: row.budget,
    badgeIcon: row.badge_icon,
    badge: row.badge_icon,
    startingSeven: [],
    bench: [],
    formation: '1-2-2-2',
    createdAt: row.created_at,
  };
}

export function auctionFromRow(row: AuctionRow): Auction {
  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    startingPrice: row.starting_price,
    currentBid: row.current_bid,
    highestTeamId: row.highest_team_id,
    status: row.status,
    startedAt: row.started_at,
    endsAt: row.ends_at,
  };
}

export function bidFromRow(row: BidRow): Bid {
  return {
    id: row.id,
    auctionId: row.auction_id,
    teamId: row.team_id,
    userId: row.user_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export function playerFromRow(row: any): Player {
  const name = row?.name || 'Player';
  const shortName = row?.short_name || row?.shortName || name.split(' ').slice(-1)[0] || name;
  const avatarUrl = getPlayerAvatarUrl(row);
  return {
    id: row?.id || '',
    name: name,
    shortName: shortName,
    position: row?.position || 'MID',
    nationality: row?.nationality || 'World',
    overall: Number(row?.overall) || 75,
    pace: Number(row?.pace) || 70,
    shooting: Number(row?.shooting) || 70,
    passing: Number(row?.passing) || 70,
    dribbling: Number(row?.dribbling) || 70,
    defending: Number(row?.defending) || 70,
    physical: Number(row?.physical) || 70,
    goalkeeping: Number(row?.goalkeeping) || 10,
    form: Number(row?.form) || 80,
    marketValue: Number(row?.market_value_m ?? row?.marketValueM ?? 10),
    marketValueM: Number(row?.market_value_m ?? row?.marketValueM ?? 10),
    avatarUrl: avatarUrl,
    imageUrl: avatarUrl,
    stats: {
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      avgRating: 7.0,
      appearances: 0,
      motm: 0,
    },
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    rating: 7.0,
    appearances: 0,
  };
}

export function squadPlayerFromRow(row: SquadRow): SquadPlayer {
  return {
    id: row.id,
    sessionId: row.session_id,
    teamId: row.team_id,
    playerId: row.player_id,
    purchasePrice: row.purchase_price,
    acquiredAt: row.acquired_at,
  };
}

function toValidUUID(id: any): string | null {
  if (!id || typeof id !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

/**
 * Saves completed match result and events into Supabase
 */
export async function saveMatchToSupabase(result: any, sessionId: string) {
  try {
    const { supabase } = await import('../lib/supabase');
    
    // 1. Insert match row
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        session_id: sessionId,
        home_team_id: toValidUUID(result.homeTeamId),
        away_team_id: toValidUUID(result.awayTeamId),
        home_score: result.homeScore,
        away_score: result.awayScore,
        status: 'COMPLETED',
        potm_player_id: toValidUUID(result.playerOfTheMatch?.playerId),
        played_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (matchError || !matchData) {
      console.error('saveMatchToSupabase match error:', matchError);
      return;
    }

    // 2. Insert match events
    if (result.events && result.events.length > 0) {
      const eventRows = result.events.map((evt: any) => ({
        match_id: matchData.id,
        session_id: sessionId,
        minute: evt.minute,
        event_type: evt.type,
        description: evt.description,
        team_id: toValidUUID(evt.teamId),
        player_id: toValidUUID(evt.playerId),
        assist_player_id: toValidUUID(evt.assistPlayerId)
      }));
      const { error: evtError } = await supabase.from('match_events').insert(eventRows);
      if (evtError) {
        console.error('saveMatchToSupabase match_events error:', evtError);
      }
    }
  } catch (err) {
    console.error('Failed to sync match to Supabase:', err);
  }
}

/**
 * Upserts computed standings into public.session_standings
 */
export async function upsertSessionStandings(sessionId: string, standings: any[]) {
  try {
    const { supabase } = await import('../lib/supabase');
    const rows = standings.map((s) => ({
      session_id: sessionId,
      team_id: s.teamId,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goals_for: s.goalsFor,
      goals_against: s.goalsAgainst,
      goal_difference: s.goalDifference,
      points: s.points,
      form: s.recentForm || [],
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from('session_standings')
      .upsert(rows, { onConflict: 'session_id,team_id' });
  } catch (err) {
    console.error('Failed to upsert session standings:', err);
  }
}

/**
 * Loads all completed matches for this session from Supabase
 */
export async function fetchSessionMatches(sessionId: string, allTeams: Team[]): Promise<any[]> {
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: rows, error } = await supabase
      .from('matches')
      .select('*, match_events(*)')
      .eq('session_id', sessionId)
      .eq('status', 'COMPLETED')
      .order('played_at', { ascending: true });

    if (error || !rows) return [];

    return rows.map((r: any) => {
      const homeTeam = allTeams.find(t => t.id === r.home_team_id);
      const awayTeam = allTeams.find(t => t.id === r.away_team_id);

      const events = (r.match_events || []).map((e: any) => ({
        id: e.id,
        minute: e.minute,
        type: e.event_type,
        description: e.description,
        teamId: e.team_id,
        playerId: e.player_id,
        assistPlayerId: e.assist_player_id,
      }));

      return {
        id: r.id,
        homeTeamId: r.home_team_id,
        awayTeamId: r.away_team_id,
        homeTeamName: homeTeam?.name || homeTeam?.teamName || 'Home Team',
        awayTeamName: awayTeam?.name || awayTeam?.teamName || 'Away Team',
        homeScore: r.home_score ?? 0,
        awayScore: r.away_score ?? 0,
        events: events,
        stats: {
          home: { possession: 50, shots: 10, shotsOnTarget: 5, passAccuracy: 80, fouls: 4, corners: 3 },
          away: { possession: 50, shots: 10, shotsOnTarget: 5, passAccuracy: 80, fouls: 4, corners: 3 },
        },
        playerRatings: {},
        played: true,
        date: r.played_at ? new Date(r.played_at).toLocaleDateString() : 'Today',
      };
    });
  } catch (err) {
    console.error('Failed to fetch session matches:', err);
    return [];
  }
}

