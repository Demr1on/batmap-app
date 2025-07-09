# BatMap - Fledermaus Tracker

Eine Web-App zur Erkennung und Kartierung von Fledermäusen mit KI-Unterstützung.

## Features

- **KI-basierte Fledermaus-Erkennung**: Upload von Audio-Dateien und automatische Artenbestimmung
- **Interaktive Karten**: Fundorte auf OpenStreetMap markieren
- **Benutzer-Authentifizierung**: Sicherer Login mit Google OAuth
- **Persönliche Aufnahmen**: Übersicht über eigene Funde
- **Responsive Design**: Optimiert für Desktop und Mobile

## Technologie-Stack

- **Frontend**: Next.js 15 mit TypeScript
- **Styling**: Tailwind CSS
- **Authentifizierung**: NextAuth.js mit Google Provider
- **KI**: TensorFlow.js mit Teachable Machine
- **Karten**: React-Leaflet mit OpenStreetMap
- **Datenbank**: PostgreSQL (Neon)
- **Deployment**: Vercel

## Setup

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- PostgreSQL Datenbank (z.B. Neon)
- Google OAuth Credentials

### Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd batmap-app
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.local.example .env.local
```

Fügen Sie folgende Werte in `.env.local` ein:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
POSTGRES_URL=your-postgres-url
```

4. Datenbank einrichten:
```bash
# SQL-Schema aus src/lib/database.sql in Ihre Datenbank importieren
```

5. Entwicklungsserver starten:
```bash
npm run dev
```

## Konfiguration

### Teachable Machine Modell

1. Besuchen Sie [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Erstellen Sie ein Audio-Projekt
3. Laden Sie Fledermausruf-Samples hoch für:
   - Zwergfledermaus
   - Wasserfledermaus
   - Großer Abendsegler
   - Hintergrundgeräusche
4. Trainieren Sie das Modell
5. Exportieren Sie als "Tensorflow.js"
6. Ersetzen Sie die URL in `src/app/page.tsx`

### Google OAuth

1. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein vorhandenes
3. Aktivieren Sie die Google+ API
4. Erstellen Sie OAuth 2.0 Credentials
5. Fügen Sie Ihre Domain zu den autorisierten Domains hinzu
6. Kopieren Sie Client ID und Secret in `.env.local`

## Projektstruktur

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── meine-aufnahmen/ # Benutzer-Aufnahmen Seite
│   ├── layout.tsx     # Root Layout
│   └── page.tsx       # Haupt-Upload Seite
├── components/
│   ├── AuthButton.tsx      # Login/Logout Button
│   ├── AudioClassifier.tsx # KI-Audio-Analyse
│   └── LocationPicker.tsx  # Kartenauswahl
└── lib/
    ├── db.ts          # Datenbankverbindung
    └── database.sql   # SQL Schema
```

## API Endpunkte

- `GET /api/aufnahmen` - Benutzer-Aufnahmen laden
- `POST /api/aufnahmen` - Neue Aufnahme speichern
- `GET /api/aufnahmen/alle` - Alle öffentlichen Aufnahmen
- `GET /api/fledermaus/[art_name]` - Art-Informationen
- `GET /api/fledermaus` - Alle Arten

## Deployment

### Vercel

1. Verbinden Sie Ihr GitHub Repository mit Vercel
2. Konfigurieren Sie Umgebungsvariablen im Vercel Dashboard
3. Deploy wird automatisch bei Push zu main ausgelöst

### Datenbank (Neon)

1. Erstellen Sie eine Neon Datenbank
2. Importieren Sie das Schema aus `src/lib/database.sql`
3. Fügen Sie die Connection String zu Vercel hinzu

## Lizenz

MIT License - siehe LICENSE Datei für Details.

## Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature Branch
3. Commiten Sie Ihre Änderungen
4. Pushen Sie zum Branch
5. Öffnen Sie einen Pull Request

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.