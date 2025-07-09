import { Pool } from 'pg';

declare global {
  var __db: Pool | undefined;
}

let db: Pool;

if (process.env.NODE_ENV === 'production') {
  db = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
} else {
  if (!global.__db) {
    global.__db = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  }
  db = global.__db;
}

export { db };

export interface FledermausArt {
  id: number;
  art_name: string;
  wissenschaftlicher_name: string;
  beschreibung: string;
  bild_url: string;
}

export interface Aufnahme {
  id: number;
  user_email: string;
  fledermaus_art_name: string;
  latitude: number;
  longitude: number;
  wahrscheinlichkeit: number;
  erstellt_am: Date;
}