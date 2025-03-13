import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiMinimize, 
  FiDownload,
  FiSkipBack,
  FiSkipForward,
  FiType
} from 'react-icons/fi';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { VideoSubtitles } from './VideoSubtitles';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { SubtitleStyle } from './SubtitleControls';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const playerRef = useRef<ReactPlayer>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  
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
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      // Hide controls after 3 seconds of inactivity when playing
      if (playing) {
        const timeout = setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
        
        setControlsTimeout(timeout);
      }
    };
    
    if (playerWrapperRef.current) {
      playerWrapperRef.current.addEventListener('mousemove', handleMouseMove);
      playerWrapperRef.current.addEventListener('mouseleave', () => {
        if (playing && !seeking) {
          setIsControlsVisible(false);
        }
      });
      playerWrapperRef.current.addEventListener('mouseenter', () => {
        setIsControlsVisible(true);
      });
    }
    
    return () => {
      if (playerWrapperRef.current) {
        playerWrapperRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [playing, controlsTimeout, seeking]);
  
  const handlePlayPause = () => {
    setPlaying(!playing);
    setIsControlsVisible(true);
  };
  
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
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
    setIsControlsVisible(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };
  
  const handleSeekChange = (values: number[]) => {
    setPlayed(values[0]);
  };
  
  const handleSeekMouseUp = () => {
    setSeeking(false);
    playerRef.current?.seekTo(played);
    
    if (playing) {
      // Set timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
      
      setControlsTimeout(timeout);
    }
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };
  
  const skipBackward = () => {
    playerRef.current?.seekTo(Math.max(0, playedSeconds - 5));
    
    // Show controls when skipping
    setIsControlsVisible(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    if (playing) {
      // Set timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
      
      setControlsTimeout(timeout);
    }
  };
  
  const skipForward = () => {
    playerRef.current?.seekTo(Math.min(duration, playedSeconds + 5));
    
    // Show controls when skipping
    setIsControlsVisible(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    if (playing) {
      // Set timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
      
      setControlsTimeout(timeout);
    }
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
    } catch (error: unknown) {
      console.error('Error downloading video with captions:', error);
      
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
    // Log changes to help debug
    console.log('VideoPlayer received new subtitle style:', {
      customPosition: newStyle.customPosition,
      position: newStyle.position,
      xPosition: newStyle.xPosition,
      yPosition: newStyle.yPosition,
    });
    
    // Use a fresh object to ensure React detects the changes
    const updatedStyle = { ...newStyle };
    setLocalSubtitleStyle(updatedStyle);
    
    // Propagate changes to parent component if callback is provided
    if (onSubtitleStyleChange) {
      onSubtitleStyleChange(updatedStyle);
    }
  };
  
  return (
    <div 
      ref={videoContainerRef}
      className="video-player w-full mx-auto rounded-xl overflow-hidden bg-black relative"
    >
      <div 
        ref={playerWrapperRef}
        className="relative group cursor-pointer"
        onClick={handlePlayPause}
      >
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
          className="react-player aspect-video"
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

        {/* Play/Pause overlay button */}
        <AnimatePresence>
          {!playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
              onClick={handlePlayPause}
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-full p-5 text-white">
                <FiPlay className="h-8 w-8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen subtitle controls overlay */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 bg-black/40 rounded-full p-2 transition-opacity opacity-0 hover:opacity-100">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                toggleSubtitles();
              }}
              className={`text-white ${subtitlesEnabled ? 'bg-primary/30' : ''}`}
              title={subtitlesEnabled ? "Hide subtitles" : "Show subtitles"}
            >
              <FiType className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Video Controls */}
        <AnimatePresence>
          {isControlsVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <div className="flex items-center mb-3">
                <span className="text-xs mr-2 w-12 text-center text-white/90 bg-black/30 py-1 px-1 rounded">
                  {formatTime(playedSeconds)}
                </span>
                <div className="flex-1 mx-1">
                  <Slider
                    value={[played]}
                    min={0}
                    max={0.999999}
                    step={0.0001}
                    onValueChange={handleSeekChange}
                    onValueCommit={handleSeekMouseUp}
                    onPointerDown={handleSeekMouseDown}
                    className="cursor-pointer"
                  />
                </div>
                <span className="text-xs ml-2 w-12 text-center text-white/90 bg-black/30 py-1 px-1 rounded">
                  {formatTime(duration)}
                </span>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      skipBackward();
                    }}
                    className="text-white hover:bg-white/10"
                    title="Skip backward 5s (Left Arrow / J)"
                  >
                    <FiSkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    className="text-white hover:bg-white/10"
                    title={playing ? "Pause (Space / K)" : "Play (Space / K)"}
                  >
                    {playing ? <FiPause className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      skipForward();
                    }}
                    className="text-white hover:bg-white/10"
                    title="Skip forward 5s (Right Arrow / L)"
                  >
                    <FiSkipForward className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtitles();
                    }}
                    className={`text-white hover:bg-white/10 ${subtitlesEnabled ? 'bg-white/20' : ''}`}
                    title={subtitlesEnabled ? "Hide subtitles (C)" : "Show subtitles (C)"}
                  >
                    <FiType className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1 mr-1 bg-black/30 rounded-full px-2 py-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute();
                      }}
                      className="text-white h-7 w-7 hover:bg-white/10"
                      title={muted ? "Unmute (M)" : "Mute (M)"}
                    >
                      {muted ? <FiVolumeX className="h-3 w-3" /> : <FiVolume2 className="h-3 w-3" />}
                    </Button>
                    
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      className="w-16 cursor-pointer"
                    />
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="text-white hover:bg-white/10"
                    title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                  >
                    {isFullscreen ? <FiMinimize className="h-4 w-4" /> : <FiMaximize className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Download button */}
      {segments.length > 0 && videoFile && (
        <div className="p-3 flex justify-end bg-muted/30 border-t border-border/10">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 relative group overflow-hidden"
            onClick={downloadVideoWithCaptions}
            disabled={isProcessingDownload}
          >
            {isProcessingDownload ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiDownload className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span>Download with Captions</span>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 