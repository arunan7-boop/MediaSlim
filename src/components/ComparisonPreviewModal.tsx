import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sliders,
  Columns,
  Play,
  Pause,
  RotateCcw,
  Crop,
  Download,
  Cloud,
  Sparkles,
  ArrowRight,
  Maximize2,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { MediaItem } from '../types';
import { calculateSavings, formatBytes } from '../utils/formatters';

interface ComparisonPreviewModalProps {
  item: MediaItem;
  onClose: () => void;
  onOpenCropEditor: (item: MediaItem) => void;
  onSaveToCloud: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}

export const ComparisonPreviewModal: React.FC<ComparisonPreviewModalProps> = ({
  item,
  onClose,
  onOpenCropEditor,
  onSaveToCloud,
  onDownload
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'sideBySide'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Video playback sync state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoTime, setVideoTime] = useState<number>(0);
  const videoRefOrig = useRef<HTMLVideoElement>(null);
  const videoRefComp = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const savings = calculateSavings(item.originalSize, item.compressedSize || 0);

  // Split-Screen slider mouse move logic
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) handleSliderMove(e.touches[0].clientX);
  };

  // Synchronized video playback handlers
  const toggleVideoPlay = () => {
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);

    if (videoRefOrig.current) {
      if (nextPlay) videoRefOrig.current.play();
      else videoRefOrig.current.pause();
    }
    if (videoRefComp.current) {
      if (nextPlay) videoRefComp.current.play();
      else videoRefComp.current.pause();
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setVideoTime(targetTime);
    if (videoRefOrig.current) videoRefOrig.current.currentTime = targetTime;
    if (videoRefComp.current) videoRefComp.current.currentTime = targetTime;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {item.name}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">Side-by-Side Quality & Compression Visual Inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {item.type === 'image' && (
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewMode === 'sideBySide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Grid Side-by-Side</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Detailed Stats Comparison Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-950 border-b border-slate-800 text-xs font-mono">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Original Size</span>
            <span className="text-slate-200 font-bold">{formatBytes(item.originalSize)}</span>
            <span className="text-[11px] text-slate-400 block">{item.originalWidth}×{item.originalHeight}</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Compressed Size</span>
            <span className="text-emerald-400 font-bold">
              {item.compressedSize ? formatBytes(item.compressedSize) : 'Processing...'}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {item.compressedWidth || item.originalWidth}×{item.compressedHeight || item.originalHeight}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Size Reduction</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{savings.formattedSaved}</span>
            </span>
            <span className="text-[11px] text-slate-400 block">Saved {formatBytes(savings.bytesSaved)}</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Format & Speed</span>
            <span className="text-indigo-400 font-bold uppercase">{item.settings.outputFormat}</span>
            <span className="text-[11px] text-slate-400 block">
              {item.processingTimeMs ? `${item.processingTimeMs} ms` : 'Ready'}
            </span>
          </div>
        </div>

        {/* Comparison Viewer Stage */}
        <div className="relative flex-1 bg-slate-950 p-4 md:p-6 flex items-center justify-center overflow-hidden min-h-[360px]">
          {item.type === 'image' ? (
            /* IMAGE COMPARISON */
            viewMode === 'split' ? (
              /* SPLIT SLIDER VIEW */
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative max-w-full max-h-[55vh] select-none rounded-xl overflow-hidden border border-slate-800 shadow-2xl cursor-ew-resize"
              >
                {/* Original Image (Left / Full Underlying) */}
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="max-h-[55vh] w-auto object-contain block"
                />

                {/* Compressed Output Image (Right / Clipped Overlay) */}
                <div
                  style={{ width: `${100 - sliderPosition}%` }}
                  className="absolute top-0 right-0 bottom-0 overflow-hidden"
                >
                  <img
                    src={item.compressedUrl || item.originalUrl}
                    alt="Compressed"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'right' }}
                    className="max-h-[55vh] block"
                  />
                </div>

                {/* Center Divider Line & Handle */}
                <div
                  style={{ left: `${sliderPosition}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] -translate-x-1/2 pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                    <Sliders className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Badges */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono font-bold text-slate-200">
                  Original
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-xs font-mono font-bold text-emerald-300">
                  Compressed ({item.settings.quality}%)
                </span>
              </div>
            ) : (
              /* SIDE-BY-SIDE GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-h-[55vh]">
                <div className="relative flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-hidden">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-slate-950/80 text-xs font-mono font-bold text-slate-300">
                    Original
                  </span>
                  <img
                    src={item.originalUrl}
                    alt="Original"
                    className="max-h-[45vh] object-contain rounded"
                  />
                </div>
                <div className="relative flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-hidden">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-emerald-950/80 text-xs font-mono font-bold text-emerald-400">
                    Compressed
                  </span>
                  <img
                    src={item.compressedUrl || item.originalUrl}
                    alt="Compressed"
                    className="max-h-[45vh] object-contain rounded"
                  />
                </div>
              </div>
            )
          ) : (
            /* VIDEO COMPARISON (SYNCHRONIZED DUAL VIDEO PLAYER) */
            <div className="w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[45vh]">
                <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-slate-950/80 text-xs font-mono font-bold text-slate-300">
                    Original Video
                  </span>
                  <video
                    ref={videoRefOrig}
                    src={item.originalUrl}
                    muted={isMuted}
                    onTimeUpdate={() => {
                      if (videoRefOrig.current) setVideoTime(videoRefOrig.current.currentTime);
                    }}
                    className="max-h-[40vh] w-full object-contain"
                  />
                </div>

                <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-emerald-950/80 text-xs font-mono font-bold text-emerald-400">
                    Compressed Video ({item.settings.quality}%)
                  </span>
                  <video
                    ref={videoRefComp}
                    src={item.compressedUrl || item.originalUrl}
                    muted={isMuted}
                    className="max-h-[40vh] w-full object-contain"
                  />
                </div>
              </div>

              {/* Synchronized Video Playback Controls */}
              <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <button
                  onClick={toggleVideoPlay}
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max={item.duration || 100}
                  step="0.1"
                  value={videoTime}
                  onChange={handleVideoSeek}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            {item.type === 'image' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCropEditor(item);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Crop className="w-3.5 h-3.5 text-violet-400" />
                <span>Adjust Aspect Ratio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSaveToCloud(item)}
              disabled={item.savedToCloud}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                item.savedToCloud
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Cloud className="w-4 h-4 text-indigo-400" />
              <span>{item.savedToCloud ? 'Saved in Vault' : 'Save to Cloud Vault'}</span>
            </button>

            {item.status === 'completed' && (
              <button
                onClick={() => onDownload(item)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Reduced File</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
