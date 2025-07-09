import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AnalyticsUtils } from '@/utils/analyticsUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    const timeframe = searchParams.get('timeframe') || '30'; // Tage
    
    let query = `
      SELECT * FROM Aufnahmen 
      WHERE erstellt_am >= NOW() - INTERVAL '${timeframe} days'
    `;
    
    const params = [];
    
    if (species && species !== 'all') {
      query += ' AND fledermaus_art_name = $1';
      params.push(species);
    }
    
    const result = await db.query(query, params);
    const recordings = result.rows;
    
    const [hotspots, biodiversityIndex] = await Promise.all([
      AnalyticsUtils.generateHotspots(recordings),
      AnalyticsUtils.generateBiodiversityIndex(recordings)
    ]);
    
    return NextResponse.json({
      hotspots,
      biodiversity: biodiversityIndex,
      total_recordings: recordings.length,
      timeframe: `${timeframe} Tage`
    });

  } catch (error) {
    console.error('Fehler beim Generieren der Hotspot-Analytik:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}