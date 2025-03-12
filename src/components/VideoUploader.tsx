import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import toast from 'react-hot-toast';

interface VideoUploaderProps {
  onVideoUploaded: (file: File) => void;
  isLoading?: boolean;
}

export function VideoUploader({ onVideoUploaded, isLoading = false }: VideoUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    // Check if the file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file.');
      return;
    }
    
    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size exceeds 100MB limit.');
      return;
    }

    setUploadedFile(file);
    onVideoUploaded(file);
  }, [onVideoUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'video/*': []
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <FiUpload className="w-10 h-10 mb-4 text-gray-500" />
          
          <div className="text-center">
            {uploadedFile ? (
              <>
                <p className="text-sm font-medium mb-1">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                  disabled={isLoading}
                >
                  Change Video
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">
                  {isDragActive ? "Drop the video here" : "Drag & drop your video"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (MP4, WEBM, MOV up to 100MB)
                </p>
                <Button variant="secondary" size="sm" disabled={isLoading}>
                  Select Video
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 