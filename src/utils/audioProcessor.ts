import { AudioFeatures } from '@/types';

export class AdvancedAudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async processAudio(audioBuffer: AudioBuffer): Promise<AudioFeatures> {
    const audioData = audioBuffer.getChannelData(0);
    
    const spectogram = this.generateSpectogram(audioData);
    const features = this.extractFeatures(audioData, spectogram);
    
    return features;
  }

  private generateSpectogram(audioData: Float32Array): Float32Array[] {
    const windowSize = 1024;
    const hopSize = 512;
    const spectogram: Float32Array[] = [];
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const fft = this.computeFFT(window);
      spectogram.push(fft);
    }
    
    return spectogram;
  }

  private computeFFT(window: Float32Array): Float32Array {
    const N = window.length;
    const fft = new Float32Array(N);
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += window[n] * Math.cos(angle);
        imag += window[n] * Math.sin(angle);
      }
      
      fft[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return fft;
  }

  private extractFeatures(audioData: Float32Array, spectogram: Float32Array[]): AudioFeatures {
    const sampleRate = this.audioContext.sampleRate;
    
    const frequencyRange = this.getFrequencyRange(spectogram);
    const dominantFrequency = this.getDominantFrequency(spectogram, sampleRate);
    const callDuration = audioData.length / sampleRate;
    const callInterval = this.estimateCallInterval(audioData, sampleRate);
    const amplitudePattern = this.getAmplitudePattern(audioData);
    const spectralCentroid = this.getSpectralCentroid(spectogram);
    const spectralRolloff = this.getSpectralRolloff(spectogram);
    const mfcc = this.getMFCC(spectogram);
    
    return {
      frequency_range: frequencyRange,
      dominant_frequency: dominantFrequency,
      call_duration: callDuration,
      call_interval: callInterval,
      amplitude_pattern: amplitudePattern,
      spectral_centroid: spectralCentroid,
      spectral_rolloff: spectralRolloff,
      mfcc: mfcc
    };
  }

  private getFrequencyRange(spectogram: Float32Array[]): [number, number] {
    let minFreq = Infinity;
    let maxFreq = 0;
    
    for (const frame of spectogram) {
      for (let i = 0; i < frame.length; i++) {
        if (frame[i] > 0.01) { // Threshold für relevante Frequenzen
          const freq = (i * this.audioContext.sampleRate) / (2 * frame.length);
          minFreq = Math.min(minFreq, freq);
          maxFreq = Math.max(maxFreq, freq);
        }
      }
    }
    
    return [minFreq, maxFreq];
  }

  private getDominantFrequency(spectogram: Float32Array[], sampleRate: number): number {
    let maxMagnitude = 0;
    let dominantFreq = 0;
    
    for (const frame of spectogram) {
      for (let i = 0; i < frame.length; i++) {
        if (frame[i] > maxMagnitude) {
          maxMagnitude = frame[i];
          dominantFreq = (i * sampleRate) / (2 * frame.length);
        }
      }
    }
    
    return dominantFreq;
  }

  private estimateCallInterval(audioData: Float32Array, sampleRate: number): number {
    const threshold = 0.01;
    const callStarts: number[] = [];
    let inCall = false;
    
    for (let i = 0; i < audioData.length; i++) {
      if (!inCall && Math.abs(audioData[i]) > threshold) {
        callStarts.push(i / sampleRate);
        inCall = true;
      } else if (inCall && Math.abs(audioData[i]) < threshold) {
        inCall = false;
      }
    }
    
    if (callStarts.length < 2) return 0;
    
    const intervals = callStarts.slice(1).map((start, i) => start - callStarts[i]);
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private getAmplitudePattern(audioData: Float32Array): number[] {
    const patternLength = 100;
    const pattern: number[] = [];
    const stepSize = Math.floor(audioData.length / patternLength);
    
    for (let i = 0; i < patternLength; i++) {
      let sum = 0;
      const start = i * stepSize;
      const end = Math.min(start + stepSize, audioData.length);
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(audioData[j]);
      }
      
      pattern.push(sum / (end - start));
    }
    
    return pattern;
  }

  private getSpectralCentroid(spectogram: Float32Array[]): number {
    let totalMagnitude = 0;
    let weightedSum = 0;
    
    for (const frame of spectogram) {
      for (let i = 0; i < frame.length; i++) {
        totalMagnitude += frame[i];
        weightedSum += i * frame[i];
      }
    }
    
    return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  }

  private getSpectralRolloff(spectogram: Float32Array[]): number {
    const rolloffThreshold = 0.85;
    let totalEnergy = 0;
    let cumulativeEnergy = 0;
    
    for (const frame of spectogram) {
      for (let i = 0; i < frame.length; i++) {
        totalEnergy += frame[i] * frame[i];
      }
    }
    
    for (const frame of spectogram) {
      for (let i = 0; i < frame.length; i++) {
        cumulativeEnergy += frame[i] * frame[i];
        if (cumulativeEnergy >= rolloffThreshold * totalEnergy) {
          return i;
        }
      }
    }
    
    return spectogram[0]?.length || 0;
  }

  private getMFCC(spectogram: Float32Array[]): number[] {
    const numCoefficients = 13;
    const mfcc: number[] = new Array(numCoefficients).fill(0);
    
    for (const frame of spectogram) {
      const melFiltered = this.applyMelFilterBank(frame);
      const dct = this.computeDCT(melFiltered);
      
      for (let i = 0; i < numCoefficients; i++) {
        mfcc[i] += dct[i];
      }
    }
    
    return mfcc.map(coeff => coeff / spectogram.length);
  }

  private applyMelFilterBank(frame: Float32Array): Float32Array {
    const numFilters = 26;
    const filtered = new Float32Array(numFilters);
    
    for (let i = 0; i < numFilters; i++) {
      const start = Math.floor(i * frame.length / numFilters);
      const end = Math.floor((i + 1) * frame.length / numFilters);
      
      for (let j = start; j < end; j++) {
        filtered[i] += frame[j];
      }
    }
    
    return filtered;
  }

  private computeDCT(input: Float32Array): Float32Array {
    const N = input.length;
    const dct = new Float32Array(N);
    
    for (let k = 0; k < N; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += input[n] * Math.cos(Math.PI * k * (2 * n + 1) / (2 * N));
      }
      dct[k] = sum;
    }
    
    return dct;
  }
}