import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatTime, generateSRTContent, generateVTTContent, downloadBlob } from '@/lib/utils';
import { FiDownload, FiEdit2, FiSave, FiX } from 'react-icons/fi';

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

interface TranscriptionDisplayProps {
  segments: TranscriptionSegment[];
  onSegmentClick?: (time: number) => void;
  onSaveTranscription?: (segments: TranscriptionSegment[]) => void;
  currentTime?: number;
  isEditable?: boolean;
}

export function TranscriptionDisplay({
  segments,
  onSegmentClick,
  onSaveTranscription,
  currentTime = 0,
  isEditable = true,
}: TranscriptionDisplayProps) {
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editedSegments, setEditedSegments] = useState<TranscriptionSegment[]>(segments);
  const [editText, setEditText] = useState('');
  
  // Update segments when props change
  useEffect(() => {
    setEditedSegments(segments);
  }, [segments]);
  
  const handleSegmentClick = (start: number) => {
    if (onSegmentClick) {
      onSegmentClick(start);
    }
  };
  
  const handleEditClick = (segment: TranscriptionSegment) => {
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };
  
  const handleSaveEdit = (id: string) => {
    const updatedSegments = editedSegments.map(segment => 
      segment.id === id ? { ...segment, text: editText } : segment
    );
    
    setEditedSegments(updatedSegments);
    setEditingSegment(null);
    
    if (onSaveTranscription) {
      onSaveTranscription(updatedSegments);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingSegment(null);
  };
  
  const downloadTranscription = (format: 'txt' | 'srt' | 'vtt') => {
    let content = '';
    let filename = `transcription.${format}`;
    let contentType = 'text/plain';
    
    switch (format) {
      case 'txt':
        content = editedSegments.map(segment => segment.text).join(' ');
        break;
        
      case 'srt':
        content = generateSRTContent(editedSegments);
        break;
        
      case 'vtt':
        content = generateVTTContent(editedSegments);
        break;
    }
    
    // Download the content
    downloadBlob(content, filename, contentType);
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transcription</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadTranscription('txt')}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Text
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadTranscription('srt')}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            SRT
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => downloadTranscription('vtt')}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            VTT
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto p-1">
          {editedSegments.map((segment) => {
            const isActive = currentTime >= segment.start && currentTime <= segment.end;
            
            return (
              <div 
                key={segment.id}
                className={`p-3 rounded-md transition-colors ${
                  isActive ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div 
                    className="text-xs text-muted-foreground cursor-pointer"
                    onClick={() => handleSegmentClick(segment.start)}
                  >
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </div>
                  
                  {isEditable && editingSegment !== segment.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEditClick(segment)}
                    >
                      <FiEdit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {editingSegment === segment.id ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border rounded-md mb-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <FiX className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveEdit(segment.id)}
                      >
                        <FiSave className="mr-1 h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{segment.text}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 