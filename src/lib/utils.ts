import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TranscriptionSegment } from "@/components/TranscriptionDisplay";
import { SubtitleStyle } from "@/components/SubtitleControls";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export function downloadBlob(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

export function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function generateSRTContent(segments: TranscriptionSegment[]): string {
  return segments.map((segment, index) => {
    // Clean the text to ensure compatibility with SRT format
    // Replace any line breaks with a space to prevent multi-line issues in FFmpeg
    const cleanText = segment.text
      .replace(/\r?\n|\r/g, ' ')
      .trim();
      
    return `${index + 1}
${formatSRTTime(segment.start)} --> ${formatSRTTime(segment.end)}
${cleanText}
`;
  }).join('\n');
}

export function generateVTTContent(segments: TranscriptionSegment[]): string {
  return `WEBVTT

${segments.map((segment) => {
  return `${formatVTTTime(segment.start)} --> ${formatVTTTime(segment.end)}
${segment.text}
`;
}).join('\n')}`;
}

export function generateASSContent(segments: TranscriptionSegment[], style: SubtitleStyle): string {
  // Convert CSS hex colors (#RRGGBB) to ASS format (&HAABBGGRR)
  const convertColorToASS = (cssHex: string, alpha: string = "00") => {
    // Remove # if present
    const hex = cssHex.replace("#", "");
    // Extract RGB components
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    // Return in ASS format: &HAABBGGRR (alpha, blue, green, red)
    return `&H${alpha}${b}${g}${r}`;
  };
  
  // Calculate opacity hex (00 = fully opaque, FF = fully transparent in ASS)
  const alphaHex = Math.round((1 - style.opacity) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  
  // Define colors in ASS format
  const primaryColor = convertColorToASS(style.color);
  const bgColor = convertColorToASS(style.backgroundColor, alphaHex);
  
  // Set alignment (1=bottom left, 2=bottom center, 3=bottom right)
  let alignment = "2";
  if (style.alignment === "left") alignment = "1";
  if (style.alignment === "right") alignment = "3";
  
  // Adjust vertical position
  const marginV = style.position === "bottom" ? "20" : "50";
  
  // Bold and italic
  const bold = style.bold ? "1" : "0";
  const italic = style.italic ? "1" : "0";
  
  // Font settings
  const fontName = style.fontFamily.split(",")[0].trim().replace(/'/g, "");
  const fontSize = style.fontSize;
  
  // Build ASS header
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H00FFFFFF,&H00000000,${bgColor},${bold},${italic},0,0,100,100,0,0,1,0,0,${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Generate events (subtitle lines)
  const events = segments.map(segment => {
    const startTime = formatASSTime(segment.start);
    const endTime = formatASSTime(segment.end);
    // Clean the text to ensure compatibility
    const cleanText = segment.text
      .replace(/\r?\n|\r/g, ' ')
      .trim();
    
    return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${cleanText}`;
  }).join('\n');

  return header + events;
}

// Helper function to format time for ASS format (H:MM:SS.CC)
function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
} 