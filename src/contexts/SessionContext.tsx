import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  GameSession, GameSessionRow, sessionFromRow as _sessionFromRow,
  Team, TeamRow, teamFromRow as _teamFromRow,
  LobbyMember, UserProfile, ProfileRow,
  Player, MatchResult, LeagueStanding
} from '../types';
import {
  sessionFromRow,
  teamFromRow,
  profileFromRow,
  playerFromRow,
  fetchSessionMatches,
  saveMatchToSupabase,
  upsertSessionStandings
} from '../services/sessionService';
import {
  generateTournamentFixtures,
  computeTournamentStandings,
  TournamentFixture
} from '../utils/tournament';
import { syncPlayersToSupabase } from '../services/playerSyncService';
import { AI_BOTS, selectAiStartingSeven } from '../services/aiEngine';

interface SessionContextType {
  currentSession: GameSession | null;
  myTeam: Team | null;
  lobbyMembers: LobbyMember[];
  allTeams: Team[];
  sessionPlayers: Player[];
  sessionMatches: MatchResult[];
  sessionStandings: LeagueStanding[];
  tournamentFixtures: TournamentFixture[];
  isTournamentComplete: boolean;
  tournamentWinner: LeagueStanding | null;
  latestMatchResult: MatchResult | null;
  loadingSession: boolean;
  inactivityNotice: string | null;
  isAiMode: boolean;
  clearInactivityNotice: () => void;
  createGame: (teamName: string, abbreviation: string, badgeIcon: string) => Promise<{ sessionCode: string | null; error: string | null }>;
  createAiGame: (aiCount: number, teamName: string, abbreviation: string, badgeIcon: string) => Promise<{ sessionCode: string | null; error: string | null }>;
  joinGame: (code: string, teamName: string, abbreviation: string, badgeIcon: string) => Promise<{ error: string | null }>;
  leaveGame: () => Promise<void>;
  endGame: () => Promise<{ error: string | null }>;
  startAuction: () => Promise<{ error: string | null }>;
  clearSession: () => void;
  recordActivity: () => void;
  broadcastSimulatedMatch: (result: MatchResult) => Promise<void>;
  updateLineup: (teamId: string, startingSeven: string[], bench: string[], formation?: string) => Promise<void>;
  updateSessionTeamSquadAndBudget: (teamId: string, player: Player, price: number) => void;
  finalizeAiLineups: () => void;
  remoteNavigation: { tab: string; opponentId?: string; timestamp: number } | null;
  broadcastNavigation: (tab: string, opponentId?: string) => Promise<void>;
  setLatestMatchResult: (match: MatchResult | null) => void;
  setIsTournamentComplete: (complete: boolean) => void;
  updateSessionStatus: (status: GameSession['status']) => Promise<void>;
  refreshSessionData: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [lobbyMembers, setLobbyMembers] = useState<LobbyMember[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([]);
  const [sessionMatches, setSessionMatches] = useState<MatchResult[]>([]);
  const [sessionStandings, setSessionStandings] = useState<LeagueStanding[]>([]);
  const [tournamentFixtures, setTournamentFixtures] = useState<TournamentFixture[]>([]);
  const [isTournamentComplete, setIsTournamentComplete] = useState<boolean>(false);
  const [tournamentWinner, setTournamentWinner] = useState<LeagueStanding | null>(null);
  const [latestMatchResult, setLatestMatchResult] = useState<MatchResult | null>(null);
  const [remoteNavigation, setRemoteNavigation] = useState<{ tab: string; opponentId?: string; timestamp: number } | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const allTeamsRef = useRef<Team[]>([]);
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity timeout

  useEffect(() => {
    allTeamsRef.current = allTeams;
  }, [allTeams]);

  // When user logs in, load any active session they belong to
  useEffect(() => {
    if (currentSession?.gameMode === 'ai') return;
    if (user) {
      loadActiveSession(user.id);
    } else {
      clearSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadActiveSession = async (userId: string) => {
    const { data: sp } = await supabase
      .from('session_players')
      .select('session_id')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single();
    if (!sp) return;

    const { data: sessionData } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sp.session_id)
      .in('status', ['LOBBY', 'AUCTION', 'TEAM_SETUP', 'MATCHES'])
      .single();
    if (!sessionData) return;

    const session = sessionFromRow(sessionData as GameSessionRow);
    setCurrentSession(session);
    await loadLobbyData(session.id, userId);
    subscribeToSession(session.id);
  };

  const loadLobbyData = async (sessionId: string, userId: string) => {
    try {
      // 1. Load session_players
      const { data: spRows, error: spErr } = await supabase
        .from('session_players')
        .select('user_id, joined_at, is_ready')
        .eq('session_id', sessionId);

      if (spErr) {
        console.error('Error fetching session_players:', spErr);
      }

      // 2. Load teams and squads for this session
      const [teamRes, squadRes] = await Promise.all([
        supabase.from('teams').select('*').eq('session_id', sessionId),
        supabase.from('squads').select('*, players(*)').eq('session_id', sessionId),
      ]);

      const teamRows = teamRes.data;
      const squadRows = squadRes.data;

      // Extract all Player objects from the squad rows
      const extractedPlayers: Player[] = [];
      (squadRows || []).forEach((row: any) => {
        let pData = row.players;
        if (Array.isArray(pData)) pData = pData[0];
        if (pData) {
          const playerObj = playerFromRow(pData);
          if (!extractedPlayers.some(p => p.id === playerObj.id)) {
            extractedPlayers.push(playerObj);
          }
        }
      });
      setSessionPlayers(extractedPlayers);

      // Map teams with real startingSeven, bench, and dynamically calculated budget
      const teams = (teamRows || []).map((r: any) => {
        const t = teamFromRow(r as TeamRow);
        const mySquadRows = (squadRows || []).filter((sq: any) => sq.team_id === t.id);
        const playerIds = mySquadRows.map((sq: any) => sq.player_id).filter(Boolean);
        t.startingSeven = playerIds.slice(0, 7);
        t.bench = playerIds.slice(7);

        // Dynamically compute exact budget from starting budget minus actual purchases
        const totalSpent = mySquadRows.reduce((sum: number, sq: any) => sum + (sq.purchase_price || 0), 0);
        const baseBudget = currentSession?.startingBudget || 130;
        t.budget = Math.max(0, baseBudget - totalSpent);
        return t;
      });

      setAllTeams(teams);
      allTeamsRef.current = teams;
      const mine = teams.find((t) => t.userId === userId);
      if (mine) setMyTeam(mine);

      // Generate 3x tournament fixtures for all teams
      const fixtures = generateTournamentFixtures(teams);
      setTournamentFixtures(fixtures);

      // Fetch matches and compute shared standings
      const existingMatches = await fetchSessionMatches(sessionId, teams);
      setSessionMatches(existingMatches);

      const computedStandings = computeTournamentStandings(teams, existingMatches);
      setSessionStandings(computedStandings);

      if (fixtures.length > 0 && existingMatches.length >= fixtures.length) {
        setIsTournamentComplete(true);
        setTournamentWinner(computedStandings[0]);
      }

      // 3. Load profiles for all players in this session
      if (spRows && spRows.length > 0) {
        const userIds = spRows.map((r: any) => r.user_id);
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        const profMap: Record<string, UserProfile> = {};
        if (profileRows) {
          profileRows.forEach((p: any) => {
            profMap[p.user_id] = profileFromRow(p as ProfileRow);
          });
        }

        const members: LobbyMember[] = spRows.map((row: any) => {
          const prof = profMap[row.user_id];
          const team = teams.find((t) => t.userId === row.user_id);
          return {
            userId: row.user_id,
            joinedAt: row.joined_at,
            isReady: row.is_ready,
            profile: prof || {
              id: row.user_id,
              userId: row.user_id,
              username: team?.abbreviation?.toLowerCase() || 'player',
              displayName: team?.teamName || 'Player',
              email: '',
              totalPoints: 0,
              gamesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals: 0,
              createdAt: row.joined_at,
            },
          };
        });
        setLobbyMembers(members);
      } else {
        setLobbyMembers([]);
      }
    } catch (err) {
      console.error('loadLobbyData exception:', err);
    }
  };

  const recordActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const clearInactivityNotice = () => {
    setInactivityNotice(null);
  };

  const subscribeToSession = (sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (sessionId.startsWith('ai-session-') || currentSession?.gameMode === 'ai') {
      return;
    }
    const channel = supabase
      .channel(`session:${sessionId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` },
        () => {
          recordActivity();
          if (user) loadLobbyData(sessionId, user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
        () => {
          recordActivity();
          if (user) loadLobbyData(sessionId, user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => {
          recordActivity();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squads' },
        (payload: any) => {
          recordActivity();
          if (user && (!payload?.new?.session_id || payload.new.session_id === sessionId)) {
            loadLobbyData(sessionId, user.id);
          }
        }
      )
      .on('broadcast', { event: 'squad_updated' }, () => {
        recordActivity();
        if (user) loadLobbyData(sessionId, user.id);
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `session_id=eq.${sessionId}` },
        async () => {
          recordActivity();
          const currentTeams = allTeamsRef.current;
          if (currentTeams.length > 0) {
            const matches = await fetchSessionMatches(sessionId, currentTeams);
            setSessionMatches(matches);
            const standings = computeTournamentStandings(currentTeams, matches);
            setSessionStandings(standings);
            const fixtures = generateTournamentFixtures(currentTeams);
            if (fixtures.length > 0 && matches.length >= fixtures.length) {
              setIsTournamentComplete(true);
              setTournamentWinner(standings[0]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          recordActivity();
          const updated = sessionFromRow(payload.new as GameSessionRow);
          if (updated.status === 'COMPLETED') {
            setIsTournamentComplete(true);
            setCurrentSession(updated);
          } else {
            setCurrentSession(updated);
          }
        }
      )
      .on('broadcast', { event: 'room_activity' }, () => {
        recordActivity();
      })
      .on('broadcast', { event: 'lineup_updated' }, ({ payload }) => {
        recordActivity();
        if (payload?.teamId) {
          setAllTeams((prev) => prev.map(t => t.id === payload.teamId ? {
            ...t,
            startingSeven: payload.startingSeven || t.startingSeven,
            bench: payload.bench || t.bench,
            formation: payload.formation || t.formation,
          } : t));
          if (myTeam && myTeam.id === payload.teamId) {
            setMyTeam(prev => prev ? {
              ...prev,
              startingSeven: payload.startingSeven || prev.startingSeven,
              bench: payload.bench || prev.bench,
              formation: payload.formation || prev.formation,
            } : null);
          }
        }
      })
      .on('broadcast', { event: 'match_simulated' }, ({ payload }) => {
        recordActivity();
        if (payload?.match) {
          setLatestMatchResult(payload.match);
          if (Array.isArray(payload.matches)) {
            setSessionMatches(payload.matches);
          } else {
            setSessionMatches((prev) => {
              if (prev.some(m => m.id === payload.match.id)) return prev;
              return [...prev, payload.match];
            });
          }
          if (Array.isArray(payload.standings)) {
            setSessionStandings(payload.standings);
          }
          if (payload.isComplete) {
            setIsTournamentComplete(true);
            if (payload.winner) setTournamentWinner(payload.winner);
          }
        }
      })
      .on('broadcast', { event: 'tournament_completed' }, ({ payload }) => {
        recordActivity();
        setIsTournamentComplete(true);
        if (payload?.winner) setTournamentWinner(payload.winner);
        if (payload?.standings) setSessionStandings(payload.standings);
      })
      .on('broadcast', { event: 'stage_navigation' }, ({ payload }) => {
        recordActivity();
        if (payload?.tab) {
          setRemoteNavigation({
            tab: payload.tab,
            opponentId: payload.opponentId,
            timestamp: Date.now(),
          });
        }
      })
      .on('broadcast', { event: 'room_ended_inactivity' }, () => {
        clearSession();
        setInactivityNotice('The room was closed after 5 minutes of inactivity.');
      })
      .subscribe();
    channelRef.current = channel;
  };

  const createGame = async (
    teamName: string,
    abbreviation: string,
    badgeIcon: string
  ): Promise<{ sessionCode: string | null; error: string | null }> => {
    if (!user) return { sessionCode: null, error: 'Not logged in.' };
    setLoadingSession(true);

    try {
      // Generate unique code
      let code = '';
      let attempts = 0;
      while (attempts < 10) {
        const candidate = generateCode();
        const { data: existing } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('session_code', candidate)
          .single();
        if (!existing) { code = candidate; break; }
        attempts++;
      }
      if (!code) return { sessionCode: null, error: 'Could not generate session code. Please try again.' };

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          session_code: code,
          host_user_id: user.id,
          status: 'LOBBY',
          max_players: 8,
          starting_budget: 130,
          squad_size: 10,
          season_length: 38,
        })
        .select('*')
        .single();
      if (sessionError) return { sessionCode: null, error: sessionError.message };

      const session = sessionFromRow(sessionData as GameSessionRow);

      // Add host to session_players
      await supabase.from('session_players').insert({
        session_id: session.id,
        user_id: user.id,
        is_ready: false,
      });

      // Create team for host
      const { data: teamData } = await supabase
        .from('teams')
        .insert({
          session_id: session.id,
          user_id: user.id,
          team_name: teamName,
          abbreviation: abbreviation.toUpperCase().slice(0, 3),
          budget: 130,
          badge_icon: badgeIcon,
        })
        .select('*')
        .single();
      if (teamData) setMyTeam(teamFromRow(teamData as TeamRow));

      setCurrentSession(session);
      await loadLobbyData(session.id, user.id);
      subscribeToSession(session.id);

      return { sessionCode: code, error: null };
    } catch (err: any) {
      return { sessionCode: null, error: err.message || 'Unknown error.' };
    } finally {
      setLoadingSession(false);
    }
  };

  const createAiGame = async (
    aiCount: number,
    teamName: string,
    abbreviation: string,
    badgeIcon: string
  ): Promise<{ sessionCode: string | null; error: string | null }> => {
    setLoadingSession(true);
    try {
      const code = 'AI-' + generateCode().slice(0, 4);
      const safeAiCount = Math.min(4, Math.max(1, aiCount));
      const selectedBots = AI_BOTS.slice(0, safeAiCount);
      const sessionId = 'ai-session-' + Date.now();

      const humanTeamId = 'team-human';
      const safeTeamName = teamName.trim() || 'My FC';
      const safeAbbr = (abbreviation || safeTeamName.slice(0, 3) || 'YOU').toUpperCase().slice(0, 3);
      const safeBadge = badgeIcon || '⚡';

      const humanTeam: Team = {
        id: humanTeamId,
        sessionId: sessionId,
        userId: user?.id || 'human-user',
        name: safeTeamName,
        teamName: safeTeamName,
        shortCode: safeAbbr,
        abbreviation: safeAbbr,
        manager: profile?.displayName || user?.email?.split('@')[0] || 'Manager',
        budget: 130,
        badgeIcon: safeBadge,
        badge: safeBadge,
        startingSeven: [],
        bench: [],
        formation: '1-2-2-2',
        createdAt: new Date().toISOString(),
      };

      const aiTeams: Team[] = selectedBots.map(bot => ({
        id: bot.id,
        sessionId: sessionId,
        userId: bot.id,
        name: bot.teamName,
        teamName: bot.teamName,
        shortCode: bot.shortCode,
        abbreviation: bot.shortCode,
        manager: bot.name,
        budget: 130,
        badgeIcon: bot.badgeIcon,
        badge: bot.badgeIcon,
        startingSeven: [],
        bench: [],
        formation: '1-2-2-2',
        createdAt: new Date().toISOString(),
      }));

      const session: GameSession = {
        id: sessionId,
        sessionCode: code,
        hostUserId: user?.id || 'human-user',
        status: 'LOBBY',
        maxPlayers: selectedBots.length + 1,
        startingBudget: 130,
        squadSize: 10,
        seasonLength: 38,
        createdAt: new Date().toISOString(),
        gameMode: 'ai',
      };

      const humanMember: LobbyMember = {
        userId: user?.id || 'human-user',
        joinedAt: new Date().toISOString(),
        isReady: true,
        profile: profile ?? {
          id: user?.id || 'human-user',
          userId: user?.id || 'human-user',
          username: user?.email ? user.email.split('@')[0] : 'You',
          displayName: user?.email ? user.email.split('@')[0] : 'You',
          email: user?.email || '',
          totalPoints: 0,
          gamesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          createdAt: new Date().toISOString(),
        }
      };

      const aiMembers: LobbyMember[] = selectedBots.map(bot => ({
        userId: bot.id,
        joinedAt: new Date().toISOString(),
        isReady: true,
        profile: {
          id: bot.id,
          userId: bot.id,
          username: bot.name,
          displayName: bot.name,
          email: `${bot.name.toLowerCase()}@ai.zeroball`,
          totalPoints: 0,
          gamesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          createdAt: new Date().toISOString(),
        }
      }));

      const allRoomTeams = [humanTeam, ...aiTeams];
      setCurrentSession(session);
      setMyTeam(humanTeam);
      setAllTeams(allRoomTeams);
      setLobbyMembers([humanMember, ...aiMembers]);
      setSessionPlayers([]);
      setSessionMatches([]);
      setSessionStandings(computeTournamentStandings(allRoomTeams, []));
      setTournamentFixtures(generateTournamentFixtures(allRoomTeams));
      setIsTournamentComplete(false);
      setTournamentWinner(null);
      setLatestMatchResult(null);

      return { sessionCode: code, error: null };
    } catch (err: any) {
      return { sessionCode: null, error: err.message || 'Error creating AI session.' };
    } finally {
      setLoadingSession(false);
    }
  };

  const joinGame = async (
    code: string,
    teamName: string,
    abbreviation: string,
    badgeIcon: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in.' };
    setLoadingSession(true);

    try {
      // Find session
      const { data: sessionData, error: findError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('session_code', code.toUpperCase())
        .single();
      if (findError || !sessionData) return { error: 'Game code not found. Double-check and try again.' };

      const session = sessionFromRow(sessionData as GameSessionRow);

      if (session.status !== 'LOBBY') {
        return { error: 'This game has already started. You cannot join now.' };
      }

      // Check not already joined
      const { data: existing } = await supabase
        .from('session_players')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .single();
      if (existing) return { error: 'You are already in this game.' };

      // Check capacity
      const { count } = await supabase
        .from('session_players')
        .select('id', { count: 'exact' })
        .eq('session_id', session.id);
      if ((count ?? 0) >= session.maxPlayers) {
        return { error: 'This game is full.' };
      }

      // Join session
      await supabase.from('session_players').insert({
        session_id: session.id,
        user_id: user.id,
        is_ready: false,
      });

      // Create team
      const { data: teamData } = await supabase
        .from('teams')
        .insert({
          session_id: session.id,
          user_id: user.id,
          team_name: teamName,
          abbreviation: abbreviation.toUpperCase().slice(0, 3),
          budget: session.startingBudget,
          badge_icon: badgeIcon,
        })
        .select('*')
        .single();
      if (teamData) setMyTeam(teamFromRow(teamData as TeamRow));

      setCurrentSession(session);
      await loadLobbyData(session.id, user.id);
      subscribeToSession(session.id);

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Unknown error.' };
    } finally {
      setLoadingSession(false);
    }
  };

  const leaveGame = async () => {
    if (!currentSession) return;
    if (currentSession.gameMode === 'ai') {
      clearSession();
      return;
    }
    if (!user) return;
    try {
      if (currentSession.hostUserId === user.id) {
        await supabase
          .from('game_sessions')
          .update({ status: 'COMPLETED', ended_at: new Date().toISOString() })
          .eq('id', currentSession.id);
      } else {
        await supabase
          .from('session_players')
          .delete()
          .eq('session_id', currentSession.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error leaving session:', err);
    } finally {
      clearSession();
    }
  };

  const endGame = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No active session.' };
    if (currentSession.gameMode === 'ai') {
      clearSession();
      return { error: null };
    }
    if (!user) return { error: 'No active session.' };
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'COMPLETED', ended_at: new Date().toISOString() })
        .eq('id', currentSession.id);
      if (error) return { error: error.message };
      clearSession();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to end room' };
    }
  };

  const startAuction = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No active session.' };
    if (currentSession.gameMode === 'ai') {
      setCurrentSession({ ...currentSession, status: 'AUCTION', startedAt: new Date().toISOString() });
      return { error: null };
    }
    if (!user) return { error: 'No active session.' };
    if (currentSession.hostUserId !== user.id) return { error: 'Only the host can start the auction.' };

    // Auto-sync all 110+ catalog players to Supabase before starting auction
    await syncPlayersToSupabase();

    // Fetch all players and shuffle them for auction order
    const { data: players, error: pErr } = await supabase
      .from('players')
      .select('id');
    if (pErr || !players) return { error: 'Could not load players.' };

    // Shuffle
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Insert session player pool
    const poolEntries = shuffled.map((p, idx) => ({
      session_id: currentSession.id,
      player_id: p.id,
      status: 'AVAILABLE',
      auction_order: idx + 1,
    }));

    // Insert in batches of 20
    for (let i = 0; i < poolEntries.length; i += 20) {
      const batch = poolEntries.slice(i, i + 20);
      const { error } = await supabase.from('session_player_pool').insert(batch);
      if (error) return { error: error.message };
    }

    // Automatically put first player on the live auction block FIRST
    const firstPlayerId = shuffled[0].id;
    const endsAt = new Date(Date.now() + 15_000).toISOString();
    const { error: auctErr } = await supabase.from('auctions').insert({
      session_id: currentSession.id,
      player_id: firstPlayerId,
      starting_price: 10,
      current_bid: 0,
      status: 'LIVE',
      started_at: new Date().toISOString(),
      ends_at: endsAt
    });
    if (auctErr) return { error: auctErr.message };

    await supabase
      .from('session_player_pool')
      .update({ status: 'IN_AUCTION' })
      .eq('session_id', currentSession.id)
      .eq('player_id', firstPlayerId);

    // Update session status to AUCTION LAST so clients receiving the realtime event see the live auction ready
    const { error: statusErr } = await supabase
      .from('game_sessions')
      .update({ status: 'AUCTION', started_at: new Date().toISOString() })
      .eq('id', currentSession.id);
    if (statusErr) return { error: statusErr.message };

    setCurrentSession({ ...currentSession, status: 'AUCTION' });

    return { error: null };
  };

  const clearSession = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setCurrentSession(null);
    setMyTeam(null);
    setLobbyMembers([]);
    setAllTeams([]);
    setSessionPlayers([]);
    setSessionMatches([]);
    setSessionStandings([]);
    setTournamentFixtures([]);
    setIsTournamentComplete(false);
    setTournamentWinner(null);
    setLatestMatchResult(null);
    setRemoteNavigation(null);
  };

  const broadcastSimulatedMatch = async (result: MatchResult) => {
    if (!currentSession) return;
    if (currentSession.gameMode === 'ai') {
      const updatedMatches = [...sessionMatches.filter(m => m.id !== result.id), result];
      const updatedStandings = computeTournamentStandings(allTeams, updatedMatches);
      const fixtures = tournamentFixtures.length > 0 ? tournamentFixtures : generateTournamentFixtures(allTeams);
      const isComplete = fixtures.length > 0 && updatedMatches.length >= fixtures.length;
      const champ = isComplete ? updatedStandings[0] : null;

      setSessionMatches(updatedMatches);
      setSessionStandings(updatedStandings);
      setLatestMatchResult(result);
      if (isComplete && champ) {
        setIsTournamentComplete(true);
        setTournamentWinner(champ);
      }
      return;
    }
    try {
      // 1. Save match to Supabase
      await saveMatchToSupabase(result, currentSession.id);

      // 2. Compute updated matches and standings
      const updatedMatches = [...sessionMatches.filter(m => m.id !== result.id), result];
      const updatedStandings = computeTournamentStandings(allTeams, updatedMatches);
      const fixtures = generateTournamentFixtures(allTeams);
      const isComplete = fixtures.length > 0 && updatedMatches.length >= fixtures.length;
      const champ = isComplete ? updatedStandings[0] : null;

      // 3. Upsert standings to Supabase
      await upsertSessionStandings(currentSession.id, updatedStandings);

      // 4. Update local state
      setSessionMatches(updatedMatches);
      setSessionStandings(updatedStandings);
      setLatestMatchResult(result);
      if (isComplete && champ) {
        setIsTournamentComplete(true);
        setTournamentWinner(champ);
      }

      // 5. Broadcast to all peers in the room
      channelRef.current?.send({
        type: 'broadcast',
        event: 'match_simulated',
        payload: {
          match: result,
          matches: updatedMatches,
          standings: updatedStandings,
          isComplete,
          winner: champ,
        }
      });

      if (isComplete && champ) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'tournament_completed',
          payload: {
            winner: champ,
            standings: updatedStandings,
          }
        });
      }
    } catch (err) {
      console.error('Failed to broadcast simulated match:', err);
    }
  };

  const updateLineup = async (teamId: string, startingSeven: string[], bench: string[], formation?: string) => {
    setAllTeams((prev) => prev.map(t => t.id === teamId ? {
      ...t,
      startingSeven,
      bench,
      formation: formation || t.formation || '1-2-2-2',
    } : t));

    if (myTeam && myTeam.id === teamId) {
      setMyTeam((prev) => prev ? {
        ...prev,
        startingSeven,
        bench,
        formation: formation || prev.formation || '1-2-2-2',
      } : null);
    }

    if (currentSession?.gameMode === 'ai') return;

    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'lineup_updated',
        payload: {
          teamId,
          startingSeven,
          bench,
          formation,
        }
      });
    } catch (e) {
      console.error('Error broadcasting lineup update:', e);
    }
  };

  const updateSessionTeamSquadAndBudget = (teamId: string, player: Player, price: number) => {
    setSessionPlayers((prev) => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });

    setAllTeams((prev) => prev.map(t => {
      if (t.id !== teamId) return t;
      const newBudget = Math.max(0, t.budget - price);
      const newBench = [...(t.bench || []), player.id];
      return {
        ...t,
        budget: newBudget,
        bench: newBench,
      };
    }));

    if (myTeam && myTeam.id === teamId) {
      setMyTeam((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          budget: Math.max(0, prev.budget - price),
          bench: [...(prev.bench || []), player.id],
        };
      });
    }
  };

  const finalizeAiLineups = () => {
    setAllTeams((prev) => prev.map(t => {
      if (!t.id.startsWith('ai-')) return t;
      const teamPlayerIds = new Set([...(t.bench || []), ...(t.startingSeven || [])]);
      const teamPlayers = sessionPlayers.filter(p => teamPlayerIds.has(p.id));
      const { startingSeven, bench, formation } = selectAiStartingSeven(teamPlayers);
      return {
        ...t,
        startingSeven,
        bench,
        formation,
      };
    }));
  };

  const broadcastNavigation = async (tab: string, opponentId?: string) => {
    if (currentSession?.gameMode === 'ai') {
      setRemoteNavigation({ tab, opponentId, timestamp: Date.now() });
      return;
    }
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stage_navigation',
        payload: {
          tab,
          opponentId,
        }
      });
    } catch (e) {
      console.error('Error broadcasting navigation:', e);
    }
  };

  const updateSessionStatus = async (status: GameSession['status']) => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, status } : null);
    if (currentSession.gameMode !== 'ai') {
      try {
        await supabase
          .from('game_sessions')
          .update({ status })
          .eq('id', currentSession.id);
      } catch (e) {
        console.error('Error updating game session status:', e);
      }
    }
  };

  const refreshSessionData = async () => {
    if (currentSession && user && currentSession.gameMode !== 'ai') {
      await loadLobbyData(currentSession.id, user.id);
    }
  };

  // Polling fallback during matches so joined mobile players stay 100% in sync
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'MATCHES' || currentSession.gameMode === 'ai') return;

    const interval = setInterval(async () => {
      const currentTeams = allTeamsRef.current;
      if (!currentTeams || currentTeams.length === 0) return;

      try {
        const matches = await fetchSessionMatches(currentSession.id, currentTeams);
        if (matches && matches.length > 0) {
          setSessionMatches(matches);
          const standings = computeTournamentStandings(currentTeams, matches);
          setSessionStandings(standings);
          const fixtures = generateTournamentFixtures(currentTeams);
          if (fixtures.length > 0 && matches.length >= fixtures.length) {
            setIsTournamentComplete(true);
            setTournamentWinner(standings[0]);
          }
        }
      } catch (e) {
        console.error('Match sync poll error:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentSession?.id, currentSession?.status, currentSession?.gameMode]);

  // 5-minute Room Inactivity Watchdog
  useEffect(() => {
    if (!currentSession || currentSession.status === 'COMPLETED' || currentSession.gameMode === 'ai') return;

    lastActivityRef.current = Date.now();

    let lastThrottledTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 2000) {
        lastThrottledTime = now;
        recordActivity();
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    const checkInterval = setInterval(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        console.warn('Closing room due to 5 minutes of inactivity.');

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'room_ended_inactivity',
            payload: { sessionId: currentSession.id },
          }).catch(() => {});
        }

        if (currentSession.hostUserId === user?.id) {
          try {
            await supabase
              .from('game_sessions')
              .update({ status: 'COMPLETED', ended_at: new Date().toISOString() })
              .eq('id', currentSession.id);
          } catch (e) {
            console.error('Error ending inactive session:', e);
          }
        } else {
          try {
            await supabase
              .from('session_players')
              .delete()
              .eq('session_id', currentSession.id)
              .eq('user_id', user?.id);
          } catch (e) {
            console.error('Error leaving inactive session:', e);
          }
        }

        clearSession();
        setInactivityNotice('The room was closed after 5 minutes of inactivity.');
      }
    }, 4000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      clearInterval(checkInterval);
    };
  }, [currentSession?.id, currentSession?.hostUserId, currentSession?.status, currentSession?.gameMode, user?.id]);

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        myTeam,
        lobbyMembers,
        allTeams,
        sessionPlayers,
        sessionMatches,
        sessionStandings,
        tournamentFixtures,
        isTournamentComplete,
        tournamentWinner,
        latestMatchResult,
        loadingSession,
        inactivityNotice,
        isAiMode: Boolean(currentSession?.gameMode === 'ai'),
        clearInactivityNotice,
        createGame,
        createAiGame,
        joinGame,
        leaveGame,
        endGame,
        startAuction,
        clearSession,
        recordActivity,
        broadcastSimulatedMatch,
        updateLineup,
        updateSessionTeamSquadAndBudget,
        finalizeAiLineups,
        remoteNavigation,
        broadcastNavigation,
        setLatestMatchResult,
        setIsTournamentComplete,
        updateSessionStatus,
        refreshSessionData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
