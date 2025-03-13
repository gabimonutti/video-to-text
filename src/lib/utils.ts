import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time in seconds to a MM:SS or HH:MM:SS format
 * @param seconds Number of seconds to format
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats time in seconds to SRT timestamp format (HH:MM:SS,mmm)
 */
export function formatSRTTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00:00,000";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Formats time in seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
export function formatVTTTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00:00.000";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Generates SRT content from transcription segments
 */
export function generateSRTContent(segments: any[]): string {
  return segments.map((segment, index) => {
    const id = index + 1;
    const start = formatSRTTime(segment.start);
    const end = formatSRTTime(segment.end);
    
    return `${id}\n${start} --> ${end}\n${segment.text}\n`;
  }).join('\n');
}

/**
 * Generates VTT content from transcription segments
 */
export function generateVTTContent(segments: any[]): string {
  const header = 'WEBVTT\n\n';
  const content = segments.map((segment, index) => {
    const start = formatVTTTime(segment.start);
    const end = formatVTTTime(segment.end);
    
    return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
  }).join('\n');
  
  return header + content;
}

/**
 * Downloads content as a file
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = filename;
  a.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
