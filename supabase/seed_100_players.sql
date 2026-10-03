-- ============================================================
-- 100 FAMOUS EA SPORTS FC MEN PLAYERS SEED MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- Includes Marc Cucurella, Cristiano Ronaldo, Toni Kroos, and all superstars
-- ============================================================

-- Ensure avatar_url column exists
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Allow insert by authenticated users or anon if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Anyone can insert players'
  ) THEN
    CREATE POLICY "Anyone can insert players" ON public.players FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Insert any missing players (skips if player with same name already exists)
INSERT INTO public.players (
  name, short_name, position, nationality, overall,
  pace, shooting, passing, dribbling, defending, physical,
  goalkeeping, form, market_value_m, avatar_url
)
SELECT v.* FROM (VALUES
  ('Thibaut Courtois', 'Courtois', 'GK', 'Belgium', 90, 48, 22, 74, 49, 30, 84, 91, 89, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192119.png?padding=0.7'),
  ('Alisson Becker', 'Alisson', 'GK', 'Brazil', 89, 56, 25, 85, 50, 35, 80, 90, 91, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212831.png?padding=0.7'),
  ('Marc-André ter Stegen', 'Ter Stegen', 'GK', 'Germany', 89, 50, 20, 88, 48, 32, 78, 89, 88, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192448.png?padding=0.7'),
  ('Gianluigi Donnarumma', 'Donnarumma', 'GK', 'Italy', 89, 52, 20, 72, 45, 30, 83, 90, 92, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230621.png?padding=0.7'),
  ('Ederson', 'Ederson', 'GK', 'Brazil', 88, 64, 30, 91, 55, 36, 81, 88, 87, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p210257.png?padding=0.7'),
  ('Jan Oblak', 'Oblak', 'GK', 'Slovenia', 88, 49, 22, 68, 44, 34, 82, 89, 86, 40, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200389.png?padding=0.7'),
  ('Gregor Kobel', 'Kobel', 'GK', 'Switzerland', 88, 50, 20, 74, 46, 32, 81, 88, 90, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235073.png?padding=0.7'),
  ('Mike Maignan', 'Maignan', 'GK', 'France', 87, 51, 21, 82, 48, 33, 82, 87, 88, 48, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p215698.png?padding=0.7'),
  ('Emiliano Martínez', 'E. Martínez', 'GK', 'Argentina', 87, 53, 24, 81, 48, 35, 84, 88, 93, 42, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202811.png?padding=0.7'),
  ('Yann Sommer', 'Sommer', 'GK', 'Switzerland', 87, 50, 20, 80, 46, 30, 77, 87, 89, 25, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p177683.png?padding=0.7'),
  ('Manuel Neuer', 'Neuer', 'GK', 'Germany', 86, 54, 28, 89, 52, 38, 80, 86, 85, 20, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p167495.png?padding=0.7'),
  ('David Raya', 'Raya', 'GK', 'Spain', 85, 55, 22, 86, 50, 32, 76, 85, 91, 40, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p220814.png?padding=0.7'),
  ('Unai Simón', 'U. Simón', 'GK', 'Spain', 84, 50, 20, 75, 44, 30, 79, 84, 88, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230869.png?padding=0.7'),
  ('Guglielmo Vicario', 'Vicario', 'GK', 'Italy', 84, 52, 20, 72, 46, 30, 78, 85, 87, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p240091.png?padding=0.7'),
  ('Diogo Costa', 'D. Costa', 'GK', 'Portugal', 84, 52, 22, 78, 46, 32, 79, 84, 87, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234577.png?padding=0.7'),
  ('Virgil van Dijk', 'Van Dijk', 'DEF', 'Netherlands', 89, 78, 60, 72, 72, 89, 86, 13, 92, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203376.png?padding=0.7'),
  ('William Saliba', 'Saliba', 'DEF', 'France', 88, 83, 40, 75, 74, 89, 86, 12, 91, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243715.png?padding=0.7'),
  ('Rúben Dias', 'R. Dias', 'DEF', 'Portugal', 88, 67, 39, 71, 69, 89, 87, 11, 88, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239818.png?padding=0.7'),
  ('Antonio Rüdiger', 'Rüdiger', 'DEF', 'Germany', 88, 82, 55, 71, 68, 86, 86, 10, 90, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205452.png?padding=0.7'),
  ('Alessandro Bastoni', 'Bastoni', 'DEF', 'Italy', 87, 75, 45, 79, 76, 87, 84, 10, 89, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237383.png?padding=0.7'),
  ('Theo Hernández', 'T. Hernández', 'DEF', 'France', 87, 95, 73, 78, 84, 81, 88, 10, 91, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232656.png?padding=0.7'),
  ('Marquinhos', 'Marquinhos', 'DEF', 'Brazil', 87, 78, 56, 75, 74, 89, 80, 12, 88, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p207865.png?padding=0.7'),
  ('Gabriel Magalhães', 'Gabriel', 'DEF', 'Brazil', 86, 72, 40, 68, 66, 86, 84, 10, 90, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232580.png?padding=0.7'),
  ('Dani Carvajal', 'Carvajal', 'DEF', 'Spain', 86, 81, 54, 79, 81, 83, 82, 13, 93, 40, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p204963.png?padding=0.7'),
  ('Trent Alexander-Arnold', 'Alexander-Arnold', 'DEF', 'England', 86, 76, 71, 90, 80, 80, 74, 14, 89, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231281.png?padding=0.7'),
  ('Alejandro Grimaldo', 'Grimaldo', 'DEF', 'Spain', 86, 85, 78, 86, 84, 78, 74, 12, 92, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205988.png?padding=0.7'),
  ('Joško Gvardiol', 'Gvardiol', 'DEF', 'Croatia', 85, 80, 64, 75, 77, 84, 84, 11, 89, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251517.png?padding=0.7'),
  ('Jules Koundé', 'Koundé', 'DEF', 'France', 85, 84, 45, 74, 75, 86, 80, 12, 90, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241486.png?padding=0.7'),
  ('Ronald Araújo', 'R. Araújo', 'DEF', 'Uruguay', 85, 81, 51, 65, 65, 85, 84, 10, 87, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253163.png?padding=0.7'),
  ('Achraf Hakimi', 'Hakimi', 'DEF', 'Morocco', 85, 92, 76, 80, 82, 76, 78, 10, 88, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235212.png?padding=0.7'),
  ('John Stones', 'Stones', 'DEF', 'England', 85, 72, 51, 78, 79, 85, 79, 10, 88, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203574.png?padding=0.7'),
  ('Jeremie Frimpong', 'Frimpong', 'DEF', 'Netherlands', 84, 95, 74, 78, 85, 75, 73, 10, 91, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253149.png?padding=0.7'),
  ('Alphonso Davies', 'Davies', 'DEF', 'Canada', 84, 95, 68, 78, 85, 76, 78, 11, 87, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234396.png?padding=0.7'),
  ('Federico Dimarco', 'Dimarco', 'DEF', 'Italy', 84, 82, 76, 84, 81, 77, 75, 10, 89, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228618.png?padding=0.7'),
  ('Kyle Walker', 'Walker', 'DEF', 'England', 84, 87, 63, 77, 78, 80, 82, 12, 86, 25, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p188377.png?padding=0.7'),
  ('Manuel Akanji', 'Akanji', 'DEF', 'Switzerland', 84, 78, 48, 74, 74, 84, 81, 10, 88, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p226853.png?padding=0.7'),
  ('Cristian Romero', 'Romero', 'DEF', 'Argentina', 84, 75, 46, 65, 66, 84, 84, 10, 88, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232488.png?padding=0.7'),
  ('Lisandro Martínez', 'L. Martínez', 'DEF', 'Argentina', 84, 76, 58, 79, 78, 84, 80, 11, 86, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237678.png?padding=0.7'),
  ('Jonathan Tah', 'Tah', 'DEF', 'Germany', 84, 74, 36, 66, 64, 84, 85, 10, 90, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p213345.png?padding=0.7'),
  ('Dayot Upamecano', 'Upamecano', 'DEF', 'France', 83, 82, 42, 67, 69, 83, 83, 10, 85, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p229558.png?padding=0.7'),
  ('Nuno Mendes', 'N. Mendes', 'DEF', 'Portugal', 83, 90, 62, 75, 81, 78, 78, 10, 87, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252145.png?padding=0.7'),
  ('Marc Cucurella', 'Cucurella', 'DEF', 'Spain', 82, 79, 62, 77, 78, 80, 78, 10, 92, 40, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239231.png?padding=0.7'),
  ('Micky van de Ven', 'Van de Ven', 'DEF', 'Netherlands', 82, 89, 44, 68, 70, 82, 83, 10, 89, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p264453.png?padding=0.7'),
  ('Pau Cubarsí', 'Cubarsí', 'DEF', 'Spain', 81, 72, 35, 78, 75, 82, 75, 10, 92, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p278046.png?padding=0.7'),
  ('Sergio Ramos', 'S. Ramos', 'DEF', 'Spain', 90, 78, 76, 81, 75, 91, 89, 11, 95, 55, 'https://cdn.futbin.com/content/fifa24/img/players/155862.png'),
  ('Rodri', 'Rodri', 'MID', 'Spain', 91, 66, 80, 86, 80, 87, 85, 10, 95, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231866.png?padding=0.7'),
  ('Kevin De Bruyne', 'De Bruyne', 'MID', 'Belgium', 90, 67, 87, 94, 87, 65, 75, 10, 91, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192985.png?padding=0.7'),
  ('Jude Bellingham', 'Bellingham', 'MID', 'England', 90, 80, 87, 83, 88, 78, 83, 10, 94, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252371.png?padding=0.7'),
  ('Martin Ødegaard', 'Ødegaard', 'MID', 'Norway', 89, 75, 82, 89, 89, 66, 67, 10, 90, 110, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p222665.png?padding=0.7'),
  ('Florian Wirtz', 'Wirtz', 'MID', 'Germany', 88, 81, 81, 86, 89, 53, 70, 10, 94, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256630.png?padding=0.7'),
  ('Federico Valverde', 'Valverde', 'MID', 'Uruguay', 88, 88, 82, 84, 84, 80, 84, 10, 92, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239053.png?padding=0.7'),
  ('Bernardo Silva', 'B. Silva', 'MID', 'Portugal', 88, 69, 78, 86, 92, 70, 70, 10, 89, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p218667.png?padding=0.7'),
  ('Jamal Musiala', 'Musiala', 'MID', 'Germany', 87, 84, 81, 81, 90, 65, 65, 10, 93, 130, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256790.png?padding=0.7'),
  ('Declan Rice', 'Rice', 'MID', 'England', 87, 74, 71, 82, 79, 86, 86, 10, 91, 120, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234378.png?padding=0.7'),
  ('Bruno Fernandes', 'B. Fernandes', 'MID', 'Portugal', 87, 71, 85, 88, 83, 69, 77, 10, 88, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212198.png?padding=0.7'),
  ('Nicolò Barella', 'Barella', 'MID', 'Italy', 87, 79, 76, 83, 86, 78, 82, 10, 90, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p224232.png?padding=0.7'),
  ('Frenkie de Jong', 'De Jong', 'MID', 'Netherlands', 87, 82, 69, 86, 88, 77, 78, 10, 87, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228702.png?padding=0.7'),
  ('Ilkay Gündogan', 'Gündogan', 'MID', 'Germany', 87, 64, 80, 86, 84, 74, 72, 10, 87, 30, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p186942.png?padding=0.7'),
  ('Toni Kroos', 'Kroos', 'MID', 'Germany', 90, 53, 81, 93, 82, 72, 70, 10, 95, 45, 'https://cdn.futbin.com/content/fifa24/img/players/182521.png'),
  ('Luka Modrić', 'Modrić', 'MID', 'Croatia', 86, 72, 76, 89, 87, 72, 66, 10, 88, 25, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p177003.png?padding=0.7'),
  ('Pedri', 'Pedri', 'MID', 'Spain', 86, 78, 69, 85, 88, 68, 73, 10, 92, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251854.png?padding=0.7'),
  ('Joshua Kimmich', 'Kimmich', 'MID', 'Germany', 86, 70, 72, 88, 84, 81, 79, 10, 87, 50, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212622.png?padding=0.7'),
  ('Hakan Çalhanoğlu', 'Çalhanoğlu', 'MID', 'Turkey', 86, 68, 83, 88, 82, 72, 72, 10, 90, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p208574.png?padding=0.7'),
  ('Alexis Mac Allister', 'Mac Allister', 'MID', 'Argentina', 86, 70, 79, 84, 84, 78, 78, 10, 90, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243627.png?padding=0.7'),
  ('Granit Xhaka', 'Xhaka', 'MID', 'Switzerland', 86, 50, 74, 86, 76, 80, 83, 10, 92, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200145.png?padding=0.7'),
  ('Cole Palmer', 'Palmer', 'MID', 'England', 85, 78, 83, 83, 86, 55, 68, 10, 96, 90, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p257534.png?padding=0.7'),
  ('Vitinha', 'Vitinha', 'MID', 'Portugal', 85, 76, 74, 84, 86, 74, 70, 10, 90, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253002.png?padding=0.7'),
  ('Aurélien Tchouaméni', 'Tchouaméni', 'MID', 'France', 85, 73, 71, 81, 78, 83, 83, 10, 89, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241637.png?padding=0.7'),
  ('Bruno Guimarães', 'Guimarães', 'MID', 'Brazil', 85, 67, 76, 84, 84, 80, 82, 10, 89, 85, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p240130.png?padding=0.7'),
  ('James Maddison', 'Maddison', 'MID', 'England', 85, 72, 81, 86, 85, 54, 64, 10, 87, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p220697.png?padding=0.7'),
  ('Eduardo Camavinga', 'Camavinga', 'MID', 'France', 83, 80, 68, 82, 83, 80, 82, 10, 89, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p248243.png?padding=0.7'),
  ('Dominik Szoboszlai', 'Szoboszlai', 'MID', 'Hungary', 83, 82, 84, 83, 83, 62, 74, 10, 88, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246404.png?padding=0.7'),
  ('Gavi', 'Gavi', 'MID', 'Spain', 83, 77, 67, 80, 85, 69, 78, 10, 88, 90, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p264240.png?padding=0.7'),
  ('Kobbie Mainoo', 'Mainoo', 'MID', 'England', 80, 73, 68, 78, 83, 76, 77, 10, 91, 55, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p269136.png?padding=0.7'),
  ('Warren Zaïre-Emery', 'Zaïre-Emery', 'MID', 'France', 80, 76, 70, 78, 80, 75, 78, 10, 89, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p272445.png?padding=0.7'),
  ('Kylian Mbappé', 'Mbappé', 'ATT', 'France', 91, 97, 90, 80, 92, 36, 78, 11, 94, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231747.png?padding=0.7'),
  ('Erling Haaland', 'Haaland', 'ATT', 'Norway', 91, 89, 92, 65, 81, 45, 88, 10, 95, 180, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239085.png?padding=0.7'),
  ('Vinícius Júnior', 'Vini Jr.', 'ATT', 'Brazil', 90, 95, 84, 81, 91, 29, 69, 10, 93, 200, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p238794.png?padding=0.7'),
  ('Harry Kane', 'Kane', 'ATT', 'England', 90, 65, 93, 84, 82, 47, 82, 10, 92, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202126.png?padding=0.7'),
  ('Mohamed Salah', 'Salah', 'ATT', 'Egypt', 89, 89, 87, 82, 88, 45, 76, 10, 93, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p209331.png?padding=0.7'),
  ('Lautaro Martínez', 'Lautaro', 'ATT', 'Argentina', 89, 81, 88, 74, 85, 48, 84, 10, 91, 110, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231478.png?padding=0.7'),
  ('Phil Foden', 'Foden', 'ATT', 'England', 88, 86, 86, 85, 90, 57, 63, 10, 90, 150, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237692.png?padding=0.7'),
  ('Robert Lewandowski', 'Lewandowski', 'ATT', 'Poland', 88, 72, 88, 78, 84, 44, 80, 10, 93, 30, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p188545.png?padding=0.7'),
  ('Antoine Griezmann', 'Griezmann', 'ATT', 'France', 88, 78, 88, 88, 88, 58, 72, 10, 89, 35, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p194765.png?padding=0.7'),
  ('Lionel Messi', 'Messi', 'ATT', 'Argentina', 88, 79, 85, 87, 92, 33, 64, 10, 90, 30, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p158023.png?padding=0.7'),
  ('Victor Osimhen', 'Osimhen', 'ATT', 'Nigeria', 87, 89, 85, 66, 80, 42, 82, 10, 89, 100, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232293.png?padding=0.7'),
  ('Son Heung-min', 'Son', 'ATT', 'South Korea', 87, 87, 89, 82, 84, 42, 70, 10, 89, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200104.png?padding=0.7'),
  ('Bukayo Saka', 'Saka', 'ATT', 'England', 87, 86, 83, 83, 88, 65, 76, 10, 92, 140, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246669.png?padding=0.7'),
  ('Cristiano Ronaldo', 'C. Ronaldo', 'ATT', 'Portugal', 86, 77, 88, 75, 80, 34, 74, 10, 91, 20, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p20801.png?padding=0.7'),
  ('Rodrygo', 'Rodrygo', 'ATT', 'Brazil', 86, 89, 82, 80, 88, 32, 60, 10, 89, 110, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243812.png?padding=0.7'),
  ('Rafael Leão', 'Leão', 'ATT', 'Portugal', 86, 93, 81, 76, 87, 28, 77, 10, 88, 90, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241721.png?padding=0.7'),
  ('Ousmane Dembélé', 'Dembélé', 'ATT', 'France', 86, 93, 79, 84, 90, 36, 58, 10, 89, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231443.png?padding=0.7'),
  ('Raphinha', 'Raphinha', 'ATT', 'Brazil', 86, 91, 82, 82, 86, 51, 73, 10, 95, 60, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233419.png?padding=0.7'),
  ('Khvicha Kvaratskhelia', 'Kvaratskhelia', 'ATT', 'Georgia', 85, 86, 81, 81, 87, 41, 76, 10, 88, 80, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p247635.png?padding=0.7'),
  ('Alexander Isak', 'Isak', 'ATT', 'Sweden', 85, 88, 83, 73, 83, 32, 71, 10, 91, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233731.png?padding=0.7'),
  ('Ollie Watkins', 'Watkins', 'ATT', 'England', 85, 86, 83, 77, 81, 45, 80, 10, 90, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p225213.png?padding=0.7'),
  ('Nico Williams', 'N. Williams', 'ATT', 'Spain', 85, 93, 78, 80, 86, 36, 70, 10, 92, 70, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256516.png?padding=0.7'),
  ('Lamine Yamal', 'Yamal', 'ATT', 'Spain', 84, 88, 80, 84, 88, 35, 55, 10, 96, 150, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p277643.png?padding=0.7'),
  ('Julián Álvarez', 'J. Álvarez', 'ATT', 'Argentina', 84, 84, 84, 78, 83, 55, 76, 10, 89, 75, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246191.png?padding=0.7'),
  ('Luis Díaz', 'L. Díaz', 'ATT', 'Colombia', 84, 90, 80, 75, 87, 34, 74, 10, 92, 65, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241084.png?padding=0.7')
  ('Xavi', 'Xavi', 'MID', 'Spain', 92, 75, 76, 95, 92, 74, 72, 10, 96, 65, 'https://cdn.futbin.com/content/fifa24/img/players/10535.png'),
  ('Andrés Iniesta', 'Iniesta', 'MID', 'Spain', 92, 78, 75, 93, 94, 65, 68, 10, 96, 65, 'https://cdn.futbin.com/content/fifa23/img/players/41.png'),
  ('Ronaldinho', 'Ronaldinho', 'ATT', 'Brazil', 93, 91, 89, 90, 95, 40, 81, 10, 97, 85, 'https://cdn.futbin.com/content/fifa24/img/players/28130.png'),
  ('Gerard Piqué', 'Piqué', 'DEF', 'Spain', 89, 65, 61, 76, 71, 90, 85, 10, 93, 45, 'https://cdn.futbin.com/content/fifa23/img/players/152729.png'),
  ('Sergio Busquets', 'Busquets', 'MID', 'Spain', 89, 45, 64, 86, 82, 88, 81, 10, 92, 45, 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p189511.png?padding=0.7'),
  ('Zinedine Zidane', 'Zidane', 'MID', 'France', 94, 83, 89, 95, 94, 74, 85, 10, 98, 90, 'https://cdn.futbin.com/content/fifa24/img/players/1397.png'),
  ('Iker Casillas', 'Casillas', 'GK', 'Spain', 91, 60, 25, 75, 50, 35, 80, 93, 96, 55, 'https://cdn.futbin.com/content/fifa24/img/players/5479.png'),
  ('Karim Benzema', 'Benzema', 'ATT', 'France', 91, 80, 89, 84, 88, 42, 81, 10, 95, 60, 'https://cdn.futbin.com/content/fifa23/img/players/165153.png'),
  ('Marcelo', 'Marcelo', 'DEF', 'Brazil', 89, 84, 74, 86, 89, 84, 80, 10, 94, 45, 'https://cdn.futbin.com/content/fifa23/img/players/176676.png'),
  ('Gareth Bale', 'Bale', 'ATT', 'Wales', 90, 94, 89, 84, 86, 58, 83, 10, 95, 55, 'https://cdn.futbin.com/content/fifa23/img/players/173731.png'),
) AS v(name, short_name, position, nationality, overall, pace, shooting, passing, dribbling, defending, physical, goalkeeping, form, market_value_m, avatar_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.players p WHERE p.name = v.name
);

-- Update avatar URLs for any existing rows that might lack them
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192119.png?padding=0.7', overall = 90 WHERE name = 'Thibaut Courtois' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212831.png?padding=0.7', overall = 89 WHERE name = 'Alisson Becker' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192448.png?padding=0.7', overall = 89 WHERE name = 'Marc-André ter Stegen' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230621.png?padding=0.7', overall = 89 WHERE name = 'Gianluigi Donnarumma' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p210257.png?padding=0.7', overall = 88 WHERE name = 'Ederson' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200389.png?padding=0.7', overall = 88 WHERE name = 'Jan Oblak' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235073.png?padding=0.7', overall = 88 WHERE name = 'Gregor Kobel' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p215698.png?padding=0.7', overall = 87 WHERE name = 'Mike Maignan' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202811.png?padding=0.7', overall = 87 WHERE name = 'Emiliano Martínez' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p177683.png?padding=0.7', overall = 87 WHERE name = 'Yann Sommer' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p167495.png?padding=0.7', overall = 86 WHERE name = 'Manuel Neuer' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p220814.png?padding=0.7', overall = 85 WHERE name = 'David Raya' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230869.png?padding=0.7', overall = 84 WHERE name = 'Unai Simón' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p240091.png?padding=0.7', overall = 84 WHERE name = 'Guglielmo Vicario' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234577.png?padding=0.7', overall = 84 WHERE name = 'Diogo Costa' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203376.png?padding=0.7', overall = 89 WHERE name = 'Virgil van Dijk' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243715.png?padding=0.7', overall = 88 WHERE name = 'William Saliba' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239818.png?padding=0.7', overall = 88 WHERE name = 'Rúben Dias' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205452.png?padding=0.7', overall = 88 WHERE name = 'Antonio Rüdiger' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237383.png?padding=0.7', overall = 87 WHERE name = 'Alessandro Bastoni' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232656.png?padding=0.7', overall = 87 WHERE name = 'Theo Hernández' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p207865.png?padding=0.7', overall = 87 WHERE name = 'Marquinhos' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232580.png?padding=0.7', overall = 86 WHERE name = 'Gabriel Magalhães' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p204963.png?padding=0.7', overall = 86 WHERE name = 'Dani Carvajal' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231281.png?padding=0.7', overall = 86 WHERE name = 'Trent Alexander-Arnold' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205988.png?padding=0.7', overall = 86 WHERE name = 'Alejandro Grimaldo' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251517.png?padding=0.7', overall = 85 WHERE name = 'Joško Gvardiol' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241486.png?padding=0.7', overall = 85 WHERE name = 'Jules Koundé' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253163.png?padding=0.7', overall = 85 WHERE name = 'Ronald Araújo' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235212.png?padding=0.7', overall = 85 WHERE name = 'Achraf Hakimi' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203574.png?padding=0.7', overall = 85 WHERE name = 'John Stones' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253149.png?padding=0.7', overall = 84 WHERE name = 'Jeremie Frimpong' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234396.png?padding=0.7', overall = 84 WHERE name = 'Alphonso Davies' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228618.png?padding=0.7', overall = 84 WHERE name = 'Federico Dimarco' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p188377.png?padding=0.7', overall = 84 WHERE name = 'Kyle Walker' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p226853.png?padding=0.7', overall = 84 WHERE name = 'Manuel Akanji' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232488.png?padding=0.7', overall = 84 WHERE name = 'Cristian Romero' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237678.png?padding=0.7', overall = 84 WHERE name = 'Lisandro Martínez' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p213345.png?padding=0.7', overall = 84 WHERE name = 'Jonathan Tah' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p229558.png?padding=0.7', overall = 83 WHERE name = 'Dayot Upamecano' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252145.png?padding=0.7', overall = 83 WHERE name = 'Nuno Mendes' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239231.png?padding=0.7', overall = 82 WHERE name = 'Marc Cucurella' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p264453.png?padding=0.7', overall = 82 WHERE name = 'Micky van de Ven' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p278046.png?padding=0.7', overall = 81 WHERE name = 'Pau Cubarsí' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/155862.png', overall = 90 WHERE name = 'Sergio Ramos';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231866.png?padding=0.7', overall = 91 WHERE name = 'Rodri' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192985.png?padding=0.7', overall = 90 WHERE name = 'Kevin De Bruyne' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252371.png?padding=0.7', overall = 90 WHERE name = 'Jude Bellingham' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p222665.png?padding=0.7', overall = 89 WHERE name = 'Martin Ødegaard' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256630.png?padding=0.7', overall = 88 WHERE name = 'Florian Wirtz' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239053.png?padding=0.7', overall = 88 WHERE name = 'Federico Valverde' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p218667.png?padding=0.7', overall = 88 WHERE name = 'Bernardo Silva' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256790.png?padding=0.7', overall = 87 WHERE name = 'Jamal Musiala' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234378.png?padding=0.7', overall = 87 WHERE name = 'Declan Rice' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212198.png?padding=0.7', overall = 87 WHERE name = 'Bruno Fernandes' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p224232.png?padding=0.7', overall = 87 WHERE name = 'Nicolò Barella' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228702.png?padding=0.7', overall = 87 WHERE name = 'Frenkie de Jong' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p186942.png?padding=0.7', overall = 87 WHERE name = 'Ilkay Gündogan' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/182521.png', overall = 90 WHERE name = 'Toni Kroos' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p177003.png?padding=0.7', overall = 86 WHERE name = 'Luka Modrić' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251854.png?padding=0.7', overall = 86 WHERE name = 'Pedri' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212622.png?padding=0.7', overall = 86 WHERE name = 'Joshua Kimmich' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p208574.png?padding=0.7', overall = 86 WHERE name = 'Hakan Çalhanoğlu' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243627.png?padding=0.7', overall = 86 WHERE name = 'Alexis Mac Allister' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200145.png?padding=0.7', overall = 86 WHERE name = 'Granit Xhaka' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p257534.png?padding=0.7', overall = 85 WHERE name = 'Cole Palmer' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253002.png?padding=0.7', overall = 85 WHERE name = 'Vitinha' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241637.png?padding=0.7', overall = 85 WHERE name = 'Aurélien Tchouaméni' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p240130.png?padding=0.7', overall = 85 WHERE name = 'Bruno Guimarães' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p220697.png?padding=0.7', overall = 85 WHERE name = 'James Maddison' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p248243.png?padding=0.7', overall = 83 WHERE name = 'Eduardo Camavinga' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246404.png?padding=0.7', overall = 83 WHERE name = 'Dominik Szoboszlai' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p264240.png?padding=0.7', overall = 83 WHERE name = 'Gavi' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p269136.png?padding=0.7', overall = 80 WHERE name = 'Kobbie Mainoo' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p272445.png?padding=0.7', overall = 80 WHERE name = 'Warren Zaïre-Emery' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231747.png?padding=0.7', overall = 91 WHERE name = 'Kylian Mbappé' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239085.png?padding=0.7', overall = 91 WHERE name = 'Erling Haaland' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p238794.png?padding=0.7', overall = 90 WHERE name = 'Vinícius Júnior' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202126.png?padding=0.7', overall = 90 WHERE name = 'Harry Kane' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p209331.png?padding=0.7', overall = 89 WHERE name = 'Mohamed Salah' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231478.png?padding=0.7', overall = 89 WHERE name = 'Lautaro Martínez' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237692.png?padding=0.7', overall = 88 WHERE name = 'Phil Foden' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p188545.png?padding=0.7', overall = 88 WHERE name = 'Robert Lewandowski' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p194765.png?padding=0.7', overall = 88 WHERE name = 'Antoine Griezmann' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p158023.png?padding=0.7', overall = 88 WHERE name = 'Lionel Messi' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232293.png?padding=0.7', overall = 87 WHERE name = 'Victor Osimhen' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p200104.png?padding=0.7', overall = 87 WHERE name = 'Son Heung-min' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246669.png?padding=0.7', overall = 87 WHERE name = 'Bukayo Saka' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p20801.png?padding=0.7', overall = 86 WHERE name = 'Cristiano Ronaldo' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243812.png?padding=0.7', overall = 86 WHERE name = 'Rodrygo' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241721.png?padding=0.7', overall = 86 WHERE name = 'Rafael Leão' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231443.png?padding=0.7', overall = 86 WHERE name = 'Ousmane Dembélé' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233419.png?padding=0.7', overall = 86 WHERE name = 'Raphinha' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p247635.png?padding=0.7', overall = 85 WHERE name = 'Khvicha Kvaratskhelia' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233731.png?padding=0.7', overall = 85 WHERE name = 'Alexander Isak' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p225213.png?padding=0.7', overall = 85 WHERE name = 'Ollie Watkins' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256516.png?padding=0.7', overall = 85 WHERE name = 'Nico Williams' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p277643.png?padding=0.7', overall = 84 WHERE name = 'Lamine Yamal' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246191.png?padding=0.7', overall = 84 WHERE name = 'Julián Álvarez' AND (avatar_url IS NULL OR avatar_url = '');
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241084.png?padding=0.7', overall = 84 WHERE name = 'Luis Díaz' AND (avatar_url IS NULL OR avatar_url = '');

-- 10 Barcelona & Real Madrid Legends Updates
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/10535.png', overall = 92 WHERE name = 'Xavi';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa23/img/players/41.png', overall = 92 WHERE name = 'Andrés Iniesta';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/28130.png', overall = 93 WHERE name = 'Ronaldinho';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa23/img/players/152729.png', overall = 89 WHERE name = 'Gerard Piqué';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p189511.png?padding=0.7', overall = 89 WHERE name = 'Sergio Busquets';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/1397.png', overall = 94 WHERE name = 'Zinedine Zidane';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa24/img/players/5479.png', overall = 91 WHERE name = 'Iker Casillas';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa23/img/players/165153.png', overall = 91 WHERE name = 'Karim Benzema';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa23/img/players/176676.png', overall = 89 WHERE name = 'Marcelo';
UPDATE public.players SET avatar_url = 'https://cdn.futbin.com/content/fifa23/img/players/173731.png', overall = 90 WHERE name = 'Gareth Bale';
