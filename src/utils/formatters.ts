import { AspectRatioPreset, ResolutionPreset } from '../types';

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calculateSavings(originalSize: number, compressedSize: number): {
  bytesSaved: number;
  percentageSaved: number;
  formattedSaved: string;
} {
  if (!originalSize || originalSize <= 0 || !compressedSize) {
    return { bytesSaved: 0, percentageSaved: 0, formattedSaved: '0%' };
  }
  const bytesSaved = Math.max(0, originalSize - compressedSize);
  const percentageSaved = Math.max(0, Math.min(100, ((originalSize - compressedSize) / originalSize) * 100));
  return {
    bytesSaved,
    percentageSaved: parseFloat(percentageSaved.toFixed(1)),
    formattedSaved: `${percentageSaved.toFixed(1)}%`
  };
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getTargetDimensions(
  origWidth: number,
  origHeight: number,
  resolution: ResolutionPreset,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: origWidth || 1920, height: origHeight || 1080 };
  }

  const aspectRatio = origWidth / origHeight;

  switch (resolution) {
    case 'original':
      return { width: origWidth, height: origHeight };

    case 'scale-75':
      return {
        width: Math.round(origWidth * 0.75),
        height: Math.round(origHeight * 0.75)
      };

    case 'scale-50':
      return {
        width: Math.round(origWidth * 0.5),
        height: Math.round(origHeight * 0.5)
      };

    case 'scale-25':
      return {
        width: Math.round(origWidth * 0.25),
        height: Math.round(origHeight * 0.25)
      };

    case '4k': {
      const maxDim = 3840;
      if (origWidth >= origHeight) {
        const width = Math.min(origWidth, maxDim);
        return { width, height: Math.round(width / aspectRatio) };
      } else {
        const height = Math.min(origHeight, maxDim);
        return { width: Math.round(height * aspectRatio), height };
      }
    }

    case '1080p': {
      const targetHeight = 1080;
      if (origHeight <= targetHeight) return { width: origWidth, height: origHeight };
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    }

    case '720p': {
      const targetHeight = 720;
      if (origHeight <= targetHeight) return { width: origWidth, height: origHeight };
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    }

    case '480p': {
      const targetHeight = 480;
      if (origHeight <= targetHeight) return { width: origWidth, height: origHeight };
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    }

    case '360p': {
      const targetHeight = 360;
      if (origHeight <= targetHeight) return { width: origWidth, height: origHeight };
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    }

    case 'custom': {
      const w = customWidth && customWidth > 0 ? customWidth : origWidth;
      const h = customHeight && customHeight > 0 ? customHeight : origHeight;
      return { width: Math.round(w), height: Math.round(h) };
    }

    default:
      return { width: origWidth, height: origHeight };
  }
}

export function parseAspectRatio(
  aspectRatioPreset: AspectRatioPreset,
  customRatioW?: number,
  customRatioH?: number
): number | null {
  switch (aspectRatioPreset) {
    case '1:1':
      return 1;
    case '16:9':
      return 16 / 9;
    case '4:3':
      return 4 / 3;
    case '3:2':
      return 3 / 2;
    case '9:16':
      return 9 / 16;
    case '21:9':
      return 21 / 9;
    case 'custom':
      if (customRatioW && customRatioH && customRatioW > 0 && customRatioH > 0) {
        return customRatioW / customRatioH;
      }
      return null;
    case 'original':
    default:
      return null;
  }
}
