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
  FiType
} from 'react-icons/fi';
import { formatTime } from '@/lib/utils';
import { Button } from './ui/button';
import { VideoSubtitles } from './VideoSubtitles';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { SubtitleStyle } from './SubtitleControls';

interface VideoPlayerProps {
  videoUrl: string;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
  currentTime?: number;
  segments?: TranscriptionSegment[];
  subtitleStyle?: SubtitleStyle;
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
};

export function VideoPlayer({ 
  videoUrl, 
  onProgress, 
  currentTime,
  segments = [],
  subtitleStyle = defaultSubtitleStyle
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  
  const playerRef = useRef<ReactPlayer>(null);
  
  // Use external currentTime if provided
  useEffect(() => {
    if (currentTime !== undefined && !seeking && Math.abs(playedSeconds - currentTime) > 0.5) {
      playerRef.current?.seekTo(currentTime);
    }
  }, [currentTime, seeking, playedSeconds]);
  
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
  
  const handleFullscreen = () => {
    const videoElement = document.querySelector('.react-player video');
    if (videoElement) {
      if ((videoElement as any).requestFullscreen) {
        (videoElement as any).requestFullscreen();
      } else if ((videoElement as any).webkitRequestFullscreen) {
        (videoElement as any).webkitRequestFullscreen();
      } else if ((videoElement as any).mozRequestFullScreen) {
        (videoElement as any).mozRequestFullScreen();
      } else if ((videoElement as any).msRequestFullscreen) {
        (videoElement as any).msRequestFullscreen();
      }
    }
  };

  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };
  
  return (
    <div className="video-player w-full max-w-3xl mx-auto rounded-lg overflow-hidden bg-card shadow-sm border">
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
        {segments && segments.length > 0 && (
          <VideoSubtitles
            segments={segments}
            currentTime={playedSeconds}
            subtitleStyle={subtitleStyle}
            enabled={subtitlesEnabled}
          />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipBackward}
              title="Skip backward 5s"
            >
              <FiSkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePlayPause}
              title={playing ? "Pause" : "Play"}
            >
              {playing ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipForward}
              title="Skip forward 5s"
            >
              <FiSkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSubtitles}
              title={subtitlesEnabled ? "Hide subtitles" : "Show subtitles"}
              className={subtitlesEnabled ? 'text-primary' : ''}
            >
              <FiType className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleToggleMute}
              title={muted ? "Unmute" : "Mute"}
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
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <FiMaximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 