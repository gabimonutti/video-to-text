import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { v4 as uuidv4 } from "uuid";

interface TranscriptionError extends Error {
  message: string;
  status?: number;
  cause?: unknown;
}

// Define segment type to avoid using 'any'
interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export async function POST(req: NextRequest) {
  try {
    // Get form data from request
    const formData = await req.formData();
    const audioFile = formData.get("file") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    console.log(`Processing transcription request. File size: ${Math.round(audioFile.size / 1024)} KB`);

    // Directly use the uploaded file with OpenAI API
    console.log(`Sending file directly to OpenAI API. File name: ${audioFile.name}, Type: ${audioFile.type}`);

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      prompt: "Transcribe the spoken content accurately, ignoring any watermarks or embedded captions.",
    });

    console.log(`Transcription successful. ${transcription.segments?.length || 0} segments generated.`);

    // Add more detailed logging for debugging
    if (transcription.text) {
      console.log(
        `Text preview: "${transcription.text.substring(0, 100)}${transcription.text.length > 100 ? "..." : ""}"`
      );
    }

    // Validate response has actual content
    if (
      !transcription.text ||
      transcription.text.trim().length === 0 ||
      !transcription.segments ||
      transcription.segments.length === 0
    ) {
      console.warn("Warning: Transcription returned empty or minimal content");
      return NextResponse.json(
        {
          error:
            "Transcription failed to produce meaningful content. Try a different language setting or check audio quality.",
        },
        { status: 422 }
      );
    }

    // Format the response with segments including IDs
    const formattedSegments = transcription.segments.map((segment: WhisperSegment) => ({
      id: uuidv4(),
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
    }));

    return NextResponse.json({
      segments: formattedSegments,
      text: transcription.text,
      language: transcription.language,
    });
  } catch (error: unknown) {
    const transcriptionError = error as TranscriptionError;
    console.error("Error in transcription API:", transcriptionError);

    // Handle OpenAI API specific errors
    if (transcriptionError.message?.includes("OpenAI")) {
      return NextResponse.json(
        {
          error: "OpenAI transcription failed. Please check your audio quality or try a different language setting.",
          details: transcriptionError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: transcriptionError.message || "An error occurred during transcription",
        details: transcriptionError.cause,
      },
      { status: transcriptionError.status || 500 }
    );
  }
}
