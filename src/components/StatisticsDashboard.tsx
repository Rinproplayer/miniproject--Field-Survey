import { useState } from 'react';
import type { SmartphoneSurveyItem } from '../types/survey';
import { fetchSurveysFromGoogleSheets } from '../services/sync';
import { 
  BarChart3, 
  PieChart, 
  Star, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  FileCode,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';

interface StatisticsDashboardProps {
  surveys: SmartphoneSurveyItem[];
  onRefreshNeeded?: () => void;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ surveys, onRefreshNeeded }) => {
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePullGoogleSheets = async () => {
    setIsPulling(true);
    setSyncNotice(null);
    const result = await fetchSurveysFromGoogleSheets();
    setIsPulling(false);

    if (result.error) {
      setSyncNotice({ type: 'error', message: result.error });
    } else {
      setSyncNotice({
        type: 'success',
        message: `Đã đồng bộ thành công ${result.count} phiếu khảo sát từ Google Sheets vào bảng thống kê!`,
      });
      onRefreshNeeded?.();
    }
  };
  const total = surveys.length;
  const synced = surveys.filter((s) => s.syncStatus === 'SYNCED').length;
  const pending = surveys.filter((s) => s.syncStatus === 'PENDING_SYNC').length;

  // Average Rating
  const avgRating = total > 0 
    ? (surveys.reduce((acc, s) => acc + s.satisfactionRating, 0) / total).toFixed(1)
    : '0.0';

  // Brand Distribution
  const brandCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    brandCounts[s.currentBrand] = (brandCounts[s.currentBrand] || 0) + 1;
  });

  // Budget Segment Distribution
  const budgetCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    budgetCounts[s.budgetSegment] = (budgetCounts[s.budgetSegment] || 0) + 1;
  });

  // Primary Usage Distribution
  const usageCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    usageCounts[s.primaryUsage] = (usageCounts[s.primaryUsage] || 0) + 1;
  });

  // Export to CSV with UTF-8 BOM for Excel compatibility
  const exportToCSV = () => {
    if (surveys.length === 0) {
      alert('Chưa có dữ liệu để xuất file CSV');
      return;
    }

    const headers = [
      'Mã UUID',
      'Thời gian khảo sát',
      'Trạng thái đồng bộ',
      'Điều tra viên',
      'Địa bàn / Khuôn viên',
      'Đối tượng',
      'Hãng máy',
      'Dòng máy',
      'Phân khúc ngân sách',
      'Nhu cầu chính',
      'Đánh giá sao (1-5)',
      'Tiêu chí ưu tiên',
      'Thời gian dự kiến lên đời',
      'Ghi chú & Phản hồi',
    ];

    const rows = surveys.map((s) => [
      `"${s.id}"`,
      `"${s.timestamp}"`,
      `"${s.syncStatus}"`,
      `"${s.auditorName.replace(/"/g, '""')}"`,
      `"${s.surveyLocation.replace(/"/g, '""')}"`,
      `"${s.targetAudience}"`,
      `"${s.currentBrand}"`,
      `"${s.currentDeviceName.replace(/"/g, '""')}"`,
      `"${s.budgetSegment}"`,
      `"${s.primaryUsage}"`,
      s.satisfactionRating,
      `"${s.priorityFeature.replace(/"/g, '""')}"`,
      `"${s.expectedUpgradeTime}"`,
      `"${(s.defectOrFeedbackNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `khao-sat-thi-truong-dien-thoai-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    if (surveys.length === 0) {
      alert('Chưa có dữ liệu để xuất file JSON');
      return;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(surveys, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.setAttribute('download', `khao-sat-thi-truong-dien-thoai-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Google Sheets Sync Action Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Đồng Bộ Cơ Sở Dữ Liệu Google Sheets</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tải toàn bộ các phiếu khảo sát được thu thập từ tất cả các máy vào bảng thống kê này.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePullGoogleSheets}
            disabled={isPulling}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
            <span>{isPulling ? 'Đang tải từ Google Sheets...' : 'Đồng bộ từ Google Sheets'}</span>
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1IQMieaQYSxdWW_G_FlVtJaH6ffGZ0ci00tvW4B8L6qs/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Mở file Google Sheets trên tab mới"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Sync Notification Notice */}
      {syncNotice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
            syncNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {syncNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>{syncNotice.message}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng số phiếu</span>
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{total}</div>
          <span className="text-[11px] text-slate-400">Dữ liệu thu thập thực địa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã đồng bộ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{synced}</div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {total > 0 ? `${Math.round((synced / total) * 100)}% hoàn thành` : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Chờ đồng bộ</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pending}</div>
          <span className="text-[11px] text-amber-600 font-medium">Lưu trong IndexedDB</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Hài lòng TB</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{avgRating} <span className="text-xs text-slate-400 font-normal">/ 5</span></div>
          <span className="text-[11px] text-slate-400">Thang điểm 1–5 sao</span>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm">Xuất Dữ Liệu Nghiên Cứu Thị Trường</h4>
          <p className="text-xs text-sky-100">Xuất toàn bộ bảng dữ liệu ra file Excel (CSV tiếng Việt có dấu) hoặc JSON</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-sky-900 rounded-xl text-xs font-bold shadow hover:bg-sky-50 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất CSV (Excel)</span>
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-800/80 text-white rounded-xl text-xs font-bold hover:bg-sky-900 transition cursor-pointer border border-sky-400/30"
          >
            <FileCode className="w-4 h-4" />
            <span>Xuất JSON</span>
          </button>
        </div>
      </div>

      {/* Charts / Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Thị Phần Thương Hiệu Hiện Tại</span>
            </h4>
            <span className="text-xs text-slate-400">{Object.keys(brandCounts).length} thương hiệu</span>
          </div>

          {total === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có dữ liệu thống kê</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(brandCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([brand, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={brand} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-700 mb-1">
                        <span>{brand}</span>
                        <span className="text-slate-500">{count} phiếu ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Budget Segment Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Phân Khúc Ngân Sách Dự Kiến</span>
            </h4>
            <span className="text-xs text-slate-400">Xu hướng tài chính</span>
          </div>

          {total === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có dữ liệu thống kê</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(budgetCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([segment, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={segment} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-700 mb-1">
                        <span>{segment}</span>
                        <span className="text-slate-500">{count} phiếu ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Primary Usage Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 md:col-span-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Mục Đích Sử Dụng Chính (Thị Hiếu Người Dùng)</span>
          </h4>

          {total === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có dữ liệu thống kê</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(usageCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([usage, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={usage} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-800 mb-1">{usage}</div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>{count} lựa chọn</span>
                        <span className="font-bold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
