import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.query(
      'SELECT * FROM Fledermaus_Arten ORDER BY art_name'
    );

    return NextResponse.json({ arten: result.rows });

  } catch (error) {
    console.error('Fehler beim Laden der Fledermaus-Arten:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}