import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await db.query(
      'SELECT id, fledermaus_art_name, latitude, longitude, wahrscheinlichkeit, erstellt_am FROM Aufnahmen ORDER BY erstellt_am DESC'
    );

    return NextResponse.json({ aufnahmen: result.rows });

  } catch (error) {
    console.error('Fehler beim Laden aller Aufnahmen:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}