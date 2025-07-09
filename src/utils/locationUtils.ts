import { AnonymizedLocation } from '@/types';

export class LocationUtils {
  private static readonly GRID_SIZE = 1000; // 1km in meters

  static coordinatesToGridCell(lat: number, lng: number): string {
    const gridLat = Math.floor(lat * 1000) / 1000;
    const gridLng = Math.floor(lng * 1000) / 1000;
    return `${gridLat.toFixed(3)},${gridLng.toFixed(3)}`;
  }

  static gridCellToCoordinates(gridCell: string): [number, number] {
    const [lat, lng] = gridCell.split(',').map(Number);
    return [lat + 0.0005, lng + 0.0005]; // Center of grid cell
  }

  static anonymizeLocation(lat: number, lng: number, confidence: number): AnonymizedLocation {
    const gridCell = this.coordinatesToGridCell(lat, lng);
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)) * (1000 * 60 * 60); // Round to hour
    
    return {
      gridCell,
      timestamp,
      confidence
    };
  }

  static addLocationNoise(lat: number, lng: number, noiseLevelMeters: number = 100): [number, number] {
    const latNoise = (Math.random() - 0.5) * (noiseLevelMeters / 111000); // ~111km per degree
    const lngNoise = (Math.random() - 0.5) * (noiseLevelMeters / (111000 * Math.cos(lat * Math.PI / 180)));
    
    return [lat + latNoise, lng + lngNoise];
  }

  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  static isWithinPrivacyRadius(lat: number, lng: number, userLat: number, userLng: number, radiusMeters: number = 1000): boolean {
    const distance = this.calculateDistance(lat, lng, userLat, userLng);
    return distance <= radiusMeters;
  }

  static generateHeatmapData(recordings: Array<{latitude: number, longitude: number, confidence: number}>) {
    const heatmapData: Array<{lat: number, lng: number, intensity: number}> = [];
    
    recordings.forEach(recording => {
      heatmapData.push({
        lat: recording.latitude,
        lng: recording.longitude,
        intensity: recording.confidence
      });
    });
    
    return heatmapData;
  }
}