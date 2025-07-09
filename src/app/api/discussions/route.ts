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

    const { recording_id, content, parent_id } = await request.json();

    if (!recording_id || !content?.trim()) {
      return NextResponse.json({ error: 'Ungültige Diskussion' }, { status: 400 });
    }

    const result = await db.query(
      'INSERT INTO discussions (recording_id, user_email, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [recording_id, session.user.email, content.trim(), parent_id || null]
    );

    return NextResponse.json({ 
      success: true, 
      discussion: result.rows[0] 
    });

  } catch (error) {
    console.error('Fehler beim Speichern der Diskussion:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}