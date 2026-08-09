import React from 'react';
import { Play, Download, Trash2, Sparkles, FileArchive, CheckCircle, RefreshCw } from 'lucide-react';
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
}

export const BatchSummaryBar: React.FC<BatchSummaryBarProps> = ({
  items,
  onProcessAll,
  onDownloadZip,
  onClearCompleted,
  isProcessingBatch,
  isDownloadingZip,
  zipProgress
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
    <div className="sticky bottom-4 z-20 w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Overall Batch Statistics */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Batch Savings</span>
                {completedItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                    -{formattedSaved} Saved!
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span>{formatBytes(totalOriginalBytes)}</span>
                <span className="text-slate-500">→</span>
                <span className="text-emerald-400">
                  {completedItems.length > 0 ? formatBytes(totalCompressedBytes) : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Queue Status:{' '}
              <strong className="text-white">
                {completedItems.length} of {items.length} compressed
              </strong>
            </div>
            <div>
              Ready to process:{' '}
              <strong className="text-indigo-400">{queuedItems.length} items</strong>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {completedItems.length > 0 && (
            <button
              onClick={onClearCompleted}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              Clear Done
            </button>
          )}

          {/* Download All as ZIP button */}
          {completedItems.length > 0 && (
            <button
              onClick={onDownloadZip}
              disabled={isDownloadingZip}
              id="download-zip-btn"
              className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
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
        <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Packaging compressed files into ZIP archive...</span>
            <span>{zipProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
