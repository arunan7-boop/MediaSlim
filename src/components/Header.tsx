import React from 'react';
import { Cloud, Sliders, HardDrive, Sparkles, ShieldCheck } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

interface HeaderProps {
  cloudUsedBytes: number;
  cloudQuotaBytes: number;
  onOpenCloudVault: () => void;
  queueCount: number;
  completedCount: number;
  totalBytesSaved: number;
  user?: any;
  onLoginSuccess: (userInfo: any) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cloudUsedBytes,
  cloudQuotaBytes,
  onOpenCloudVault,
  queueCount,
  completedCount,
  totalBytesSaved,
  user,
  onLoginSuccess,
  onLogout
}) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + tokenResponse.access_token);
        const userInfo = await res.json();
        onLoginSuccess(userInfo);
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    },
    onError: (error) => console.log('Login Failed:', error)
  });

  const handleLogout = () => {
    googleLogout();
    onLogout();
  };

  const quotaPercent = Math.min(100, (cloudUsedBytes / cloudQuotaBytes) * 100);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-8 shrink-0 flex items-center transition-colors shadow-xs">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                MEDIASLIM
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                PRO
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 hidden sm:block">
              Smart Minimalist Batch Image & Video Compression
            </p>
          </div>
        </div>

        {/* Global Stats & Cloud Storage Indicator Bar */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Cloud Storage
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-28 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, quotaPercent)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-800 font-mono">
                {formatBytes(cloudUsedBytes, 1)} / {formatBytes(cloudQuotaBytes, 0)}
              </span>
            </div>
          </div>

          {totalBytesSaved > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              <span>Saved {formatBytes(totalBytesSaved)}</span>
            </div>
          )}

          {/* Login/Logout Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 hidden md:block">
                {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-all border border-slate-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              Sign in with Google
            </button>
          )}

          {/* Secure Cloud Storage Vault Button */}
          <button
            onClick={onOpenCloudVault}
            id="open-cloud-vault-btn"
            className="bg-slate-900 text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
            title="Open Cloud Vault"
          >
            <Cloud className="w-4 h-4 text-slate-200" />
            <span>Cloud Vault</span>
          </button>
        </div>
      </div>
    </header>
  );
};
