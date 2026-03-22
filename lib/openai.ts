import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

export type VerificationResult = {
  verdict: 'approved' | 'rejected';
  reasoning: string;
  confidence: number;
};

export async function verifyTaskWithPhoto(
  taskTitle: string,
  taskDescription: string | null,
  photoBase64: string
): Promise<VerificationResult> {
  const base64 = photoBase64;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an accountability assistant. Your job is to verify whether a user has completed their task based on the evidence they submit. Be fair but thorough. Return your response as JSON.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Task: "${taskTitle}"${taskDescription ? `\nDescription: "${taskDescription}"` : ''}

The user submitted this photo as proof of completion. Does this photo provide reasonable evidence that they completed the task?

Respond with JSON in this exact format:
{
  "verdict": "approved" or "rejected",
  "reasoning": "A clear 1-2 sentence explanation of your decision",
  "confidence": 0.0 to 1.0
}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
              detail: 'auto',
            },
          },
        ],
      },
    ],
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    verdict: parsed.verdict === 'approved' ? 'approved' : 'rejected',
    reasoning: parsed.reasoning ?? 'Unable to determine.',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
  };
}

export async function verifyTaskWithText(
  taskTitle: string,
  taskDescription: string | null,
  userText: string
): Promise<VerificationResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an accountability assistant. Verify if the user's written explanation demonstrates they completed their task. Be fair but thorough.`,
      },
      {
        role: 'user',
        content: `Task: "${taskTitle}"${taskDescription ? `\nDescription: "${taskDescription}"` : ''}

The user wrote this as proof of completion:
"${userText}"

Does this text provide reasonable evidence that they completed the task?

Respond with JSON:
{
  "verdict": "approved" or "rejected",
  "reasoning": "A clear 1-2 sentence explanation",
  "confidence": 0.0 to 1.0
}`,
      },
    ],
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    verdict: parsed.verdict === 'approved' ? 'approved' : 'rejected',
    reasoning: parsed.reasoning ?? 'Unable to determine.',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
  };
}

export async function verifyTaskWithAudio(
  taskTitle: string,
  taskDescription: string | null,
  audioUri: string
): Promise<VerificationResult> {
  // Read audio file and send to Whisper for transcription
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64' as any,
  });

  // Convert base64 to blob for Whisper API
  const binaryStr = atob(audioBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: 'audio/m4a' });
  const audioFile = new File([audioBlob], 'recording.m4a', { type: 'audio/m4a' });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  const transcribedText = transcription.text;

  // Now verify the transcription as text
  const result = await verifyTaskWithText(taskTitle, taskDescription, transcribedText);

  return {
    ...result,
    reasoning: `[Transcribed audio]: "${transcribedText.slice(0, 100)}${transcribedText.length > 100 ? '...' : ''}"\n\n${result.reasoning}`,
  };
}
