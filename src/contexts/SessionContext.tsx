import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  GameSession, GameSessionRow, sessionFromRow as _sessionFromRow,
  Team, TeamRow, teamFromRow as _teamFromRow,
  LobbyMember, UserProfile, ProfileRow,
} from '../types';
import { sessionFromRow, teamFromRow, profileFromRow } from '../services/sessionService';

interface SessionContextType {
  currentSession: GameSession | null;
  myTeam: Team | null;
  lobbyMembers: LobbyMember[];
  allTeams: Team[];
  loadingSession: boolean;
  createGame: (teamName: string, abbreviation: string, badgeIcon: string) => Promise<{ sessionCode: string | null; error: string | null }>;
  joinGame: (code: string, teamName: string, abbreviation: string, badgeIcon: string) => Promise<{ error: string | null }>;
  leaveGame: () => Promise<void>;
  startAuction: () => Promise<{ error: string | null }>;
  clearSession: () => void;
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
  const [loadingSession, setLoadingSession] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // When user logs in, load any active session they belong to
  useEffect(() => {
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
    // Load session_players joined with profiles
    const { data: spRows } = await supabase
      .from('session_players')
      .select('user_id, joined_at, is_ready, profiles(*)')
      .eq('session_id', sessionId);

    if (spRows) {
      const members: LobbyMember[] = spRows.map((row: any) => ({
        userId: row.user_id,
        joinedAt: row.joined_at,
        isReady: row.is_ready,
        profile: row.profiles ? profileFromRow(row.profiles as ProfileRow) : undefined,
      }));
      setLobbyMembers(members);
    }

    // Load teams
    const { data: teamRows } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', sessionId);
    if (teamRows) {
      const teams = teamRows.map((r: any) => teamFromRow(r as TeamRow));
      setAllTeams(teams);
      const mine = teams.find((t) => t.userId === userId);
      if (mine) setMyTeam(mine);
    }
  };

  const subscribeToSession = (sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` },
        () => { if (user) loadLobbyData(sessionId, user.id); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
        () => { if (user) loadLobbyData(sessionId, user.id); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = sessionFromRow(payload.new as GameSessionRow);
          setCurrentSession(updated);
        }
      )
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
          starting_budget: 100,
          squad_size: 7,
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
          budget: 100,
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
    if (!user || !currentSession) return;
    await supabase
      .from('session_players')
      .delete()
      .eq('session_id', currentSession.id)
      .eq('user_id', user.id);
    clearSession();
  };

  const startAuction = async (): Promise<{ error: string | null }> => {
    if (!user || !currentSession) return { error: 'No active session.' };
    if (currentSession.hostUserId !== user.id) return { error: 'Only the host can start the auction.' };

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
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        myTeam,
        lobbyMembers,
        allTeams,
        loadingSession,
        createGame,
        joinGame,
        leaveGame,
        startAuction,
        clearSession,
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
