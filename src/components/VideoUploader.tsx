import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiVideo, FiX, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    // if (file.size > 100 * 1024 * 1024) {
    //   toast.error('Video size exceeds 100MB limit.');
    //   return;
    // }

    setUploadedFile(file);
    onVideoUploaded(file);
    
    // Show success toast
    toast.success(`Video "${file.name}" uploaded successfully!`);
  }, [onVideoUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'video/*': []
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  // Format file size with appropriate units
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border border-primary/20 shadow-lg bg-card">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`relative p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden
              ${isDragActive 
                ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary' 
                : 'hover:bg-gradient-to-br hover:from-primary/5 hover:to-background'}
              ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            {/* Background animation for drag state */}
            {isDragActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-xl animate-pulse" />
                <div className="absolute inset-0 opacity-5 bg-primary" />
              </motion.div>
            )}
            
            {uploadedFile ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <FiVideo className="w-8 h-8 text-primary" />
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-lg truncate max-w-xs">{uploadedFile.name}</span>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20">
                    <FiCheck className="w-3 h-3 text-green-500" />
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  {formatFileSize(uploadedFile.size)} • Ready to process
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    disabled={isLoading}
                    className="gap-1 group"
                  >
                    <FiX className="w-4 h-4 text-destructive group-hover:animate-spin-once" />
                    Change Video
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center text-center py-4 px-2"
                animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      y: isDragActive ? [0, -5, 0] : 0 
                    }}
                    transition={{ 
                      repeat: isDragActive ? Infinity : 0, 
                      duration: 1.5 
                    }}
                  >
                    <FiUpload className="w-9 h-9 text-primary/80" />
                  </motion.div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? "Drop it right here!" : "Upload your video"}
                </h3>
                
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {isDragActive 
                    ? "We'll handle the rest..." 
                    : "Drag & drop your video file here, or click to browse"}
                </p>
                
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    variant="default" 
                    size="lg" 
                    disabled={isLoading}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <FiVideo className="w-4 h-4" />
                      Select Video
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-90 group-hover:scale-110 transition-transform duration-500"></div>
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Supports MP4, WEBM, MOV (max 100MB)
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 