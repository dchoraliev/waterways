/// @ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not set' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (!contentType.toLowerCase().includes('application/json')) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid content-type, expected application/json with audioBase64, filename, and mimeType.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const body = await req.json();
    const audioBase64 = body.audioBase64 as string | undefined;
    const filename = (body.filename as string | undefined) ?? 'audio.m4a';
    const mimeType = (body.mimeType as string | undefined) ?? 'audio/m4a';
    const language = (body.language as string | undefined) ?? 'en';

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'Missing audioBase64 in request body' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Decode base64 into bytes
    const binaryString = atob(audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a File object for OpenAI
    const file = new File([bytes], filename, { type: mimeType });

    // Build multipart/form-data for OpenAI Whisper
    const openaiForm = new FormData();
    openaiForm.append('file', file);
    openaiForm.append('model', 'whisper-1');
    openaiForm.append('language', language);

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errText);
      return new Response(
        JSON.stringify({
          error: 'Failed to transcribe audio',
          status: openaiRes.status,
          details: errText,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const data = (await openaiRes.json()) as { text?: string };

    return new Response(
      JSON.stringify({
        text: data.text ?? '',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error('Unexpected error in transcribe-audio:', err);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error in edge function',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
