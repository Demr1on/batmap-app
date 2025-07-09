// Web Worker für Audio-Verarbeitung
self.onmessage = async function(e) {
  const { audioData, sampleRate, taskId } = e.data;
  
  try {
    // Erweiterte Audio-Verarbeitung im Worker
    const result = await processAudioInWorker(audioData, sampleRate);
    
    self.postMessage({
      taskId,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      taskId,
      success: false,
      error: error.message
    });
  }
};

async function processAudioInWorker(audioData, sampleRate) {
  // Spektrogramm-Berechnung
  const spectogram = generateSpectogram(audioData);
  
  // Feature-Extraktion
  const features = extractFeatures(audioData, spectogram, sampleRate);
  
  // Rauschunterdrückung
  const cleanedAudio = removeNoise(audioData);
  
  return {
    features,
    spectogram,
    cleanedAudio,
    metadata: {
      duration: audioData.length / sampleRate,
      sampleRate,
      channelCount: 1
    }
  };
}

function generateSpectogram(audioData) {
  const windowSize = 1024;
  const hopSize = 512;
  const spectogram = [];
  
  for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
    const window = audioData.slice(i, i + windowSize);
    const fft = computeFFT(window);
    spectogram.push(fft);
  }
  
  return spectogram;
}

function computeFFT(window) {
  const N = window.length;
  const fft = new Array(N);
  
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

function extractFeatures(audioData, spectogram, sampleRate) {
  return {
    frequency_range: getFrequencyRange(spectogram, sampleRate),
    dominant_frequency: getDominantFrequency(spectogram, sampleRate),
    call_duration: audioData.length / sampleRate,
    call_interval: estimateCallInterval(audioData, sampleRate),
    amplitude_pattern: getAmplitudePattern(audioData),
    spectral_centroid: getSpectralCentroid(spectogram),
    spectral_rolloff: getSpectralRolloff(spectogram),
    mfcc: getMFCC(spectogram),
    zero_crossing_rate: calculateZeroCrossingRate(audioData),
    rms_energy: calculateRMSEnergy(audioData)
  };
}

function getFrequencyRange(spectogram, sampleRate) {
  let minFreq = Infinity;
  let maxFreq = 0;
  
  for (const frame of spectogram) {
    for (let i = 0; i < frame.length; i++) {
      if (frame[i] > 0.01) {
        const freq = (i * sampleRate) / (2 * frame.length);
        minFreq = Math.min(minFreq, freq);
        maxFreq = Math.max(maxFreq, freq);
      }
    }
  }
  
  return [minFreq, maxFreq];
}

function getDominantFrequency(spectogram, sampleRate) {
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

function estimateCallInterval(audioData, sampleRate) {
  const threshold = 0.01;
  const callStarts = [];
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

function getAmplitudePattern(audioData) {
  const patternLength = 100;
  const pattern = [];
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

function getSpectralCentroid(spectogram) {
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

function getSpectralRolloff(spectogram) {
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

function getMFCC(spectogram) {
  const numCoefficients = 13;
  const mfcc = new Array(numCoefficients).fill(0);
  
  for (const frame of spectogram) {
    const melFiltered = applyMelFilterBank(frame);
    const dct = computeDCT(melFiltered);
    
    for (let i = 0; i < numCoefficients; i++) {
      mfcc[i] += dct[i];
    }
  }
  
  return mfcc.map(coeff => coeff / spectogram.length);
}

function applyMelFilterBank(frame) {
  const numFilters = 26;
  const filtered = new Array(numFilters).fill(0);
  
  for (let i = 0; i < numFilters; i++) {
    const start = Math.floor(i * frame.length / numFilters);
    const end = Math.floor((i + 1) * frame.length / numFilters);
    
    for (let j = start; j < end; j++) {
      filtered[i] += frame[j];
    }
  }
  
  return filtered;
}

function computeDCT(input) {
  const N = input.length;
  const dct = new Array(N);
  
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += input[n] * Math.cos(Math.PI * k * (2 * n + 1) / (2 * N));
    }
    dct[k] = sum;
  }
  
  return dct;
}

function calculateZeroCrossingRate(audioData) {
  let crossings = 0;
  for (let i = 1; i < audioData.length; i++) {
    if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / audioData.length;
}

function calculateRMSEnergy(audioData) {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
}

function removeNoise(audioData) {
  // Einfache Rauschunterdrückung durch Spektral-Subtraction
  const threshold = 0.01;
  const cleanedAudio = new Array(audioData.length);
  
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) > threshold) {
      cleanedAudio[i] = audioData[i];
    } else {
      cleanedAudio[i] = 0;
    }
  }
  
  return cleanedAudio;
}