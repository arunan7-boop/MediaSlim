import React, { useState, useRef, useEffect } from 'react';
import { Crop, Check, RotateCcw, X, Grid, Move } from 'lucide-react';
import { AspectRatioPreset, CropRect } from '../types';
import { parseAspectRatio } from '../utils/formatters';

interface AspectCropEditorProps {
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  currentAspectRatio: AspectRatioPreset;
  initialCropRect?: CropRect;
  onSaveCrop: (cropRect: CropRect | undefined, aspectRatio: AspectRatioPreset) => void;
  onCancel: () => void;
}

export const AspectCropEditor: React.FC<AspectCropEditorProps> = ({
  imageUrl,
  originalWidth,
  originalHeight,
  currentAspectRatio,
  initialCropRect,
  onSaveCrop,
  onCancel
}) => {
  const [aspect, setAspect] = useState<AspectRatioPreset>(currentAspectRatio);
  const [crop, setCrop] = useState<CropRect>(
    initialCropRect || { x: 10, y: 10, width: 80, height: 80 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Recalculate default crop frame whenever aspect ratio selection changes
  useEffect(() => {
    const targetRatio = parseAspectRatio(aspect);
    if (!targetRatio || targetRatio <= 0) {
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
      return;
    }

    const currentAspect = originalWidth / originalHeight;
    let widthPct = 80;
    let heightPct = 80;

    if (currentAspect > targetRatio) {
      // Image is wider than crop aspect -> height stays 80%, calculate width
      heightPct = 80;
      const targetWidthPx = (originalHeight * 0.8) * targetRatio;
      widthPct = Math.min(100, (targetWidthPx / originalWidth) * 100);
    } else {
      // Image is taller than crop aspect -> width stays 80%, calculate height
      widthPct = 80;
      const targetHeightPx = (originalWidth * 0.8) / targetRatio;
      heightPct = Math.min(100, (targetHeightPx / originalHeight) * 100);
    }

    const xPct = (100 - widthPct) / 2;
    const yPct = (100 - heightPct) / 2;

    setCrop({
      x: Math.round(xPct),
      y: Math.round(yPct),
      width: Math.round(widthPct),
      height: Math.round(heightPct)
    });
  }, [aspect, originalWidth, originalHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragStart.y) / rect.height) * 100;

    setDragStart({ x: e.clientX, y: e.clientY });

    setCrop((prev) => {
      let newX = prev.x + deltaXPct;
      let newY = prev.y + deltaYPct;

      newX = Math.max(0, Math.min(100 - prev.width, newX));
      newY = Math.max(0, Math.min(100 - prev.height, newY));

      return { ...prev, x: newX, y: newY };
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setAspect('original');
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  const calculatedWidthPx = Math.round((crop.width / 100) * originalWidth);
  const calculatedHeightPx = Math.round((crop.height / 100) * originalHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Manual Aspect Ratio & Crop Adjuster</h3>
              <p className="text-xs text-slate-400">Position and resize the crop frame for custom image aspect ratios</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Presets:</span>
          {[
            { id: 'original', label: 'Original' },
            { id: '1:1', label: '1:1 Square' },
            { id: '16:9', label: '16:9 Widescreen' },
            { id: '4:3', label: '4:3 Standard' },
            { id: '3:2', label: '3:2 Photo' },
            { id: '9:16', label: '9:16 Story/Reel' },
            { id: '21:9', label: '21:9 Ultrawide' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAspect(item.id as AspectRatioPreset)}
              className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all ${
                aspect === item.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Interactive Crop Frame Canvas */}
        <div className="relative flex-1 p-6 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[320px]">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative max-w-full max-h-[50vh] select-none rounded-lg overflow-hidden border border-slate-800 shadow-2xl"
          >
            <img
              src={imageUrl}
              alt="Crop source"
              className="max-h-[50vh] w-auto object-contain pointer-events-none opacity-40"
            />

            {/* Crop Overlay Box */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`
              }}
              className="absolute border-2 border-indigo-400 bg-indigo-500/10 cursor-move shadow-2xl group transition-shadow"
            >
              {/* Grid 3x3 Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-r border-b border-indigo-300/40" />
                <div className="border-b border-indigo-300/40" />
                <div className="border-r border-indigo-300/40" />
                <div className="border-r border-indigo-300/40" />
                <div />
              </div>

              {/* Move Badge Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600/90 text-white shadow-lg pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4 animate-pulse" />
              </div>

              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-indigo-400 border border-white rounded-full" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-400 border border-white rounded-full" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-indigo-400 border border-white rounded-full" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-400 border border-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400 font-mono">
            Crop Area: <strong className="text-white">{calculatedWidthPx} × {calculatedHeightPx} px</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveCrop(crop.width === 100 && crop.height === 100 ? undefined : crop, aspect)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Aspect Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
