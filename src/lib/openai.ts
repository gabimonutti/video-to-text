import OpenAI from "openai";

// Check if OpenAI API key is set
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set in environment variables.");
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

// Define interfaces for the transcription response
export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface TranscriptionResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: TranscriptionSegment[];
}

// Remove the language code mapping as we need to keep ISO-639-1 codes
// const LANGUAGE_CODE_MAP: Record<string, string> = {
//   'en': 'english',
//   'es': 'spanish',
//   'fr': 'french',
//   'de': 'german',
//   'it': 'italian',
//   'pt': 'portuguese',
//   'ru': 'russian',
//   'zh': 'chinese',
//   'ja': 'japanese',
//   'ko': 'korean',
//   'ar': 'arabic',
//   'hi': 'hindi',
// };

// This function is maintained for backward compatibility
// but we're now handling the transcription directly in the API route
export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<TranscriptionResponse> {
  try {
    console.log("This function is deprecated. Please use the direct OpenAI client approach in the API route.");
    console.log(`Audio buffer size: ${Math.round(audioBuffer.byteLength / 1024)} KB`);
    
    // For proper server implementation, see the /api/transcribe/route.ts file
    // where we directly use the uploaded file with OpenAI API
    throw new Error("This function is deprecated. Please use the direct approach in the API route.");
    
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original tone, meaning, and style as closely as possible.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
}
