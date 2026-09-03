import { useState } from 'react';
import type { 
  SmartphoneSurveyItem, 
  SyncStatus 
} from '../types/survey';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Star, 
  MapPin, 
  User, 
  Calendar,
  X,
  Smartphone,
  FileSpreadsheet,
  ExternalLink,
  Info
} from 'lucide-react';
import { deleteSurvey, updateSurveyStatus } from '../services/db';
import { syncQueue } from '../services/sync';

interface SurveyQueueListProps {
  surveys: SmartphoneSurveyItem[];
  onRefreshNeeded: () => void;
}

export const SurveyQueueList: React.FC<SurveyQueueListProps> = ({ surveys, onRefreshNeeded }) => {
  const [filter, setFilter] = useState<'ALL' | SyncStatus>('ALL');
  const [selectedSurvey, setSelectedSurvey] = useState<SmartphoneSurveyItem | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const filteredSurveys = surveys.filter((s) => {
    if (filter === 'ALL') return true;
    return s.syncStatus === filter;
  });

  const pendingCount = surveys.filter((s) => s.syncStatus === 'PENDING_SYNC').length;
  const syncedCount = surveys.filter((s) => s.syncStatus === 'SYNCED').length;
  const failedCount = surveys.filter((s) => s.syncStatus === 'FAILED').length;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi khảo sát này khỏi bộ nhớ máy?')) {
      await deleteSurvey(id);
      onRefreshNeeded();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncQueue();
    setIsSyncing(false);
    onRefreshNeeded();
  };

  const handleRetrySingle = async (item: SmartphoneSurveyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateSurveyStatus(item.id, 'PENDING_SYNC');
    setIsSyncing(true);
    await syncQueue();
    setIsSyncing(false);
    onRefreshNeeded();
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Global Sync Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Hàng Đợi Khảo Sát Ngoại Tuyến (Offline Queue)</h3>
          <p className="text-xs text-slate-500">
            Tổng cộng {surveys.length} phiếu trên máy này ({pendingCount} chờ gửi, {syncedCount} đã đồng bộ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://docs.google.com/spreadsheets/d/1IQMieaQYSxdWW_G_FlVtJaH6ffGZ0ci00tvW4B8L6qs/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition shadow-xs"
            title="Mở Google Sheets để xem toàn bộ dữ liệu tập trung đã đồng bộ từ tất cả các máy"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Mở Google Sheets</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || pendingCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              pendingCount > 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang gửi...' : `Đồng bộ (${pendingCount})`}</span>
          </button>
        </div>
      </div>

      {/* Cloud database explanation banner */}
      <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl flex items-start gap-2 text-xs text-sky-900">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          <strong>Lưu ý về cơ sở dữ liệu:</strong> Bảng dưới đây là <strong>Hàng đợi ngoại tuyến (Offline Queue)</strong> lưu trong bộ nhớ cục bộ (IndexedDB) của thiết bị/trình duyệt này để phục vụ khi mất mạng. Toàn bộ phiếu khảo sát đã gửi thành công đều được lưu trữ vĩnh viễn và tập hợp tại <strong>Google Sheets Database</strong> đám mây chung!
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả ({surveys.length})
        </button>

        <button
          onClick={() => setFilter('PENDING_SYNC')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'PENDING_SYNC'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Chờ đồng bộ ({pendingCount})</span>
        </button>

        <button
          onClick={() => setFilter('SYNCED')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'SYNCED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Đã đồng bộ ({syncedCount})</span>
        </button>

        {failedCount > 0 && (
          <button
            onClick={() => setFilter('FAILED')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'FAILED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Lỗi ({failedCount})</span>
          </button>
        )}
      </div>

      {/* List of Survey Cards */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 space-y-2">
          <Smartphone className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-medium">Không có phiếu khảo sát nào trong mục này</p>
          <p className="text-xs text-slate-400">Hãy chuyển sang tab "Tạo Khảo Sát Mới" để thu thập dữ liệu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSurveys.map((item) => {
            const isPending = item.syncStatus === 'PENDING_SYNC';
            const isSynced = item.syncStatus === 'SYNCED';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedSurvey(item)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status Badge + Date */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3 animate-pulse" /> PENDING_SYNC
                      </span>
                    )}
                    {isSynced && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> SYNCED
                      </span>
                    )}
                    {!isPending && !isSynced && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3 h-3" /> FAILED
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {/* Device & Brand Headline */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="bg-sky-100 text-sky-800 text-xs px-1.5 py-0.5 rounded font-bold">
                          {item.currentBrand}
                        </span>
                        <span>{item.currentDeviceName}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.surveyLocation}</span>
                      </p>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-800">{item.satisfactionRating}/5</span>
                    </div>
                  </div>

                  {/* Details Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 mb-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.budgetSegment}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.primaryUsage}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">
                      {item.targetAudience}
                    </span>
                  </div>

                  {/* Feedback Snippet */}
                  {item.defectOrFeedbackNotes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2 italic mb-3 border border-slate-100">
                      "{item.defectOrFeedbackNotes}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.auditorName}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={(e) => handleRetrySingle(item, e)}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Đồng bộ bản ghi này"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa phiếu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSurvey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">Chi Tiết Phiếu Khảo Sát</h3>
              </div>
              <button
                onClick={() => setSelectedSurvey(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview if any */}
            {selectedSurvey.photoUrl && (
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                <img
                  src={selectedSurvey.photoUrl}
                  alt="Field Evidence"
                  className="max-h-60 object-contain"
                />
              </div>
            )}

            {/* Detailed Table */}
            <div className="text-xs space-y-2.5 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mã định danh (UUID v4):</span>
                <span className="font-mono text-[11px] font-semibold text-sky-800">{selectedSurvey.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Thời gian tạo:</span>
                <span>{formatDate(selectedSurvey.timestamp)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Trạng thái đồng bộ:</span>
                <span className="font-semibold">{selectedSurvey.syncStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Điều tra viên:</span>
                <span className="font-medium">{selectedSurvey.auditorName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Địa bàn / Khuôn viên:</span>
                <span className="font-medium">{selectedSurvey.surveyLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Đối tượng khảo sát:</span>
                <span>{selectedSurvey.targetAudience}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Thiết bị đang dùng:</span>
                <span className="font-bold text-slate-800">{selectedSurvey.currentBrand} {selectedSurvey.currentDeviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mức độ hài lòng (1-5 Sao):</span>
                <span className="font-bold text-amber-600">{selectedSurvey.satisfactionRating} / 5 Sao</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Phân khúc dự kiến mua:</span>
                <span className="font-semibold text-emerald-700">{selectedSurvey.budgetSegment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nhu cầu chính:</span>
                <span>{selectedSurvey.primaryUsage}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Tiêu chí ưu tiên:</span>
                <span>{selectedSurvey.priorityFeature}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Dự kiến lên đời:</span>
                <span>{selectedSurvey.expectedUpgradeTime}</span>
              </div>
            </div>

            {selectedSurvey.defectOrFeedbackNotes && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Ghi chú & Đóng góp ý kiến:</span>
                <div className="bg-slate-100 p-3 rounded-xl text-slate-800 italic">
                  "{selectedSurvey.defectOrFeedbackNotes}"
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSurvey(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
