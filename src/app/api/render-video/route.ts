import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm, readFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { generateSRTContent, generateASSContent } from "@/lib/utils";
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
    
    // 3. Generate subtitle content
    // First, generate SRT for backup/compatibility
    const srtContent = generateSRTContent(segments);
    const srtPath = path.join(tempDir, "subtitles.srt");
    await writeFile(srtPath, srtContent);
    
    // Then generate ASS format for better styling control
    const assContent = generateASSContent(segments, subtitleStyle);
    const assPath = path.join(tempDir, "subtitles.ass");
    await writeFile(assPath, assContent);
    
    // 4. Prepare output path
    const outputPath = path.join(tempDir, "output.mp4");
    
    // Execute FFmpeg command with ASS subtitles for better styling
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "ass='${assPath}'" -c:a copy "${outputPath}"`;
    
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