import { CompressionSettings, ProgressStage } from '../types';
import { getTargetDimensions } from './formatters';

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  url: string;
}

export interface VideoCompressionResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  timeMs: number;
}

export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        duration: video.duration || 0,
        url
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = url;
  });
}

export async function compressVideo(
  file: File,
  settings: CompressionSettings,
  onProgress?: (stage: ProgressStage, progress: number, message?: string) => void
): Promise<VideoCompressionResult> {
  const startTime = performance.now();

  if (onProgress) onProgress('reading', 5, 'Reading video metadata...');

  const meta = await getVideoMetadata(file);
  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    meta.width,
    meta.height,
    settings.resolution,
    settings.customWidth,
    settings.customHeight
  );

  if (onProgress) onProgress('resizing', 15, `Preparing frame pipeline (${targetWidth}x${targetHeight})...`);

  // Create video DOM element
  const video = document.createElement('video');
  video.src = meta.url;
  video.muted = true; // Mute for processing/play without user gesture block
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.oncanplaythrough = () => resolve();
    video.onerror = () => reject(new Error('Failed to prepare video for playback encoding'));
    video.load();
  });

  const duration = meta.duration || 1;

  // Create canvas for frame resizing
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not obtain canvas 2D context for video encoding');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine bitrate based on quality setting (10 - 100)
  // Standard 1080p video bitrate is ~5-8 Mbps. 720p is ~2.5 Mbps.
  // Scale bitrate according to target area and quality %
  const baseBitrate = (targetWidth * targetHeight * (settings.videoFps || 30) * 0.07);
  const targetBitrate = Math.round(baseBitrate * (settings.quality / 100));

  // Determine supported mimeType for MediaRecorder
  const mimeType = getSupportedVideoMimeType(settings.outputFormat);

  // Capture stream from canvas
  const fps = settings.videoFps || 30;
  const canvasStream = canvas.captureStream(fps);

  // Try to preserve original audio if present
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const sourceNode = audioContext.createMediaElementSource(video);
    const destNode = audioContext.createMediaStreamDestination();
    sourceNode.connect(destNode);
    destNode.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
  } catch {
    // If audio extraction fails (cross-origin or silent), continue with video stream
  }

  const options: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond: targetBitrate
  };

  let mediaRecorder: MediaRecorder;
  try {
    mediaRecorder = new MediaRecorder(canvasStream, options);
  } catch {
    // Fallback options if specified mimeType is rejected
    mediaRecorder = new MediaRecorder(canvasStream);
  }

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  if (onProgress) onProgress('encoding', 25, 'Starting frame re-encoding...');

  return new Promise<VideoCompressionResult>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const endTime = performance.now();

      if (onProgress) onProgress('idle', 100, 'Video compression complete');

      resolve({
        blob,
        url,
        size: blob.size,
        width: targetWidth,
        height: targetHeight,
        duration,
        timeMs: Math.round(endTime - startTime)
      });
    };

    mediaRecorder.onerror = (e) => {
      reject(new Error(`Video MediaRecorder error: ${e.error}`));
    };

    // Start recording
    mediaRecorder.start(100);

    video.currentTime = 0;
    video.play().catch(reject);

    let animationFrameId: number;

    function renderLoop() {
      if (video.paused || video.ended) {
        if (video.ended) {
          mediaRecorder.stop();
          return;
        }
      }

      ctx?.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Report current progress
      const progressPercent = Math.min(99, Math.round((video.currentTime / duration) * 100));
      if (onProgress) {
        onProgress('encoding', progressPercent, `Encoding frame (${formatVideoTime(video.currentTime)} / ${formatVideoTime(duration)})`);
      }

      if (!video.ended) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    }

    renderLoop();

    // Timeout safety net in case video playback gets stuck
    const maxTimeoutMs = (duration + 10) * 1000;
    const timeoutTimer = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, maxTimeoutMs);

    mediaRecorder.addEventListener('stop', () => clearTimeout(timeoutTimer));
  });
}

function getSupportedVideoMimeType(preferredFormat: string): string {
  const candidates = preferredFormat === 'mp4'
    ? ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
    : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

function formatVideoTime(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const rSec = s % 60;
  return `${m}:${rSec < 10 ? '0' : ''}${rSec}`;
}
