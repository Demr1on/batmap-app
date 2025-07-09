"use client";

import { memo, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { Aufnahme } from '@/types';

interface VirtualizedMapMarkersProps {
  recordings: Aufnahme[];
  viewport?: {
    bounds: [[number, number], [number, number]];
    zoom: number;
  };
}

const VirtualizedMapMarkers = memo(({ recordings, viewport }: VirtualizedMapMarkersProps) => {
  const map = useMap();

  // Filtere sichtbare Marker basierend auf Viewport
  const visibleMarkers = useMemo(() => {
    if (!viewport) return recordings;

    const [[south, west], [north, east]] = viewport.bounds;
    
    return recordings.filter(recording => {
      const { latitude, longitude } = recording;
      return latitude >= south && latitude <= north && 
             longitude >= west && longitude <= east;
    });
  }, [recordings, viewport]);

  // Cluster-Markers bei hohem Zoom-Level
  const clusteredMarkers = useMemo(() => {
    if (!viewport || viewport.zoom >= 12) {
      return visibleMarkers;
    }

    const clusters = new Map<string, Aufnahme[]>();
    const gridSize = 0.01; // ~1km grid
    
    visibleMarkers.forEach(recording => {
      const gridLat = Math.floor(recording.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(recording.longitude / gridSize) * gridSize;
      const gridKey = `${gridLat},${gridLng}`;
      
      if (!clusters.has(gridKey)) {
        clusters.set(gridKey, []);
      }
      clusters.get(gridKey)!.push(recording);
    });

    const clusteredResults: Aufnahme[] = [];
    
    clusters.forEach((recordings, gridKey) => {
      if (recordings.length === 1) {
        clusteredResults.push(recordings[0]);
      } else {
        // Erstelle Cluster-Marker
        const [gridLat, gridLng] = gridKey.split(',').map(Number);
        const avgLat = recordings.reduce((sum, r) => sum + r.latitude, 0) / recordings.length;
        const avgLng = recordings.reduce((sum, r) => sum + r.longitude, 0) / recordings.length;
        
        clusteredResults.push({
          ...recordings[0],
          id: parseInt(gridKey.replace(',', '')),
          latitude: avgLat,
          longitude: avgLng,
          fledermaus_art_name: `${recordings.length} Aufnahmen`,
          cluster: true,
          cluster_recordings: recordings
        } as any);
      }
    });

    return clusteredResults;
  }, [visibleMarkers, viewport]);

  return (
    <>
      {clusteredMarkers.map((recording) => (
        <Marker
          key={recording.id}
          position={[recording.latitude, recording.longitude]}
        >
          <Popup>
            <div className="text-center">
              {(recording as any).cluster ? (
                <div>
                  <h3 className="font-semibold">{recording.fledermaus_art_name}</h3>
                  <div className="max-h-32 overflow-y-auto">
                    {(recording as any).cluster_recordings.map((r: Aufnahme) => (
                      <div key={r.id} className="text-sm border-b py-1">
                        <strong>{r.fledermaus_art_name}</strong>
                        <br />
                        <span className="text-gray-600">
                          {(r.wahrscheinlichkeit * 100).toFixed(1)}% • {' '}
                          {new Date(r.erstellt_am).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold">{recording.fledermaus_art_name}</h3>
                  <p className="text-sm text-gray-600">
                    {(recording.wahrscheinlichkeit * 100).toFixed(1)}% Wahrscheinlichkeit
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(recording.erstellt_am).toLocaleDateString('de-DE')}
                  </p>
                  {recording.weather_conditions && (
                    <p className="text-xs text-gray-400 mt-1">
                      {recording.weather_conditions}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});

VirtualizedMapMarkers.displayName = 'VirtualizedMapMarkers';

export default VirtualizedMapMarkers;