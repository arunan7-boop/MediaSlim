import React, { useState } from 'react';
import { Sliders, Maximize2, Crop, FileType, Check, Video, Sparkles, Brain, Loader2, Info, Trash2, ShieldCheck, Eraser } from 'lucide-react';
import { AspectRatioPreset, CompressionSettings, MediaItem, OutputFormat, ResolutionPreset } from '../types';

interface CompressionControlsProps {
  settings: CompressionSettings;
  onChangeSettings: (newSettings: CompressionSettings) => void;
  onApplyToAll: () => void;
  queueHasImages: boolean;
  queueHasVideos: boolean;
  sampleItem?: MediaItem | null;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  settings,
  onChangeSettings,
  onApplyToAll,
  queueHasImages,
  queueHasVideos,
  sampleItem
}) => {
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handleToggleSmartAi = () => {
    const nextState = !settings.smartAiEnabled;
    onChangeSettings({ ...settings, smartAiEnabled: nextState });

    if (nextState && sampleItem && sampleItem.type === 'image') {
      runAiAnalysis(sampleItem);
    }
  };

  const handleToggleAutoCleanup = () => {
    onChangeSettings({ ...settings, autoCleanup: !settings.autoCleanup });
  };

  const runAiAnalysis = async (itemToAnalyze: MediaItem) => {
    if (itemToAnalyze.type !== 'image') {
      setAiError('Smart AI Compression analysis requires an image file.');
      return;
    }

    setIsAnalyzingAi(true);
    setAiError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(itemToAnalyze.file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/analyze-compression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: itemToAnalyze.file.type,
            fileName: itemToAnalyze.name,
            fileSize: itemToAnalyze.originalSize,
            width: itemToAnalyze.originalWidth,
            height: itemToAnalyze.originalHeight
          })
        });

        const data = await res.json();
        if (data.success && data.analysis) {
          const { suggestedQuality, suggestedFormat, complexityLevel, reasoning } = data.analysis;
          onChangeSettings({
            ...settings,
            quality: suggestedQuality || settings.quality,
            outputFormat: (suggestedFormat as OutputFormat) || settings.outputFormat,
            smartAiEnabled: true,
            aiSuggestedQuality: suggestedQuality,
            aiComplexityLevel: complexityLevel,
            aiReasoning: reasoning
          });
        } else {
          setAiError(data.error || 'Failed to analyze image with AI');
        }
        setIsAnalyzingAi(false);
      };
      reader.onerror = () => {
        setAiError('Failed to read image file');
        setIsAnalyzingAi(false);
      };
    } catch (err: any) {
      console.error(err);
      setAiError('AI Analysis request failed');
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Compression & Target Settings</h2>
            <p className="text-xs text-slate-500 font-medium">Customize quality, scale resolution, and AI settings</p>
          </div>
        </div>

        {/* Smart AI Toggle, Auto-cleanup Toggle & Apply Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Smart AI Compression Toggle Button */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Brain className={`w-4 h-4 ${settings.smartAiEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Smart AI Compression</span>
            </div>

            <button
              type="button"
              onClick={handleToggleSmartAi}
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex items-center p-0.5 ${
                settings.smartAiEnabled ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${
                  settings.smartAiEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto-cleanup Toggle Button */}
          <div
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-colors ${
              settings.autoCleanup
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
            title="Automatically clear completed items from queue after download or cloud sync"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Eraser className={`w-4 h-4 ${settings.autoCleanup ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Auto-cleanup</span>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoCleanup}
              id="auto-cleanup-toggle"
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex items-center p-0.5 ${
                settings.autoCleanup ? 'bg-rose-600' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${
                  settings.autoCleanup ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={onApplyToAll}
            id="apply-all-settings-btn"
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 text-slate-900" />
            <span>Apply to All Files</span>
          </button>
        </div>
      </div>

      {/* Auto-cleanup Information Banner if Active */}
      {settings.autoCleanup && (
        <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-900 font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <Eraser className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Auto-cleanup Active:</strong> Completed items will automatically be cleared from the processing queue once downloaded or saved to Cloud Vault.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleAutoCleanup}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex-shrink-0"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Smart AI Analysis Recommendation Panel if Toggle Enabled */}
      {settings.smartAiEnabled && (
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Gemini AI Engine</span>
              </span>
              {settings.aiSuggestedQuality && (
                <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Suggested Quality: {settings.aiSuggestedQuality}% ({settings.aiComplexityLevel || 'Analyzed'})
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isAnalyzingAi || !sampleItem}
              onClick={() => sampleItem && runAiAnalysis(sampleItem)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Image Complexity...</span>
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  <span>{sampleItem ? `Analyze "${sampleItem.name}"` : 'Upload image to analyze'}</span>
                </>
              )}
            </button>
          </div>

          {settings.aiReasoning && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed pl-1">
              <strong className="text-slate-900">AI Recommendation:</strong> {settings.aiReasoning}
            </p>
          )}

          {aiError && <p className="text-xs text-rose-600 font-semibold">{aiError}</p>}
        </div>
      )}

      {/* Grid Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Target Quality */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Target Quality
            </label>
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
            className="w-full accent-slate-900 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
            id="quality-slider"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setQualityPreset(50)}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold border transition-colors ${
                settings.quality <= 55
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Max Savings
            </button>
            <button
              type="button"
              onClick={() => setQualityPreset(75)}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold border transition-colors ${
                settings.quality > 55 && settings.quality <= 82
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Balanced 75%
            </button>
            <button
              type="button"
              onClick={() => setQualityPreset(90)}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold border transition-colors ${
                settings.quality > 82
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              High Quality
            </button>
          </div>
        </div>

        {/* 2. Target Resolution */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Target Resolution
          </label>

          <select
            value={settings.resolution}
            onChange={handleResolutionChange}
            id="resolution-preset-select"
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
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
              <input
                type="number"
                placeholder="Width (px)"
                value={settings.customWidth || ''}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    customWidth: parseInt(e.target.value, 10) || undefined
                  })
                }
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
              />
              <input
                type="number"
                placeholder="Height (px)"
                value={settings.customHeight || ''}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    customHeight: parseInt(e.target.value, 10) || undefined
                  })
                }
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
              />
            </div>
          )}
        </div>

        {/* 3. Aspect Ratio */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Aspect Ratio
          </label>

          <select
            value={settings.aspectRatio}
            onChange={handleAspectRatioChange}
            id="aspect-ratio-select"
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
          >
            <option value="original">Original Ratio</option>
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Widescreen</option>
            <option value="4:3">4:3 Standard</option>
            <option value="3:2">3:2 DSLR Classic</option>
            <option value="9:16">9:16 Vertical Story</option>
            <option value="21:9">21:9 Cinema</option>
          </select>
        </div>

        {/* 4. Output Format */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Output Format
          </label>

          <select
            value={settings.outputFormat}
            onChange={handleFormatChange}
            id="output-format-select"
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
          >
            <optgroup label="Image Formats">
              <option value="webp">WebP (Best Size Savings & Quality)</option>
              <option value="jpeg">JPEG (Standard Universal)</option>
              <option value="png">PNG (Lossless / Transparency)</option>
              <option value="avif">AVIF (Next-Gen High Efficiency)</option>
            </optgroup>
            <optgroup label="Video Formats">
              <option value="webm">WebM (Optimal Web Video)</option>
              <option value="mp4">MP4 (H.264 Universal Video)</option>
            </optgroup>
          </select>

          {queueHasVideos && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold pt-1">
              <span>Video FPS:</span>
              <select
                value={settings.videoFps || 30}
                onChange={(e) =>
                  onChangeSettings({ ...settings, videoFps: parseInt(e.target.value, 10) })
                }
                className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 font-bold"
              >
                <option value={60}>60 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={24}>24 FPS</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
