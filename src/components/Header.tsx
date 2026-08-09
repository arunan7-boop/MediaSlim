import React from 'react';
import { Cloud, Sliders, HardDrive, Sparkles, ShieldCheck } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface HeaderProps {
  cloudUsedBytes: number;
  cloudQuotaBytes: number;
  onOpenCloudVault: () => void;
  queueCount: number;
  completedCount: number;
  totalBytesSaved: number;
}

export const Header: React.FC<HeaderProps> = ({
  cloudUsedBytes,
  cloudQuotaBytes,
  onOpenCloudVault,
  queueCount,
  completedCount,
  totalBytesSaved
}) => {
  const quotaPercent = Math.min(100, (cloudUsedBytes / cloudQuotaBytes) * 100);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Sliders className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                MediaSlim
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Smart Batch Image & Video File Size Reducer
            </p>
          </div>
        </div>

        {/* Global Stats & Cloud Vault Trigger */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
          {totalBytesSaved > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Total Saved: <strong>{formatBytes(totalBytesSaved)}</strong></span>
            </div>
          )}

          {/* Secure Cloud Storage Vault Button */}
          <button
            onClick={onOpenCloudVault}
            id="open-cloud-vault-btn"
            className="group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 hover:text-white transition-all text-xs font-medium"
            title="Open Secure Cloud Storage Vault"
          >
            <div className="relative">
              <Cloud className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 absolute -bottom-1 -right-1" />
            </div>
            <span>Cloud Vault</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50">
              <HardDrive className="w-3 h-3 text-slate-500" />
              <span>{formatBytes(cloudUsedBytes, 0)}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">{formatBytes(cloudQuotaBytes, 0)}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
