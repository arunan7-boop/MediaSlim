import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Header
} from './components/Header';
import {
  Dropzone
} from './components/Dropzone';
import {
  CompressionControls
} from './components/CompressionControls';
import {
  MediaQueue
} from './components/MediaQueue';
import {
  BatchSummaryBar
} from './components/BatchSummaryBar';
import {
  ComparisonPreviewModal
} from './components/ComparisonPreviewModal';
import {
  AspectCropEditor
} from './components/AspectCropEditor';
import {
  CloudVaultModal
} from './components/CloudVaultModal';
import {
  AspectRatioPreset,
  CloudStoredFile,
  CompressionSettings,
  CropRect,
  MediaItem,
  ProgressStage
} from './types';
import {
  compressImage,
  getImageDimensions
} from './utils/imageCompressor';
import {
  compressVideo,
  getVideoMetadata
} from './utils/videoCompressor';
import {
  calculateUsedVaultStorage,
  DEFAULT_QUOTA_BYTES,
  getStoredCloudFiles,
  getVaultSettings,
  uploadToCloudVault
} from './utils/cloudStorage';
import { formatBytes } from './utils/formatters';
import { Sparkles, ShieldCheck, Zap, DownloadCloud, RefreshCw } from 'lucide-react';

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 75,
  resolution: 'original',
  keepAspectRatio: true,
  outputFormat: 'webp',
  aspectRatio: 'original',
  videoFps: 30
};

export default function App() {
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [isReadingFiles, setIsReadingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [cropModalItem, setCropModalItem] = useState<MediaItem | null>(null);
  const [isCloudVaultOpen, setIsCloudVaultOpen] = useState<boolean>(false);
  const [cloudFiles, setCloudFiles] = useState<CloudStoredFile[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCloudFiles(getStoredCloudFiles());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Intake uploaded files into queue
  const handleFilesSelected = async (files: File[]) => {
    setIsReadingFiles(true);
    setUploadProgress(10);

    const newItems: MediaItem[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const currentPct = Math.round(((i + 1) / totalFiles) * 100);
      setUploadProgress(currentPct);

      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);
      const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      try {
        if (isVideo) {
          const meta = await getVideoMetadata(file);
          newItems.push({
            id,
            file,
            name: file.name,
            type: 'video',
            originalSize: file.size,
            originalUrl: meta.url,
            originalWidth: meta.width,
            originalHeight: meta.height,
            duration: meta.duration,
            status: 'queued',
            progress: { stage: 'idle', progress: 0 },
            settings: { ...globalSettings, outputFormat: 'webm' }
          });
        } else {
          const meta = await getImageDimensions(file);
          newItems.push({
            id,
            file,
            name: file.name,
            type: 'image',
            originalSize: file.size,
            originalUrl: meta.url,
            originalWidth: meta.width,
            originalHeight: meta.height,
            status: 'queued',
            progress: { stage: 'idle', progress: 0 },
            settings: { ...globalSettings }
          });
        }
      } catch (err) {
        console.error('Error intaking file:', file.name, err);
      }
    }

    setQueue((prev) => [...prev, ...newItems]);
    setIsReadingFiles(false);
    setUploadProgress(0);
    showToast(`Added ${newItems.length} ${newItems.length === 1 ? 'file' : 'files'} to compression queue`);
  };

  // Compress single item
  const processSingleItem = async (itemId: string) => {
    const targetItem = queue.find((i) => i.id === itemId);
    if (!targetItem) return;

    // Update status to processing
    setQueue((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'processing', progress: { stage: 'reading', progress: 5, message: 'Starting...' } }
          : i
      )
    );

    try {
      if (targetItem.type === 'image') {
        const result = await compressImage(
          targetItem.file,
          targetItem.settings,
          (stage: ProgressStage, progress: number, message?: string) => {
            setQueue((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, progress: { stage, progress, message } } : i))
            );
          }
        );

        setQueue((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'completed',
                  compressedBlob: result.blob,
                  compressedUrl: result.url,
                  compressedSize: result.size,
                  compressedWidth: result.width,
                  compressedHeight: result.height,
                  processingTimeMs: result.timeMs,
                  progress: { stage: 'idle', progress: 100 }
                }
              : i
          )
        );
      } else {
        const result = await compressVideo(
          targetItem.file,
          targetItem.settings,
          (stage: ProgressStage, progress: number, message?: string) => {
            setQueue((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, progress: { stage, progress, message } } : i))
            );
          }
        );

        setQueue((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'completed',
                  compressedBlob: result.blob,
                  compressedUrl: result.url,
                  compressedSize: result.size,
                  compressedWidth: result.width,
                  compressedHeight: result.height,
                  processingTimeMs: result.timeMs,
                  progress: { stage: 'idle', progress: 100 }
                }
              : i
          )
        );
      }
      showToast(`Successfully reduced ${targetItem.name}`);
    } catch (error) {
      console.error('Compression error:', error);
      const errMsg = error instanceof Error ? error.message : 'Compression failed';
      setQueue((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, status: 'error', errorMessage: errMsg, progress: { stage: 'idle', progress: 0 } }
            : i
        )
      );
      showToast(`Error processing ${targetItem.name}`);
    }
  };

  // Process all queued items in batch
  const handleProcessAllBatch = async () => {
    setIsProcessingBatch(true);
    const queued = queue.filter((i) => i.status === 'queued' || i.status === 'error');

    for (const item of queued) {
      await processSingleItem(item.id);
    }

    setIsProcessingBatch(false);
    showToast('Batch processing complete!');
  };

  // Download All as ZIP Archive
  const handleDownloadAllZip = async () => {
    const completedItems = queue.filter((i) => i.status === 'completed' && i.compressedBlob);
    if (completedItems.length === 0) return;

    setIsDownloadingZip(true);
    setZipProgress(10);

    const zip = new JSZip();

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      if (item.compressedBlob) {
        const ext = item.settings.outputFormat;
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const zipFileName = `slim_${baseName}.${ext}`;
        zip.file(zipFileName, item.compressedBlob);
      }
    }

    const zipBlob = await zip.generateAsync(
      { type: 'blob' },
      (metadata) => {
        setZipProgress(Math.round(metadata.percent));
      }
    );

    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `MediaSlim_Batch_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);

    setIsDownloadingZip(false);
    setZipProgress(0);
    showToast('Downloaded ZIP bundle!');
  };

  // Save to Cloud Storage Vault
  const handleSaveToCloud = async (item: MediaItem) => {
    if (!item.compressedBlob) return;

    try {
      const cloudFile = await uploadToCloudVault(item);
      setCloudFiles((prev) => [cloudFile, ...prev]);
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, savedToCloud: true, cloudFileId: cloudFile.id } : i))
      );
      showToast(`Saved ${item.name} to Cloud Vault`);
    } catch (err) {
      console.error('Cloud upload error:', err);
      showToast('Failed to save to Cloud Storage Vault');
    }
  };

  // Apply settings to all items in queue
  const handleApplySettingsToAll = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        settings: {
          ...globalSettings,
          // Preserve appropriate format if item is video vs image
          outputFormat:
            item.type === 'video'
              ? globalSettings.outputFormat === 'mp4'
                ? 'mp4'
                : 'webm'
              : globalSettings.outputFormat
        }
      }))
    );
    showToast('Applied global settings to all queue items');
  };

  const handleDownloadItem = (item: MediaItem) => {
    if (!item.compressedUrl) return;
    const ext = item.settings.outputFormat;
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const fileName = `slim_${baseName}.${ext}`;

    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCrop = (cropRect: CropRect | undefined, aspect: AspectRatioPreset) => {
    if (!cropModalItem) return;

    const updatedSettings: CompressionSettings = {
      ...cropModalItem.settings,
      cropRect,
      aspectRatio: aspect
    };

    setQueue((prev) =>
      prev.map((i) =>
        i.id === cropModalItem.id
          ? { ...i, settings: updatedSettings, status: 'queued' }
          : i
      )
    );

    setCropModalItem(null);
    showToast(`Updated aspect ratio & crop for ${cropModalItem.name}`);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  const queueHasImages = queue.some((i) => i.type === 'image');
  const queueHasVideos = queue.some((i) => i.type === 'video');

  const vaultStats = calculateUsedVaultStorage(cloudFiles);
  const totalSavedBytes = queue.reduce((acc, i) => {
    if (i.status === 'completed' && i.compressedSize) {
      return acc + Math.max(0, i.originalSize - i.compressedSize);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs font-semibold shadow-2xl animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <Header
        cloudUsedBytes={vaultStats.usedBytes}
        cloudQuotaBytes={vaultStats.quotaBytes}
        onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        queueCount={queue.length}
        completedCount={queue.filter((i) => i.status === 'completed').length}
        totalBytesSaved={totalSavedBytes}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Dropzone File Upload */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isReadingFiles={isReadingFiles}
          uploadProgress={uploadProgress}
        />

        {/* Compression Controls */}
        <CompressionControls
          settings={globalSettings}
          onChangeSettings={setGlobalSettings}
          onApplyToAll={handleApplySettingsToAll}
          queueHasImages={queueHasImages}
          queueHasVideos={queueHasVideos}
        />

        {/* Media Queue List */}
        <MediaQueue
          items={queue}
          onProcessItem={processSingleItem}
          onRemoveItem={handleRemoveItem}
          onOpenPreview={(item) => setPreviewItem(item)}
          onOpenCropEditor={(item) => setCropModalItem(item)}
          onSaveItemToCloud={handleSaveToCloud}
          onDownloadItem={handleDownloadItem}
        />

        {/* Batch Summary Floating Bar */}
        <BatchSummaryBar
          items={queue}
          onProcessAll={handleProcessAllBatch}
          onDownloadZip={handleDownloadAllZip}
          onClearCompleted={handleClearCompleted}
          isProcessingBatch={isProcessingBatch}
          isDownloadingZip={isDownloadingZip}
          zipProgress={zipProgress}
        />
      </main>

      {/* Side-by-Side Preview Comparison Modal */}
      {previewItem && (
        <ComparisonPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onOpenCropEditor={(item) => {
            setPreviewItem(null);
            setCropModalItem(item);
          }}
          onSaveToCloud={handleSaveToCloud}
          onDownload={handleDownloadItem}
        />
      )}

      {/* Manual Aspect Ratio & Crop Modal */}
      {cropModalItem && (
        <AspectCropEditor
          imageUrl={cropModalItem.compressedUrl || cropModalItem.originalUrl}
          originalWidth={cropModalItem.originalWidth}
          originalHeight={cropModalItem.originalHeight}
          currentAspectRatio={cropModalItem.settings.aspectRatio}
          initialCropRect={cropModalItem.settings.cropRect}
          onSaveCrop={handleSaveCrop}
          onCancel={() => setCropModalItem(null)}
        />
      )}

      {/* Secure Cloud Storage Vault Modal */}
      {isCloudVaultOpen && (
        <CloudVaultModal
          onClose={() => {
            setIsCloudVaultOpen(false);
            setCloudFiles(getStoredCloudFiles());
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>MediaSlim — High Efficiency Image & Video Compression Tool</p>
      </footer>
    </div>
  );
}
