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
  OutputFormat,
  ProgressStage,
  RenamePatternSettings
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
  getStoredCloudFiles,
  uploadToCloudVault
} from './utils/cloudStorage';
import {
  computeFormattedFilename
} from './utils/renameUtils';
import { Sparkles } from 'lucide-react';

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 75,
  resolution: 'original',
  keepAspectRatio: true,
  outputFormat: 'webp',
  aspectRatio: 'original',
  videoFps: 30,
  smartAiEnabled: false,
  autoCleanup: false
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
  const [user, setUser] = useState<any>(null);

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

    setQueue((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'processing', progress: { stage: 'reading', progress: 5, message: 'Compressing...' } }
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

  // Bulk renaming state handlers
  const handleUpdateItemName = (id: string, newName: string | undefined) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, customName: newName } : item))
    );
    showToast('Updated item output filename');
  };

  const handleApplyBulkRenamePattern = (pattern: RenamePatternSettings) => {
    setQueue((prev) =>
      prev.map((item, index) => {
        const formatted = computeFormattedFilename(item, index, pattern);
        const ext = item.settings.outputFormat;
        const baseWithoutExt = formatted.endsWith(`.${ext}`)
          ? formatted.slice(0, -(ext.length + 1))
          : formatted;
        return { ...item, customName: baseWithoutExt };
      })
    );
    showToast('Applied bulk rename rules to queue');
  };

  const handleResetAllNames = () => {
    setQueue((prev) => prev.map((item) => ({ ...item, customName: undefined })));
    showToast('Reset output filenames to default');
  };

  // Batch format conversion handler for selected items
  const handleConvertItemFormats = async (
    itemIds: string[],
    targetFormat: OutputFormat,
    autoProcess: boolean = false
  ) => {
    if (itemIds.length === 0) return;

    setQueue((prev) =>
      prev.map((item) => {
        if (itemIds.includes(item.id)) {
          return {
            ...item,
            settings: {
              ...item.settings,
              outputFormat: targetFormat
            },
            status: 'pending',
            compressedBlob: undefined,
            compressedUrl: undefined,
            compressedSize: undefined,
            errorMessage: undefined,
            progress: { stage: 'idle', progress: 0 }
          };
        }
        return item;
      })
    );

    showToast(`Converted ${itemIds.length} file(s) to ${targetFormat.toUpperCase()}`);

    if (autoProcess) {
      setIsProcessingBatch(true);
      for (const id of itemIds) {
        await processSingleItem(id);
      }
      setIsProcessingBatch(false);
      showToast('Finished processing converted files!');
    }
  };

  const handleRemoveMultipleItems = (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setQueue((prev) => prev.filter((item) => !itemIds.includes(item.id)));
    showToast(`Removed ${itemIds.length} item(s) from queue`);
  };

  const handleProcessMultipleItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setIsProcessingBatch(true);
    for (const id of itemIds) {
      await processSingleItem(id);
    }
    setIsProcessingBatch(false);
    showToast(`Processed ${itemIds.length} selected item(s)`);
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
        const itemIdx = queue.findIndex((q) => q.id === item.id);
        const zipFileName = computeFormattedFilename(item, itemIdx >= 0 ? itemIdx : i);
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

    if (globalSettings.autoCleanup) {
      const completedIds = new Set(completedItems.map((i) => i.id));
      setQueue((prev) => prev.filter((i) => !completedIds.has(i.id)));
      showToast('Downloaded ZIP bundle & auto-cleaned workspace!');
    } else {
      showToast('Downloaded ZIP bundle with renamed files!');
    }
  };

  // Save to Cloud Storage Vault
  const handleSaveToCloud = async (item: MediaItem) => {
    if (!item.compressedBlob) return;

    try {
      const itemIdx = queue.findIndex((q) => q.id === item.id);
      const customFilename = computeFormattedFilename(item, itemIdx >= 0 ? itemIdx : 0);
      const cloudFile = await uploadToCloudVault(item, undefined, customFilename);
      setCloudFiles((prev) => [cloudFile, ...prev]);

      if (globalSettings.autoCleanup || item.settings.autoCleanup) {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        showToast(`Saved ${customFilename} to Cloud Vault & auto-cleaned from workspace`);
      } else {
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, savedToCloud: true, cloudFileId: cloudFile.id } : i))
        );
        showToast(`Saved ${customFilename} to Cloud Vault`);
      }
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
    const itemIdx = queue.findIndex((q) => q.id === item.id);
    const fileName = computeFormattedFilename(item, itemIdx >= 0 ? itemIdx : 0);

    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (globalSettings.autoCleanup || item.settings.autoCleanup) {
      setTimeout(() => {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        showToast(`Downloaded ${fileName} & auto-cleaned from workspace`);
      }, 400);
    }
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
  const sampleImageItem = queue.find((i) => i.type === 'image') || null;

  const vaultStats = calculateUsedVaultStorage(cloudFiles);
  const totalSavedBytes = queue.reduce((acc, i) => {
    if (i.status === 'completed' && i.compressedSize) {
      return acc + Math.max(0, i.originalSize - i.compressedSize);
    }
    return acc;
  }, 0);

  const handleGlobalSettingsChange = (newSettings: CompressionSettings) => {
    setGlobalSettings(newSettings);
    // Automatically apply to all un-processed items in the queue
    setQueue((prev) =>
      prev.map((item) => {
        if (item.status === 'completed' || item.status === 'processing') return item;
        return {
          ...item,
          settings: {
            ...item.settings,
            quality: newSettings.quality,
            resolution: newSettings.resolution,
            keepAspectRatio: newSettings.keepAspectRatio,
            outputFormat:
              item.type === 'video'
                ? newSettings.outputFormat === 'mp4'
                  ? 'mp4'
                  : 'webm'
                : newSettings.outputFormat,
            aspectRatio: newSettings.aspectRatio,
            smartAiEnabled: newSettings.smartAiEnabled,
            autoCleanup: newSettings.autoCleanup
          }
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
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
        user={user}
        onLoginSuccess={(userInfo) => setUser(userInfo)}
        onLogout={() => setUser(null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Dropzone File Upload */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isReadingFiles={isReadingFiles}
          uploadProgress={uploadProgress}
        />

        {/* Compression Controls with Smart AI Toggle */}
        <CompressionControls
          settings={globalSettings}
          onChangeSettings={handleGlobalSettingsChange}
          onApplyToAll={handleApplySettingsToAll}
          queueHasImages={queueHasImages}
          queueHasVideos={queueHasVideos}
          sampleItem={sampleImageItem}
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
          onUpdateItemName={handleUpdateItemName}
          onApplyBulkRename={handleApplyBulkRenamePattern}
          onResetAllNames={handleResetAllNames}
          onConvertItemFormats={handleConvertItemFormats}
          onRemoveMultipleItems={handleRemoveMultipleItems}
          onProcessMultipleItems={handleProcessMultipleItems}
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
          autoCleanup={globalSettings.autoCleanup}
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
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-medium">
        <p>MEDIASLIM Studio — Clean Minimalist Batch Media File Size Reducer</p>
      </footer>
    </div>
  );
}
