import { Player, Team, LeagueStanding, MatchResult, AuctionPlayer, UserAccount } from '../types';
import { INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_STANDINGS, UPCOMING_AUCTIONS } from '../data/initialData';

const STORAGE_KEY = 'football_draft_manager_v2';

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
    localStorage.removeItem('football_draft_manager_save_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.standings)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved state, using clean default', e);
  }

  return {
    players: INITIAL_PLAYERS,
    teams: [],
    standings: [],
    recentMatches: [],
    auctions: [],
    userTeamId: '',
    currentUser: null,
    savedAccounts: []
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
  localStorage.removeItem('football_draft_manager_save_v1');
  return {
    players: INITIAL_PLAYERS,
    teams: [],
    standings: [],
    recentMatches: [],
    auctions: [],
    userTeamId: '',
    currentUser: null,
    savedAccounts: []
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
  });
}
