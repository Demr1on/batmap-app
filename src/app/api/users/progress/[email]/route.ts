import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { email } = await params;
    
    if (!session?.user?.email || session.user.email !== decodeURIComponent(email)) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const result = await db.query(
      'SELECT * FROM user_progress WHERE user_email = $1',
      [decodeURIComponent(email)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Fortschritt nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ progress: result.rows[0] });

  } catch (error) {
    console.error('Fehler beim Laden des Fortschritts:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}