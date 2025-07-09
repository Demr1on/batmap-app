import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    const { recordingId } = await params;
    
    const result = await db.query(
      'SELECT * FROM recording_ratings WHERE recording_id = $1 ORDER BY created_at DESC',
      [parseInt(recordingId)]
    );

    return NextResponse.json({ ratings: result.rows });

  } catch (error) {
    console.error('Fehler beim Laden der Bewertungen:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}