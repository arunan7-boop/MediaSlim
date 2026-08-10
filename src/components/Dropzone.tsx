import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Video as VideoIcon, FileCheck, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isReadingFiles: boolean;
  uploadProgress: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  isReadingFiles,
  uploadProgress
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(isValidMediaFile);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(isValidMediaFile);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isValidMediaFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(file.name);
    return isImage || isVideo;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        id="media-file-input"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        id="dropzone-area"
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isDragOver
            ? 'border-slate-900 bg-slate-100/80 scale-[1.002] shadow-sm'
            : 'border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          {/* Upload icon box */}
          <div className={`p-3.5 rounded-xl transition-all duration-200 ${
            isDragOver
              ? 'bg-slate-900 text-white scale-110'
              : 'bg-slate-900 text-white group-hover:scale-105 shadow-sm'
          }`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
              Drop images or videos here to reduce size
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Supports batch processing. Drag & drop files or{' '}
              <span className="text-slate-900 underline underline-offset-4 font-bold">browse local files</span>
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isReadingFiles && (
            <div className="w-full max-w-md bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
                  Reading & analyzing files...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Formats & Badge Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
              <span>JPG, PNG, WebP, AVIF, GIF</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 font-medium">
              <VideoIcon className="w-3.5 h-3.5 text-slate-700" />
              <span>MP4, WebM, MOV, AVI</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold">
              <FileCheck className="w-3.5 h-3.5 text-green-600" />
              <span>Batch Queue Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
