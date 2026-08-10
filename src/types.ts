export type MediaType = 'image' | 'video';

export type OutputFormat = 'jpeg' | 'webp' | 'png' | 'avif' | 'webm' | 'mp4';

export type ResolutionPreset = 
  | 'original' 
  | '4k' 
  | '1080p' 
  | '720p' 
  | '480p' 
  | '360p' 
  | 'scale-75' 
  | 'scale-50' 
  | 'scale-25' 
  | 'custom';

export type AspectRatioPreset = 
  | 'original' 
  | '1:1' 
  | '16:9' 
  | '4:3' 
  | '3:2' 
  | '9:16' 
  | '21:9' 
  | 'custom';

export interface CropRect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface CompressionSettings {
  quality: number; // 10 to 100
  resolution: ResolutionPreset;
  customWidth?: number;
  customHeight?: number;
  keepAspectRatio: boolean;
  outputFormat: OutputFormat;
  aspectRatio: AspectRatioPreset;
  customRatioWidth?: number;
  customRatioHeight?: number;
  cropRect?: CropRect;
  videoFps?: number; // 24, 30, 60
  videoBitrateScale?: number; // 0.2 to 1.0
  smartAiEnabled?: boolean;
  autoCleanup?: boolean;
  aiSuggestedQuality?: number;
  aiReasoning?: string;
  aiComplexityLevel?: string;
}

export type ProcessingStatus = 'queued' | 'uploading' | 'processing' | 'completed' | 'error';

export type ProgressStage = 
  | 'idle' 
  | 'uploading' 
  | 'reading'
  | 'resizing' 
  | 'encoding' 
  | 'compressing' 
  | 'saving_cloud' 
  | 'downloading';

export interface ProgressState {
  stage: ProgressStage;
  progress: number; // 0 - 100
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
}

export interface RenamePatternSettings {
  prefix: string;
  useOriginalName: boolean;
  customBaseName: string;
  suffix: string;
  enableSequential: boolean;
  startIndex: number;
  numberPadding: number; // e.g. 1 ('1'), 2 ('01'), 3 ('001'), 4 ('0001')
  caseOption: 'preserve' | 'lowercase' | 'uppercase';
}

export interface MediaItem {
  id: string;
  file: File;
  name: string;
  customName?: string; // User-edited or bulk-renamed filename (without extension)
  type: MediaType;
  originalSize: number;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  duration?: number; // seconds for video
  status: ProcessingStatus;
  progress: ProgressState;
  settings: CompressionSettings;
  compressedBlob?: Blob;
  compressedUrl?: string;
  compressedSize?: number;
  compressedWidth?: number;
  compressedHeight?: number;
  processingTimeMs?: number;
  errorMessage?: string;
  savedToCloud?: boolean;
  cloudUrl?: string;
  cloudFileId?: string;
}

export interface CloudStoredFile {
  id: string;
  name: string;
  type: MediaType;
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  downloadUrl: string;
  dataUrl?: string; // base64 / blob url for local persistence
  createdAt: string;
  shareToken: string;
  shareExpiresAt?: string;
  downloadCount: number;
  format: string;
  dimensions?: string;
}

export interface CloudVaultSettings {
  isPinProtected: boolean;
  pinHash?: string;
  storageQuotaBytes: number; // e.g. 1 GB = 1073741824
  gcsBucketName?: string;
  gcsRegion?: string;
  gcsCustomDomain?: string;
  gcsConnected?: boolean;
  cloudRunRegion?: string;
  cloudRunServiceUrl?: string;
  cloudflareDomain?: string;
  cloudflareCdnEnabled?: boolean;
}
