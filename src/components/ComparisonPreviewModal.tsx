import React, { useState, useRef } from 'react';
import {
  X,
  Sliders,
  Columns,
  Play,
  Pause,
  Crop,
  Download,
  Cloud,
  Sparkles,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {item.name}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Side-by-Side Quality & Visual Inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {item.type === 'image' && (
              <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-colors ${
                    viewMode === 'split' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-colors ${
                    viewMode === 'sideBySide' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Grid Side-by-Side</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Detailed Stats Comparison Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Original Size</span>
            <span className="text-slate-900 font-bold">{formatBytes(item.originalSize)}</span>
            <span className="text-[11px] text-slate-500 block">{item.originalWidth}×{item.originalHeight}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Compressed Size</span>
            <span className="text-green-700 font-bold">
              {item.compressedSize ? formatBytes(item.compressedSize) : 'Processing...'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {item.compressedWidth || item.originalWidth}×{item.compressedHeight || item.originalHeight}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Size Reduction</span>
            <span className="text-green-700 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{savings.formattedSaved}</span>
            </span>
            <span className="text-[11px] text-slate-500 block">Saved {formatBytes(savings.bytesSaved)}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Format</span>
            <span className="text-slate-900 font-bold uppercase">{item.settings.outputFormat}</span>
            <span className="text-[11px] text-slate-500 block">
              {item.processingTimeMs ? `${item.processingTimeMs} ms` : 'Ready'}
            </span>
          </div>
        </div>

        {/* Comparison Viewer Stage */}
        <div className="relative flex-1 bg-slate-100 p-4 md:p-6 flex items-center justify-center overflow-hidden min-h-[360px]">
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
                className="relative max-w-full max-h-[55vh] select-none rounded-2xl overflow-hidden border border-slate-200 shadow-lg cursor-ew-resize bg-white"
              >
                {/* Original Image */}
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="max-h-[55vh] w-auto object-contain block"
                />

                {/* Compressed Output Image */}
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
                  className="absolute top-0 bottom-0 w-1 bg-slate-900 shadow-md -translate-x-1/2 pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <Sliders className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Badges */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-xs font-mono font-bold text-slate-900 shadow-2xs">
                  Original
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-mono font-bold shadow-2xs">
                  Compressed ({item.settings.quality}%)
                </span>
              </div>
            ) : (
              /* SIDE-BY-SIDE GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-h-[55vh]">
                <div className="relative flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-3 overflow-hidden shadow-2xs">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-slate-900 text-xs font-mono font-bold text-white">
                    Original
                  </span>
                  <img
                    src={item.originalUrl}
                    alt="Original"
                    className="max-h-[45vh] object-contain rounded-xl"
                  />
                </div>
                <div className="relative flex flex-col items-center justify-center bg-white border-2 border-slate-900 rounded-2xl p-3 overflow-hidden shadow-xs">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-green-500 text-xs font-mono font-bold text-white">
                    Compressed
                  </span>
                  <img
                    src={item.compressedUrl || item.originalUrl}
                    alt="Compressed"
                    className="max-h-[45vh] object-contain rounded-xl"
                  />
                </div>
              </div>
            )
          ) : (
            /* VIDEO COMPARISON */
            <div className="w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[45vh]">
                <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xs">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-slate-900 text-xs font-mono font-bold text-white">
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

                <div className="relative bg-white border-2 border-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-xs">
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-green-500 text-xs font-mono font-bold text-white">
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
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  onClick={toggleVideoPlay}
                  className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
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
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            {item.type === 'image' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCropEditor(item);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <Crop className="w-3.5 h-3.5 text-slate-700" />
                <span>Adjust Aspect Ratio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSaveToCloud(item)}
              disabled={item.savedToCloud}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                item.savedToCloud
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
              }`}
            >
              <Cloud className="w-4 h-4 text-slate-700" />
              <span>{item.savedToCloud ? 'Saved in Vault' : 'Save to Cloud Vault'}</span>
            </button>

            {item.status === 'completed' && (
              <button
                onClick={() => onDownload(item)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-xs transition-all"
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
