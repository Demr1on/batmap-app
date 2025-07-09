import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    const { recordingId } = await params;
    
    // Lade Haupt-Diskussionen
    const mainDiscussions = await db.query(
      'SELECT * FROM discussions WHERE recording_id = $1 AND parent_id IS NULL ORDER BY created_at DESC',
      [parseInt(recordingId)]
    );

    // Lade Antworten für jede Hauptdiskussion
    const discussionsWithReplies = await Promise.all(
      mainDiscussions.rows.map(async (discussion) => {
        const replies = await db.query(
          'SELECT * FROM discussions WHERE parent_id = $1 ORDER BY created_at ASC',
          [discussion.id]
        );
        
        return {
          ...discussion,
          replies: replies.rows
        };
      })
    );

    return NextResponse.json({ discussions: discussionsWithReplies });

  } catch (error) {
    console.error('Fehler beim Laden der Diskussionen:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}