import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiCpu, FiLoader, FiCheckCircle, FiAlertCircle, FiGlobe, FiClock, FiInfo, FiWifi } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';

// Language options for transcription and translation
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

interface TranscriptionProcessorProps {
  videoFile: File | null;
  onTranscriptionComplete: (segments: TranscriptionSegment[], detectedLanguage?: string) => void;
}

export function TranscriptionProcessor({ 
  videoFile, 
  onTranscriptionComplete 
}: TranscriptionProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [extractionStartTime, setExtractionStartTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'extracting' | 'transcribing'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Format the time estimate in a human-readable way
  const formatEstimatedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
  };
  
  // Update time remaining estimate
  useEffect(() => {
    if (isExtractingAudio && progress > 0 && totalDuration > 0) {
      // Calculate elapsed time
      const elapsedSeconds = (Date.now() - extractionStartTime) / 1000;
      
      // Estimate time remaining based on progress
      const estimatedTotalSeconds = elapsedSeconds / (progress / 100);
      const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
      
      // Only update if we have a reasonable value
      if (remainingSeconds > 0 && remainingSeconds < totalDuration * 5) {
        setEstimatedTimeRemaining(remainingSeconds);
      }
    } else if (!isExtractingAudio) {
      setEstimatedTimeRemaining(null);
    }
  }, [progress, isExtractingAudio, totalDuration, extractionStartTime]);
  
  const extractAudioFromVideo = useCallback(async (videoFile: File): Promise<File> => {
    setIsExtractingAudio(true);
    setProcessingStep('extracting');
    setExtractionStartTime(Date.now());
    setProgress(0);
    setErrorMessage(null);
    
    try {
      // Create a video element to load the video
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(videoFile);
      
      // Set up the video element
      video.src = videoUrl;
      video.muted = true;
      
      // Wait for the video to be loaded
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          setTotalDuration(video.duration);
          resolve(null);
        };
        
        // Handle loading errors
        video.onerror = (e) => {
          setErrorMessage(`Error loading video: ${video.error?.message || 'Unknown error'}`);
          resolve(null);
        };
      });
      
      // Check if we have a valid duration
      if (!video.duration || video.duration === Infinity) {
        throw new Error('Could not determine video duration. The file may be corrupted.');
      }
      
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);
      
      // Set up a media recorder to capture audio
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // Start recording and playing the video
      mediaRecorder.start();
      video.play();
      
      // Update progress as the video plays
      const interval = setInterval(() => {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setCurrentTime(video.currentTime);
        setProgress(Math.min(99, currentProgress)); // Cap at 99% until fully complete
      }, 100);
      
      // Wait for the video to finish playing
      await new Promise<void>((resolve) => {
        video.onended = () => {
          clearInterval(interval);
          setProgress(100);
          mediaRecorder.stop();
          resolve();
        };
        
        // Handle playback errors
        video.onerror = () => {
          clearInterval(interval);
          setErrorMessage(`Error during playback: ${video.error?.message || 'Unknown error'}`);
          mediaRecorder.stop();
          resolve();
        };
      });
      
      // Get the recorded audio
      const audioBlob = await new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: 'audio/mp4' });
          resolve(blob);
        };
      });
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      
      // Check if we actually got audio data
      if (audioBlob.size < 1000) {
        throw new Error('The extracted audio is too small. There might be no audio track in this video.');
      }
      
      // Convert blob to file
      const audioFile = new File([audioBlob], 'audio.mp4', { type: 'audio/mp4' });
      
      return audioFile;
    } catch (error: any) {
      console.error('Error extracting audio:', error);
      setErrorMessage(error.message || 'Failed to extract audio from video');
      throw error;
    } finally {
      setIsExtractingAudio(false);
    }
  }, []);
  
  const transcribeAudio = useCallback(async (audioFile: File, language: string) => {
    setIsTranscribing(true);
    setProcessingStep('transcribing');
    setErrorMessage(null);
    
    try {
      // Create FormData for the API
      const formData = new FormData();
      formData.append('file', audioFile);
      
      if (language) {
        console.log(`Setting language for transcription API: ${language} (ISO-639-1 code)`);
        formData.append('language', language);
      }
      
      // Send directly to the API - no preprocessing needed
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Check if we received the expected data
      if (!response.data.segments || !Array.isArray(response.data.segments) || response.data.segments.length === 0) {
        throw new Error('No transcription segments were generated. The audio might not contain detectable speech.');
      }
      
      // Check for the Spanish subtitle issue specifically
      if (response.data.segments.length === 1 && response.data.text.includes('Subtítulos realizados por')) {
        throw new Error(
          'The transcription only detected embedded subtitles instead of the actual speech. ' +
          'Try using a different language or a video without embedded subtitles.'
        );
      }
      
      return response.data.segments;
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      // Handle API error responses
      const errorMsg = error.response?.data?.error || error.message || 'Failed to transcribe audio';
      setErrorMessage(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsTranscribing(false);
      setProcessingStep('idle');
    }
  }, []);
  
  const handleProcessVideo = async () => {
    if (!videoFile || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);
    
    try {
      // Initial toast with infinite duration
      toast.loading('Transcribing video...', { 
        id: 'processing',
        duration: Infinity, // Keep the toast until we dismiss it
      });
      
      // Create FormData for the API
      const formData = new FormData();
      formData.append('file', videoFile);
      
      // Track upload progress phase
      let uploadComplete = false;
      
      // Send directly to the API - no extraction needed
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Only show upload progress up to 50% of the total progress
            // Reserve the other 50% for processing
            setProgress(Math.floor(percentCompleted / 2));
            
            // Update the toast message with progress
            if (percentCompleted % 10 === 0) { // Only update every 10% to avoid too many updates
              toast.loading(`Transcribing video... ${percentCompleted}% uploaded`, { id: 'processing' });
            }
            
            // Mark when upload is complete
            if (percentCompleted >= 100) {
              uploadComplete = true;
              toast.loading('Processing audio with OpenAI Whisper... (this may take a few minutes)', { id: 'processing' });
              
              // Start a progress simulation for the processing phase
              let processingProgress = 0;
              const processingInterval = setInterval(() => {
                processingProgress += 1;
                // Cap at 98% to show it's still processing
                if (processingProgress <= 48) {
                  setProgress(50 + processingProgress); // Add to the 50% from upload phase
                  
                  // Update the toast occasionally
                  if (processingProgress % 10 === 0) {
                    toast.loading(`Processing audio with OpenAI Whisper... (${Math.round((50 + processingProgress) / 50 * 100)}%)`, 
                      { id: 'processing' });
                  }
                }
              }, 2000); // Update every 2 seconds
              
              // Store the interval ID on the component instance
              // @ts-ignore - adding property to the component instance
              window.__processingInterval = processingInterval;
            }
          }
        }
      });
      
      // Clear the progress simulation interval if it exists
      if (window.__processingInterval) {
        clearInterval(window.__processingInterval);
        // @ts-ignore - removing property
        window.__processingInterval = null;
      }
      
      // Set to 100% when processing is complete
      setProgress(100);
      
      // Get the transcription from the response
      const segments = response.data.segments;
      
      // Extract detected language if available
      const detectedLanguage = response.data.language || '';
      console.log('Detected language from API:', detectedLanguage);
      
      // Return the transcription
      onTranscriptionComplete(segments, detectedLanguage);
      toast.success('Transcription complete!', { id: 'processing' });
      
    } catch (error: any) {
      // Clear the progress simulation interval if it exists
      if (window.__processingInterval) {
        clearInterval(window.__processingInterval);
        // @ts-ignore - removing property
        window.__processingInterval = null;
      }
      
      console.error('Error processing video:', error);
      toast.error(`Error: ${error.response?.data?.error || error.message || 'Failed to process video'}`, { id: 'processing' });
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to process video');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentTime(0);
      setTotalDuration(0);
      setEstimatedTimeRemaining(null);
      setProcessingStep('idle');
    }
  };
  
  // Format video filesize
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden border border-primary/10 shadow-md">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FiCpu className="h-5 w-5 text-primary" />
            Transcribe Video
          </CardTitle>
          <CardDescription>
            Extract text from your video using AI
            {videoFile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center mt-1 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <FiInfo className="h-3 w-3" />
                  {videoFile.name} ({formatFileSize(videoFile.size)})
                </span>
              </motion.div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3 pt-3 space-y-4">
          {/* Error message display */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 p-3 rounded-lg text-sm text-destructive dark:text-destructive-foreground flex items-start space-x-2"
            >
              <FiAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="font-medium">Error occurred:</p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 bg-muted/20 rounded-lg p-3 border border-primary/10"
            >
              {/* Processing status with animated icon */}
              <div className="flex items-center gap-2 mb-1">
                {progress < 50 ? (
                  <div className="flex items-center gap-2">
                    <FiWifi className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium">Uploading video...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ 
                        rotate: [0, 180, 360],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear"
                      }}
                    >
                      <FiCpu className="h-4 w-4 text-primary" />
                    </motion.div>
                    <span className="text-sm font-medium">Processing with AI...</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar with gradient */}
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span>
                    {progress < 50 ? 'Uploading' : 'Processing'}
                  </span>
                  <span className="font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", damping: 15, stiffness: 50 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/80"
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground italic px-1">
                {progress < 50 
                  ? "Uploading your video to the server..." 
                  : "OpenAI Whisper is processing your audio. This may take a few minutes..."}
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-col space-y-2 items-center text-center">
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FiGlobe className="h-4 w-4" />
              <span>Languages are automatically detected by OpenAI Whisper</span>
            </div>
            
            <Button
              onClick={handleProcessVideo}
              disabled={!videoFile || isProcessing}
              className="w-full mt-2 relative overflow-hidden group"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                  <span>Processing... {progress > 0 ? `(${Math.round(progress)}%)` : ''}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative z-10">
                  <FiCpu className="h-4 w-4" />
                  <span>Start Transcription</span>
                </div>
              )}
              
              {!isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-90 group-hover:scale-110 transition-transform duration-500"></div>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center py-3 border-t border-border/30 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Powered by OpenAI Whisper • High quality transcription
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 