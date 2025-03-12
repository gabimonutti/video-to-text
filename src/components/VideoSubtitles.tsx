import React, { useEffect, useState } from 'react';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { SubtitleStyle } from './SubtitleControls';

interface VideoSubtitlesProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  subtitleStyle: SubtitleStyle;
  enabled: boolean;
}

export function VideoSubtitles({ 
  segments, 
  currentTime, 
  subtitleStyle,
  enabled = true
}: VideoSubtitlesProps) {
  const [activeSegment, setActiveSegment] = useState<TranscriptionSegment | null>(null);

  // Update active segment based on currentTime
  useEffect(() => {
    if (!segments || !segments.length || !enabled) {
      setActiveSegment(null);
      return;
    }

    const segment = segments.find(
      segment => currentTime >= segment.start && currentTime <= segment.end
    );

    if (segment) {
      setActiveSegment(segment);
    } else {
      setActiveSegment(null);
    }
  }, [segments, currentTime, enabled]);

  if (!activeSegment || !enabled) {
    return null;
  }

  // Convert opacity to hex for the backgroundColor
  const opacityHex = Math.round(subtitleStyle.opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return (
    <div 
      className={`absolute left-0 right-0 px-4 py-2 flex justify-center ${
        subtitleStyle.position === 'bottom' ? 'bottom-8' : 'top-8'
      }`}
    >
      <div
        style={{
          color: subtitleStyle.color,
          backgroundColor: `${subtitleStyle.backgroundColor}${opacityHex}`,
          fontFamily: subtitleStyle.fontFamily,
          fontSize: `${subtitleStyle.fontSize}px`,
          fontWeight: subtitleStyle.bold ? 'bold' : 'normal',
          fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
          textAlign: subtitleStyle.alignment,
          padding: '4px 12px',
          borderRadius: '4px',
          maxWidth: '80%',
          textShadow: subtitleStyle.backgroundColor === 'transparent' ? '0px 0px 2px rgba(0, 0, 0, 0.8)' : 'none',
        }}
      >
        {activeSegment.text}
      </div>
    </div>
  );
} 