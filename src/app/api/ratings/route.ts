import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { recording_id, rating, comment } = await request.json();

    if (!recording_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Ungültige Bewertung' }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO recording_ratings (recording_id, user_email, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (recording_id, user_email) 
       DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [recording_id, session.user.email, rating, comment || null]
    );

    return NextResponse.json({ 
      success: true, 
      rating: result.rows[0] 
    });

  } catch (error) {
    console.error('Fehler beim Speichern der Bewertung:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}