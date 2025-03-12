'use client';

import React, { useState } from 'react';
import { VideoUploader } from '@/components/VideoUploader';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TranscriptionProcessor } from '@/components/TranscriptionProcessor';
import { TranscriptionDisplay, TranscriptionSegment } from '@/components/TranscriptionDisplay';
import { TranslationProcessor } from '@/components/TranslationProcessor';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from 'react-hot-toast';
import { SubtitleControls, SubtitleStyle } from '@/components/SubtitleControls';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [translatedSegments, setTranslatedSegments] = useState<TranscriptionSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegments, setActiveSegments] = useState<TranscriptionSegment[]>(transcriptionSegments);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [showSubtitleControls, setShowSubtitleControls] = useState<boolean>(false);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 20,
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    opacity: 0.7,
    bold: false,
    italic: false,
    alignment: 'center',
    position: 'bottom',
  });
  
  const handleVideoUploaded = (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    // Reset transcription and translation when a new video is uploaded
    setTranscriptionSegments([]);
    setTranslatedSegments([]);
    setActiveSegments([]);
    setDetectedLanguage('');
    setShowSubtitleControls(false);
  };
  
  const handleTranscriptionComplete = (segments: TranscriptionSegment[], language?: string) => {
    setTranscriptionSegments(segments);
    setActiveSegments(segments);
    setDetectedLanguage(language || '');
    setShowSubtitleControls(true);
  };
  
  const handleTranslationComplete = (segments: TranscriptionSegment[]) => {
    setTranslatedSegments(segments);
    setActiveSegments(segments);
  };
  
  const handleVideoProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };
  
  const handleSegmentClick = (time: number) => {
    setCurrentTime(time);
  };
  
  const handleToggleView = () => {
    if (activeSegments === transcriptionSegments && translatedSegments.length > 0) {
      setActiveSegments(translatedSegments);
    } else {
      setActiveSegments(transcriptionSegments);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 max-w-5xl mx-auto">
      <header className="w-full flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Video to Text</h1>
          <p className="text-muted-foreground">
            Upload a video, transcribe it, translate it, and more
          </p>
        </div>
        <div className="absolute right-8 top-8">
          <ThemeToggle />
        </div>
      </header>
      
      <VideoUploader onVideoUploaded={handleVideoUploaded} />
      
      {videoUrl && (
        <VideoPlayer 
          videoUrl={videoUrl} 
          onProgress={handleVideoProgress}
          currentTime={currentTime}
          segments={activeSegments}
          subtitleStyle={subtitleStyle}
          videoFile={videoFile}
        />
      )}
      
      {videoFile && !transcriptionSegments.length && (
        <TranscriptionProcessor 
          videoFile={videoFile}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      )}
      
      {transcriptionSegments.length > 0 && (
        <>
          <div className="w-full max-w-3xl mx-auto mt-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {activeSegments === translatedSegments ? 'Translated Transcription' : 
                detectedLanguage ? `Original Transcription (${detectedLanguage})` : 'Original Transcription'}
            </h2>
            
            {translatedSegments.length > 0 && (
              <button 
                onClick={handleToggleView}
                className="text-sm text-primary hover:underline"
              >
                {activeSegments === translatedSegments ? 'View Original' : 'View Translation'}
              </button>
            )}
          </div>
          
          <TranscriptionDisplay 
            segments={activeSegments}
            onSegmentClick={handleSegmentClick}
            currentTime={currentTime}
          />
          
          {showSubtitleControls && (
            <SubtitleControls 
              style={subtitleStyle}
              onChange={setSubtitleStyle}
            />
          )}
          
          {activeSegments !== translatedSegments && (
            <TranslationProcessor 
              segments={transcriptionSegments}
              onTranslationComplete={handleTranslationComplete}
              disabled={!transcriptionSegments.length}
              detectedLanguage={detectedLanguage}
            />
          )}
        </>
      )}
      
      <Toaster position="bottom-center" />
    </main>
  );
}
