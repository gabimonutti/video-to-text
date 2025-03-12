import React, { useEffect, useState, useRef } from 'react';
import { TranscriptionSegment } from './TranscriptionDisplay';
import { SubtitleStyle } from './SubtitleControls';

interface VideoSubtitlesProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  subtitleStyle: SubtitleStyle;
  enabled: boolean;
  onStyleChange?: (style: SubtitleStyle) => void; // Callback for style changes (position)
}

export function VideoSubtitles({ 
  segments, 
  currentTime, 
  subtitleStyle,
  enabled = true,
  onStyleChange
}: VideoSubtitlesProps) {
  const [activeSegment, setActiveSegment] = useState<TranscriptionSegment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Log subtitle style changes for debugging
  useEffect(() => {
    console.log('VideoSubtitles received style update:', {
      customPosition: subtitleStyle.customPosition,
      position: subtitleStyle.position,
      xPosition: subtitleStyle.xPosition,
      yPosition: subtitleStyle.yPosition,
    });
  }, [subtitleStyle.customPosition, subtitleStyle.position, subtitleStyle.xPosition, subtitleStyle.yPosition]);

  // Handle dragging for custom positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!subtitleStyle.customPosition || !onStyleChange || !containerRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const initialXPercent = subtitleStyle.xPosition;
    const initialYPercent = subtitleStyle.yPosition;
    
    const handleMouseMoveLocal = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      // Convert pixel change to percentage change
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;
      
      // Apply the change to the initial position
      const newXPercent = Math.min(100, Math.max(0, initialXPercent + deltaXPercent));
      const newYPercent = Math.min(100, Math.max(0, initialYPercent + deltaYPercent));
      
      onStyleChange({
        ...subtitleStyle,
        xPosition: Math.round(newXPercent),
        yPosition: Math.round(newYPercent)
      });
    };
    
    const handleMouseUpLocal = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMoveLocal);
      document.removeEventListener('mouseup', handleMouseUpLocal);
    };
    
    document.addEventListener('mousemove', handleMouseMoveLocal);
    document.addEventListener('mouseup', handleMouseUpLocal);
  };
  
  // Get rid of the previous global handlers that aren't being used correctly
  const handleMouseMove = (e: MouseEvent) => {
    // This is now handled in the local closure inside handleMouseDown
  };
  
  const handleMouseUp = () => {
    // This is now handled in the local closure inside handleMouseDown
  };

  // Handle touch events for mobile with the same approach
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!subtitleStyle.customPosition || !onStyleChange || !containerRef.current) return;
    
    if (e.touches.length !== 1) return;
    e.preventDefault();
    
    setIsDragging(true);
    
    const touch = e.touches[0];
    const initialTouchX = touch.clientX;
    const initialTouchY = touch.clientY;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const initialXPercent = subtitleStyle.xPosition;
    const initialYPercent = subtitleStyle.yPosition;
    
    const handleTouchMoveLocal = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      moveEvent.preventDefault();
      
      const moveTouch = moveEvent.touches[0];
      const deltaX = moveTouch.clientX - initialTouchX;
      const deltaY = moveTouch.clientY - initialTouchY;
      
      // Convert pixel change to percentage change
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;
      
      // Apply the change to the initial position
      const newXPercent = Math.min(100, Math.max(0, initialXPercent + deltaXPercent));
      const newYPercent = Math.min(100, Math.max(0, initialYPercent + deltaYPercent));
      
      onStyleChange({
        ...subtitleStyle,
        xPosition: Math.round(newXPercent),
        yPosition: Math.round(newYPercent)
      });
    };
    
    const handleTouchEndLocal = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMoveLocal, { capture: true } as EventListenerOptions);
      document.removeEventListener('touchend', handleTouchEndLocal);
    };
    
    document.addEventListener('touchmove', handleTouchMoveLocal, { passive: false, capture: true } as EventListenerOptions);
    document.addEventListener('touchend', handleTouchEndLocal);
  };
  
  // Get rid of the previous global handlers
  const handleTouchMove = (e: TouchEvent) => {
    // This is now handled in the local closure inside handleTouchStart
  };
  
  const handleTouchEnd = () => {
    // This is now handled in the local closure inside handleTouchStart
  };

  if (!activeSegment || !enabled) {
    return null;
  }

  // Convert opacity to hex for the backgroundColor
  const opacityHex = Math.round(subtitleStyle.opacity * 255)
    .toString(16)
    .padStart(2, '0');

  // Position based on whether we're using custom positioning or not
  let positionStyle = {};
  
  if (subtitleStyle.customPosition) {
    positionStyle = {
      position: 'absolute',
      left: `${subtitleStyle.xPosition}%`,
      top: `${subtitleStyle.yPosition}%`,
      transform: 'translate(-50%, -50%)',
      cursor: isDragging ? 'grabbing' : 'grab'
    };
  } else {
    // For standard positions, use a more direct approach to ensure visibility
    if (subtitleStyle.position === 'bottom') {
      positionStyle = {
        position: 'absolute',
        left: '50%',
        bottom: '40px', // Fixed distance from bottom
        transform: 'translateX(-50%)',
      };
    } else { // top
      positionStyle = {
        position: 'absolute',
        left: '50%',
        top: '40px', // Fixed distance from top
        transform: 'translateX(-50%)',
      };
    }
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: subtitleStyle.customPosition ? 'auto' : 'none' }}
    >
      <div
        ref={subtitleRef}
        style={{
          ...positionStyle,
          color: subtitleStyle.color,
          backgroundColor: subtitleStyle.noBackground ? 'transparent' : `${subtitleStyle.backgroundColor}${opacityHex}`,
          fontFamily: subtitleStyle.fontFamily,
          fontSize: `${subtitleStyle.fontSize}px`,
          fontWeight: subtitleStyle.bold ? 'bold' : 'normal',
          fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
          textAlign: subtitleStyle.alignment,
          padding: '4px 12px',
          borderRadius: '4px',
          maxWidth: '80%',
          textShadow: subtitleStyle.noBackground ? '0px 0px 2px rgba(0, 0, 0, 0.8)' : 'none',
          userSelect: 'none',
          zIndex: 10,
          border: subtitleStyle.customPosition ? '1px dashed rgba(255, 255, 255, 0.5)' : 'none',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title={subtitleStyle.customPosition ? "Drag to reposition" : ""}
      >
        {subtitleStyle.customPosition && (
          <div 
            style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              color: 'white',
              opacity: isDragging ? 1 : 0.7,
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
            }}
          >
            ⋮⋮
          </div>
        )}
        {activeSegment.text}
      </div>
    </div>
  );
} 