import React from 'react';
import { Play, Download, Trash2, Sparkles, FileArchive, CheckCircle, RefreshCw, Eraser } from 'lucide-react';
import { MediaItem } from '../types';
import { calculateSavings, formatBytes } from '../utils/formatters';

interface BatchSummaryBarProps {
  items: MediaItem[];
  onProcessAll: () => void;
  onDownloadZip: () => void;
  onClearCompleted: () => void;
  isProcessingBatch: boolean;
  isDownloadingZip: boolean;
  zipProgress: number;
  autoCleanup?: boolean;
}

export const BatchSummaryBar: React.FC<BatchSummaryBarProps> = ({
  items,
  onProcessAll,
  onDownloadZip,
  onClearCompleted,
  isProcessingBatch,
  isDownloadingZip,
  zipProgress,
  autoCleanup
}) => {
  if (items.length === 0) return null;

  const completedItems = items.filter((i) => i.status === 'completed');
  const queuedItems = items.filter((i) => i.status === 'queued' || i.status === 'error');

  const totalOriginalBytes = items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalCompressedBytes = items.reduce((acc, i) => acc + (i.compressedSize || i.originalSize), 0);

  const { bytesSaved, percentageSaved, formattedSaved } = calculateSavings(
    totalOriginalBytes,
    completedItems.length > 0 ? totalCompressedBytes : totalOriginalBytes
  );

  return (
    <div className="sticky bottom-4 z-20 w-full bg-white/95 border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-md text-slate-900">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Overall Batch Statistics */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Batch Savings</span>
                {completedItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-extrabold uppercase">
                    -{formattedSaved} Saved!
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <span>{formatBytes(totalOriginalBytes)}</span>
                <span className="text-slate-400">→</span>
                <span className="text-green-700">
                  {completedItems.length > 0 ? formatBytes(totalCompressedBytes) : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="text-xs text-slate-500 space-y-0.5 font-medium">
            <div>
              Queue Status:{' '}
              <strong className="text-slate-900">
                {completedItems.length} of {items.length} completed
              </strong>
            </div>
            <div>
              Ready to process:{' '}
              <strong className="text-slate-900 font-bold">{queuedItems.length} items</strong>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {autoCleanup && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
              <Eraser className="w-3.5 h-3.5 text-rose-600" />
              <span>Auto-cleanup Active</span>
            </span>
          )}

          {completedItems.length > 0 && (
            <button
              onClick={onClearCompleted}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-600" />
              <span>Clear Completed</span>
            </button>
          )}

          {/* Download All as ZIP button */}
          {completedItems.length > 0 && (
            <button
              onClick={onDownloadZip}
              disabled={isDownloadingZip}
              id="download-zip-btn"
              className="relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isDownloadingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Building ZIP ({zipProgress}%)...</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </>
              )}
            </button>
          )}

          {/* Process All Items */}
          {queuedItems.length > 0 && (
            <button
              onClick={onProcessAll}
              disabled={isProcessingBatch}
              id="process-all-btn"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isProcessingBatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Process All ({queuedItems.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ZIP Download Progress Bar */}
      {isDownloadingZip && (
        <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-600 font-mono font-bold">
            <span>Packaging compressed files into ZIP archive...</span>
            <span>{zipProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-150"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
