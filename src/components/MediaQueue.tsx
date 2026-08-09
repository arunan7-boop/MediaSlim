import React from 'react';
import {
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  Cloud,
  Eye,
  Trash2,
  Crop,
  RefreshCw,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MediaItem } from '../types';
import { calculateSavings, formatBytes } from '../utils/formatters';

interface MediaQueueProps {
  items: MediaItem[];
  onProcessItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onOpenPreview: (item: MediaItem) => void;
  onOpenCropEditor: (item: MediaItem) => void;
  onSaveItemToCloud: (item: MediaItem) => void;
  onDownloadItem: (item: MediaItem) => void;
}

export const MediaQueue: React.FC<MediaQueueProps> = ({
  items,
  onProcessItem,
  onRemoveItem,
  onOpenPreview,
  onOpenCropEditor,
  onSaveItemToCloud,
  onDownloadItem
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Processing Queue</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-normal">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const savings = calculateSavings(item.originalSize, item.compressedSize || 0);
          const isCompleted = item.status === 'completed';
          const isProcessing = item.status === 'processing' || item.status === 'uploading';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`relative group bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 overflow-hidden ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                  : isProcessing
                  ? 'border-indigo-500/40 bg-indigo-500/[0.03]'
                  : isError
                  ? 'border-rose-500/40 bg-rose-500/[0.03]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Media Thumbnail Preview */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center group-hover:border-slate-600 transition-colors">
                    {item.type === 'image' ? (
                      <img
                        src={item.compressedUrl || item.originalUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-850">
                        <video
                          src={item.originalUrl}
                          className="w-full h-full object-cover opacity-60"
                        />
                        <VideoIcon className="w-6 h-6 text-violet-400 absolute" />
                      </div>
                    )}

                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-950/80 text-[9px] font-mono font-bold text-slate-300 uppercase">
                      {item.type === 'image' ? item.settings.outputFormat : 'video'}
                    </span>
                  </div>

                  {/* File Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate max-w-[240px] md:max-w-md">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 capitalize">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                      <span>Orig: {formatBytes(item.originalSize)}</span>
                      <span>({item.originalWidth}x{item.originalHeight})</span>

                      {isCompleted && item.compressedSize && (
                        <>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span className="text-white font-bold">New: {formatBytes(item.compressedSize)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            -{savings.formattedSaved}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Status */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {/* Compare / Preview Button */}
                  {(isCompleted || item.type === 'image') && (
                    <button
                      onClick={() => onOpenPreview(item)}
                      title="Open Side-by-Side Comparison Preview"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden md:inline">Compare</span>
                    </button>
                  )}

                  {/* Manual Aspect Ratio Crop (Images only) */}
                  {item.type === 'image' && (
                    <button
                      onClick={() => onOpenCropEditor(item)}
                      title="Manually Adjust Aspect Ratio & Crop Box"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    >
                      <Crop className="w-3.5 h-3.5 text-violet-400" />
                    </button>
                  )}

                  {/* Process Single Item Button */}
                  {!isCompleted && !isProcessing && (
                    <button
                      onClick={() => onProcessItem(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Reduce Size</span>
                    </button>
                  )}

                  {/* Save to Cloud Button */}
                  {isCompleted && (
                    <button
                      onClick={() => onSaveItemToCloud(item)}
                      disabled={item.savedToCloud}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        item.savedToCloud
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      <Cloud className={`w-3.5 h-3.5 ${item.savedToCloud ? 'text-emerald-400' : 'text-indigo-400'}`} />
                      <span>{item.savedToCloud ? 'In Cloud' : 'Cloud Save'}</span>
                    </button>
                  )}

                  {/* Download Output Button */}
                  {isCompleted && (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    title="Remove item"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Status Text */}
              {isProcessing && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                      <span>{item.progress.message || 'Processing video/image...'}</span>
                    </span>
                    <span className="font-mono">{item.progress.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 h-full rounded-full transition-all duration-200"
                      style={{ width: `${item.progress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {isError && (
                <div className="mt-3 pt-2 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{item.errorMessage || 'Failed to compress media file'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
