-- Tabelle für die statischen Infos zu den Fledermausarten
CREATE TABLE Fledermaus_Arten (
    id SERIAL PRIMARY KEY,
    art_name VARCHAR(255) UNIQUE NOT NULL, -- "Zwergfledermaus" (Muss exakt dem Klassennamen in Teachable Machine entsprechen!)
    wissenschaftlicher_name VARCHAR(255),
    beschreibung TEXT,
    bild_url VARCHAR(255)
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

-- Beispiel-Daten einfügen
INSERT INTO Fledermaus_Arten (art_name, wissenschaftlicher_name, beschreibung, bild_url) VALUES
('Zwergfledermaus', 'Pipistrellus pipistrellus', 'Die Zwergfledermaus ist eine der häufigsten Fledermausarten in Europa. Sie ist sehr anpassungsfähig und lebt oft in der Nähe menschlicher Siedlungen.', 'https://example.com/zwergfledermaus.jpg'),
('Wasserfledermaus', 'Myotis daubentonii', 'Die Wasserfledermaus jagt bevorzugt über Gewässern und kann sogar Insekten von der Wasseroberfläche aufnehmen.', 'https://example.com/wasserfledermaus.jpg'),
('Großer Abendsegler', 'Nyctalus noctula', 'Der Große Abendsegler ist eine der größten heimischen Fledermausarten und jagt in großer Höhe.', 'https://example.com/grosser-abendsegler.jpg'),
('Hintergrundgeräusche', 'Keine Art', 'Verschiedene Hintergrundgeräusche oder Stille, die keine Fledermausrufe enthalten.', 'https://example.com/no-bat.jpg');