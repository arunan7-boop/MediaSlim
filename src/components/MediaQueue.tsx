import React, { useState } from 'react';
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
  Video as VideoIcon,
  Sparkles,
  ArrowRight,
  Edit3,
  Hash,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Type,
  Film,
  FileCode,
  FileImage,
  Layers,
  Zap,
  Image as ImageIcon,
  Clapperboard,
  FileType,
  Filter
} from 'lucide-react';
import { MediaItem, OutputFormat, RenamePatternSettings } from '../types';
import { calculateSavings, formatBytes } from '../utils/formatters';
import {
  computeFormattedFilename,
  DEFAULT_RENAME_PATTERN,
  getOriginalBaseName
} from '../utils/renameUtils';

interface FormatConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  pillClass: string;
  iconColor: string;
}

export function getFormatConfig(item: MediaItem): FormatConfig {
  const origExt = item.name.split('.').pop()?.toLowerCase() || '';
  const format = (
    item.type === 'video'
      ? item.settings.outputFormat || origExt || 'video'
      : origExt === 'svg'
      ? 'svg'
      : item.settings.outputFormat || origExt || 'image'
  ).toLowerCase();

  switch (format) {
    case 'svg':
      return {
        label: 'SVG Vector',
        icon: FileCode,
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
        pillClass: 'bg-purple-600 text-white',
        iconColor: 'text-purple-600'
      };
    case 'webp':
      return {
        label: 'WEBP',
        icon: Sparkles,
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        pillClass: 'bg-emerald-600 text-white',
        iconColor: 'text-emerald-600'
      };
    case 'png':
      return {
        label: 'PNG',
        icon: Layers,
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        pillClass: 'bg-indigo-600 text-white',
        iconColor: 'text-indigo-600'
      };
    case 'jpg':
    case 'jpeg':
      return {
        label: 'JPG',
        icon: ImageIcon,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
        pillClass: 'bg-amber-600 text-white',
        iconColor: 'text-amber-600'
      };
    case 'avif':
      return {
        label: 'AVIF',
        icon: Zap,
        badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-200',
        pillClass: 'bg-cyan-600 text-white',
        iconColor: 'text-cyan-600'
      };
    case 'gif':
      return {
        label: 'GIF',
        icon: FileImage,
        badgeClass: 'bg-pink-100 text-pink-900 border-pink-200',
        pillClass: 'bg-pink-600 text-white',
        iconColor: 'text-pink-600'
      };
    case 'mp4':
      return {
        label: 'MP4 Film',
        icon: Film,
        badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
        pillClass: 'bg-rose-600 text-white',
        iconColor: 'text-rose-600'
      };
    case 'webm':
      return {
        label: 'WEBM Film',
        icon: Film,
        badgeClass: 'bg-violet-100 text-violet-900 border-violet-200',
        pillClass: 'bg-violet-600 text-white',
        iconColor: 'text-violet-600'
      };
    case 'mov':
    case 'avi':
    case 'mkv':
      return {
        label: format.toUpperCase(),
        icon: Clapperboard,
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
        pillClass: 'bg-blue-600 text-white',
        iconColor: 'text-blue-600'
      };
    default:
      if (item.type === 'video') {
        return {
          label: 'VIDEO',
          icon: Film,
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
          pillClass: 'bg-rose-600 text-white',
          iconColor: 'text-rose-600'
        };
      }
      return {
        label: format.toUpperCase(),
        icon: FileImage,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
        pillClass: 'bg-slate-700 text-white',
        iconColor: 'text-slate-600'
      };
  }
}

interface MediaQueueProps {
  items: MediaItem[];
  onProcessItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onOpenPreview: (item: MediaItem) => void;
  onOpenCropEditor: (item: MediaItem) => void;
  onSaveItemToCloud: (item: MediaItem) => void;
  onDownloadItem: (item: MediaItem) => void;
  onUpdateItemName?: (id: string, newName: string | undefined) => void;
  onApplyBulkRename?: (pattern: RenamePatternSettings) => void;
  onResetAllNames?: () => void;
  onConvertItemFormats?: (itemIds: string[], targetFormat: OutputFormat, autoProcess?: boolean) => void;
  onRemoveMultipleItems?: (itemIds: string[]) => void;
  onProcessMultipleItems?: (itemIds: string[]) => void;
}

export const MediaQueue: React.FC<MediaQueueProps> = ({
  items,
  onProcessItem,
  onRemoveItem,
  onOpenPreview,
  onOpenCropEditor,
  onSaveItemToCloud,
  onDownloadItem,
  onUpdateItemName,
  onApplyBulkRename,
  onResetAllNames,
  onConvertItemFormats,
  onRemoveMultipleItems,
  onProcessMultipleItems
}) => {
  const [isRenamePanelOpen, setIsRenamePanelOpen] = useState<boolean>(false);
  const [isConvertPanelOpen, setIsConvertPanelOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTargetFormat, setBatchTargetFormat] = useState<OutputFormat>('webp');
  const [autoProcessAfterConvert, setAutoProcessAfterConvert] = useState<boolean>(false);

  const [pattern, setPattern] = useState<RenamePatternSettings>(DEFAULT_RENAME_PATTERN);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  if (items.length === 0) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(items.map((i) => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSelectByFilter = (filterType: 'png' | 'jpg' | 'images' | 'videos' | 'webp') => {
    let matchedIds: string[] = [];
    if (filterType === 'png') {
      matchedIds = items
        .filter((i) => i.name.toLowerCase().endsWith('.png') || i.settings.outputFormat === 'png')
        .map((i) => i.id);
    } else if (filterType === 'jpg') {
      matchedIds = items
        .filter((i) =>
          i.name.toLowerCase().endsWith('.jpg') ||
          i.name.toLowerCase().endsWith('.jpeg') ||
          i.settings.outputFormat === 'jpeg'
        )
        .map((i) => i.id);
    } else if (filterType === 'webp') {
      matchedIds = items
        .filter((i) => i.name.toLowerCase().endsWith('.webp') || i.settings.outputFormat === 'webp')
        .map((i) => i.id);
    } else if (filterType === 'images') {
      matchedIds = items.filter((i) => i.type === 'image').map((i) => i.id);
    } else if (filterType === 'videos') {
      matchedIds = items.filter((i) => i.type === 'video').map((i) => i.id);
    }
    setSelectedIds(matchedIds);
  };

  const handleExecuteBatchConvert = () => {
    const idsToConvert = selectedIds.length > 0 ? selectedIds : items.map((i) => i.id);
    if (onConvertItemFormats && idsToConvert.length > 0) {
      onConvertItemFormats(idsToConvert, batchTargetFormat, autoProcessAfterConvert);
    }
  };

  const handleExecuteRemoveSelected = () => {
    if (selectedIds.length === 0) return;
    if (onRemoveMultipleItems) {
      onRemoveMultipleItems(selectedIds);
      setSelectedIds([]);
    } else {
      selectedIds.forEach((id) => onRemoveItem(id));
      setSelectedIds([]);
    }
  };

  const handleExecuteProcessSelected = () => {
    if (selectedIds.length === 0) return;
    if (onProcessMultipleItems) {
      onProcessMultipleItems(selectedIds);
    } else {
      selectedIds.forEach((id) => onProcessItem(id));
    }
  };

  const pngCount = items.filter(
    (i) => i.name.toLowerCase().endsWith('.png') || i.settings.outputFormat === 'png'
  ).length;
  const jpgCount = items.filter(
    (i) =>
      i.name.toLowerCase().endsWith('.jpg') ||
      i.name.toLowerCase().endsWith('.jpeg') ||
      i.settings.outputFormat === 'jpeg'
  ).length;
  const imageCount = items.filter((i) => i.type === 'image').length;
  const videoCount = items.filter((i) => i.type === 'video').length;

  const handleStartInlineEdit = (item: MediaItem, index: number) => {
    setEditingItemId(item.id);
    const currentFormatted = computeFormattedFilename(item, index, pattern);
    const ext = item.settings.outputFormat;
    const baseWithoutExt = currentFormatted.endsWith(`.${ext}`)
      ? currentFormatted.slice(0, -(ext.length + 1))
      : currentFormatted;
    setEditingNameValue(baseWithoutExt);
  };

  const handleSaveInlineEdit = (id: string) => {
    if (onUpdateItemName) {
      onUpdateItemName(id, editingNameValue.trim());
    }
    setEditingItemId(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingItemId(null);
  };

  const handleApplyPattern = () => {
    if (onApplyBulkRename) {
      onApplyBulkRename(pattern);
    }
  };

  const handleResetPattern = () => {
    setPattern(DEFAULT_RENAME_PATTERN);
    if (onResetAllNames) {
      onResetAllNames();
    }
  };

  // Sample preview using first item in queue
  const sampleItem = items[0];
  const sampleOutputName = sampleItem
    ? computeFormattedFilename(sampleItem, 0, pattern)
    : 'slim_sample.webp';

  return (
    <div className="w-full space-y-4">
      {/* Processing Queue Header with Action Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span>Processing Queue</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </span>
          {selectedIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-xs font-black border border-indigo-200">
              {selectedIds.length} selected
            </span>
          )}
        </h3>

        {/* Header Batch Tool Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch Convert Formats Button */}
          <button
            onClick={() => {
              setIsConvertPanelOpen(!isConvertPanelOpen);
              if (isRenamePanelOpen) setIsRenamePanelOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isConvertPanelOpen || selectedIds.length > 0
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <FileType className={`w-3.5 h-3.5 ${isConvertPanelOpen || selectedIds.length > 0 ? 'text-indigo-200' : 'text-indigo-600'}`} />
            <span>Batch Convert Formats</span>
            {selectedIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-indigo-700 text-[10px] font-black">
                {selectedIds.length}
              </span>
            )}
            {isConvertPanelOpen ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            )}
          </button>

          {/* Bulk Renaming Tool Toggle Button */}
          <button
            onClick={() => {
              setIsRenamePanelOpen(!isRenamePanelOpen);
              if (isConvertPanelOpen) setIsConvertPanelOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isRenamePanelOpen
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk Rename Pattern</span>
            {isRenamePanelOpen ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            )}
          </button>
        </div>
      </div>

      {/* Batch Format Converter Panel */}
      {(isConvertPanelOpen || selectedIds.length > 0) && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-xl space-y-4 animate-fadeIn">
          {/* Top Bar: Title & Select All / Deselect Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileType className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Group Format Converter
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-200 border border-indigo-700 text-[11px] font-bold">
                {selectedIds.length > 0 ? `${selectedIds.length} of ${items.length} selected` : 'All items in queue'}
              </span>
            </div>

            {/* Selection Quick Filter Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
              <span className="text-slate-400 mr-1 flex items-center gap-1 font-sans">
                <Filter className="w-3 h-3 text-indigo-400" />
                Select:
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className={`px-2 py-0.5 rounded font-bold border transition-colors ${
                  selectedIds.length === items.length
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                All ({items.length})
              </button>
              {pngCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectByFilter('png')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold"
                >
                  PNGs ({pngCount})
                </button>
              )}
              {jpgCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectByFilter('jpg')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold"
                >
                  JPEGs ({jpgCount})
                </button>
              )}
              {imageCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectByFilter('images')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold"
                >
                  Images ({imageCount})
                </button>
              )}
              {videoCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectByFilter('videos')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold"
                >
                  Videos ({videoCount})
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold ml-1"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Target Format Options */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select Target Format for Selected Group:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {/* WEBP */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('webp')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'webp'
                    ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400">WEBP</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Best Compression</div>
              </button>

              {/* PNG */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('png')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'png'
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400">PNG</span>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Lossless Quality</div>
              </button>

              {/* JPEG */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('jpeg')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'jpeg'
                    ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400">JPEG</span>
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Universal standard</div>
              </button>

              {/* AVIF */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('avif')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'avif'
                    ? 'bg-cyan-950/80 border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400">AVIF</span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Next-Gen Codec</div>
              </button>

              {/* WEBM */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('webm')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'webm'
                    ? 'bg-violet-950/80 border-violet-500 ring-2 ring-violet-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-400">WEBM</span>
                  <Film className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Web Video</div>
              </button>

              {/* MP4 */}
              <button
                type="button"
                onClick={() => setBatchTargetFormat('mp4')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  batchTargetFormat === 'mp4'
                    ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400">MP4</span>
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">H.264 Video</div>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={autoProcessAfterConvert}
                onChange={(e) => setAutoProcessAfterConvert(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
              />
              <span>Automatically compress/re-process immediately after conversion</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleExecuteRemoveSelected}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Selected ({selectedIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteProcessSelected}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    <span>Reduce Size ({selectedIds.length})</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleExecuteBatchConvert}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all"
              >
                <FileType className="w-4 h-4" />
                <span>
                  Convert {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'All Queue Files'} to {batchTargetFormat.toUpperCase()}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Bulk Renaming Controls Panel */}
      {isRenamePanelOpen && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Bulk File Naming Rules
              </h4>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-400">Presets:</span>
              <button
                onClick={() =>
                  setPattern({
                    prefix: 'slim_',
                    useOriginalName: true,
                    customBaseName: 'media',
                    suffix: '',
                    enableSequential: false,
                    startIndex: 1,
                    numberPadding: 3,
                    caseOption: 'preserve'
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold"
              >
                Default
              </button>
              <button
                onClick={() =>
                  setPattern({
                    prefix: 'photo_',
                    useOriginalName: false,
                    customBaseName: 'compressed',
                    suffix: '',
                    enableSequential: true,
                    startIndex: 1,
                    numberPadding: 3,
                    caseOption: 'lowercase'
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold"
              >
                Sequential (001)
              </button>
              <button
                onClick={() =>
                  setPattern({
                    prefix: 'optimized_',
                    useOriginalName: true,
                    customBaseName: 'asset',
                    suffix: '_web',
                    enableSequential: false,
                    startIndex: 1,
                    numberPadding: 2,
                    caseOption: 'lowercase'
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold"
              >
                Clean Web
              </button>
            </div>
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Prefix */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Prefix</label>
              <input
                type="text"
                value={pattern.prefix}
                onChange={(e) => setPattern({ ...pattern, prefix: e.target.value })}
                placeholder="e.g. compressed_"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Base Name Mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Filename Base</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPattern({ ...pattern, useOriginalName: true })}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold truncate ${
                    pattern.useOriginalName
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setPattern({ ...pattern, useOriginalName: false })}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold truncate ${
                    !pattern.useOriginalName
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Custom
                </button>
              </div>
              {!pattern.useOriginalName && (
                <input
                  type="text"
                  value={pattern.customBaseName}
                  onChange={(e) => setPattern({ ...pattern, customBaseName: e.target.value })}
                  placeholder="e.g. photo"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            {/* Sequential Indexing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-amber-400" />
                  <span>Numbering</span>
                </label>
                <input
                  type="checkbox"
                  checked={pattern.enableSequential}
                  onChange={(e) => setPattern({ ...pattern, enableSequential: e.target.checked })}
                  className="rounded border-slate-700 text-amber-400 accent-amber-400 cursor-pointer"
                />
              </div>

              {pattern.enableSequential ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={0}
                    value={pattern.startIndex}
                    onChange={(e) =>
                      setPattern({ ...pattern, startIndex: parseInt(e.target.value) || 1 })
                    }
                    title="Start Index"
                    className="w-16 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white text-center font-mono focus:outline-none focus:border-amber-400"
                  />
                  <select
                    value={pattern.numberPadding}
                    onChange={(e) =>
                      setPattern({ ...pattern, numberPadding: parseInt(e.target.value) || 1 })
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white font-mono focus:outline-none focus:border-amber-400"
                  >
                    <option value={1}>1 (e.g. 1)</option>
                    <option value={2}>2 (e.g. 01)</option>
                    <option value={3}>3 (e.g. 001)</option>
                    <option value={4}>4 (e.g. 0001)</option>
                  </select>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 pt-1">Sequential numbering off</p>
              )}
            </div>

            {/* Suffix & Case */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Suffix & Case</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pattern.suffix}
                  onChange={(e) => setPattern({ ...pattern, suffix: e.target.value })}
                  placeholder="e.g. _web"
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <select
                  value={pattern.caseOption}
                  onChange={(e) =>
                    setPattern({
                      ...pattern,
                      caseOption: e.target.value as 'preserve' | 'lowercase' | 'uppercase'
                    })
                  }
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  <option value="preserve">Preserve</option>
                  <option value="lowercase">lowercase</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300 overflow-x-auto max-w-full">
              <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                Pattern Preview:
              </span>
              <span className="text-slate-400 line-through truncate max-w-[150px]">
                {sampleItem ? sampleItem.name : 'input.jpg'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-amber-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[240px]">
                {sampleOutputName}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleResetPattern}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleApplyPattern}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-xs transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Rename Pattern to Queue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Items List */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const savings = calculateSavings(item.originalSize, item.compressedSize || 0);
          const isCompleted = item.status === 'completed';
          const isProcessing = item.status === 'processing' || item.status === 'uploading';
          const isError = item.status === 'error';
          const isSelected = selectedIds.includes(item.id);

          const formattedOutputName = computeFormattedFilename(item, index, pattern);
          const fmt = getFormatConfig(item);
          const FormatIcon = fmt.icon;

          return (
            <div
              key={item.id}
              className={`relative group bg-white border rounded-2xl p-4 transition-all duration-200 overflow-hidden shadow-2xs ${
                isSelected
                  ? 'border-indigo-500/80 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                  : isCompleted
                  ? 'border-green-500/80 bg-green-50/20'
                  : isProcessing
                  ? 'border-slate-900 bg-slate-50/50'
                  : isError
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: Checkbox, Thumbnail & Main Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(item.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-300 text-transparent hover:border-indigo-400'
                    }`}
                    title={isSelected ? 'Deselect item' : 'Select item for batch format conversion'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Media Thumbnail Preview */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center group/thumb">
                    {item.type === 'image' ? (
                      <img
                        src={item.compressedUrl || item.originalUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                        <video
                          src={item.originalUrl}
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                          <Film className="w-6 h-6 text-rose-400 drop-shadow-md" />
                        </div>
                      </div>
                    )}

                    <span
                      className={`absolute bottom-0.5 right-0.5 flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold shadow-xs ${fmt.pillClass}`}
                    >
                      <FormatIcon className="w-2.5 h-2.5" />
                      <span>{fmt.label.replace(' Vector', '').replace(' Film', '')}</span>
                    </span>
                  </div>

                  {/* File Metadata & Naming */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Original Name & Color-Coded Format Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-500 truncate max-w-[160px] sm:max-w-[200px] md:max-w-xs">
                        {item.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-2xs ${fmt.badgeClass}`}
                        title={`File format: ${fmt.label}`}
                      >
                        <FormatIcon className={`w-3 h-3 ${fmt.iconColor}`} />
                        <span>{fmt.label}</span>
                      </span>

                      {/* Quick Single Item Format Switcher */}
                      <select
                        value={item.settings.outputFormat}
                        onChange={(e) => {
                          const newFmt = e.target.value as OutputFormat;
                          if (onConvertItemFormats) {
                            onConvertItemFormats([item.id], newFmt);
                          }
                        }}
                        className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs hover:border-indigo-300"
                        title="Change output file format directly"
                      >
                        {item.type === 'image' ? (
                          <>
                            <option value="webp">⚡ WebP</option>
                            <option value="png">🖼️ PNG</option>
                            <option value="jpeg">📸 JPEG</option>
                            <option value="avif">🚀 AVIF</option>
                          </>
                        ) : (
                          <>
                            <option value="webm">🎬 WebM</option>
                            <option value="mp4">🎞️ MP4</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Output Name Display / Inline Editor */}
                    <div className="flex items-center gap-2">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1.5 w-full max-w-sm">
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.id);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            autoFocus
                            className="flex-1 bg-slate-50 border border-slate-900 rounded-lg px-2 py-0.5 text-xs text-slate-900 font-bold font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveInlineEdit(item.id)}
                            className="p-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                            title="Save custom filename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
                            title="Cancel"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/edit">
                          <span className="text-sm font-extrabold text-slate-900 font-mono truncate max-w-[220px] md:max-w-md">
                            {formattedOutputName}
                          </span>
                          {item.customName && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Renamed
                            </span>
                          )}
                          <button
                            onClick={() => handleStartInlineEdit(item, index)}
                            title="Edit output file name"
                            className="opacity-60 group-hover/edit:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-500 transition-opacity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dimensions & Compression stats */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono flex-wrap">
                      <span>Orig: {formatBytes(item.originalSize)}</span>
                      <span>({item.originalWidth}x{item.originalHeight})</span>

                      {isCompleted && item.compressedSize && (
                        <>
                          <ArrowRight className="w-3 h-3 text-green-600" />
                          <span className="text-slate-900 font-bold">
                            New: {formatBytes(item.compressedSize)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-green-500 text-white font-bold">
                            -{savings.formattedSaved}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Status */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Compare / Preview Button */}
                  {(isCompleted || item.type === 'image') && (
                    <button
                      onClick={() => onOpenPreview(item)}
                      title="Open Comparison Preview"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-700" />
                      <span className="hidden md:inline">Compare</span>
                    </button>
                  )}

                  {/* Manual Aspect Ratio Crop (Images only) */}
                  {item.type === 'image' && (
                    <button
                      onClick={() => onOpenCropEditor(item)}
                      title="Manually Adjust Aspect Ratio & Crop Box"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Crop className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                  )}

                  {/* Process Single Item Button */}
                  {!isCompleted && !isProcessing && (
                    <button
                      onClick={() => onProcessItem(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        item.savedToCloud
                          ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                      }`}
                    >
                      <Cloud className={`w-3.5 h-3.5 ${item.savedToCloud ? 'text-green-600' : 'text-slate-700'}`} />
                      <span>{item.savedToCloud ? 'In Cloud' : 'Cloud Save'}</span>
                    </button>
                  )}

                  {/* Download Output Button */}
                  {isCompleted && (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    title="Remove item"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Status Text */}
              {isProcessing && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 text-slate-900 animate-spin" />
                      <span>{item.progress.message || 'Compressing media file...'}</span>
                    </span>
                    <span className="font-mono">{item.progress.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-200"
                      style={{ width: `${item.progress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {isError && (
                <div className="mt-3 pt-2 text-xs text-rose-600 font-bold flex items-center gap-2">
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
