import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { LocationUtils } from '@/utils/locationUtils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { 
      fledermaus_art_name, 
      latitude, 
      longitude, 
      wahrscheinlichkeit,
      confidence,
      audio_duration,
      weather_conditions
    } = await request.json();

    if (!fledermaus_art_name || !latitude || !longitude || wahrscheinlichkeit === undefined) {
      return NextResponse.json({ error: 'Unvollständige Daten' }, { status: 400 });
    }

    // Datenschutz-konforme Location-Speicherung
    const gridCell = LocationUtils.coordinatesToGridCell(latitude, longitude);
    const [anonymizedLat, anonymizedLng] = LocationUtils.addLocationNoise(latitude, longitude);

    const result = await db.query(
      `INSERT INTO Aufnahmen (
        user_email, 
        fledermaus_art_name, 
        latitude, 
        longitude, 
        grid_cell,
        wahrscheinlichkeit,
        confidence,
        audio_duration,
        weather_conditions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        session.user.email, 
        fledermaus_art_name, 
        anonymizedLat, 
        anonymizedLng, 
        gridCell,
        wahrscheinlichkeit,
        confidence || 'medium',
        audio_duration || 0,
        weather_conditions || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      aufnahme: result.rows[0] 
    });

  } catch (error) {
    console.error('Fehler beim Speichern der Aufnahme:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const result = await db.query(
      'SELECT * FROM Aufnahmen WHERE user_email = $1 ORDER BY erstellt_am DESC',
      [session.user.email]
    );

    return NextResponse.json({ aufnahmen: result.rows });

  } catch (error) {
    console.error('Fehler beim Laden der Aufnahmen:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}