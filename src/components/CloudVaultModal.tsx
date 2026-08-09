import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Lock,
  Unlock,
  HardDrive,
  Download,
  Trash2,
  Share2,
  Check,
  Copy,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  FileText,
  KeyRound
} from 'lucide-react';
import { CloudStoredFile, CloudVaultSettings } from '../types';
import {
  calculateUsedVaultStorage,
  deleteCloudFile,
  generateShareableLink,
  getStoredCloudFiles,
  getVaultSettings,
  saveVaultSettings
} from '../utils/cloudStorage';
import { formatBytes } from '../utils/formatters';

interface CloudVaultModalProps {
  onClose: () => void;
}

export const CloudVaultModal: React.FC<CloudVaultModalProps> = ({ onClose }) => {
  const [cloudFiles, setCloudFiles] = useState<CloudStoredFile[]>([]);
  const [vaultSettings, setVaultSettings] = useState<CloudVaultSettings>(getVaultSettings());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!vaultSettings.isPinProtected);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModalFile, setShareModalFile] = useState<CloudStoredFile | null>(null);
  const [shareExpiryDays, setShareExpiryDays] = useState<number>(7);

  useEffect(() => {
    setCloudFiles(getStoredCloudFiles());
  }, []);

  const storageStats = calculateUsedVaultStorage(cloudFiles);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (vaultSettings.pinHash && pinInput === vaultSettings.pinHash) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN passcode. Try again.');
    }
  };

  const handleTogglePinProtection = () => {
    if (vaultSettings.isPinProtected) {
      const updated: CloudVaultSettings = { ...vaultSettings, isPinProtected: false, pinHash: undefined };
      setVaultSettings(updated);
      saveVaultSettings(updated);
      setIsUnlocked(true);
    } else {
      const newPin = prompt('Set a 4-digit security PIN for your Cloud Vault:');
      if (newPin && newPin.trim().length >= 4) {
        const updated: CloudVaultSettings = {
          ...vaultSettings,
          isPinProtected: true,
          pinHash: newPin.trim()
        };
        setVaultSettings(updated);
        saveVaultSettings(updated);
        setIsUnlocked(true);
      }
    }
  };

  const handleDeleteFile = (id: string) => {
    const updated = deleteCloudFile(id);
    setCloudFiles(updated);
  };

  const handleCopyShareLink = (file: CloudStoredFile) => {
    const link = generateShareableLink(file, shareExpiryDays);
    navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Secure Cloud Storage Vault</h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-400">Cloud backup & share link generator for compressed media</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Security Gate if PIN lock is enabled and locked */}
        {!isUnlocked ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Vault Security Locked</h4>
              <p className="text-xs text-slate-400 mt-1">Enter your 4-digit PIN code to access cloud files</p>
            </div>

            <form onSubmit={handleUnlockPin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={8}
                placeholder="Enter PIN Passcode"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-indigo-500"
              />
              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Unlock Cloud Vault
              </button>
            </form>
          </div>
        ) : (
          /* Main Cloud Vault Body */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Storage Quota Usage Meter */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-slate-300">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Vault Storage Quota</span>
                </span>
                <span className="font-mono text-slate-400">
                  <strong className="text-white">{storageStats.formattedUsed}</strong> / {storageStats.formattedQuota} ({storageStats.percentageUsed}%)
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${storageStats.percentageUsed}%` }}
                />
              </div>

              {/* Security Lock Toggle Bar */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  {vaultSettings.isPinProtected ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">PIN Protection Enabled</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN Protection Disabled</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleTogglePinProtection}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
                >
                  {vaultSettings.isPinProtected ? 'Disable PIN' : 'Set PIN Lock'}
                </button>
              </div>
            </div>

            {/* Cloud Files List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Stored Media ({cloudFiles.length})</span>
              </div>

              {cloudFiles.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 border border-slate-800/80 rounded-2xl text-slate-500 space-y-2">
                  <Cloud className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No files saved to cloud vault yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Compress files in the queue and click "Cloud Save" to store them securely.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cloudFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold text-white truncate max-w-xs">
                            {file.name}
                          </h5>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {file.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                          <span>Size: {formatBytes(file.compressedSize)}</span>
                          <span className="text-emerald-400 font-bold">(-{file.savingsPercentage}%)</span>
                          <span>{file.dimensions}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Share Link Button */}
                        <button
                          onClick={() => setShareModalFile(file)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Share</span>
                        </button>

                        {/* Download Button */}
                        <a
                          href={file.dataUrl || file.downloadUrl}
                          download={`compressed_${file.name}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get</span>
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share Link Generation Modal Sub-Overlay */}
            {shareModalFile && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-200 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span>Generate Share Link for {shareModalFile.name}</span>
                  </span>
                  <button onClick={() => setShareModalFile(null)} className="text-indigo-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Expiry:</span>
                  {[
                    { days: 1, label: '24 Hours' },
                    { days: 7, label: '7 Days' },
                    { days: 0, label: 'Never' }
                  ].map((exp) => (
                    <button
                      key={exp.days}
                      onClick={() => setShareExpiryDays(exp.days)}
                      className={`px-2.5 py-1 rounded-lg border font-medium ${
                        shareExpiryDays === exp.days
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateShareableLink(shareModalFile, shareExpiryDays)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono"
                  />
                  <button
                    onClick={() => handleCopyShareLink(shareModalFile)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                  >
                    {copiedId === shareModalFile.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
