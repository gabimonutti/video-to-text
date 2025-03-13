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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    noBackground: false,
    customPosition: false,
    xPosition: 50, // Center horizontally by default
    yPosition: 90, // Near bottom by default
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
  
  const handleSubtitleStyleChange = (newStyle: SubtitleStyle) => {
    console.log('Subtitle style updated:', {
      xPosition: newStyle.xPosition,
      yPosition: newStyle.yPosition,
      customPosition: newStyle.customPosition
    });
    setSubtitleStyle(newStyle);
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header with animated gradient border bottom */}
      <header className="sticky top-0 z-10 w-full backdrop-blur-sm bg-background/90 border-b border-primary/10 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm">V2T</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Video to Text
              <span className="text-primary ml-1">Studio</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
      </header>

      <div className="container px-4 py-6 md:px-6 md:py-8 max-w-7xl mx-auto">
        {/* Upload section - Shown only when no video is uploaded */}
        {!videoUrl && (
          <div className="py-12 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-center mb-2">
              Transform Your <span className="text-primary">Video</span> Experience
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Upload a video to transcribe, translate, and add beautiful captions in seconds
            </p>
            <VideoUploader onVideoUploaded={handleVideoUploaded} />
          </div>
        )}

        {/* Main content section - Shown after video upload */}
        {videoUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Video panel - Always shows the video player */}
            <div className="lg:col-span-8 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-card rounded-xl overflow-hidden shadow-md border border-primary/10">
                <VideoPlayer 
                  videoUrl={videoUrl} 
                  onProgress={handleVideoProgress}
                  currentTime={currentTime}
                  segments={activeSegments}
                  subtitleStyle={subtitleStyle}
                  videoFile={videoFile}
                  onSubtitleStyleChange={handleSubtitleStyleChange}
                />
              </div>
              
              {/* Transcription processor - Only shown when no transcription exists */}
              {videoFile && !transcriptionSegments.length && (
                <div className="mt-4">
                  <TranscriptionProcessor 
                    videoFile={videoFile}
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                </div>
              )}
            </div>
            
            {/* Right panel - Contains transcription, subtitles, and translation controls */}
            <div className="lg:col-span-4 space-y-4">
              {transcriptionSegments.length > 0 ? (
                <Tabs defaultValue="transcription" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="transcription">
                      {activeSegments === translatedSegments ? 'Translation' : 'Transcription'}
                    </TabsTrigger>
                    <TabsTrigger value="subtitles">Subtitle Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transcription" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">
                        {activeSegments === translatedSegments ? 'Translated Text' : 
                          detectedLanguage ? `Original (${detectedLanguage})` : 'Original Text'}
                      </h2>
                      
                      {translatedSegments.length > 0 && (
                        <button 
                          onClick={handleToggleView}
                          className="text-sm px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        >
                          {activeSegments === translatedSegments ? 'View Original' : 'View Translation'}
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                      <TranscriptionDisplay 
                        segments={activeSegments}
                        onSegmentClick={handleSegmentClick}
                        currentTime={currentTime}
                      />
                    </div>
                    
                    {activeSegments !== translatedSegments && (
                      <div className="mt-4">
                        <TranslationProcessor 
                          segments={transcriptionSegments}
                          onTranslationComplete={handleTranslationComplete}
                          disabled={!transcriptionSegments.length}
                          detectedLanguage={detectedLanguage}
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="subtitles">
                    {showSubtitleControls && (
                      <SubtitleControls 
                        style={subtitleStyle}
                        onChange={handleSubtitleStyleChange}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="bg-card/50 border border-primary/10 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium mb-2">No Transcription Yet</h3>
                  <p className="text-muted-foreground">
                    Process your video to generate transcription and add subtitles
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="mt-12 border-t border-primary/10 py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>Video to Text Studio • Transcribe, translate, and caption your videos</p>
        </div>
      </footer>
      
      <Toaster position="bottom-center" />
    </main>
  );
}
