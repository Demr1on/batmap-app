import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ProcessingJob } from '@/types';

// In-Memory Queue für Demo - in Production würde Redis/Database verwendet
const processingQueue: ProcessingJob[] = [];
const processingResults = new Map<string, ProcessingJob>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Keine Audio-Datei gefunden' }, { status: 400 });
    }

    // Job erstellen
    const jobId = generateJobId();
    const audioData = await audioFile.arrayBuffer();
    
    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      audio_data: audioData,
      created_at: new Date()
    };

    // Job zur Queue hinzufügen
    processingQueue.push(job);
    
    // Asynchrone Verarbeitung starten
    processNextJob();

    return NextResponse.json({ 
      jobId,
      status: 'pending',
      message: 'Audio-Datei wird verarbeitet'
    });

  } catch (error) {
    console.error('Fehler beim Starten der Klassifizierung:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID erforderlich' }, { status: 400 });
    }

    const job = processingResults.get(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      result: job.result,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at
    });

  } catch (error) {
    console.error('Fehler beim Abrufen des Job-Status:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

async function processNextJob() {
  if (processingQueue.length === 0) return;

  const job = processingQueue.shift()!;
  job.status = 'processing';
  processingResults.set(job.id, job);

  try {
    // Simuliere erweiterte KI-Verarbeitung
    const result = await performAdvancedClassification(job.audio_data);
    
    job.status = 'completed';
    job.result = result;
    job.completed_at = new Date();
    
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unbekannter Fehler';
    job.completed_at = new Date();
  }

  processingResults.set(job.id, job);
  
  // Nächsten Job verarbeiten
  setTimeout(processNextJob, 100);
}

async function performAdvancedClassification(audioData: ArrayBuffer) {
  // Simuliere komplexe KI-Verarbeitung
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In einer echten Implementierung würde hier TensorFlow/PyTorch verwendet
  const mockResults = [
    { className: 'Zwergfledermaus', probability: 0.85 },
    { className: 'Wasserfledermaus', probability: 0.72 },
    { className: 'Großer Abendsegler', probability: 0.91 },
    { className: 'Hintergrundgeräusche', probability: 0.15 }
  ];
  
  const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
  
  return {
    className: randomResult.className,
    probability: randomResult.probability,
    confidence: randomResult.probability >= 0.8 ? 'high' : 
               randomResult.probability >= 0.6 ? 'medium' : 'low',
    processingTime: 2000
  };
}

function generateJobId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}