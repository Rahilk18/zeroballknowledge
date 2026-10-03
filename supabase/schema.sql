-- ============================================================
-- FOOTBALL DRAFT MANAGER — SUPABASE DATABASE SETUP
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins         INTEGER NOT NULL DEFAULT 0,
  draws        INTEGER NOT NULL DEFAULT 0,
  losses       INTEGER NOT NULL DEFAULT 0,
  goals        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (true);

-- Auto-create profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2. PLAYERS TABLE (global player pool — attributes only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  position    TEXT NOT NULL CHECK (position IN ('GK','DEF','MID','ATT')),
  nationality TEXT NOT NULL DEFAULT '',
  overall     INTEGER NOT NULL DEFAULT 80,
  pace        INTEGER NOT NULL DEFAULT 75,
  shooting    INTEGER NOT NULL DEFAULT 75,
  passing     INTEGER NOT NULL DEFAULT 75,
  dribbling   INTEGER NOT NULL DEFAULT 75,
  defending   INTEGER NOT NULL DEFAULT 50,
  physical    INTEGER NOT NULL DEFAULT 75,
  goalkeeping INTEGER NOT NULL DEFAULT 20,
  form        INTEGER NOT NULL DEFAULT 85,
  market_value_m INTEGER NOT NULL DEFAULT 50,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read players"
  ON public.players FOR SELECT USING (true);

-- ============================================================
-- 3. GAME SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code    TEXT UNIQUE NOT NULL,
  host_user_id    UUID NOT NULL REFERENCES auth.users(id),
  status          TEXT NOT NULL DEFAULT 'LOBBY'
                  CHECK (status IN ('LOBBY','AUCTION','TEAM_SETUP','MATCHES','COMPLETED')),
  max_players     INTEGER NOT NULL DEFAULT 8,
  starting_budget INTEGER NOT NULL DEFAULT 100,
  squad_size      INTEGER NOT NULL DEFAULT 7,
  season_length   INTEGER NOT NULL DEFAULT 38,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read game sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can update their session"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

-- ============================================================
-- 4. SESSION PLAYERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_ready    BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (session_id, user_id)
);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players in session can view other members"
  ON public.session_players FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join sessions"
  ON public.session_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session record"
  ON public.session_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
  ON public.session_players FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. TEAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name    TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  budget       INTEGER NOT NULL DEFAULT 100,
  badge_icon   TEXT NOT NULL DEFAULT '⚡',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view teams in a session"
  ON public.teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own team"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team"
  ON public.teams FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. SESSION PLAYER POOL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_player_pool (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES public.players(id),
  status       TEXT NOT NULL DEFAULT 'AVAILABLE'
               CHECK (status IN ('AVAILABLE','IN_AUCTION','SOLD','SKIPPED')),
  auction_order INTEGER,
  UNIQUE (session_id, player_id)
);

ALTER TABLE public.session_player_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view pool"
  ON public.session_player_pool FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Host can manage pool (insert)"
  ON public.session_player_pool FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT host_user_id FROM public.game_sessions WHERE id = session_id
    )
  );

CREATE POLICY "Host can update pool"
  ON public.session_player_pool FOR UPDATE
  USING (
    auth.uid() = (
      SELECT host_user_id FROM public.game_sessions WHERE id = session_id
    )
  );

-- ============================================================
-- 7. AUCTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auctions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id        UUID NOT NULL REFERENCES public.players(id),
  starting_price   INTEGER NOT NULL DEFAULT 5,
  current_bid      INTEGER NOT NULL DEFAULT 0,
  highest_team_id  UUID REFERENCES public.teams(id),
  status           TEXT NOT NULL DEFAULT 'WAITING'
                   CHECK (status IN ('WAITING','LIVE','SOLD','SKIPPED','COMPLETED')),
  started_at       TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view auctions"
  ON public.auctions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Host can create auctions"
  ON public.auctions FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT host_user_id FROM public.game_sessions WHERE id = session_id
    )
  );

CREATE POLICY "Host can update auctions"
  ON public.auctions FOR UPDATE
  USING (
    auth.uid() = (
      SELECT host_user_id FROM public.game_sessions WHERE id = session_id
    )
  );

-- ============================================================
-- 8. BIDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id  UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  team_id     UUID NOT NULL REFERENCES public.teams(id),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  amount      INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view bids"
  ON public.bids FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can place their own bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. SQUADS TABLE (players purchased per session)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.squads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES public.players(id),
  purchase_price  INTEGER NOT NULL DEFAULT 0,
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, player_id)
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view squads"
  ON public.squads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Host can manage squads"
  ON public.squads FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT host_user_id FROM public.game_sessions WHERE id = session_id
    )
  );

-- ============================================================
-- 10. SEED PLAYER DATA
-- ============================================================
INSERT INTO public.players (name, short_name, position, nationality, overall, pace, shooting, passing, dribbling, defending, physical, goalkeeping, form, market_value_m, avatar_url) VALUES

-- ATTACKERS (15)
('Kylian Mbappé',       'Mbappé',      'ATT', 'France',        94, 97, 93, 86, 95, 40, 88, 11, 92, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231747.png?padding=0.7'),
('Erling Haaland',      'Haaland',     'ATT', 'Norway',        91, 89, 93, 70, 81, 45, 90, 10, 94, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239085.png?padding=0.7'),
('Lamine Yamal',        'L. Yamal',    'ATT', 'Spain',         86, 89, 82, 86, 90, 42, 65, 10, 95, 150, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p277643.png?padding=0.7'),
('Harry Kane',          'H. Kane',     'ATT', 'England',       90, 70, 92, 85, 83, 50, 82, 10, 90, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202126.png?padding=0.7'),
('Vinícius Júnior',     'Vini Jr.',    'ATT', 'Brazil',        90, 96, 85, 82, 92, 32, 70, 10, 92, 170, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p238794.png?padding=0.7'),
('Mohamed Salah',       'M. Salah',    'ATT', 'Egypt',         89, 88, 87, 83, 88, 44, 76, 10, 91, 95, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p209331.png?padding=0.7'),
('Ousmane Dembélé',     'Dembélé',     'ATT', 'France',        86, 93, 79, 84, 91, 36, 62, 10, 87, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231443.png?padding=0.7'),
('Raphinha',            'Raphinha',    'ATT', 'Brazil',        87, 91, 83, 83, 87, 52, 74, 10, 93, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233419.png?padding=0.7'),
('Lautaro Martínez',    'L. Martínez', 'ATT', 'Argentina',     88, 82, 87, 77, 85, 51, 82, 10, 90, 90, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231478.png?padding=0.7'),
('Bukayo Saka',         'Saka',        'ATT', 'England',       88, 87, 84, 83, 88, 65, 76, 10, 92, 135, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246669.png?padding=0.7'),
('Rodrygo',             'Rodrygo',     'ATT', 'Brazil',        87, 90, 83, 82, 89, 41, 68, 10, 89, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243812.png?padding=0.7'),
('Rafael Leão',         'R. Leão',     'ATT', 'Portugal',      86, 92, 81, 79, 89, 37, 74, 10, 88, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241721.png?padding=0.7'),
('Khvicha Kvaratskhelia','Kvaratkhelia','ATT', 'Georgia',       86, 88, 81, 82, 90, 43, 72, 10, 90, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p247635.png?padding=0.7'),
('Julián Álvarez',      'J. Álvarez',  'ATT', 'Argentina',     85, 82, 82, 79, 84, 55, 79, 10, 88, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246191.png?padding=0.7'),
('Lionel Messi',        'Messi',       'ATT', 'Argentina',     92, 80, 92, 93, 94, 34, 66, 10, 94, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p158023.png?padding=0.7'),

-- MIDFIELDERS (15)
('Jude Bellingham',     'Bellingham',  'MID', 'England',       90, 82, 86, 86, 88, 80, 86, 10, 93, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252371.png?padding=0.7'),
('Pedri',               'Pedri',       'MID', 'Spain',         88, 80, 76, 90, 91, 72, 73, 10, 91, 110, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251854.png?padding=0.7'),
('Rodri',               'Rodri',       'MID', 'Spain',         91, 68, 82, 88, 84, 89, 87, 11, 94, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231866.png?padding=0.7'),
('Federico Valverde',   'Valverde',    'MID', 'Uruguay',       89, 88, 84, 85, 84, 82, 85, 11, 93, 120, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239053.png?padding=0.7'),
('Kevin De Bruyne',     'De Bruyne',   'MID', 'Belgium',       90, 71, 87, 94, 87, 65, 75, 10, 89, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192985.png?padding=0.7'),
('Declan Rice',         'D. Rice',     'MID', 'England',       86, 76, 72, 80, 76, 86, 85, 10, 88, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234378.png?padding=0.7'),
('Martin Ødegaard',     'Ødegaard',    'MID', 'Norway',        87, 77, 80, 91, 88, 68, 72, 10, 89, 85, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p222665.png?padding=0.7'),
('Florian Wirtz',       'Wirtz',       'MID', 'Germany',       88, 83, 82, 88, 90, 54, 70, 10, 93, 125, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256630.png?padding=0.7'),
('Bruno Fernandes',     'B. Fernandes','MID', 'Portugal',      87, 74, 84, 88, 84, 67, 74, 10, 88, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212198.png?padding=0.7'),
('Jamal Musiala',       'Musiala',     'MID', 'Germany',       88, 86, 82, 84, 94, 46, 68, 10, 91, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256790.png?padding=0.7'),
('Vitinha',             'Vitinha',     'MID', 'Portugal',      84, 79, 74, 88, 87, 72, 72, 10, 87, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p255253.png?padding=0.7'),
('Joshua Kimmich',      'Kimmich',     'MID', 'Germany',       87, 72, 76, 89, 81, 82, 76, 10, 88, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212622.png?padding=0.7'),
('Cole Palmer',         'C. Palmer',   'MID', 'England',       86, 79, 84, 87, 88, 54, 70, 10, 90, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p257534.png?padding=0.7'),
('Bernardo Silva',      'B. Silva',    'MID', 'Portugal',      87, 78, 79, 89, 89, 66, 73, 10, 88, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p218667.png?padding=0.7'),
('Frenkie de Jong',     'F. de Jong',  'MID', 'Netherlands',   86, 76, 72, 88, 86, 72, 76, 10, 87, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228702.png?padding=0.7'),

-- DEFENDERS (15)
('Virgil van Dijk',     'Van Dijk',    'DEF', 'Netherlands',   89, 78, 60, 74, 72, 91, 89, 11, 90, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203376.png?padding=0.7'),
('William Saliba',      'Saliba',      'DEF', 'France',        88, 83, 40, 75, 74, 89, 86, 12, 91, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243715.png?padding=0.7'),
('Achraf Hakimi',       'Hakimi',      'DEF', 'Morocco',       87, 90, 70, 78, 82, 79, 78, 10, 89, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235212.png?padding=0.7'),
('Nuno Mendes',         'N. Mendes',   'DEF', 'Portugal',      85, 92, 61, 77, 82, 82, 78, 10, 86, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252145.png?padding=0.7'),
('Rúben Dias',          'R. Dias',     'DEF', 'Portugal',      88, 68, 39, 72, 69, 90, 87, 10, 90, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239818.png?padding=0.7'),
('Marquinhos',          'Marquinhos',  'DEF', 'Brazil',        87, 73, 48, 76, 73, 89, 82, 10, 88, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p207865.png?padding=0.7'),
('Theo Hernández',      'T. Hernández','DEF', 'France',        85, 89, 67, 76, 80, 79, 80, 10, 87, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232656.png?padding=0.7'),
('Trent Alexander-Arnold','T. Alexander-Arnold','DEF','England',87, 82, 72, 88, 81, 78, 74, 10, 88, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231281.png?padding=0.7'),
('Antonio Rüdiger',     'Rüdiger',     'DEF', 'Germany',       85, 78, 51, 68, 68, 88, 88, 10, 86, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205452.png?padding=0.7'),
('Alessandro Bastoni',  'Bastoni',     'DEF', 'Italy',         87, 75, 42, 82, 77, 88, 84, 10, 88, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237383.png?padding=0.7'),
('Joško Gvardiol',      'Gvardiol',    'DEF', 'Croatia',       85, 82, 62, 79, 78, 85, 84, 10, 87, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251517.png?padding=0.7'),
('Jules Koundé',        'Koundé',      'DEF', 'France',        86, 82, 54, 76, 78, 86, 80, 10, 88, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241486.png?padding=0.7'),
('Pau Cubarsí',         'Cubarsí',     'DEF', 'Spain',         83, 72, 38, 74, 73, 84, 80, 10, 85, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p278046.png?padding=0.7'),
('Gabriel Magalhães',   'Gabriel',     'DEF', 'Brazil',        86, 76, 44, 71, 68, 88, 87, 11, 89, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232580.png?padding=0.7'),
('Ronald Araújo',       'R. Araújo',   'DEF', 'Uruguay',       86, 77, 46, 68, 71, 88, 86, 10, 87, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253163.png?padding=0.7'),

-- GOALKEEPERS (5)
('Thibaut Courtois',    'Courtois',    'GK', 'Belgium',        90, 48, 22, 74, 49, 30, 84, 91, 89, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192119.png?padding=0.7'),
('Alisson Becker',      'Alisson',     'GK', 'Brazil',         89, 52, 25, 84, 55, 32, 80, 90, 89, 40, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212831.png?padding=0.7'),
('Gianluigi Donnarumma','Donnarumma',  'GK', 'Italy',          89, 48, 16, 72, 45, 26, 86, 90, 88, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230621.png?padding=0.7'),
('Emiliano Martínez',   'E. Martínez', 'GK', 'Argentina',      88, 44, 19, 73, 45, 28, 85, 89, 90, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202811.png?padding=0.7'),
('Manuel Neuer',        'M. Neuer',    'GK', 'Germany',        87, 50, 20, 74, 52, 30, 81, 88, 86, 25, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p167495.png?padding=0.7')

ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. ENABLE REALTIME on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_player_pool;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squads;

-- ============================================================
-- 12. MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  matchweek       INTEGER NOT NULL DEFAULT 1,
  home_team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  home_score      INTEGER,
  away_score      INTEGER,
  status          TEXT NOT NULL DEFAULT 'SCHEDULED'
                  CHECK (status IN ('SCHEDULED', 'PLAYING', 'COMPLETED')),
  potm_player_id  UUID REFERENCES public.players(id),
  played_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view matches"
  ON public.matches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Session participants can insert or update matches"
  ON public.matches FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 13. MATCH EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  session_id       UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  minute           INTEGER NOT NULL,
  event_type       TEXT NOT NULL,
  description      TEXT NOT NULL,
  team_id          UUID REFERENCES public.teams(id),
  player_id        UUID REFERENCES public.players(id),
  assist_player_id UUID REFERENCES public.players(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view match events"
  ON public.match_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can insert match events"
  ON public.match_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 14. SESSION STANDINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_standings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  played          INTEGER NOT NULL DEFAULT 0,
  won             INTEGER NOT NULL DEFAULT 0,
  drawn           INTEGER NOT NULL DEFAULT 0,
  lost            INTEGER NOT NULL DEFAULT 0,
  goals_for       INTEGER NOT NULL DEFAULT 0,
  goals_against   INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points          INTEGER NOT NULL DEFAULT 0,
  form            TEXT[] NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, team_id)
);

ALTER TABLE public.session_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view standings"
  ON public.session_standings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Session participants can update standings"
  ON public.session_standings FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 15. PLAYER MATCH STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  session_id   UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id      UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rating       NUMERIC(3, 1) NOT NULL DEFAULT 6.0,
  goals        INTEGER NOT NULL DEFAULT 0,
  assists      INTEGER NOT NULL DEFAULT 0,
  saves        INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards    INTEGER NOT NULL DEFAULT 0,
  is_potm      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view player match stats"
  ON public.player_match_stats FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can insert player match stats"
  ON public.player_match_stats FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 16. GAME RESULTS & HALL OF FAME TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.game_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES public.teams(id),
  final_position  INTEGER NOT NULL,
  points_earned   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game results"
  ON public.game_results FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert game results"
  ON public.game_results FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add realtime for matches, standings, and game_results
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_standings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_results;

