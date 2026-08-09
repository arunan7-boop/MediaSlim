import React from 'react';
import { Sliders, Maximize2, Crop, FileType, Check, RotateCcw, Video, Sparkles } from 'lucide-react';
import { AspectRatioPreset, CompressionSettings, OutputFormat, ResolutionPreset } from '../types';

interface CompressionControlsProps {
  settings: CompressionSettings;
  onChangeSettings: (newSettings: CompressionSettings) => void;
  onApplyToAll: () => void;
  queueHasImages: boolean;
  queueHasVideos: boolean;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  settings,
  onChangeSettings,
  onApplyToAll,
  queueHasImages,
  queueHasVideos
}) => {
  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSettings({ ...settings, quality: parseInt(e.target.value, 10) });
  };

  const setQualityPreset = (val: number) => {
    onChangeSettings({ ...settings, quality: val });
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeSettings({ ...settings, resolution: e.target.value as ResolutionPreset });
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeSettings({ ...settings, aspectRatio: e.target.value as AspectRatioPreset });
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeSettings({ ...settings, outputFormat: e.target.value as OutputFormat });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Compression & Output Settings</h2>
            <p className="text-xs text-slate-400">Configure global output settings for batch processing</p>
          </div>
        </div>

        <button
          onClick={onApplyToAll}
          id="apply-all-settings-btn"
          className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-medium transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Settings to All Items</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Quality Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Quality</span>
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {settings.quality}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={settings.quality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            id="quality-slider"
          />

          {/* Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setQualityPreset(45)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                settings.quality <= 50
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Max Size Savings
            </button>
            <button
              type="button"
              onClick={() => setQualityPreset(75)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                settings.quality > 50 && settings.quality <= 80
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Balanced (75%)
            </button>
            <button
              type="button"
              onClick={() => setQualityPreset(90)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                settings.quality > 80
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              High Quality
            </button>
          </div>
        </div>

        {/* 2. Target Resolution */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Resolution</span>
          </label>

          <select
            value={settings.resolution}
            onChange={handleResolutionChange}
            id="resolution-preset-select"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="original">Original Dimensions (100%)</option>
            <option value="scale-75">Scale down to 75%</option>
            <option value="scale-50">Scale down to 50%</option>
            <option value="scale-25">Scale down to 25%</option>
            <option value="4k">4K Ultra HD (3840px max)</option>
            <option value="1080p">1080p Full HD (1920px max)</option>
            <option value="720p">720p HD (1280px max)</option>
            <option value="480p">480p SD (854px max)</option>
            <option value="custom">Custom Dimensions (W x H)</option>
          </select>

          {settings.resolution === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Width (px)</span>
                <input
                  type="number"
                  placeholder="Width"
                  value={settings.customWidth || ''}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      customWidth: parseInt(e.target.value, 10) || undefined
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Height (px)</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={settings.customHeight || ''}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      customHeight: parseInt(e.target.value, 10) || undefined
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Image Aspect Ratio Control */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-violet-400" />
              <span>Aspect Ratio (Images)</span>
            </span>
            <span className="text-[10px] text-slate-500">Crop Frame</span>
          </label>

          <select
            value={settings.aspectRatio}
            onChange={handleAspectRatioChange}
            id="aspect-ratio-select"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="original">Original Aspect Ratio</option>
            <option value="1:1">1:1 Square (Instagram/Avatar)</option>
            <option value="16:9">16:9 Widescreen (YouTube/Monitor)</option>
            <option value="4:3">4:3 Standard Photo</option>
            <option value="3:2">3:2 DSLR Classic</option>
            <option value="9:16">9:16 Story / TikTok / Reel</option>
            <option value="21:9">21:9 Ultrawide Cinema</option>
            <option value="custom">Custom Ratio (e.g., 5:4)</option>
          </select>

          {settings.aspectRatio === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="number"
                placeholder="Ratio W (e.g. 5)"
                value={settings.customRatioWidth || ''}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    customRatioWidth: parseFloat(e.target.value) || undefined
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
              />
              <input
                type="number"
                placeholder="Ratio H (e.g. 4)"
                value={settings.customRatioHeight || ''}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    customRatioHeight: parseFloat(e.target.value) || undefined
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
              />
            </div>
          )}
        </div>

        {/* 4. Output Format Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileType className="w-3.5 h-3.5 text-emerald-400" />
            <span>Output Format</span>
          </label>

          <select
            value={settings.outputFormat}
            onChange={handleFormatChange}
            id="output-format-select"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <optgroup label="Image Formats">
              <option value="webp">WebP (Best Size Savings & Quality)</option>
              <option value="jpeg">JPEG (Standard Universal)</option>
              <option value="png">PNG (Lossless / Alpha)</option>
              <option value="avif">AVIF (Next-Gen High Efficiency)</option>
            </optgroup>
            <optgroup label="Video Formats">
              <option value="webm">WebM (Optimal Web Video)</option>
              <option value="mp4">MP4 (H.264 Universal Video)</option>
            </optgroup>
          </select>

          {/* FPS Video option if video present */}
          {queueHasVideos && (
            <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Video className="w-3 h-3 text-violet-400" />
                Frame Rate:
              </span>
              <select
                value={settings.videoFps || 30}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    videoFps: parseInt(e.target.value, 10)
                  })
                }
                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
              >
                <option value={60}>60 FPS</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={24}>24 FPS (Cinematic)</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
