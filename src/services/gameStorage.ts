import { Player, Team, LeagueStanding, MatchResult, AuctionPlayer, UserAccount } from '../types';
import { INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_STANDINGS, UPCOMING_AUCTIONS } from '../data/initialData';
import { getPlayerAvatarUrl } from '../data/playerAvatars';

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
        // Refresh avatarUrl and imageUrl on all existing players so cached sessions immediately get the authentic faces
        const initialMap = new Map<string, Player>();
        const normKey = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        INITIAL_PLAYERS.forEach(ip => {
          if (ip.name) initialMap.set(ip.name.toLowerCase(), ip);
          if (ip.name) initialMap.set(normKey(ip.name), ip);
          if (ip.shortName) initialMap.set(normKey(ip.shortName), ip);
        });

        const updatedExisting = (parsed.players || []).map((p: any) => {
          const raw = p.name || p.shortName || '';
          const fresh = initialMap.get(raw.toLowerCase()) || initialMap.get(normKey(raw));
          if (fresh) {
            return {
              ...p,
              overall: fresh.overall,
              pace: fresh.pace,
              shooting: fresh.shooting,
              passing: fresh.passing,
              dribbling: fresh.dribbling,
              defending: fresh.defending,
              physical: fresh.physical,
              form: fresh.form,
              marketValue: fresh.marketValue,
              marketValueM: fresh.marketValueM,
              wage: fresh.wage,
              avatarUrl: fresh.avatarUrl,
              imageUrl: fresh.imageUrl
            };
          }
          return {
            ...p,
            avatarUrl: getPlayerAvatarUrl(p) || p.avatarUrl,
            imageUrl: getPlayerAvatarUrl(p) || p.imageUrl
          };
        });

        const existingNames = new Set(updatedExisting.map((p: any) => p.name?.toLowerCase()));
        const mergedPlayers = [...updatedExisting];
        INITIAL_PLAYERS.forEach(ip => {
          if (!existingNames.has(ip.name?.toLowerCase())) {
            mergedPlayers.push(ip);
          }
        });
        return {
          ...parsed,
          players: mergedPlayers
        };
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
