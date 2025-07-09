import { useState, useCallback } from 'react';
import { ClassificationResult, AudioFeatures } from '@/types';
import { AdvancedAudioProcessor } from '@/utils/audioProcessor';

export function useAudioClassification(modelUrl: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [processor] = useState(() => new AdvancedAudioProcessor());

  const loadModel = useCallback(async () => {
    if (model) return model;
    
    try {
      setIsLoading(true);
      const loadedModel = await import('@tensorflow/tfjs').then(tf => 
        tf.loadGraphModel(modelUrl)
      );
      setModel(loadedModel);
      return loadedModel;
    } catch (error) {
      console.error('Fehler beim Laden des Modells:', error);
      throw new Error('Modell konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  }, [modelUrl, model]);

  const classifyAudio = useCallback(async (audioFile: File): Promise<ClassificationResult> => {
    if (!model) {
      throw new Error('Modell noch nicht geladen');
    }

    const startTime = performance.now();
    
    try {
      setIsLoading(true);
      
      // Audio-Datei verarbeiten
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Erweiterte Feature-Extraktion
      const features = await processor.processAudio(audioBuffer);
      
      // Klassifizierung durchführen
      const result = await performClassification(model, features, audioBuffer);
      
      const processingTime = performance.now() - startTime;
      
      return {
        ...result,
        processingTime,
        confidence: getConfidenceLevel(result.probability)
      };
    } catch (error) {
      console.error('Fehler bei der Audio-Klassifizierung:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [model, processor]);

  const performClassification = async (
    model: any, 
    features: AudioFeatures, 
    audioBuffer: AudioBuffer
  ): Promise<Omit<ClassificationResult, 'confidence' | 'processingTime'>> => {
    const tf = await import('@tensorflow/tfjs');
    
    // Konvertiere Features zu Tensor
    const featureArray = [
      features.dominant_frequency / 100000, // Normalisierung
      features.call_duration,
      features.call_interval,
      features.spectral_centroid / 1000,
      features.spectral_rolloff / 1000,
      ...features.mfcc.slice(0, 13),
      ...features.amplitude_pattern.slice(0, 20)
    ];
    
    const inputTensor = tf.tensor2d([featureArray]);
    
    // Vorhersage
    const prediction = model.predict(inputTensor) as any;
    const predictionData = await prediction.data();
    
    // Cleanup
    inputTensor.dispose();
    prediction.dispose();
    
    // Ergebnis interpretieren
    const classNames = ['Zwergfledermaus', 'Wasserfledermaus', 'Großer Abendsegler', 'Hintergrundgeräusche'];
    const maxIndex = predictionData.indexOf(Math.max(...predictionData));
    
    return {
      className: classNames[maxIndex],
      probability: predictionData[maxIndex]
    };
  };

  const getConfidenceLevel = (probability: number): 'low' | 'medium' | 'high' => {
    if (probability >= 0.8) return 'high';
    if (probability >= 0.6) return 'medium';
    return 'low';
  };

  return {
    isLoading,
    model,
    loadModel,
    classifyAudio
  };
}