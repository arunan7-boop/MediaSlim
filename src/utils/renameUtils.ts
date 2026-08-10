import { MediaItem, RenamePatternSettings } from '../types';

export const DEFAULT_RENAME_PATTERN: RenamePatternSettings = {
  prefix: 'slim_',
  useOriginalName: true,
  customBaseName: 'media',
  suffix: '',
  enableSequential: false,
  startIndex: 1,
  numberPadding: 3,
  caseOption: 'preserve'
};

export function getOriginalBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) return filename;
  return filename.substring(0, lastDot);
}

export function computeFormattedFilename(
  item: MediaItem,
  index: number,
  pattern?: RenamePatternSettings
): string {
  const ext = item.settings.outputFormat || (item.type === 'image' ? 'webp' : 'webm');

  // If user explicitly edited customName for this single item, respect it
  if (item.customName && item.customName.trim().length > 0) {
    const cleaned = item.customName.trim();
    // Check if customName already includes extension
    if (cleaned.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
      return cleaned;
    }
    return `${cleaned}.${ext}`;
  }

  // If pattern settings are passed
  if (pattern) {
    const origBase = getOriginalBaseName(item.name);
    let base = pattern.useOriginalName ? origBase : pattern.customBaseName.trim() || 'file';

    const numStr = String(pattern.startIndex + index).padStart(pattern.numberPadding, '0');
    const seqPart = pattern.enableSequential ? (base ? `_${numStr}` : numStr) : '';

    let constructed = `${pattern.prefix}${base}${seqPart}${pattern.suffix}`;

    if (pattern.caseOption === 'lowercase') {
      constructed = constructed.toLowerCase();
    } else if (pattern.caseOption === 'uppercase') {
      constructed = constructed.toUpperCase();
    }

    // fallback if empty
    if (!constructed.trim()) {
      constructed = `slim_${origBase}`;
    }

    return `${constructed}.${ext}`;
  }

  // Fallback default
  const origBase = getOriginalBaseName(item.name);
  return `slim_${origBase}.${ext}`;
}
