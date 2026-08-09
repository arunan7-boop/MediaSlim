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
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005] shadow-xl shadow-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          {/* Animated upload icon circle */}
          <div className={`p-4 rounded-2xl transition-all duration-300 ${
            isDragOver
              ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800/80 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105'
          }`}>
            <UploadCloud className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
              Drop images or videos here to reduce size
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Supports batch processing. Drag & drop multiple files or{' '}
              <span className="text-indigo-400 underline underline-offset-4 font-medium">browse files</span>
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isReadingFiles && (
            <div className="w-full max-w-md bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  Reading & analyzing uploaded files...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Formats & Badge Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>JPG, PNG, WebP, AVIF, GIF, BMP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <VideoIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>MP4, WebM, MOV, AVI, MKV</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Unlimited Batch Queue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
