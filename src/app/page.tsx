"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
import AudioClassifier from '@/components/AudioClassifier';
import LocationPicker from '@/components/LocationPicker';
import { useUserProgress } from '@/hooks/useUserProgress';
import { usePWA } from '@/hooks/usePWA';
import { ClassificationResult, FledermausArt } from '@/types';
import { QueryCache } from '@/utils/cache';


export default function Home() {
  const { data: session } = useSession();
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [artInfo, setArtInfo] = useState<FledermausArt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { userProgress, updateProgress } = useUserProgress(session?.user?.email || null);
  const { isOnline, canInstall, installApp, syncOfflineRecordings } = usePWA();

  useEffect(() => {
    if (isOnline) {
      syncOfflineRecordings();
    }
  }, [isOnline, syncOfflineRecordings]);

  const handleClassificationResult = async (result: ClassificationResult) => {
    setClassificationResult(result);
    
    if (result.className !== 'Hintergrundgeräusche') {
      try {
        const artData = await QueryCache.getCachedOrFetch(
          `species-${result.className}`,
          async () => {
            const response = await fetch(`/api/fledermaus/${encodeURIComponent(result.className)}`);
            const data = await response.json();
            return data.art;
          },
          3600 // 1 Stunde Cache
        );
        
        if (artData) {
          setArtInfo(artData);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Art-Informationen:', error);
      }
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleSaveRecord = async () => {
    if (!session?.user?.email || !classificationResult || !selectedLocation) {
      alert('Bitte melden Sie sich an und führen Sie eine Analyse durch');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/aufnahmen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fledermaus_art_name: classificationResult.className,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          wahrscheinlichkeit: classificationResult.probability,
          confidence: classificationResult.confidence,
          audio_duration: 0, // Wird später aus der Datei extrahiert
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Aufnahme erfolgreich gespeichert!');
        
        // Aktualisiere Benutzer-Fortschritt
        if (updateProgress) {
          await updateProgress({
            fledermaus_art_name: classificationResult.className,
            wahrscheinlichkeit: classificationResult.probability
          });
        }
        
        // Cache invalidieren
        QueryCache.invalidate('aufnahmen');
        
        setClassificationResult(null);
        setSelectedLocation(null);
        setArtInfo(null);
      } else {
        alert('Fehler beim Speichern: ' + data.error);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Aufnahme');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🦇 BatMap</h1>
              <p className="text-gray-600">Fledermäuse erkennen und kartieren</p>
            </div>
            <div className="flex items-center gap-4">
              {canInstall && (
                <button
                  onClick={installApp}
                  className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
                >
                  📱 App installieren
                </button>
              )}
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Willkommen bei BatMap
            </h2>
            <p className="text-gray-600 mb-8">
              Melden Sie sich an, um Fledermausrufe zu analysieren und zu kartieren.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Benutzer-Fortschritt */}
            {userProgress && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Ihr Fortschritt</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userProgress.total_recordings}</div>
                    <div className="text-sm text-gray-600">Aufnahmen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userProgress.species_discovered.length}</div>
                    <div className="text-sm text-gray-600">Arten entdeckt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userProgress.badges.length}</div>
                    <div className="text-sm text-gray-600">Badges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{(userProgress.accuracy_score * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Genauigkeit</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <AudioClassifier
                onResult={handleClassificationResult}
                teachableMachineUrl="https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/"
              />
            </div>

            {classificationResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Analyseergebnis</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium">
                    Erkannte Art: <span className="text-blue-600">{classificationResult.className}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-sm text-gray-600">
                      Wahrscheinlichkeit: {(classificationResult.probability * 100).toFixed(1)}%
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      classificationResult.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      classificationResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {classificationResult.confidence === 'high' ? 'Hohe Konfidenz' :
                       classificationResult.confidence === 'medium' ? 'Mittlere Konfidenz' :
                       'Niedrige Konfidenz'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Verarbeitungszeit: {classificationResult.processingTime}ms
                  </p>
                </div>

                {artInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-800">{artInfo.art_name}</h3>
                    <p className="text-sm text-green-600 italic mb-2">{artInfo.wissenschaftlicher_name}</p>
                    <p className="text-sm text-gray-700">{artInfo.beschreibung}</p>
                  </div>
                )}
              </div>
            )}

            {classificationResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <LocationPicker onLocationSelect={handleLocationSelect} />
                
                {selectedLocation && (
                  <div className="mt-6 pt-6 border-t">
                    <button
                      onClick={handleSaveRecord}
                      disabled={isLoading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isLoading ? 'Speichere...' : 'Aufnahme speichern'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}