import { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, 
  FileText, 
  ListOrdered, 
  BarChart3, 
  FileSpreadsheet
} from 'lucide-react';
import { NetworkBanner } from './components/NetworkBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { MultiStepForm } from './components/MultiStepForm';
import { SurveyQueueList } from './components/SurveyQueueList';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { GoogleSheetsConfigModal } from './components/GoogleSheetsConfigModal';
import { getAllSurveys } from './services/db';
import { initNetworkMonitoring } from './services/network';
import { initAutoSync } from './services/sync';
import type { SmartphoneSurveyItem } from './types/survey';

export function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'queue' | 'stats'>('form');
  const [surveys, setSurveys] = useState<SmartphoneSurveyItem[]>([]);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);

  // Load surveys from IndexedDB
  const refreshSurveys = useCallback(async () => {
    try {
      const items = await getAllSurveys();
      setSurveys(items);
    } catch (err) {
      console.error('Lỗi tải danh sách khảo sát:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Initialize Network monitoring
    initNetworkMonitoring();

    // 2. Initialize Auto sync on online reconnect
    initAutoSync();

    // 3. Initial load from IndexedDB
    refreshSurveys();
  }, [refreshSurveys]);

  const pendingCount = surveys.filter((s) => s.syncStatus === 'PENDING_SYNC').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased pb-20 md:pb-6">
      {/* Real-time Network Banner */}
      <NetworkBanner pendingCount={pendingCount} onRefreshNeeded={refreshSurveys} />

      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  VKU Mini-Project 1
                </span>
                <span className="text-[10px] font-semibold text-slate-400">PWA & Capacitor</span>
              </div>
              <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                Khảo Sát Nhu Cầu Sử Dụng Điện Thoại
              </h1>
            </div>
          </div>

          {/* Header Action: Google Sheets Config */}
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition cursor-pointer shadow-xs"
            title="Cấu hình kết nối cơ sở dữ liệu Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Google Sheets DB</span>
          </button>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4 hidden md:flex items-center gap-1 border-t border-slate-100 pt-1">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'form'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Thu Thập Khảo Sát</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer relative ${
              activeTab === 'queue'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Hàng Đợi Ngoại Tuyến</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'stats'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống Kê Dữ Liệu</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1">
        {activeTab === 'form' && (
          <MultiStepForm
            onSurveySubmitted={() => {
              refreshSurveys();
              setActiveTab('queue');
            }}
          />
        )}

        {activeTab === 'queue' && (
          <SurveyQueueList surveys={surveys} onRefreshNeeded={refreshSurveys} />
        )}

        {activeTab === 'stats' && <StatisticsDashboard surveys={surveys} />}
      </main>

      {/* Mobile Bottom Navigation Bar (App Shell UI) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around py-2 px-1 shadow-lg">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'form' ? 'text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Tạo phiếu</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer relative ${
            activeTab === 'queue' ? 'text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <div className="relative">
            <ListOrdered className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Hàng đợi</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'stats' ? 'text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Thống kê</span>
        </button>

        <button
          onClick={() => setIsSheetsModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 hover:text-emerald-700 transition cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px]">Google Sheets</span>
        </button>
      </nav>

      {/* Google Sheets Modal */}
      <GoogleSheetsConfigModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
}
export default App;
