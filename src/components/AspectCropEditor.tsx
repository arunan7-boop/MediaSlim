import React, { useState, useRef, useEffect } from 'react';
import { Crop, Check, RotateCcw, X, Move } from 'lucide-react';
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
      heightPct = 80;
      const targetWidthPx = (originalHeight * 0.8) * targetRatio;
      widthPct = Math.min(100, (targetWidthPx / originalWidth) * 100);
    } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manual Aspect Ratio & Crop Adjuster</h3>
              <p className="text-xs text-slate-500 font-medium">Position and resize crop frame for custom image aspect ratio</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold whitespace-nowrap mr-1">Presets:</span>
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
              className={`px-3 py-1.5 rounded-xl border font-bold whitespace-nowrap transition-all ${
                aspect === item.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 bg-white border border-slate-200 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Interactive Crop Frame Canvas */}
        <div className="relative flex-1 p-6 bg-slate-100 flex items-center justify-center overflow-hidden min-h-[320px]">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative max-w-full max-h-[50vh] select-none rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white"
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
              className="absolute border-2 border-slate-900 bg-slate-900/10 cursor-move shadow-2xl group transition-shadow"
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-slate-900" />
                <div className="border-r border-b border-slate-900" />
                <div className="border-b border-slate-900" />
                <div className="border-r border-b border-slate-900" />
                <div className="border-r border-b border-slate-900" />
                <div className="border-b border-slate-900" />
                <div className="border-r border-slate-900" />
                <div className="border-r border-slate-900" />
                <div />
              </div>

              {/* Move Badge Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900 text-white shadow-md pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4 animate-pulse" />
              </div>

              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-slate-900 border border-white rounded-full" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-slate-900 border border-white rounded-full" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-slate-900 border border-white rounded-full" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-slate-900 border border-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-xs text-slate-500 font-mono font-bold">
            Crop Target: <strong className="text-slate-900">{calculatedWidthPx} × {calculatedHeightPx} px</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveCrop(crop.width === 100 && crop.height === 100 ? undefined : crop, aspect)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-all"
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
