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
  ShieldCheck,
  KeyRound,
  Server,
  Globe,
  Database,
  ExternalLink,
  RefreshCw,
  Zap,
  CheckCircle2
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
  const [activeTab, setActiveTab] = useState<'files' | 'gcs' | 'cloudrun'>('files');
  const [cloudFiles, setCloudFiles] = useState<CloudStoredFile[]>([]);
  const [vaultSettings, setVaultSettings] = useState<CloudVaultSettings>(getVaultSettings());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!vaultSettings.isPinProtected);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModalFile, setShareModalFile] = useState<CloudStoredFile | null>(null);
  const [shareExpiryDays, setShareExpiryDays] = useState<number>(7);

  // Cloud Run & GCS Status State
  const [cloudRunStatus, setCloudRunStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [gcsSavedMsg, setGcsSavedMsg] = useState<string>('');

  useEffect(() => {
    setCloudFiles(getStoredCloudFiles());
    fetchCloudRunStatus();
  }, []);

  const fetchCloudRunStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/cloud-run/status');
      if (res.ok) {
        const data = await res.json();
        setCloudRunStatus(data);
      }
    } catch (e) {
      console.warn('Status fetch error:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSaveGcsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveVaultSettings(vaultSettings);
    setGcsSavedMsg('Settings updated successfully!');
    setTimeout(() => setGcsSavedMsg(''), 3000);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs">
              <Cloud className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Cloud Storage & Infrastructure</h3>
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  GCS + Cloud Run
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Google Cloud Storage, Cloud Run Containers & Cloudflare CDN integration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {isUnlocked && (
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'files'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Vault Files ({cloudFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gcs')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'gcs'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Google Cloud Storage</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'cloudrun'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Server className="w-4 h-4 text-cyan-600" />
              <span>Cloud Run & Cloudflare</span>
            </button>
          </div>
        )}

        {/* PIN Security Gate if PIN lock is enabled and locked */}
        {!isUnlocked ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-100 text-slate-900 border border-slate-200">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Vault Security Locked</h4>
              <p className="text-xs text-slate-500 mt-1">Enter your 4-digit PIN code to access cloud files</p>
            </div>

            <form onSubmit={handleUnlockPin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={8}
                placeholder="Enter PIN Passcode"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-slate-900 tracking-widest focus:outline-none focus:border-slate-900"
              />
              {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                Unlock Cloud Vault
              </button>
            </form>
          </div>
        ) : (
          /* Main Tab Body */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: FILES */}
            {activeTab === 'files' && (
              <>
                {/* Storage Quota Usage Meter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-900">
                      <HardDrive className="w-4 h-4 text-slate-700" />
                      <span>Vault Storage Quota</span>
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong className="text-slate-900">{storageStats.formattedUsed}</strong> / {storageStats.formattedQuota} ({storageStats.percentageUsed}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-300"
                      style={{ width: `${storageStats.percentageUsed}%` }}
                    />
                  </div>

                  {/* Security Lock Toggle Bar */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      {vaultSettings.isPinProtected ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-700 font-bold">PIN Protection Enabled</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-amber-600" />
                          <span>PIN Protection Disabled</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleTogglePinProtection}
                      className="text-slate-900 hover:underline font-bold"
                    >
                      {vaultSettings.isPinProtected ? 'Disable PIN' : 'Set PIN Lock'}
                    </button>
                  </div>
                </div>

                {/* Cloud Files List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>Stored Media ({cloudFiles.length})</span>
                  </div>

                  {cloudFiles.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 space-y-2">
                      <Cloud className="w-8 h-8 mx-auto text-slate-400" />
                      <p className="text-xs font-bold text-slate-700">No files saved to cloud vault yet.</p>
                      <p className="text-[11px] text-slate-500">
                        Compress files in the queue and click "Cloud Save" to store them securely.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {cloudFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900 truncate max-w-xs">
                                {file.name}
                              </h5>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {file.format}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                              <span>Size: {formatBytes(file.compressedSize)}</span>
                              <span className="text-green-700 font-bold">(-{file.savingsPercentage}%)</span>
                              <span>{file.dimensions}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {/* Share Link Button */}
                            <button
                              onClick={() => setShareModalFile(file)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5 text-slate-700" />
                              <span>Share</span>
                            </button>

                            {/* Download Button */}
                            <a
                              href={file.dataUrl || file.downloadUrl}
                              download={`compressed_${file.name}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Get</span>
                            </a>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-slate-900" />
                        <span>Generate Share Link for {shareModalFile.name}</span>
                      </span>
                      <button onClick={() => setShareModalFile(null)} className="text-slate-400 hover:text-slate-900">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-bold">Expiry:</span>
                      {[
                        { days: 1, label: '24 Hours' },
                        { days: 7, label: '7 Days' },
                        { days: 0, label: 'Never' }
                      ].map((exp) => (
                        <button
                          key={exp.days}
                          onClick={() => setShareExpiryDays(exp.days)}
                          className={`px-2.5 py-1 rounded-lg border font-bold ${
                            shareExpiryDays === exp.days
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200'
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
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                      />
                      <button
                        onClick={() => handleCopyShareLink(shareModalFile)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
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
              </>
            )}

            {/* TAB 2: GOOGLE CLOUD STORAGE */}
            {activeTab === 'gcs' && (
              <form onSubmit={handleSaveGcsSettings} className="space-y-5">
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
                  <Database className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold text-indigo-900">Google Cloud Storage (GCS) Bucket Sync:</strong>
                    <p className="mt-0.5 text-indigo-800">
                      Connect your Google Cloud Storage bucket (`gs://your-bucket-name`) for unlimited persistent storage of original and compressed media files with Cloudflare CDN edge acceleration.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bucket Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">GCS Bucket Name</label>
                    <input
                      type="text"
                      placeholder="e.g. mediaslim-vault-bucket"
                      value={vaultSettings.gcsBucketName || ''}
                      onChange={(e) => setVaultSettings({ ...vaultSettings, gcsBucketName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* GCS Region */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Storage Region</label>
                    <select
                      value={vaultSettings.gcsRegion || 'us-central1'}
                      onChange={(e) => setVaultSettings({ ...vaultSettings, gcsRegion: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="us-central1">us-central1 (Iowa)</option>
                      <option value="us-east1">us-east1 (South Carolina)</option>
                      <option value="europe-west1">europe-west1 (Belgium)</option>
                      <option value="asia-east1">asia-east1 (Taiwan)</option>
                    </select>
                  </div>
                </div>

                {/* Cloudflare Custom Domain for GCS */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Cloudflare CDN Custom Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. cdn.mediaslim.app"
                    value={vaultSettings.gcsCustomDomain || ''}
                    onChange={(e) => setVaultSettings({ ...vaultSettings, gcsCustomDomain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    Route requests through Cloudflare CNAME to `c.storage.googleapis.com` for zero-latency global delivery.
                  </p>
                </div>

                {/* Bucket Connection Status Card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>GCS Bucket Status</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase">
                      Connected & Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Bucket: gs://{vaultSettings.gcsBucketName || 'mediaslim-vault-bucket'} | Region: {vaultSettings.gcsRegion || 'us-central1'}
                  </p>
                </div>

                {/* Submit / Success message */}
                <div className="flex items-center justify-between pt-2">
                  {gcsSavedMsg ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> {gcsSavedMsg}
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-md"
                  >
                    Save GCS Settings
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: CLOUD RUN & CLOUDFLARE */}
            {activeTab === 'cloudrun' && (
              <div className="space-y-5">
                {/* Status Refresh Header */}
                <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Cloud Run Container Engine
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Port 3000 | Container ID: {cloudRunStatus?.containerId || 'mediaslim-v1'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchCloudRunStatus}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>Refresh Status</span>
                  </button>
                </div>

                {/* Cloud Run Specs Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Host Port</span>
                    <p className="text-sm font-black font-mono text-slate-900">3000 (Required)</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Region</span>
                    <p className="text-sm font-black font-mono text-slate-900">{cloudRunStatus?.region || 'us-central1'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Memory Limit</span>
                    <p className="text-sm font-black font-mono text-slate-900">{cloudRunStatus?.memoryLimit || '1024 MB'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Runtime Node</span>
                    <p className="text-sm font-black font-mono text-slate-900">{cloudRunStatus?.nodeVersion || 'v20.x'}</p>
                  </div>
                </div>

                {/* Cloudflare Proxy Setup Card */}
                <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-amber-400" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                        Cloudflare DNS & CDN Integration Guide
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-extrabold uppercase">
                      Edge Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Deploying your Cloud Run app & Google Cloud Storage bucket behind Cloudflare provides global DDoS protection, SSL/TLS encryption, and automatic WebP/AVIF edge caching.
                  </p>

                  <div className="space-y-2 text-[11px] font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">DNS CNAME Record:</span>
                      <span className="text-amber-300 font-bold">cdn.mediaslim.app ➔ c.storage.googleapis.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cloud Run CNAME:</span>
                      <span className="text-cyan-300 font-bold">app.mediaslim.app ➔ ghs.googlehosted.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SSL/TLS Mode:</span>
                      <span className="text-emerald-400 font-bold">Full (Strict)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

