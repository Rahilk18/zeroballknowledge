-- ============================================================
-- MIGRATION: Add EA Sports FC Official Player Faces
-- ============================================================

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url TEXT;

UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192119.png?padding=0.7' WHERE name = 'Thibaut Courtois';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243715.png?padding=0.7' WHERE name = 'William Saliba';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p237383.png?padding=0.7' WHERE name = 'Alessandro Bastoni';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239053.png?padding=0.7' WHERE name = 'Federico Valverde';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p277643.png?padding=0.7' WHERE name = 'Lamine Yamal';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p158023.png?padding=0.7' WHERE name = 'Lionel Messi';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231747.png?padding=0.7' WHERE name = 'Kylian Mbappé';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235073.png?padding=0.7' WHERE name = 'Gregor Kobel';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251517.png?padding=0.7' WHERE name = 'Joško Gvardiol';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256790.png?padding=0.7' WHERE name = 'Jamal Musiala';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202811.png?padding=0.7' WHERE name = 'Emiliano Martínez';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252145.png?padding=0.7' WHERE name = 'Nuno Mendes';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p203376.png?padding=0.7' WHERE name = 'Virgil van Dijk';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p251854.png?padding=0.7' WHERE name = 'Pedri';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p252371.png?padding=0.7' WHERE name = 'Jude Bellingham';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p243812.png?padding=0.7' WHERE name = 'Rodrygo';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231443.png?padding=0.7' WHERE name = 'Ousmane Dembélé';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p230621.png?padding=0.7' WHERE name = 'Gianluigi Donnarumma';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232580.png?padding=0.7' WHERE name = 'Gabriel Magalhães';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p177003.png?padding=0.7' WHERE name = 'Luka Modrić';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231866.png?padding=0.7' WHERE name = 'Rodri';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p20801.png?padding=0.7' WHERE name = 'Cristiano Ronaldo';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233419.png?padding=0.7' WHERE name = 'Raphinha';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239085.png?padding=0.7' WHERE name = 'Erling Haaland';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p192985.png?padding=0.7' WHERE name = 'Kevin De Bruyne';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212831.png?padding=0.7' WHERE name = 'Alisson Becker';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p239818.png?padding=0.7' WHERE name = 'Rúben Dias';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p256630.png?padding=0.7' WHERE name = 'Florian Wirtz';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246669.png?padding=0.7' WHERE name = 'Bukayo Saka';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p202126.png?padding=0.7' WHERE name = 'Harry Kane';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p209331.png?padding=0.7' WHERE name = 'Mohamed Salah';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231478.png?padding=0.7' WHERE name = 'Lautaro Martínez';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241721.png?padding=0.7' WHERE name = 'Rafael Leão';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p247635.png?padding=0.7' WHERE name = 'Khvicha Kvaratskhelia';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p246191.png?padding=0.7' WHERE name = 'Julián Álvarez';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p234378.png?padding=0.7' WHERE name = 'Declan Rice';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p222665.png?padding=0.7' WHERE name = 'Martin Ødegaard';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212198.png?padding=0.7' WHERE name = 'Bruno Fernandes';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p255253.png?padding=0.7' WHERE name = 'Vitinha';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p212622.png?padding=0.7' WHERE name = 'Joshua Kimmich';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p257534.png?padding=0.7' WHERE name = 'Cole Palmer';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p218667.png?padding=0.7' WHERE name = 'Bernardo Silva';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p228702.png?padding=0.7' WHERE name = 'Frenkie de Jong';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p235212.png?padding=0.7' WHERE name = 'Achraf Hakimi';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p207865.png?padding=0.7' WHERE name = 'Marquinhos';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p232656.png?padding=0.7' WHERE name = 'Theo Hernández';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231281.png?padding=0.7' WHERE name = 'Trent Alexander-Arnold';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p205452.png?padding=0.7' WHERE name = 'Antonio Rüdiger';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p241486.png?padding=0.7' WHERE name = 'Jules Koundé';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p278046.png?padding=0.7' WHERE name = 'Pau Cubarsí';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p238794.png?padding=0.7' WHERE name = 'Vinícius Júnior';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p253163.png?padding=0.7' WHERE name = 'Ronald Araújo';
UPDATE public.players SET avatar_url = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p167495.png?padding=0.7' WHERE name = 'Manuel Neuer';
