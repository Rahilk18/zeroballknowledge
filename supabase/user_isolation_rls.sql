-- ==============================================================================
-- FOOTBALL DRAFT MANAGER — USER DATA ISOLATION & ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase SQL Editor to enforce strict user-level
-- data ownership and prevent unauthorized cross-user data leakage.
-- ==============================================================================

-- 1. PROFILES
-- Users can view basic manager profiles for multiplayer leaderboards & lobbies,
-- but may ONLY insert or update their own personal profile record.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert own profile" ON public.profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can only insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. TEAMS
-- Users can ONLY access their own teams, OR teams in a game session they are part of.
-- Users can NEVER modify or delete teams belonging to other users.
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view teams in a session" ON public.teams;
DROP POLICY IF EXISTS "Users can create own team" ON public.teams;
DROP POLICY IF EXISTS "Users can update own team" ON public.teams;
DROP POLICY IF EXISTS "Users can view own teams or session teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can only update own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can only delete own teams" ON public.teams;

CREATE POLICY "Users can view own teams or session teams"
  ON public.teams FOR SELECT
  USING (
    auth.uid() = user_id
    OR session_id IN (
      SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = user_id);


-- 3. GAME SESSIONS
-- Users can view LOBBY sessions (to join by code), or sessions they are participants/hosts of.
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Host can update their session" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view relevant sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Hosts can create sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Hosts can update own sessions" ON public.game_sessions;

CREATE POLICY "Users can view relevant sessions"
  ON public.game_sessions FOR SELECT
  USING (
    status = 'LOBBY'
    OR host_user_id = auth.uid()
    OR id IN (
      SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can create sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);


-- 4. SESSION PLAYERS (Room memberships)
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players in session can view other members" ON public.session_players;
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_players;
DROP POLICY IF EXISTS "Users can update own session record" ON public.session_players;
DROP POLICY IF EXISTS "Users can leave sessions" ON public.session_players;

CREATE POLICY "Users can view session members"
  ON public.session_players FOR SELECT
  USING (
    user_id = auth.uid()
    OR session_id IN (
      SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON public.session_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session record"
  ON public.session_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
  ON public.session_players FOR DELETE
  USING (auth.uid() = user_id);


-- 5. GAME RESULTS & HALL OF FAME
-- Personal history queries load strictly records belonging to auth.uid().
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view game results" ON public.game_results;
DROP POLICY IF EXISTS "Authenticated users can insert game results" ON public.game_results;

CREATE POLICY "Users can view their own game results or session results"
  ON public.game_results FOR SELECT
  USING (
    user_id = auth.uid()
    OR session_id IN (
      SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own game results"
  ON public.game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 6. BIDS
-- Bidders can place bids strictly under their own user_id.
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view bids" ON public.bids;
DROP POLICY IF EXISTS "Users can place their own bids" ON public.bids;

CREATE POLICY "Users can view bids in their active sessions"
  ON public.bids FOR SELECT
  USING (
    auction_id IN (
      SELECT id FROM public.auctions WHERE session_id IN (
        SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can place their own bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 7. SQUADS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view squads" ON public.squads;
DROP POLICY IF EXISTS "Host can manage squads" ON public.squads;

CREATE POLICY "Users can view squads in their sessions"
  ON public.squads FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM public.session_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Host or team owner can manage squads"
  ON public.squads FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT host_user_id FROM public.game_sessions WHERE id = session_id)
    OR team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );
