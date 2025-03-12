import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { segments, targetLanguage } = await req.json();
    
    if (!segments || !Array.isArray(segments) || !targetLanguage) {
      return NextResponse.json(
        { error: 'Invalid request. Segments array and targetLanguage are required.' },
        { status: 400 }
      );
    }
    
    // For better performance, translate all text at once
    const combinedText = segments.map((segment: any) => segment.text).join('\n---SEGMENT_BREAK---\n');
    
    // Translate all text at once
    const translatedCombined = await translateText(combinedText, targetLanguage);
    
    // Split back into segments
    const translatedTexts = translatedCombined.split('\n---SEGMENT_BREAK---\n');
    
    // Create new segments with translated text
    const translatedSegments = segments.map((segment: any, index: number) => ({
      ...segment,
      id: uuidv4(), // Generate new IDs for translated segments
      text: translatedTexts[index]?.trim() || segment.text // Fallback to original if translation fails
    }));
    
    return NextResponse.json({ 
      segments: translatedSegments,
      language: targetLanguage
    });
    
  } catch (error: any) {
    console.error('Error in translation API:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during translation' },
      { status: 500 }
    );
  }
} 