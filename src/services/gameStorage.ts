import { Player, Team, LeagueStanding, MatchResult, AuctionPlayer, UserAccount } from '../types';
import { INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_STANDINGS, UPCOMING_AUCTIONS } from '../data/initialData';

const STORAGE_KEY = 'football_draft_manager_save_v1';

export const DEFAULT_USER: UserAccount = {
  id: 'user-rahil',
  name: 'Rahil',
  username: 'rahil',
  managerName: 'Rahil',
  clubName: 'Rahil FC',
  email: 'rahil@footballdraft.fc',
  badgeIcon: '⚡',
  createdAt: new Date().toISOString()
};

export interface GameState {
  players: Player[];
  teams: Team[];
  standings: LeagueStanding[];
  recentMatches: MatchResult[];
  auctions: AuctionPlayer[];
  userTeamId: string;
  currentUser: UserAccount | null;
  savedAccounts: UserAccount[];
}

export function loadInitialState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.teams && parsed.standings) {
        return {
          ...parsed,
          currentUser: parsed.currentUser !== undefined ? parsed.currentUser : DEFAULT_USER,
          savedAccounts: parsed.savedAccounts || [DEFAULT_USER]
        };
      }
    }
  } catch (e) {
    console.error('Failed to load saved state, using default', e);
  }

  return {
    players: INITIAL_PLAYERS,
    teams: INITIAL_TEAMS,
    standings: INITIAL_STANDINGS,
    recentMatches: [],
    auctions: UPCOMING_AUCTIONS,
    userTeamId: 'team-rahil',
    currentUser: DEFAULT_USER,
    savedAccounts: [DEFAULT_USER]
  };
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

export function resetToDefaults(): GameState {
  localStorage.removeItem(STORAGE_KEY);
  return {
    players: INITIAL_PLAYERS,
    teams: INITIAL_TEAMS,
    standings: INITIAL_STANDINGS,
    recentMatches: [],
    auctions: UPCOMING_AUCTIONS,
    userTeamId: 'team-rahil',
    currentUser: DEFAULT_USER,
    savedAccounts: [DEFAULT_USER]
  };
}

export function applyMatchToStandings(
  standings: LeagueStanding[],
  match: MatchResult
): LeagueStanding[] {
  return standings.map(s => {
    if (s.teamId === match.homeTeamId) {
      const isWin = match.homeScore > match.awayScore;
      const isDraw = match.homeScore === match.awayScore;
      const pts = isWin ? 3 : isDraw ? 1 : 0;
      const formResult: 'W' | 'D' | 'L' = isWin ? 'W' : isDraw ? 'D' : 'L';

      return {
        ...s,
        played: s.played + 1,
        won: s.won + (isWin ? 1 : 0),
        drawn: s.drawn + (isDraw ? 1 : 0),
        lost: s.lost + (!isWin && !isDraw ? 1 : 0),
        goalsFor: s.goalsFor + match.homeScore,
        goalsAgainst: s.goalsAgainst + match.awayScore,
        goalDifference: (s.goalsFor + match.homeScore) - (s.goalsAgainst + match.awayScore),
        points: s.points + pts,
        recentForm: [formResult, ...s.recentForm].slice(0, 5)
      };
    }

    if (s.teamId === match.awayTeamId) {
      const isWin = match.awayScore > match.homeScore;
      const isDraw = match.homeScore === match.awayScore;
      const pts = isWin ? 3 : isDraw ? 1 : 0;
      const formResult: 'W' | 'D' | 'L' = isWin ? 'W' : isDraw ? 'D' : 'L';

      return {
        ...s,
        played: s.played + 1,
        won: s.won + (isWin ? 1 : 0),
        drawn: s.drawn + (isDraw ? 1 : 0),
        lost: s.lost + (!isWin && !isDraw ? 1 : 0),
        goalsFor: s.goalsFor + match.awayScore,
        goalsAgainst: s.goalsAgainst + match.homeScore,
        goalDifference: (s.goalsFor + match.awayScore) - (s.goalsAgainst + match.homeScore),
        points: s.points + pts,
        recentForm: [formResult, ...s.recentForm].slice(0, 5)
      };
    }

    return s;
  }).sort((a, b) => {
    // Points DESC
    if (b.points !== a.points) return b.points - a.points;
    // Goal difference DESC
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // Goals For DESC
    return b.goalsFor - a.goalsFor;
  });
}
