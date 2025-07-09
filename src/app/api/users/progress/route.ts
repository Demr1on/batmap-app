import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { userEmail, progress } = await request.json();
    
    if (session.user.email !== userEmail) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 });
    }

    await db.query(`
      INSERT INTO user_progress (
        user_email, 
        species_discovered, 
        total_recordings, 
        accuracy_score, 
        badges, 
        contribution_rank, 
        monthly_streak,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_email) 
      DO UPDATE SET
        species_discovered = $2,
        total_recordings = $3,
        accuracy_score = $4,
        badges = $5,
        contribution_rank = $6,
        monthly_streak = $7,
        updated_at = NOW()
    `, [
      userEmail,
      JSON.stringify(progress.species_discovered),
      progress.total_recordings,
      progress.accuracy_score,
      JSON.stringify(progress.badges),
      progress.contribution_rank,
      progress.monthly_streak
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fortschritts:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}