import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    // Detect iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // On iOS, beforeinstallprompt is not supported by Apple Safari.
      // We show the iOS installation banner directly
      setShowBanner(true);
    } else {
      // Android / Chrome / Edge
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

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
    <>
      <div className="bg-sky-50 border-b border-sky-200 px-4 py-2.5 text-xs text-sky-900 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-600 text-white rounded-lg shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <span>
            {isIOS ? (
              <>
                Bạn đang dùng <strong>iOS (iPhone)</strong>? Cài đặt PWA vào màn hình chính để dùng 100% ngoại tuyến!
              </>
            ) : (
              <>
                Cài đặt ứng dụng <strong>VKU Survey</strong> vào màn hình chính để sử dụng mượt mà 100% offline!
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
          >
            {isIOS ? <Share className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isIOS ? 'Cách cài đặt' : 'Cài đặt PWA'}</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 text-sky-600 hover:bg-sky-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Cách Cài Đặt PWA Trên iPhone</span>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apple (iOS) quy định mọi PWA phải được cài đặt thông qua trình duyệt <strong>Safari</strong> theo 3 bước:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 text-xs">1</span>
                <div>
                  Mở trang web bằng trình duyệt <strong>Safari</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 text-xs">2</span>
                <div>
                  Bấm vào nút <strong>Chia sẻ (Share)</strong> có biểu tượng <Share className="w-3.5 h-3.5 inline text-sky-600 mx-1" /> ở thanh công cụ dưới đáy Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 text-xs">3</span>
                <div>
                  Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> &gt; Bấm <strong>Thêm (Add)</strong>.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
