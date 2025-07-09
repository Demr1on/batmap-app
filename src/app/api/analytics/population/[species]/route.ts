import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsUtils } from '@/utils/analyticsUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ species: string }> }
) {
  try {
    const { species } = await params;
    const decodedSpecies = decodeURIComponent(species);
    
    const analytics = await AnalyticsUtils.generatePopulationAnalytics(decodedSpecies);
    
    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('Fehler beim Generieren der Populationsanalytik:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}