import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { FiCpu, FiLoader, FiCheckCircle, FiAlertCircle, FiGlobe, FiClock, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { formatTime } from '@/lib/utils';

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
      // Send the video file directly to the API without preprocessing
      toast.loading('Processing video...', { id: 'processing' });
      
      // Create FormData for the API
      const formData = new FormData();
      formData.append('file', videoFile);
      
      // Send directly to the API - no extraction needed
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      
      // Get the transcription from the response
      const segments = response.data.segments;
      
      // Extract detected language if available
      const detectedLanguage = response.data.language || '';
      console.log('Detected language from API:', detectedLanguage);
      
      // Return the transcription
      onTranscriptionComplete(segments, detectedLanguage);
      toast.success('Transcription complete!', { id: 'processing' });
      
    } catch (error: any) {
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
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Process Video</CardTitle>
        <CardDescription>
          Generate transcription from your video
          {videoFile && (
            <span className="block mt-1 text-xs text-muted-foreground">
              File: {videoFile.name} ({formatFileSize(videoFile.size)})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Removed language selection since Whisper auto-detects language */}
          
          {/* Error message display */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md text-sm text-red-700 dark:text-red-300 flex items-start space-x-2">
              <FiAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-medium">Error occurred:</p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
              {/* Progress bar with detailed information */}
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span>
                    Processing Video
                  </span>
                  <span className="font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">
              OpenAI Whisper will automatically detect the language in your video
            </p>
          </div>
          
          <Button
            onClick={handleProcessVideo}
            disabled={!videoFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Processing Video ({Math.round(progress)}%)
              </>
            ) : (
              'Start Processing'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 