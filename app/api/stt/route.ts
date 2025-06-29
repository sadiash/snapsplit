import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'STT service not configured' }, { status: 500 });
    }

    // Prepare form data for OpenAI Whisper
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'audio.wav');
    whisperFormData.append('model', 'whisper-1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: whisperFormData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API Error:', errorText);
        return NextResponse.json({ error: 'Speech recognition failed' }, { status: 500 });
      }

      const result = await response.json();
      
      return NextResponse.json({
        text: result.text || '',
      });

    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      throw error;
    }

  } catch (error) {
    console.error('STT API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}