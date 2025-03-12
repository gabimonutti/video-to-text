import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm, readFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { generateSRTContent } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

// Helper to promisify the exec function
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function POST(req: NextRequest) {
  const jobId = uuidv4();
  const tempDir = path.join(process.cwd(), "tmp", jobId);
  
  try {
    // Get form data from request
    const formData = await req.formData();
    const videoFile = formData.get("videoFile") as File;
    const subtitleStyleStr = formData.get("subtitleStyle") as string;
    const segmentsStr = formData.get("segments") as string;
    const subtitlesEnabled = formData.get("subtitlesEnabled") === "true";

    // Check if we have all necessary data
    if (!videoFile || !subtitleStyleStr || !segmentsStr || !subtitlesEnabled) {
      return NextResponse.json(
        { error: "Missing required data for video rendering" },
        { status: 400 }
      );
    }

    // Parse JSON data
    const subtitleStyle = JSON.parse(subtitleStyleStr);
    const segments = JSON.parse(segmentsStr);

    // Log information about the request
    console.log(`Render video request received. Video: ${videoFile.name}, Size: ${Math.round(videoFile.size / 1024)} KB`);
    console.log(`Subtitles: ${segments.length} segments, Enabled: ${subtitlesEnabled}`);

    // 1. Create temporary directory
    await mkdir(tempDir, { recursive: true });
    
    // 2. Save video file
    const videoPath = path.join(tempDir, "input" + path.extname(videoFile.name) || ".mp4");
    const videoArrayBuffer = await videoFile.arrayBuffer();
    await writeFile(videoPath, Buffer.from(videoArrayBuffer));
    
    // 3. Generate SRT content from segments
    const srtContent = generateSRTContent(segments);
    const srtPath = path.join(tempDir, "subtitles.srt");
    await writeFile(srtPath, srtContent);
    
    // 4. Prepare FFmpeg style parameters based on subtitleStyle
    const fontName = subtitleStyle.fontFamily.split(",")[0].trim().replace(/'/g, "");
    const fontSize = subtitleStyle.fontSize;
    const primaryColor = subtitleStyle.color.replace("#", "&H");
    const bgColor = subtitleStyle.backgroundColor.replace("#", "&H");
    const opacity = Math.round(subtitleStyle.opacity * 255).toString(16).padStart(2, "0");
    
    // Apply opacity to background color - FFmpeg expects AABBGGRR format for colors
    const bgColorWithOpacity = "&H" + opacity + bgColor.substring(2);
    
    // Set alignment (1=left, 2=center, 3=right)
    let alignment = "2";
    if (subtitleStyle.alignment === "left") alignment = "1";
    if (subtitleStyle.alignment === "right") alignment = "3";
    
    // Position (bottom or top)
    const marginV = subtitleStyle.position === "bottom" ? "20" : "50";
    
    // Bold and italic
    const bold = subtitleStyle.bold ? "1" : "0";
    const italic = subtitleStyle.italic ? "1" : "0";
    
    // 5. Build FFmpeg command
    const outputPath = path.join(tempDir, "output.mp4");
    const styleParams = `FontName=${fontName},FontSize=${fontSize},PrimaryColour=${primaryColor},OutlineColour=${bgColorWithOpacity},Bold=${bold},Italic=${italic},Alignment=${alignment},MarginV=${marginV}`;
    
    // Execute FFmpeg command
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "subtitles='${srtPath}':force_style='${styleParams}'" -c:a copy "${outputPath}"`;
    
    console.log("Executing FFmpeg command:", ffmpegCommand);
    
    await execPromise(ffmpegCommand);
    
    // 6. Read output file using fs instead of fetch
    const outputVideoBuffer = await readFile(outputPath);
    
    // 7. Clean up temp files - async, don't wait
    rm(tempDir, { recursive: true, force: true })
      .catch(err => console.error("Error cleaning up temporary files:", err));
      
    // Return the processed video
    return new NextResponse(outputVideoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-with-captions.mp4"`,
      },
    });

  } catch (error: any) {
    console.error("Error in render-video API:", error);
    
    // Clean up temp files if they exist
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error cleaning up temporary files:", cleanupError);
    }
    
    if (error.message?.includes("ffmpeg")) {
      return NextResponse.json(
        {
          error: "Error processing video. Make sure FFmpeg is installed on the server."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || "An error occurred during video rendering"
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}; 