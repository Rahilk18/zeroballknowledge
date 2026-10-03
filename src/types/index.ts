// ============================================================
// FOOTBALL DRAFT MANAGER — UNIFIED TYPES
// Supports both offline prototype & live Supabase multiplayer
// ============================================================

import { getPlayerAvatarUrl } from '../data/playerAvatars';

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  appearances?: number;
  motm?: number;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  number?: number;
  position: PlayerPosition;
  nationality: string;
  nationalityCode?: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  form: number;
  fitness?: number;
  marketValue?: number;
  marketValueM?: number;
  wage?: number;
  preferredFoot?: string;
  teamId?: string;
  avatarUrl?: string;
  imageUrl?: string;
  stats: PlayerStats;
  // Season stats direct access helpers:
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  rating?: number;
  appearances?: number;
}

export interface PlayerRow {
  id: string;
  name: string;
  short_name: string;
  position: PlayerPosition;
  nationality: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  form: number;
  market_value_m: number;
  avatar_url?: string;
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

// ---- Team ----
export interface Team {
  id: string;
  name: string;
  shortCode: string;
  manager?: string;
  budget: number;
  primaryColor?: string;
  accentColor?: string;
  formation?: string;
  startingSeven: string[];
  bench: string[];
  badgeIcon: string;
  badge?: string;
  // Supabase multiplayer fields
  sessionId?: string;
  userId?: string;
  teamName?: string;
  abbreviation?: string;
  createdAt?: string;
}

export interface TeamRow {
  id: string;
  session_id: string;
  user_id: string;
  team_name: string;
  abbreviation: string;
  budget: number;
  badge_icon: string;
  created_at: string;
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

// ---- User Profile ----
export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  trophies?: number;
  createdAt: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  total_points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  trophies?: number;
  created_at: string;
}

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

// ---- User Account (Local & Session auth) ----
export interface UserAccount {
  id: string;
  name?: string;
  email: string;
  username?: string;
  clubName: string;
  badge?: string;
  badgeIcon?: string;
  managerName?: string;
  createdAt?: string;
}

// ---- Game Session ----
export type SessionStatus = 'LOBBY' | 'AUCTION' | 'TEAM_SETUP' | 'MATCHES' | 'COMPLETED';

export interface GameSession {
  id: string;
  sessionCode: string;
  hostUserId: string;
  status: SessionStatus;
  maxPlayers: number;
  startingBudget: number;
  squadSize: number;
  seasonLength: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface GameSessionRow {
  id: string;
  session_code: string;
  host_user_id: string;
  status: SessionStatus;
  max_players: number;
  starting_budget: number;
  squad_size: number;
  season_length: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
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

export interface LobbyMember {
  userId: string;
  joinedAt: string;
  isReady: boolean;
  profile?: UserProfile;
}

// ---- Session Player Pool ----
export type PlayerPoolStatus = 'AVAILABLE' | 'IN_AUCTION' | 'SOLD' | 'SKIPPED';

export interface SessionPlayerPool {
  id: string;
  sessionId: string;
  playerId: string;
  status: PlayerPoolStatus;
  auctionOrder?: number;
  player?: Player;
}

// ---- Auction ----
export type AuctionStatus = 'WAITING' | 'LIVE' | 'SOLD' | 'SKIPPED' | 'COMPLETED';

export interface Auction {
  id: string;
  sessionId: string;
  playerId: string;
  startingPrice: number;
  currentBid: number;
  highestTeamId?: string;
  status: AuctionStatus;
  startedAt?: string;
  endsAt?: string;
  player?: Player;
  highestTeam?: Team;
}

export interface AuctionRow {
  id: string;
  session_id: string;
  player_id: string;
  starting_price: number;
  current_bid: number;
  highest_team_id?: string;
  status: AuctionStatus;
  started_at?: string;
  ends_at?: string;
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

export interface Bid {
  id: string;
  auctionId: string;
  teamId: string;
  userId: string;
  amount: number;
  createdAt: string;
  team?: Team;
  profile?: UserProfile;
}

export interface BidRow {
  id: string;
  auction_id: string;
  team_id: string;
  user_id: string;
  amount: number;
  created_at: string;
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

export interface SquadPlayer {
  id: string;
  sessionId: string;
  teamId: string;
  playerId: string;
  purchasePrice: number;
  acquiredAt: string;
  player?: Player;
}

export interface SquadRow {
  id: string;
  session_id: string;
  team_id: string;
  player_id: string;
  purchase_price: number;
  acquired_at: string;
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

// ---- Match / League ----
export interface LeagueStanding {
  teamId: string;
  teamName: string;
  abbreviation?: string;
  shortCode?: string;
  badge?: string;
  badgeIcon?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm: string[];
  form?: string[];
}

export type EventType =
  | 'goal'
  | 'save'
  | 'yellow_card'
  | 'red_card'
  | 'foul'
  | 'shot'
  | 'corner'
  | 'substitution'
  | 'KICKOFF'
  | 'GOAL'
  | 'ASSIST'
  | 'SHOT_SAVED'
  | 'SHOT_MISSED'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SUBSTITUTION'
  | 'FOUL'
  | 'CORNER'
  | 'OFFSIDE'
  | 'HALFTIME'
  | 'FULLTIME'
  | 'NEAR_MISS';

export interface MatchEvent {
  id?: string;
  minute: number;
  type: EventType;
  description: string;
  teamId?: string;
  playerId?: string;
  playerName?: string;
  teamName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  scoreAfter?: {
    home: number;
    away: number;
  };
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passAccuracy: number;
  fouls: number;
  corners: number;
  offsides?: number;
  yellowCards?: number;
  redCards?: number;
  saves?: number;
}

export interface PlayerMatchRating {
  playerId: string;
  playerName: string;
  teamId?: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
  shots?: number;
  saves?: number;
  tackles?: number;
  keyActions?: string[];
}

export interface MatchResult {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeGoals?: number;
  awayGoals?: number;
  events: MatchEvent[];
  stats: {
    home: TeamMatchStats;
    away: TeamMatchStats;
  };
  homeStats?: TeamMatchStats;
  awayStats?: TeamMatchStats;
  playerRatings: Record<string, PlayerMatchRating>;
  playerOfTheMatch?: {
    playerId: string;
    playerName: string;
    teamId?: string;
    rating: number;
    reason: string;
  };
  potmPlayerId?: string;
  matchweek?: number;
  played?: boolean;
  date?: string;
  completed?: boolean;
}

// ---- Fixture (Scheduled / Played Match) ----
export interface Fixture {
  id: string;
  sessionId?: string;
  matchweek: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'SCHEDULED' | 'PLAYING' | 'COMPLETED';
  result?: MatchResult;
}

// ---- Legacy Prototype Auction Player ----
export interface AuctionPlayer {
  id: string;
  name?: string;
  position?: string;
  overall?: number;
  currentBid: number;
  minimumBid?: number;
  timeLeftSeconds: number;
  status: 'active' | 'sold' | 'upcoming';
  bids?: { teamId: string; amount: number; teamName: string }[];
  soldToTeamId?: string;
  highestBidderTeamId?: string;
  highestBidderName?: string;
  minNextBid?: number;
  player?: Player;
}

// ---- Game Result / Hall of Fame ----
export interface GameResult {
  id: string;
  sessionId: string;
  sessionCode: string;
  userId: string;
  teamName: string;
  finalPosition: number;
  pointsEarned: number;
  createdAt: string;
}

// ---- Navigation Tabs ----
export type ActiveTab =
  | 'dashboard'
  | 'players'
  | 'my-team'
  | 'myteam'
  | 'matches'
  | 'matchsetup'
  | 'simulation'
  | 'league'
  | 'auction'
  | 'statistics'
  | 'settings'
  | 'lobby'
  | 'leaderboard';
