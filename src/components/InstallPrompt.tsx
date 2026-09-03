import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-sky-50 border-b border-sky-200 px-4 py-2.5 text-xs text-sky-900 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-sky-600 text-white rounded-lg">
          <Smartphone className="w-4 h-4" />
        </div>
        <span>
          Cài đặt ứng dụng <strong>VKU Survey</strong> vào màn hình chính để sử dụng mượt mà 100% offline!
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Cài đặt PWA</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-sky-600 hover:bg-sky-100 rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
