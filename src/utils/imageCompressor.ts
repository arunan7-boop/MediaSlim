import { CompressionSettings, CropRect, OutputFormat, ProgressStage } from '../types';
import { getTargetDimensions, parseAspectRatio } from './formatters';

export interface ImageCompressionResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  timeMs: number;
}

export async function compressImage(
  file: File,
  settings: CompressionSettings,
  onProgress?: (stage: ProgressStage, progress: number, message?: string) => void
): Promise<ImageCompressionResult> {
  const startTime = performance.now();

  if (onProgress) onProgress('reading', 10, 'Loading image file...');

  const img = await loadImage(file);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (onProgress) onProgress('resizing', 30, 'Calculating target resolution & aspect ratio...');

  // 1. Calculate Crop Box based on Aspect Ratio or custom cropRect
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = origWidth;
  let sourceHeight = origHeight;

  if (settings.cropRect) {
    // Custom Crop Box provided in percentages
    const { x, y, width, height } = settings.cropRect;
    sourceX = Math.round((x / 100) * origWidth);
    sourceY = Math.round((y / 100) * origHeight);
    sourceWidth = Math.round((width / 100) * origWidth);
    sourceHeight = Math.round((height / 100) * origHeight);
  } else {
    const targetAspect = parseAspectRatio(
      settings.aspectRatio,
      settings.customRatioWidth,
      settings.customRatioHeight
    );

    if (targetAspect && targetAspect > 0) {
      const currentAspect = origWidth / origHeight;
      if (currentAspect > targetAspect) {
        // Current is wider than target aspect -> crop horizontally (left/right)
        sourceWidth = Math.round(origHeight * targetAspect);
        sourceHeight = origHeight;
        sourceX = Math.round((origWidth - sourceWidth) / 2);
        sourceY = 0;
      } else if (currentAspect < targetAspect) {
        // Current is taller than target aspect -> crop vertically (top/bottom)
        sourceWidth = origWidth;
        sourceHeight = Math.round(origWidth / targetAspect);
        sourceX = 0;
        sourceY = Math.round((origHeight - sourceHeight) / 2);
      }
    }
  }

  // 2. Calculate Final Output Dimensions after Crop
  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    sourceWidth,
    sourceHeight,
    settings.resolution,
    settings.customWidth,
    settings.customHeight
  );

  if (onProgress) onProgress('encoding', 60, 'Rendering to canvas...');

  // 3. Draw on Offscreen/HTML Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: settings.outputFormat !== 'jpeg' });
  if (!ctx) throw new Error('Could not get 2D context for image compression');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background with white if converting PNG with transparency to JPEG
  if (settings.outputFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  if (onProgress) onProgress('compressing', 85, 'Encoding compressed image file...');

  // 4. Determine MIME type and Quality
  const mimeType = getMimeType(settings.outputFormat);
  const quality = Math.max(0.1, Math.min(1.0, settings.quality / 100));

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const url = URL.createObjectURL(blob);
  const endTime = performance.now();

  if (onProgress) onProgress('idle', 100, 'Image compression complete');

  return {
    blob,
    url,
    size: blob.size,
    width: targetWidth,
    height: targetHeight,
    timeMs: Math.round(endTime - startTime)
  };
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        url
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image metadata'));
    };
    img.src = url;
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to parse image element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function getMimeType(format: OutputFormat): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'avif':
      return 'image/avif';
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to JPEG if requested format is unsupported by canvas.toBlob
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Canvas export failed'));
            },
            'image/jpeg',
            quality
          );
        }
      },
      mimeType,
      quality
    );
  });
}
