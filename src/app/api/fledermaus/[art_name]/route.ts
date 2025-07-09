import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ art_name: string }> }
) {
  try {
    const { art_name } = await params;
    
    const result = await db.query(
      'SELECT * FROM Fledermaus_Arten WHERE art_name = $1',
      [decodeURIComponent(art_name)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Art nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ art: result.rows[0] });

  } catch (error) {
    console.error('Fehler beim Laden der Art-Informationen:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}