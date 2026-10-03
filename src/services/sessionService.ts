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
        home_team_id: result.homeTeamId,
        away_team_id: result.awayTeamId,
        home_score: result.homeScore,
        away_score: result.awayScore,
        status: 'COMPLETED',
        potm_player_id: result.playerOfTheMatch?.playerId || null,
        played_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (matchError || !matchData) return;

    // 2. Insert match events
    if (result.events && result.events.length > 0) {
      const eventRows = result.events.map((evt: any) => ({
        match_id: matchData.id,
        session_id: sessionId,
        minute: evt.minute,
        event_type: evt.type,
        description: evt.description,
        team_id: evt.teamId || null,
        player_id: evt.playerId || null,
        assist_player_id: evt.assistPlayerId || null
      }));
      await supabase.from('match_events').insert(eventRows);
    }
  } catch (err) {
    console.error('Failed to sync match to Supabase:', err);
  }
}
