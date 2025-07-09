-- Tabelle für die statischen Infos zu den Fledermausarten (erweitert basierend auf Research-Prompt)
CREATE TABLE Fledermaus_Arten (
    id SERIAL PRIMARY KEY,
    art_name VARCHAR(255) UNIQUE NOT NULL, -- "Zwergfledermaus" (Muss exakt dem Klassennamen in Teachable Machine entsprechen!)
    wissenschaftlicher_name VARCHAR(255) NOT NULL,
    familie VARCHAR(255) NOT NULL, -- Taxonomische Familie
    
    -- Biometrische Daten und Erkennungsmerkmale
    aussehen_beschreibung TEXT,
    fellfarbe VARCHAR(255),
    besondere_merkmale TEXT,
    fluegelspannweite_min DOUBLE PRECISION, -- cm
    fluegelspannweite_max DOUBLE PRECISION, -- cm
    koerperlaenge_min DOUBLE PRECISION, -- cm
    koerperlaenge_max DOUBLE PRECISION, -- cm
    gewicht_min DOUBLE PRECISION, -- g
    gewicht_max DOUBLE PRECISION, -- g
    
    -- Verbreitung und Lebensraum
    geografische_verbreitung TEXT,
    typische_lebensraeume TEXT,
    haeufigkeit VARCHAR(50), -- 'sehr häufig', 'häufig', 'mäßig häufig', 'selten'
    kerngebiete TEXT,
    
    -- Quartiere
    sommerquartiere TEXT,
    wochenstuben TEXT,
    winterquartiere TEXT,
    
    -- Jagdverhalten und Ernährung
    jagdstrategie TEXT,
    jagdgebiete TEXT,
    flugverhalten TEXT,
    hauptbeutetiere TEXT,
    nahrungszusammensetzung TEXT,
    
    -- Echoortung und Schutzstatus
    frequenzbereich_min DOUBLE PRECISION, -- kHz
    frequenzbereich_max DOUBLE PRECISION, -- kHz
    ortungsruf_charakteristik TEXT,
    gefaehrdungsstatus VARCHAR(50), -- Rote Liste Status
    hauptgefaehrdungsursachen TEXT,
    
    -- Metadata
    bild_url VARCHAR(255),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für die individuellen Aufnahmen der Nutzer
CREATE TABLE Aufnahmen (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    fledermaus_art_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    grid_cell VARCHAR(50) NOT NULL, -- Datenschutz-konforme Grid-Zelle
    wahrscheinlichkeit DOUBLE PRECISION,
    confidence VARCHAR(20) DEFAULT 'medium',
    user_verification INTEGER DEFAULT 0, -- Community-Bewertung
    expert_review BOOLEAN DEFAULT FALSE,
    discussion_thread TEXT,
    audio_duration DOUBLE PRECISION,
    weather_conditions TEXT,
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fledermaus_art_name) REFERENCES Fledermaus_Arten(art_name)
);

-- Tabelle für Benutzer-Fortschritt
CREATE TABLE user_progress (
    user_email VARCHAR(255) PRIMARY KEY,
    species_discovered JSONB DEFAULT '[]',
    total_recordings INTEGER DEFAULT 0,
    accuracy_score DOUBLE PRECISION DEFAULT 0,
    badges JSONB DEFAULT '[]',
    contribution_rank INTEGER DEFAULT 0,
    monthly_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Community-Bewertungen
CREATE TABLE recording_ratings (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recording_id) REFERENCES Aufnahmen(id),
    UNIQUE(recording_id, user_email)
);

-- Tabelle für Diskussions-Threads
CREATE TABLE discussions (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    parent_id INTEGER, -- Für Antworten
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recording_id) REFERENCES Aufnahmen(id),
    FOREIGN KEY (parent_id) REFERENCES discussions(id)
);

-- Tabelle für Populationsanalytik
CREATE TABLE population_data (
    id SERIAL PRIMARY KEY,
    species VARCHAR(255) NOT NULL,
    grid_cell VARCHAR(50) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    count INTEGER NOT NULL,
    avg_activity DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance
CREATE INDEX idx_aufnahmen_grid_cell ON Aufnahmen(grid_cell);
CREATE INDEX idx_aufnahmen_species ON Aufnahmen(fledermaus_art_name);
CREATE INDEX idx_aufnahmen_user ON Aufnahmen(user_email);
CREATE INDEX idx_aufnahmen_date ON Aufnahmen(erstellt_am);
CREATE INDEX idx_population_species_time ON population_data(species, year, month);
CREATE INDEX idx_discussions_recording ON discussions(recording_id);

-- Beispiel-Daten einfügen (erweitert mit vollständigen Informationen)
INSERT INTO Fledermaus_Arten (
    art_name, wissenschaftlicher_name, familie,
    aussehen_beschreibung, fellfarbe, besondere_merkmale,
    fluegelspannweite_min, fluegelspannweite_max, koerperlaenge_min, koerperlaenge_max, gewicht_min, gewicht_max,
    geografische_verbreitung, typische_lebensraeume, haeufigkeit, kerngebiete,
    sommerquartiere, wochenstuben, winterquartiere,
    jagdstrategie, jagdgebiete, flugverhalten, hauptbeutetiere, nahrungszusammensetzung,
    frequenzbereich_min, frequenzbereich_max, ortungsruf_charakteristik, gefaehrdungsstatus, hauptgefaehrdungsursachen,
    bild_url
) VALUES
('Zwergfledermaus', 'Pipistrellus pipistrellus', 'Vespertilionidae',
    'Sehr kleine Fledermaus mit breiten, abgerundeten Ohren', 'Rotbraun bis dunkelbraun', 'Charakteristische Tragus-Form, kleine Größe',
    18.0, 24.0, 3.2, 5.1, 3.5, 8.0,
    'Ganz Deutschland flächendeckend', 'Siedlungen, Parks, Gärten, Waldränder', 'sehr häufig', 'Alle Bundesländer',
    'Gebäudespalten, Dachböden, Baumhöhlen', 'Warme Dachböden, Gebäudespalten', 'Keller, Bunker, Felsspalten',
    'Wendiger Flug um Vegetation', 'Siedlungsbereich, Waldränder, Gewässer', 'Schnell und wendig', 'Mücken, kleine Käfer, Nachtfalter', 'Hauptsächlich kleine Dipteren',
    45.0, 51.0, 'Kurze, steile Rufe mit konstantem Frequenzverlauf', 'Ungefährdet', 'Gebäudesanierung, Quartierverlust',
    'https://example.com/zwergfledermaus.jpg'
),
('Wasserfledermaus', 'Myotis daubentonii', 'Vespertilionidae',
    'Mittelgroße Fledermaus mit großen Füßen', 'Oberseits braun, unterseits heller', 'Große Füße, lange Ohren',
    24.0, 27.5, 4.5, 5.5, 7.0, 15.0,
    'Ganz Deutschland, bevorzugt gewässerreiche Gebiete', 'Gewässer, Auwälder, Feuchtgebiete', 'häufig', 'Norddeutsche Tiefebene, Flussauen',
    'Baumhöhlen, Nistkästen', 'Baumhöhlen in Gewässernähe', 'Höhlen, Stollen, Keller',
    'Jagd dicht über Wasseroberfläche', 'Stillgewässer, langsame Fließgewässer', 'Langsam, dicht über Wasser', 'Zuckmücken, Köcherfliegen, Eintagsfliegen', 'Wasserinsekten, kleine Fische',
    35.0, 85.0, 'Frequenzmodulierte Rufe, breitbandig', 'Ungefährdet', 'Gewässerverschmutzung, Habitatverlust',
    'https://example.com/wasserfledermaus.jpg'
),
('Großer Abendsegler', 'Nyctalus noctula', 'Vespertilionidae',
    'Große Fledermaus mit langen, schmalen Flügeln', 'Goldbraun bis rotbraun', 'Große Ohren, kräftiger Körperbau',
    32.0, 40.0, 6.0, 8.2, 18.0, 40.0,
    'Vor allem Norddeutschland, Zugvogel', 'Wälder, Parkanlagen, offene Landschaften', 'mäßig häufig', 'Norddeutsche Tiefebene, Mittelgebirge',
    'Baumhöhlen, Nistkästen', 'Baumhöhlen in Wäldern', 'Baumhöhlen, Gebäude',
    'Jagd im freien Luftraum', 'Über Wäldern und Gewässern, 10-50m Höhe', 'Schnell und geradlinig', 'Maikäfer, Nachtfalter, Termiten', 'Große Insekten',
    17.0, 25.0, 'Tieffrequente, konstante Rufe', 'Vorwarnliste', 'Windenergieanlagen, Quartierverlust',
    'https://example.com/grosser-abendsegler.jpg'
),
('Hintergrundgeräusche', 'Keine Art', 'Keine Familie',
    'Verschiedene Umgebungsgeräusche ohne Fledermausrufe', 'Nicht zutreffend', 'Rauschen, Wind, andere Tierstimmen',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Überall', 'Alle Lebensräume', 'sehr häufig', 'Überall',
    'Nicht zutreffend', 'Nicht zutreffend', 'Nicht zutreffend',
    'Nicht zutreffend', 'Nicht zutreffend', 'Nicht zutreffend', 'Nicht zutreffend', 'Nicht zutreffend',
    NULL, NULL, 'Verschiedene Frequenzen ohne Struktur', 'Nicht zutreffend', 'Nicht zutreffend',
    'https://example.com/no-bat.jpg'
),
('Breitflügelfledermaus', 'Eptesicus serotinus', 'Vespertilionidae',
    'Große, kräftige Fledermaus mit breiten Flügeln', 'Dunkelbraun bis schwarzbraun', 'Breite Flügel, große Ohren mit breitem Tragus',
    31.5, 38.0, 6.2, 8.0, 14.0, 35.0,
    'Ganz Deutschland außer Hochgebirge', 'Siedlungen, Parklandschaften, Waldränder', 'häufig', 'Norddeutsche Tiefebene, Rheinebene',
    'Dachböden, Gebäudespalten', 'Warme Dachböden großer Gebäude', 'Keller, Bunker, Höhlen',
    'Langsamer, geradliniger Flug', 'Über Siedlungen und offener Landschaft', 'Langsam und stetig', 'Maikäfer, Dungkäfer, Nachtfalter', 'Große Käfer und Falter',
    20.0, 28.0, 'Tieffrequente, konstante Rufe', 'Vorwarnliste', 'Quartierverlust, Insektizide',
    'https://example.com/breitfluegelfledermaus.jpg'
),
('Kleine Bartfledermaus', 'Myotis mystacinus', 'Vespertilionidae',
    'Kleine Fledermaus mit charakteristischen Barthaaren', 'Oberseits dunkelbraun, unterseits graubraun', 'Barthaare um den Mund, kleine Ohren',
    19.0, 22.5, 3.5, 4.7, 4.0, 7.5,
    'Ganz Deutschland, bevorzugt strukturreiche Landschaften', 'Dörfer, Waldränder, Gewässernähe', 'häufig', 'Mittelgebirge, Alpenvorland',
    'Gebäudespalten, Baumhöhlen', 'Warme Spalten in Gebäuden', 'Höhlen, Stollen, Keller',
    'Wendiger Flug in niedriger Höhe', 'Entlang von Vegetation, Gewässern', 'Langsam, wendig', 'Mücken, kleine Käfer, Spinnen', 'Kleine Arthropoden',
    35.0, 105.0, 'Frequenzmodulierte Rufe, sehr breitbandig', 'Ungefährdet', 'Habitatverlust, Quartierverlust',
    'https://example.com/kleine-bartfledermaus.jpg'
),
('Mausohr', 'Myotis myotis', 'Vespertilionidae',
    'Eine der größten europäischen Fledermausarten', 'Oberseits graubraun, unterseits heller', 'Sehr große Ohren, kräftiger Körperbau',
    35.0, 43.0, 6.7, 8.4, 20.0, 40.0,
    'Süddeutschland, zerstreut in Norddeutschland', 'Laubwälder, Parklandschaften, Dörfer', 'mäßig häufig', 'Baden-Württemberg, Bayern, Rheinland-Pfalz',
    'Dachböden großer Gebäude', 'Warme Dachböden von Kirchen und Schlössern', 'Höhlen, Stollen, große Keller',
    'Langsamer Flug, bodennahes Jagen', 'Laubwälder, Grünland', 'Langsam, präzise', 'Laufkäfer, Dungkäfer, Raupen', 'Bodenbewohnende Insekten',
    25.0, 86.0, 'Leisere Rufe, frequenzmoduliert', 'Ungefährdet', 'Quartiersverlust, Forstwirtschaft',
    'https://example.com/mausohr.jpg'
),
('Fransenfledermaus', 'Myotis nattereri', 'Vespertilionidae',
    'Mittelgroße Fledermaus mit charakteristischen Hautfransen', 'Oberseits braun, unterseits weißlich', 'Hautfransen an der Schwanzflughaut, lange Ohren',
    24.5, 30.0, 4.3, 5.0, 7.0, 12.0,
    'Ganz Deutschland, bevorzugt strukturreiche Gebiete', 'Wälder, Parks, Gärten, Gewässernähe', 'häufig', 'Alle Bundesländer, besonders waldreich',
    'Baumhöhlen, Nistkästen, Dachböden', 'Baumhöhlen, warme Gebäudespalten', 'Höhlen, Stollen, Keller',
    'Wendiger Flug, gleaning von Oberflächen', 'Wälder, Gärten, Gewässer', 'Langsam, sehr wendig', 'Spinnen, Weberknechte, Raupen', 'Arthropoden von Oberflächen',
    25.0, 100.0, 'Sehr leisere Rufe, frequenzmoduliert', 'Ungefährdet', 'Waldverlust, Quartiermangel',
    'https://example.com/fransenfledermaus.jpg'
),
('Rauhautfledermaus', 'Pipistrellus nathusii', 'Vespertilionidae',
    'Mittelgroße Fledermaus mit charakteristischer Behaarung', 'Oberseits rotbraun, unterseits gelbbraun', 'Behaarung auf der Schwanzflughaut, runde Ohren',
    23.0, 25.5, 4.6, 5.5, 6.0, 15.5,
    'Norddeutschland, Zugvogel', 'Wälder, Gewässernähe, Parkanlagen', 'mäßig häufig', 'Norddeutsche Tiefebene, Ostseeküste',
    'Baumhöhlen, Nistkästen', 'Baumhöhlen in Gewässernähe', 'Baumhöhlen, Gebäudequartiere',
    'Schneller Flug entlang von Gehölzen', 'Waldränder, Gewässer, Alleen', 'Schnell, geradlinig', 'Zuckmücken, Eintagsfliegen, kleine Käfer', 'Kleine Fluginsekten',
    38.0, 47.0, 'Konstante Rufe, mittlere Frequenz', 'Ungefährdet', 'Windenergieanlagen, Quartierverlust',
    'https://example.com/rauhautfledermaus.jpg'
);

-- Testdaten für Aufnahmen hinzufügen
INSERT INTO Aufnahmen (
    user_email, fledermaus_art_name, latitude, longitude, grid_cell, 
    wahrscheinlichkeit, confidence, user_verification, expert_review, 
    audio_duration, weather_conditions
) VALUES
-- Testuser 1 (test@example.com)
('test@example.com', 'Zwergfledermaus', 52.5200, 13.4050, '52.520,13.405', 0.92, 'high', 3, FALSE, 3.2, 'Klarer Himmel, 18°C'),
('test@example.com', 'Wasserfledermaus', 52.5100, 13.4000, '52.510,13.400', 0.87, 'high', 4, TRUE, 4.1, 'Leichter Wind, 16°C'),
('test@example.com', 'Großer Abendsegler', 52.5300, 13.4100, '52.530,13.410', 0.78, 'medium', 2, FALSE, 2.8, 'Bewölkt, 19°C'),
('test@example.com', 'Breitflügelfledermaus', 52.5150, 13.4200, '52.515,13.420', 0.85, 'high', 5, TRUE, 5.5, 'Regen, 15°C'),
('test@example.com', 'Kleine Bartfledermaus', 52.5250, 13.4300, '52.525,13.430', 0.73, 'medium', 1, FALSE, 3.8, 'Nebel, 12°C'),

-- Testuser 2 (demo@example.com)
('demo@example.com', 'Mausohr', 48.1351, 11.5820, '48.135,11.582', 0.89, 'high', 4, TRUE, 4.7, 'Sternenklar, 14°C'),
('demo@example.com', 'Fransenfledermaus', 48.1400, 11.5800, '48.140,11.580', 0.82, 'medium', 3, FALSE, 3.5, 'Wolkenlos, 17°C'),
('demo@example.com', 'Rauhautfledermaus', 48.1300, 11.5900, '48.130,11.590', 0.91, 'high', 5, TRUE, 2.9, 'Leichter Wind, 13°C'),
('demo@example.com', 'Zwergfledermaus', 48.1450, 11.5750, '48.145,11.575', 0.76, 'medium', 2, FALSE, 4.2, 'Bewölkt, 16°C'),
('demo@example.com', 'Wasserfledermaus', 48.1200, 11.5850, '48.120,11.585', 0.88, 'high', 4, TRUE, 3.1, 'Klar, 18°C'),

-- Testuser 3 (batfan@example.com)
('batfan@example.com', 'Großer Abendsegler', 51.0504, 13.7373, '51.050,13.737', 0.94, 'high', 5, TRUE, 3.6, 'Windstill, 20°C'),
('batfan@example.com', 'Breitflügelfledermaus', 51.0600, 13.7300, '51.060,13.730', 0.79, 'medium', 2, FALSE, 4.8, 'Leichter Regen, 14°C'),
('batfan@example.com', 'Kleine Bartfledermaus', 51.0450, 13.7450, '51.045,13.745', 0.86, 'high', 3, FALSE, 3.7, 'Neblig, 11°C'),
('batfan@example.com', 'Mausohr', 51.0550, 13.7250, '51.055,13.725', 0.81, 'medium', 4, TRUE, 5.2, 'Klar, 19°C'),
('batfan@example.com', 'Hintergrundgeräusche', 51.0500, 13.7400, '51.050,13.740', 0.15, 'low', 1, FALSE, 2.1, 'Windig, 16°C');

-- Testdaten für User Progress hinzufügen
INSERT INTO user_progress (
    user_email, species_discovered, total_recordings, accuracy_score, 
    badges, contribution_rank, monthly_streak
) VALUES
('test@example.com', 
 '["Zwergfledermaus", "Wasserfledermaus", "Großer Abendsegler", "Breitflügelfledermaus", "Kleine Bartfledermaus"]',
 5, 0.83, 
 '[{"id": "first_recording", "name": "Erste Aufnahme", "description": "Erste Fledermaus-Aufnahme", "icon": "🦇", "rarity": "common", "earned_at": "2024-01-15T20:30:00Z"}, {"id": "species_collector", "name": "Artensammler", "description": "5 verschiedene Arten entdeckt", "icon": "🔬", "rarity": "common", "earned_at": "2024-01-20T18:45:00Z"}]',
 1, 12),
('demo@example.com',
 '["Mausohr", "Fransenfledermaus", "Rauhautfledermaus", "Zwergfledermaus", "Wasserfledermaus"]',
 5, 0.85,
 '[{"id": "first_recording", "name": "Erste Aufnahme", "description": "Erste Fledermaus-Aufnahme", "icon": "🦇", "rarity": "common", "earned_at": "2024-01-10T21:15:00Z"}, {"id": "species_collector", "name": "Artensammler", "description": "5 verschiedene Arten entdeckt", "icon": "🔬", "rarity": "common", "earned_at": "2024-01-18T19:30:00Z"}, {"id": "accuracy_expert", "name": "Genauigkeits-Experte", "description": "Über 85% Genauigkeit", "icon": "🎯", "rarity": "rare", "earned_at": "2024-01-22T20:00:00Z"}]',
 2, 8),
('batfan@example.com',
 '["Großer Abendsegler", "Breitflügelfledermaus", "Kleine Bartfledermaus", "Mausohr"]',
 5, 0.87,
 '[{"id": "first_recording", "name": "Erste Aufnahme", "description": "Erste Fledermaus-Aufnahme", "icon": "🦇", "rarity": "common", "earned_at": "2024-01-05T22:00:00Z"}, {"id": "accuracy_expert", "name": "Genauigkeits-Experte", "description": "Über 85% Genauigkeit", "icon": "🎯", "rarity": "rare", "earned_at": "2024-01-25T19:15:00Z"}]',
 3, 15);

-- Testdaten für Recording Ratings hinzufügen
INSERT INTO recording_ratings (recording_id, user_email, rating, comment) VALUES
(1, 'demo@example.com', 5, 'Sehr klare Aufnahme der Zwergfledermaus!'),
(1, 'batfan@example.com', 4, 'Gut erkennbare Rufe'),
(2, 'test@example.com', 5, 'Perfekte Wasserfledermaus-Aufnahme'),
(2, 'batfan@example.com', 5, 'Eindeutig identifizierbar'),
(3, 'demo@example.com', 3, 'Etwas schwer zu erkennen'),
(4, 'batfan@example.com', 5, 'Tolle Breitflügelfledermaus-Aufnahme'),
(6, 'test@example.com', 4, 'Schöne Mausohr-Aufnahme'),
(8, 'demo@example.com', 5, 'Sehr gute Rauhautfledermaus-Identifikation'),
(11, 'test@example.com', 5, 'Perfekter Großer Abendsegler!'),
(11, 'demo@example.com', 5, 'Exzellente Aufnahme');

-- Testdaten für Discussions hinzufügen
INSERT INTO discussions (recording_id, user_email, content, parent_id) VALUES
(1, 'demo@example.com', 'Ist das wirklich eine Zwergfledermaus? Die Frequenz scheint mir etwas hoch.', NULL),
(1, 'test@example.com', 'Ja, das ist definitiv eine Zwergfledermaus. Die Frequenz ist typisch für diese Art.', 1),
(1, 'batfan@example.com', 'Stimme zu, eindeutig Pipistrellus pipistrellus.', 1),
(2, 'batfan@example.com', 'Schöne Aufnahme! Kann man die Jagdstrategie über dem Wasser erkennen?', NULL),
(2, 'test@example.com', 'Genau! Die Wasserfledermaus jagt typischerweise dicht über der Oberfläche.', 4),
(6, 'demo@example.com', 'Wow, ein Mausohr! Die sind hier in der Gegend eher selten.', NULL),
(6, 'batfan@example.com', 'Stimmt, Myotis myotis ist eine beeindruckende Art. Toll, dass du sie gefunden hast!', 6),
(11, 'test@example.com', 'Der Große Abendsegler ist immer wieder faszinierend. Besonders die Migrationsrouten!', NULL),
(11, 'demo@example.com', 'Ja, Nyctalus noctula kann hunderte Kilometer zurücklegen. Beeindruckend!', 8);

-- Testdaten für Population Data hinzufügen
INSERT INTO population_data (species, grid_cell, month, year, count, avg_activity) VALUES
-- Berlin Area (52.5xx, 13.4xx)
('Zwergfledermaus', '52.520,13.405', 6, 2024, 15, 0.8),
('Zwergfledermaus', '52.520,13.405', 7, 2024, 22, 0.9),
('Zwergfledermaus', '52.520,13.405', 8, 2024, 18, 0.7),
('Wasserfledermaus', '52.510,13.400', 6, 2024, 8, 0.6),
('Wasserfledermaus', '52.510,13.400', 7, 2024, 12, 0.8),
('Wasserfledermaus', '52.510,13.400', 8, 2024, 10, 0.7),
('Großer Abendsegler', '52.530,13.410', 5, 2024, 5, 0.9),
('Großer Abendsegler', '52.530,13.410', 6, 2024, 8, 1.0),
('Großer Abendsegler', '52.530,13.410', 7, 2024, 6, 0.8),

-- Munich Area (48.1xx, 11.5xx)
('Mausohr', '48.135,11.582', 6, 2024, 12, 0.7),
('Mausohr', '48.135,11.582', 7, 2024, 18, 0.9),
('Mausohr', '48.135,11.582', 8, 2024, 14, 0.8),
('Fransenfledermaus', '48.140,11.580', 6, 2024, 10, 0.6),
('Fransenfledermaus', '48.140,11.580', 7, 2024, 15, 0.8),
('Fransenfledermaus', '48.140,11.580', 8, 2024, 12, 0.7),

-- Dresden Area (51.0xx, 13.7xx)
('Breitflügelfledermaus', '51.060,13.730', 6, 2024, 7, 0.5),
('Breitflügelfledermaus', '51.060,13.730', 7, 2024, 11, 0.7),
('Breitflügelfledermaus', '51.060,13.730', 8, 2024, 9, 0.6),
('Kleine Bartfledermaus', '51.045,13.745', 6, 2024, 6, 0.4),
('Kleine Bartfledermaus', '51.045,13.745', 7, 2024, 9, 0.6),
('Kleine Bartfledermaus', '51.045,13.745', 8, 2024, 7, 0.5);