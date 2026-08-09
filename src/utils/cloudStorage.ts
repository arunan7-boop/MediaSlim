import { CloudStoredFile, CloudVaultSettings, MediaItem } from '../types';
import { calculateSavings, formatBytes } from './formatters';

const STORAGE_KEY_FILES = 'mediaslim_cloud_vault_files_v1';
const STORAGE_KEY_SETTINGS = 'mediaslim_cloud_vault_settings_v1';

export const DEFAULT_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB

export function getVaultSettings(): CloudVaultSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    isPinProtected: false,
    storageQuotaBytes: DEFAULT_QUOTA_BYTES
  };
}

export function saveVaultSettings(settings: CloudVaultSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save vault settings:', err);
  }
}

export function getStoredCloudFiles(): CloudStoredFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading cloud files:', err);
  }
  return [];
}

export function saveStoredCloudFiles(files: CloudStoredFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
  } catch (err) {
    console.error('Error saving cloud files:', err);
  }
}

export async function uploadToCloudVault(
  item: MediaItem,
  onProgress?: (progress: number) => void
): Promise<CloudStoredFile> {
  if (!item.compressedBlob) {
    throw new Error('Item has no compressed output to upload');
  }

  // Simulate cloud chunked upload with progress
  for (let p = 0; p <= 100; p += 20) {
    if (onProgress) onProgress(p);
    await new Promise((r) => setTimeout(r, 80));
  }

  // Convert blob to base64 data URL for persistence
  const dataUrl = await blobToDataUrl(item.compressedBlob);

  const { percentageSaved } = calculateSavings(item.originalSize, item.compressedSize || 0);

  const shareToken = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

  const newCloudFile: CloudStoredFile = {
    id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: item.name,
    type: item.type,
    originalSize: item.originalSize,
    compressedSize: item.compressedSize || item.compressedBlob.size,
    savingsPercentage: percentageSaved,
    downloadUrl: item.compressedUrl || dataUrl,
    dataUrl,
    createdAt: new Date().toISOString(),
    shareToken,
    downloadCount: 0,
    format: item.settings.outputFormat.toUpperCase(),
    dimensions: `${item.compressedWidth || item.originalWidth}x${item.compressedHeight || item.originalHeight}`
  };

  const currentFiles = getStoredCloudFiles();
  currentFiles.unshift(newCloudFile);
  saveStoredCloudFiles(currentFiles);

  return newCloudFile;
}

export function deleteCloudFile(id: string): CloudStoredFile[] {
  const currentFiles = getStoredCloudFiles();
  const filtered = currentFiles.filter((f) => f.id !== id);
  saveStoredCloudFiles(filtered);
  return filtered;
}

export function calculateUsedVaultStorage(files: CloudStoredFile[]): {
  usedBytes: number;
  formattedUsed: string;
  quotaBytes: number;
  formattedQuota: string;
  percentageUsed: number;
} {
  const usedBytes = files.reduce((acc, f) => acc + (f.compressedSize || 0), 0);
  const settings = getVaultSettings();
  const quotaBytes = settings.storageQuotaBytes || DEFAULT_QUOTA_BYTES;
  const percentageUsed = Math.min(100, parseFloat(((usedBytes / quotaBytes) * 100).toFixed(1)));

  return {
    usedBytes,
    formattedUsed: formatBytes(usedBytes),
    quotaBytes,
    formattedQuota: formatBytes(quotaBytes),
    percentageUsed
  };
}

export function generateShareableLink(file: CloudStoredFile, expiryDays?: number): string {
  const appUrl = window.location.origin;
  let url = `${appUrl}/#share=${file.shareToken}`;
  if (expiryDays && expiryDays > 0) {
    const expTime = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    url += `&exp=${expTime}`;
  }
  return url;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
