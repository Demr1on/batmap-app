"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet Icon Fix für Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onLocationSelect }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Benutzer-Standort ermitteln
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback zu Deutschland
          setPosition([51.1657, 10.4515]);
        }
      );
    } else {
      // Fallback zu Deutschland
      setPosition([51.1657, 10.4515]);
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setCoordinates({ lat: lat.toString(), lng: lng.toString() });
    onLocationSelect(lat, lng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        handleLocationSelect(lat, lng);
      } else {
        alert('Ort nicht gefunden');
      }
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      alert('Fehler bei der Ortssuche');
    }
  };

  const handleCoordinatesSubmit = () => {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Ungültige Koordinaten');
      return;
    }
    
    handleLocationSelect(lat, lng);
  };

  if (!isClient) {
    return <div>Lade Karte...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fundort auswählen</h3>
      
      {/* Ortsuche */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ort suchen (z.B. Berlin, München)"
          className="flex-1 px-3 py-2 border rounded-md"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Suchen
        </button>
      </div>

      {/* Koordinaten-Eingabe */}
      <div className="flex gap-2">
        <input
          type="number"
          value={coordinates.lat}
          onChange={(e) => setCoordinates({...coordinates, lat: e.target.value})}
          placeholder="Breitengrad"
          className="flex-1 px-3 py-2 border rounded-md"
          step="any"
        />
        <input
          type="number"
          value={coordinates.lng}
          onChange={(e) => setCoordinates({...coordinates, lng: e.target.value})}
          placeholder="Längengrad"
          className="flex-1 px-3 py-2 border rounded-md"
          step="any"
        />
        <button
          onClick={handleCoordinatesSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Setzen
        </button>
      </div>

      {/* Karte */}
      <div className="h-96 w-full border rounded-md overflow-hidden">
        {position && (
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} onLocationSelect={handleLocationSelect} />
          </MapContainer>
        )}
      </div>

      {position && (
        <div className="text-sm text-gray-600">
          Ausgewählte Position: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
    </div>
  );
}