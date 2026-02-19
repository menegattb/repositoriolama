import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface AssemblyAITranscript {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  words?: AssemblyAIWord[];
  language_code?: string;
  error?: string;
  audio_duration?: number;
}

// Agrupa palavras do AssemblyAI em segmentos de ~30s para compatibilidade com transcriptArray
function wordsToSegments(words: AssemblyAIWord[], intervalMs = 30000): Array<{ text: string; offset: number; duration: number }> {
  if (!words || words.length === 0) return [];

  const segments: Array<{ text: string; offset: number; duration: number }> = [];
  let currentSegment: { startTime: number; endTime: number; texts: string[] } | null = null;

  for (const word of words) {
    if (!currentSegment || word.start - currentSegment.startTime >= intervalMs) {
      if (currentSegment && currentSegment.texts.length > 0) {
        segments.push({
          text: currentSegment.texts.join(' '),
          offset: currentSegment.startTime,
          duration: currentSegment.endTime - currentSegment.startTime,
        });
      }
      currentSegment = { startTime: word.start, endTime: word.end, texts: [word.text] };
    } else {
      currentSegment.texts.push(word.text);
      currentSegment.endTime = word.end;
    }
  }

  if (currentSegment && currentSegment.texts.length > 0) {
    segments.push({
      text: currentSegment.texts.join(' '),
      offset: currentSegment.startTime,
      duration: currentSegment.endTime - currentSegment.startTime,
    });
  }

  return segments;
}

// POST: Submit audio for transcription
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AssemblyAI API key não configurada. Adicione ASSEMBLYAI_API_KEY no .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { audioStreamUrl, audioTitle, folderName } = body;

    if (!audioStreamUrl) {
      return NextResponse.json(
        { success: false, error: 'audioStreamUrl é obrigatório' },
        { status: 400 }
      );
    }

    // Construir URL pública completa a partir da URL relativa do stream
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const publicAudioUrl = audioStreamUrl.startsWith('http')
      ? audioStreamUrl
      : `${protocol}://${host}${audioStreamUrl}`;

    console.log(`[TranscribeAudio] Submetendo transcrição para AssemblyAI:`, {
      audioTitle,
      folderName,
      publicAudioUrl,
    });

    // Submeter para AssemblyAI
    const submitResponse = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: publicAudioUrl,
        language_code: 'pt',
      }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('[TranscribeAudio] Erro ao submeter para AssemblyAI:', submitResponse.status, errorData);
      return NextResponse.json(
        { success: false, error: `Erro ao submeter transcrição: ${errorData.error || submitResponse.statusText}` },
        { status: submitResponse.status }
      );
    }

    const submitData: AssemblyAITranscript = await submitResponse.json();

    console.log(`[TranscribeAudio] Job submetido: ${submitData.id}, status: ${submitData.status}`);

    return NextResponse.json({
      success: true,
      jobId: submitData.id,
      status: submitData.status,
    });
  } catch (error) {
    console.error('[TranscribeAudio] Erro:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// GET: Poll transcription status
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AssemblyAI API key não configurada' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    const pollResponse = await fetch(`${ASSEMBLYAI_BASE}/transcript/${jobId}`, {
      headers: { 'Authorization': apiKey },
    });

    if (!pollResponse.ok) {
      const errorData = await pollResponse.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: `Erro ao consultar status: ${errorData.error || pollResponse.statusText}` },
        { status: pollResponse.status }
      );
    }

    const data: AssemblyAITranscript = await pollResponse.json();

    if (data.status === 'completed') {
      const transcriptArray = wordsToSegments(data.words || []);

      console.log(`[TranscribeAudio] Job ${jobId} concluído: ${transcriptArray.length} segmentos`);

      return NextResponse.json({
        success: true,
        status: 'completed',
        transcriptArray,
        text: data.text,
        lang: data.language_code || 'pt',
        audioDuration: data.audio_duration,
      });
    }

    if (data.status === 'error') {
      console.error(`[TranscribeAudio] Job ${jobId} falhou:`, data.error);
      return NextResponse.json({
        success: false,
        status: 'error',
        error: data.error || 'Erro na transcrição do AssemblyAI',
      });
    }

    // Still processing
    return NextResponse.json({
      success: true,
      status: data.status, // 'queued' or 'processing'
    });
  } catch (error) {
    console.error('[TranscribeAudio] Erro ao consultar status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
