import { PopulationAnalytics, SeasonalData, MigrationPath, HabitatAnalysis, ActivityPattern } from '@/types';

export class AnalyticsUtils {
  static async generatePopulationAnalytics(species: string): Promise<PopulationAnalytics> {
    const [seasonalData, migrationRoutes, habitatData, activityPatterns] = await Promise.all([
      this.generateSeasonalData(species),
      this.generateMigrationRoutes(species),
      this.generateHabitatAnalysis(species),
      this.generateActivityPatterns(species)
    ]);

    return {
      seasonal_patterns: seasonalData,
      migration_routes: migrationRoutes,
      habitat_preferences: habitatData,
      activity_patterns: activityPatterns
    };
  }

  private static async generateSeasonalData(species: string): Promise<SeasonalData[]> {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return months.map(month => ({
      month,
      species,
      count: this.getSeasonalCount(species, month),
      avg_activity: this.getSeasonalActivity(species, month)
    }));
  }

  private static getSeasonalCount(species: string, month: number): number {
    // Simulierte saisonale Muster basierend auf Fledermaus-Biologie
    const patterns: Record<string, number[]> = {
      'Zwergfledermaus': [5, 8, 15, 25, 35, 45, 50, 48, 40, 30, 15, 8],
      'Wasserfledermaus': [2, 3, 8, 15, 25, 35, 40, 38, 30, 20, 10, 5],
      'Großer Abendsegler': [1, 2, 5, 12, 20, 30, 35, 33, 25, 15, 8, 3]
    };

    return patterns[species]?.[month - 1] || 0;
  }

  private static getSeasonalActivity(species: string, month: number): number {
    // Aktivitätsmuster (0-1 Skala)
    const activityPatterns: Record<string, number[]> = {
      'Zwergfledermaus': [0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.6, 0.4, 0.2],
      'Wasserfledermaus': [0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0, 0.9, 0.7, 0.5, 0.3, 0.1],
      'Großer Abendsegler': [0.1, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.8, 0.6, 0.4, 0.2, 0.1]
    };

    return activityPatterns[species]?.[month - 1] || 0;
  }

  private static async generateMigrationRoutes(species: string): Promise<MigrationPath[]> {
    // Simulierte Migrationsrouten
    const routes: Record<string, MigrationPath[]> = {
      'Großer Abendsegler': [
        {
          species,
          coordinates: [[55.0, 12.0], [52.5, 13.4], [50.1, 8.7], [48.8, 2.3]],
          timeframe: 'Herbst-Migration'
        },
        {
          species,
          coordinates: [[48.8, 2.3], [50.1, 8.7], [52.5, 13.4], [55.0, 12.0]],
          timeframe: 'Frühjahr-Migration'
        }
      ],
      'Zwergfledermaus': [], // Meist standorttreu
      'Wasserfledermaus': [] // Meist standorttreu
    };

    return routes[species] || [];
  }

  private static async generateHabitatAnalysis(species: string): Promise<HabitatAnalysis> {
    const habitatPreferences: Record<string, string[]> = {
      'Zwergfledermaus': ['Siedlungen', 'Parks', 'Gärten', 'Waldränder'],
      'Wasserfledermaus': ['Gewässer', 'Feuchtgebiete', 'Auwälder', 'Teiche'],
      'Großer Abendsegler': ['Wälder', 'Parkanlagen', 'Hochlagen', 'Offenland']
    };

    return {
      species,
      preferred_habitats: habitatPreferences[species] || [],
      activity_zones: this.generateActivityZones(species)
    };
  }

  private static generateActivityZones(species: string) {
    // Simulierte Aktivitätszonen
    const zones = [
      { coordinates: [52.5, 13.4], radius: 5000, activity_level: 0.9, time_of_day: 'Abend' },
      { coordinates: [48.1, 11.6], radius: 3000, activity_level: 0.7, time_of_day: 'Nacht' },
      { coordinates: [50.9, 6.9], radius: 4000, activity_level: 0.8, time_of_day: 'Morgen' }
    ];

    return zones.map(zone => ({
      ...zone,
      coordinates: zone.coordinates as [number, number]
    }));
  }

  private static async generateActivityPatterns(species: string): Promise<ActivityPattern[]> {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => ({
      species,
      hour,
      activity_level: this.getHourlyActivity(species, hour),
      confidence: this.getActivityConfidence(species, hour)
    }));
  }

  private static getHourlyActivity(species: string, hour: number): number {
    // Fledermäuse sind nachtaktiv
    const basePattern = [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 0-5 Uhr
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 6-11 Uhr
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 12-17 Uhr
      0.1, 0.3, 0.6, 0.9, 1.0, 0.9, // 18-23 Uhr
    ];

    const speciesModifiers: Record<string, number> = {
      'Zwergfledermaus': 1.0,
      'Wasserfledermaus': 0.8,
      'Großer Abendsegler': 1.2
    };

    const modifier = speciesModifiers[species] || 1.0;
    return Math.min(basePattern[hour] * modifier, 1.0);
  }

  private static getActivityConfidence(species: string, hour: number): number {
    // Höhere Konfidenz in den typischen Aktivitätsstunden
    if (hour >= 19 && hour <= 23) return 0.9;
    if (hour >= 0 && hour <= 5) return 0.7;
    if (hour >= 18 && hour <= 18) return 0.8;
    return 0.3;
  }

  static async generateWeatherCorrelation(species: string) {
    // Simulierte Wetter-Korrelation
    return {
      temperature: {
        optimal_range: [15, 25],
        correlation: 0.75
      },
      humidity: {
        optimal_range: [60, 80],
        correlation: 0.65
      },
      wind_speed: {
        optimal_range: [0, 10],
        correlation: -0.45
      },
      precipitation: {
        correlation: -0.8
      }
    };
  }

  static async generateBiodiversityIndex(recordings: any[]) {
    const speciesCount = new Set(recordings.map(r => r.fledermaus_art_name)).size;
    const totalRecordings = recordings.length;
    
    // Shannon-Diversity Index
    const speciesFrequencies = recordings.reduce((acc, recording) => {
      acc[recording.fledermaus_art_name] = (acc[recording.fledermaus_art_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const shannonIndex = -Object.values(speciesFrequencies)
      .map(count => (count / totalRecordings) * Math.log(count / totalRecordings))
      .reduce((sum, value) => sum + value, 0);

    return {
      species_count: speciesCount,
      total_recordings: totalRecordings,
      shannon_diversity: shannonIndex,
      evenness: shannonIndex / Math.log(speciesCount || 1)
    };
  }

  static async generateHotspots(recordings: any[]) {
    const gridCells = recordings.reduce((acc, recording) => {
      const cell = recording.grid_cell || 'unknown';
      acc[cell] = (acc[cell] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hotspots = Object.entries(gridCells)
      .map(([cell, count]) => ({
        grid_cell: cell,
        recording_count: count,
        species_diversity: new Set(
          recordings.filter(r => r.grid_cell === cell).map(r => r.fledermaus_art_name)
        ).size
      }))
      .sort((a, b) => b.recording_count - a.recording_count)
      .slice(0, 10);

    return hotspots;
  }
}