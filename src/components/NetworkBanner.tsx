import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { subscribeNetworkStatus, setSimulatedOffline } from '../services/network';
import { subscribeSyncProgress, syncQueue } from '../services/sync';
import { getSettings, saveSettings } from '../services/db';

interface NetworkBannerProps {
  pendingCount: number;
  onRefreshNeeded: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ pendingCount, onRefreshNeeded }) => {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [simulatedOffline, setSimulatedOfflineState] = useState<boolean>(false);

  useEffect(() => {
    // Load setting
    getSettings().then((s) => {
      setSimulatedOfflineState(s.simulateOffline);
    });

    const unsubNetwork = subscribeNetworkStatus((status) => {
      setOnline(status);
    });

    const unsubSync = subscribeSyncProgress((syncing, _, msg) => {
      setIsSyncing(syncing);
      if (msg) setSyncMessage(msg);
      if (!syncing) {
        onRefreshNeeded();
      }
    });

    return () => {
      unsubNetwork();
      unsubSync();
    };
  }, [onRefreshNeeded]);

  const toggleSimulate = async () => {
    const nextVal = !simulatedOffline;
    setSimulatedOfflineState(nextVal);
    setSimulatedOffline(nextVal);
    const s = await getSettings();
    s.simulateOffline = nextVal;
    await saveSettings(s);
  };

  const handleManualSync = async () => {
    await syncQueue();
    onRefreshNeeded();
  };

  return (
    <div className="w-full bg-slate-900 text-white shadow-md transition-all">
      {/* Network Status Header Bar */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          {online ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Wifi className="w-4 h-4" />
              <span>Đang kết nối (Online)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <WifiOff className="w-4 h-4" />
              <span>Ngoại tuyến (Offline Mode)</span>
              {simulatedOffline && <span className="text-[11px] bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-300 border border-amber-600/40">Giả lập</span>}
            </span>
          )}

          {pendingCount > 0 && (
            <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full text-xs font-semibold border border-sky-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {pendingCount} chờ đồng bộ
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Simulate Offline Toggle */}
          <button
            onClick={toggleSimulate}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
            title="Bật/Tắt chế độ giả lập mất mạng để test tính năng Offline-First"
          >
            {simulatedOffline ? (
              <>
                <ToggleRight className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">Tắt giả lập</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span className="text-[11px]">Test Offline</span>
              </>
            )}
          </button>

          {/* Sync Button */}
          {online && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing || pendingCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs transition cursor-pointer ${
                pendingCount > 0
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow'
                  : 'bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync in-progress banner */}
      {isSyncing && (
        <div className="bg-sky-950 border-t border-sky-800/50 px-4 py-1.5 text-center text-xs text-sky-200 flex items-center justify-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
          <span>{syncMessage || 'Đang tự động đẩy dữ liệu lên máy chủ...'}</span>
        </div>
      )}
    </div>
  );
};
