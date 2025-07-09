"use client";

import { useRef } from 'react';
import { ClassificationResult } from '@/types';
import { useAudioClassification } from '@/hooks/useAudioClassification';
import { usePWA } from '@/hooks/usePWA';

interface AudioClassifierProps {
  onResult: (result: ClassificationResult) => void;
  teachableMachineUrl: string;
}

export default function AudioClassifier({ onResult, teachableMachineUrl }: AudioClassifierProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, model, loadModel, classifyAudio } = useAudioClassification(teachableMachineUrl);
  const { isOnline, storeRecordingOffline } = usePWA();

  const processAudioFile = async (file: File) => {
    if (!model) {
      alert('Modell noch nicht geladen');
      return;
    }

    try {
      const result = await classifyAudio(file);
      onResult(result);
      
      // Offline-Speicherung wenn nicht online
      if (!isOnline) {
        const success = await storeRecordingOffline({
          audioFile: file,
          result,
          timestamp: Date.now()
        });
        
        if (success) {
          alert('Aufnahme offline gespeichert. Wird synchronisiert sobald Sie online sind.');
        }
      }
      
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Audio-Datei:', error);
      alert('Fehler beim Verarbeiten der Audio-Datei');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        processAudioFile(file);
      } else {
        alert('Bitte wählen Sie eine Audio-Datei aus');
      }
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
      <h2 className="text-xl font-bold mb-4">Fledermausruf analysieren</h2>
      
      {/* Online-Status Indikator */}
      <div className={`mb-4 px-3 py-1 rounded-full text-sm ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        {isOnline ? '🟢 Online' : '🟡 Offline - Aufnahmen werden lokal gespeichert'}
      </div>
      
      {!model && (
        <div className="mb-4">
          <button
            onClick={loadModel}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Lade Modell...' : 'KI-Modell laden'}
          </button>
        </div>
      )}
      
      {model && (
        <div>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Analysiere...' : 'Audio-Datei auswählen'}
          </button>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Unterstützte Formate: WAV, MP3, OGG</p>
            <p>Empfohlene Länge: 2-10 Sekunden</p>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            Erweiterte KI-Analyse läuft...
          </p>
          <div className="mt-2 text-xs text-gray-500">
            FFT-Spektrogramm • MFCC-Features • Frequenz-Analyse
          </div>
        </div>
      )}
    </div>
  );
}