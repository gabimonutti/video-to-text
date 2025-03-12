import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { FiLoader, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { LANGUAGES } from './TranscriptionProcessor';

interface TranslationProcessorProps {
  segments: TranscriptionSegment[];
  onTranslationComplete: (segments: TranscriptionSegment[]) => void;
  disabled?: boolean;
  detectedLanguage?: string;
}

export function TranslationProcessor({
  segments,
  onTranslationComplete,
  disabled = false,
  detectedLanguage = ''
}: TranslationProcessorProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<Array<{code: string, name: string}>>([]); 

  // Set up available languages - always include English and exclude detected language
  useEffect(() => {
    const detectLangCode = detectedLanguage.toLowerCase().substring(0, 2);
    
    // Create a list of available languages, always including English
    const languages = LANGUAGES.filter(lang => 
      // Filter out the detected language as we can't translate to the same language
      lang.code !== detectLangCode
    );

    // Always ensure English is available if the source isn't English
    if (detectLangCode !== 'en' && !languages.some(lang => lang.code === 'en')) {
      languages.unshift({ code: 'en', name: 'English' });
    }
    
    setAvailableLanguages(languages);
    
    // If the current target is the detected language or not in the available languages,
    // default to English (if not the source) or the first available language
    if (detectLangCode === targetLanguage || !languages.some(lang => lang.code === targetLanguage)) {
      setTargetLanguage(detectLangCode !== 'en' ? 'en' : languages[0]?.code || 'es');
    }
  }, [detectedLanguage, targetLanguage]);
  
  const handleTranslate = async () => {
    if (!segments.length || isTranslating) return;
    
    setIsTranslating(true);
    
    try {
      toast.loading('Translating...', { id: 'translating' });
      
      const response = await axios.post('/api/translate', {
        segments,
        targetLanguage
      });
      
      const translatedSegments = response.data.segments;
      
      onTranslationComplete(translatedSegments);
      toast.success('Translation complete!', { id: 'translating' });
      
    } catch (error: any) {
      console.error('Error translating transcription:', error);
      toast.error(`Error: ${error.message || 'Failed to translate'}`, { id: 'translating' });
    } finally {
      setIsTranslating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Translate</CardTitle>
        <CardDescription>
          {detectedLanguage ? 
            `Translate from ${detectedLanguage} to another language` : 
            'Translate the transcription to another language'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="target-language-select" className="text-sm font-medium">
              Target Language:
            </label>
            <select
              id="target-language-select"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isTranslating || disabled}
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 flex items-center justify-center rounded-full mr-2 text-primary">
              <FiGlobe />
            </div>
            <span className="text-sm">
              Translation is powered by OpenAI's language models
            </span>
          </div>
          
          <Button
            onClick={handleTranslate}
            disabled={!segments.length || isTranslating || disabled || availableLanguages.length === 0}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Translating...
              </>
            ) : (
              `Translate to ${availableLanguages.find(lang => lang.code === targetLanguage)?.name || targetLanguage}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 