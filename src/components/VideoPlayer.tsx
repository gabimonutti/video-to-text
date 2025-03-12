import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiSkipBack, 
  FiSkipForward,
  FiType,
  FiMinimize,
  FiDownload
} from 'react-icons/fi';
import { formatTime } from '@/lib/utils';
import { Button } from './ui/button';
import { VideoSubtitles } from './VideoSubtitles';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { SubtitleStyle } from './SubtitleControls';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  videoUrl: string;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  currentTime?: number;
  segments?: TranscriptionSegment[];
  subtitleStyle?: SubtitleStyle;
  videoFile?: File | null;
  onSubtitleStyleChange?: (style: SubtitleStyle) => void;
}

const defaultSubtitleStyle: SubtitleStyle = {
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
};

export function VideoPlayer({ 
  videoUrl, 
  onProgress, 
  currentTime,
  segments = [],
  subtitleStyle = defaultSubtitleStyle,
  videoFile = null,
  onSubtitleStyleChange
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const [localSubtitleStyle, setLocalSubtitleStyle] = useState(subtitleStyle);
  
  const playerRef = useRef<ReactPlayer>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Update local subtitle style when prop changes
  useEffect(() => {
    setLocalSubtitleStyle(subtitleStyle);
  }, [subtitleStyle]);
  
  // Use external currentTime if provided
  useEffect(() => {
    if (currentTime !== undefined && !seeking && Math.abs(playedSeconds - currentTime) > 0.5) {
      playerRef.current?.seekTo(currentTime);
    }
  }, [currentTime, seeking, playedSeconds]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process keyboard shortcuts if video player is focused or in fullscreen
      if (!videoContainerRef.current?.contains(document.activeElement) && !isFullscreen) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          setPlaying(prev => !prev);
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'j':
          skipBackward();
          e.preventDefault();
          break;
        case 'arrowright':
        case 'l':
          skipForward();
          e.preventDefault();
          break;
        case 'm':
          setMuted(prev => !prev);
          e.preventDefault();
          break;
        case 'c':
          setSubtitlesEnabled(prev => !prev);
          e.preventDefault();
          break;
        case 'f':
          toggleFullscreen();
          e.preventDefault();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const handlePlayPause = () => {
    setPlaying(!playing);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  const handleToggleMute = () => {
    setMuted(!muted);
  };
  
  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setPlayedSeconds(state.playedSeconds);
      if (onProgress) {
        onProgress(state);
      }
    }
  };
  
  const handleSeekMouseDown = () => {
    setSeeking(true);
  };
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };
  
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };
  
  const skipBackward = () => {
    playerRef.current?.seekTo(Math.max(0, playedSeconds - 5));
  };
  
  const skipForward = () => {
    playerRef.current?.seekTo(Math.min(duration, playedSeconds + 5));
  };
  
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };

  const downloadVideoWithCaptions = async () => {
    if (!videoFile || segments.length === 0) {
      toast.error("Video file or transcription segments not available");
      return;
    }

    setIsProcessingDownload(true);
    toast.loading("Processing video with captions...", { id: "download-video" });

    try {
      // Create a form with the video file and subtitle information
      const formData = new FormData();
      formData.append("videoFile", videoFile);
      
      // Convert subtitle style and segments to JSON and append to form
      formData.append("subtitleStyle", JSON.stringify(localSubtitleStyle));
      formData.append("segments", JSON.stringify(segments));
      formData.append("subtitlesEnabled", String(subtitlesEnabled));
      
      // Send request to server endpoint
      const response = await fetch("/api/render-video", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }
      
      // Get the video blob from response
      const videoBlob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `video-with-captions.mp4`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success("Video with captions downloaded successfully", { id: "download-video" });
    } catch (error: Error | unknown) {
      console.error("Error downloading video with captions:", error);
      
      if (error instanceof Error && error.message.includes("not implemented")) {
        toast.error(
          "This feature requires server-side implementation with FFmpeg. Download subtitles separately for now.",
          { id: "download-video", duration: 5000 }
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to process video";
        toast.error(`Error: ${errorMessage}`, { id: "download-video" });
      }
    } finally {
      setIsProcessingDownload(false);
    }
  };
  
  // Handle subtitle style changes
  const handleSubtitleStyleChange = (newStyle: SubtitleStyle) => {
    setLocalSubtitleStyle(newStyle);
    
    // Propagate changes to parent component if callback is provided
    if (onSubtitleStyleChange) {
      onSubtitleStyleChange(newStyle);
    }
  };
  
  return (
    <div 
      ref={videoContainerRef}
      className="video-player w-full max-w-3xl mx-auto rounded-lg overflow-hidden bg-card shadow-sm border"
    >
      <div className="relative">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="auto"
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          className="react-player"
          progressInterval={100}
        />
        {subtitlesEnabled && (
          <VideoSubtitles
            segments={segments}
            currentTime={playedSeconds}
            subtitleStyle={localSubtitleStyle}
            enabled={true}
            onStyleChange={handleSubtitleStyleChange}
          />
        )}

        {/* Fullscreen subtitle controls overlay */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 bg-black/40 rounded-full p-2 transition-opacity opacity-0 hover:opacity-100">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSubtitles}
              className={`text-white ${subtitlesEnabled ? 'bg-primary/30' : ''}`}
              title={subtitlesEnabled ? "Hide subtitles" : "Show subtitles"}
            >
              <FiType className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Progress bar */}
        <div className="flex items-center mb-2">
          <span className="text-xs mr-2 w-12 text-right">
            {formatTime(playedSeconds)}
          </span>
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs ml-2 w-12">
            {formatTime(duration)}
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipBackward}
              title="Skip backward 5s (Left Arrow / J)"
            >
              <FiSkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePlayPause}
              title={playing ? "Pause (Space / K)" : "Play (Space / K)"}
            >
              {playing ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipForward}
              title="Skip forward 5s (Right Arrow / L)"
            >
              <FiSkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSubtitles}
              title={subtitlesEnabled ? "Hide subtitles (C)" : "Show subtitles (C)"}
              className={subtitlesEnabled ? 'text-primary' : ''}
            >
              <FiType className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleToggleMute}
              title={muted ? "Unmute (M)" : "Mute (M)"}
            >
              {muted ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
            </Button>
            
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <FiMinimize className="h-4 w-4" /> : <FiMaximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Download button */}
        {segments.length > 0 && videoFile && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={downloadVideoWithCaptions}
              disabled={isProcessingDownload}
            >
              <FiDownload className="h-4 w-4" />
              {isProcessingDownload ? "Processing..." : "Download Video with Captions"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 