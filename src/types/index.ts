export interface ClassificationResult {
  className: string;
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  processingTime: number;
}

export interface FledermausArt {
  id: number;
  art_name: string;
  wissenschaftlicher_name: string;
  familie: string;
  
  // Biometrische Daten und Erkennungsmerkmale
  aussehen_beschreibung: string;
  fellfarbe: string;
  besondere_merkmale: string;
  fluegelspannweite_min: number;
  fluegelspannweite_max: number;
  koerperlaenge_min: number;
  koerperlaenge_max: number;
  gewicht_min: number;
  gewicht_max: number;
  
  // Verbreitung und Lebensraum
  geografische_verbreitung: string;
  typische_lebensraeume: string;
  haeufigkeit: string;
  kerngebiete: string;
  
  // Quartiere
  sommerquartiere: string;
  wochenstuben: string;
  winterquartiere: string;
  
  // Jagdverhalten und Ernährung
  jagdstrategie: string;
  jagdgebiete: string;
  flugverhalten: string;
  hauptbeutetiere: string;
  nahrungszusammensetzung: string;
  
  // Echoortung und Schutzstatus
  frequenzbereich_min: number;
  frequenzbereich_max: number;
  ortungsruf_charakteristik: string;
  gefaehrdungsstatus: string;
  hauptgefaehrdungsursachen: string;
  
  // Metadata
  bild_url: string;
  erstellt_am: Date;
  aktualisiert_am: Date;
}

export interface Aufnahme {
  id: number;
  user_email: string;
  fledermaus_art_name: string;
  latitude: number;
  longitude: number;
  grid_cell: string;
  wahrscheinlichkeit: number;
  confidence: string;
  user_verification: number;
  expert_review: boolean;
  discussion_thread?: string;
  erstellt_am: Date;
  audio_duration: number;
  weather_conditions?: string;
}

export interface AnonymizedLocation {
  gridCell: string;
  timestamp: number;
  confidence: number;
}

export interface UserProgress {
  species_discovered: string[];
  total_recordings: number;
  accuracy_score: number;
  badges: Badge[];
  contribution_rank: number;
  monthly_streak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: Date;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface PopulationAnalytics {
  seasonal_patterns: SeasonalData[];
  migration_routes: MigrationPath[];
  habitat_preferences: HabitatAnalysis;
  activity_patterns: ActivityPattern[];
}

export interface SeasonalData {
  month: number;
  species: string;
  count: number;
  avg_activity: number;
}

export interface MigrationPath {
  species: string;
  coordinates: [number, number][];
  timeframe: string;
}

export interface HabitatAnalysis {
  species: string;
  preferred_habitats: string[];
  activity_zones: ActivityZone[];
}

export interface ActivityZone {
  coordinates: [number, number];
  radius: number;
  activity_level: number;
  time_of_day: string;
}

export interface ActivityPattern {
  species: string;
  hour: number;
  activity_level: number;
  confidence: number;
}

export interface AudioFeatures {
  frequency_range: [number, number];
  dominant_frequency: number;
  call_duration: number;
  call_interval: number;
  amplitude_pattern: number[];
  spectral_centroid: number;
  spectral_rolloff: number;
  mfcc: number[];
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audio_data: ArrayBuffer;
  result?: ClassificationResult;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}