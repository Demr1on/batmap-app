"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AuthButton from '@/components/AuthButton';

// Leaflet Icon Fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Aufnahme {
  id: number;
  fledermaus_art_name: string;
  latitude: number;
  longitude: number;
  wahrscheinlichkeit: number;
  erstellt_am: string;
}

export default function MeineAufnahmen() {
  const { data: session } = useSession();
  const [aufnahmen, setAufnahmen] = useState<Aufnahme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (session) {
      loadAufnahmen();
    }
  }, [session]);

  const loadAufnahmen = async () => {
    try {
      const response = await fetch('/api/aufnahmen');
      const data = await response.json();
      if (data.aufnahmen) {
        setAufnahmen(data.aufnahmen);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Aufnahmen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🦇 BatMap</h1>
                <p className="text-gray-600">Meine Aufnahmen</p>
              </div>
              <AuthButton />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Anmeldung erforderlich
            </h2>
            <p className="text-gray-600">
              Melden Sie sich an, um Ihre Aufnahmen zu sehen.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🦇 BatMap</h1>
              <p className="text-gray-600">Meine Aufnahmen</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Zur Analyse
              </a>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Aufnahmen...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Meine Fledermaus-Aufnahmen ({aufnahmen.length})
              </h2>
              
              {aufnahmen.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Noch keine Aufnahmen vorhanden. <a href="/" className="text-blue-600 hover:text-blue-800">Erste Aufnahme erstellen</a>
                </p>
              ) : (
                <div className="space-y-4">
                  {aufnahmen.map((aufnahme) => (
                    <div key={aufnahme.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{aufnahme.fledermaus_art_name}</h3>
                          <p className="text-sm text-gray-600">
                            Wahrscheinlichkeit: {(aufnahme.wahrscheinlichkeit * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Position: {aufnahme.latitude.toFixed(6)}, {aufnahme.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(aufnahme.erstellt_am).toLocaleDateString('de-DE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {aufnahmen.length > 0 && isClient && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Karte</h2>
                <div className="h-96 w-full border rounded-md overflow-hidden">
                  <MapContainer
                    center={[aufnahmen[0].latitude, aufnahmen[0].longitude]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {aufnahmen.map((aufnahme) => (
                      <Marker
                        key={aufnahme.id}
                        position={[aufnahme.latitude, aufnahme.longitude]}
                      >
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-semibold">{aufnahme.fledermaus_art_name}</h3>
                            <p className="text-sm text-gray-600">
                              {(aufnahme.wahrscheinlichkeit * 100).toFixed(1)}% Wahrscheinlichkeit
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(aufnahme.erstellt_am).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}