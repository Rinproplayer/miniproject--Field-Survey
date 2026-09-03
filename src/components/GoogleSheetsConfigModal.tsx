import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Copy, 
  Check, 
  Save, 
  HelpCircle
} from 'lucide-react';
import { getSettings, saveSettings } from '../services/db';

interface GoogleSheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APPS_SCRIPT_TEMPLATE = `// Google Apps Script: Mở Google Sheet -> Tiện ích mở rộng (Extensions) -> Apps Script
// Dán đoạn mã này vào và bấm Deploy -> New deployment -> Web App (Chọn Anyone có quyền truy cập)

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo dòng tiêu đề nếu trang tính đang trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "UUID", "Thời gian", "Điều tra viên", "Địa bàn khảo sát", 
        "Đối tượng", "Hãng máy", "Dòng máy", "Phân khúc ngân sách", 
        "Nhu cầu chính", "Đánh giá sao", "Tiêu chí ưu tiên", 
        "Dự kiến lên đời", "Ghi chú & Lỗi cũ", "Ảnh đính kèm"
      ]);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.id,
      data.timestamp,
      data.auditorName,
      data.surveyLocation,
      data.targetAudience,
      data.currentBrand,
      data.currentDeviceName,
      data.budgetSegment,
      data.primaryUsage,
      data.satisfactionRating,
      data.priorityFeature,
      data.expectedUpgradeTime,
      data.defectOrFeedbackNotes,
      data.hasPhoto
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm đọc dữ liệu từ Google Sheets về app
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var list = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[0]) continue;
      list.push({
        id: String(r[0]),
        timestamp: r[1] ? new Date(r[1]).toISOString() : new Date().toISOString(),
        auditorName: String(r[2] || ""),
        surveyLocation: String(r[3] || ""),
        targetAudience: String(r[4] || "Sinh viên VKU"),
        currentBrand: String(r[5] || "Khác"),
        currentDeviceName: String(r[6] || ""),
        budgetSegment: String(r[7] || "5 - 10 triệu"),
        primaryUsage: String(r[8] || "Học tập & Tra cứu"),
        satisfactionRating: Number(r[9]) || 4,
        priorityFeature: String(r[10] || ""),
        expectedUpgradeTime: String(r[11] || ""),
        defectOrFeedbackNotes: String(r[12] || ""),
        hasPhoto: String(r[13] || ""),
        syncStatus: "SYNCED"
      });
    }
    return ContentService.createTextOutput(JSON.stringify(list))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const GoogleSheetsConfigModal: React.FC<GoogleSheetsConfigModalProps> = ({ isOpen, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      getSettings().then((s) => {
        setWebhookUrl(s.googleSheetsWebhookUrl || '');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const s = await getSettings();
    s.googleSheetsWebhookUrl = webhookUrl.trim();
    await saveSettings(s);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-700">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-base">Cấu Hình Cơ Sở Dữ Liệu Google Sheets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Webhook URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Google Apps Script Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <p className="text-[11px] text-slate-500">
            Dữ liệu khảo sát khi đồng bộ sẽ được tự động chèn thành từng hàng (row) vào trang tính Google Sheets của bạn.
          </p>
        </div>

        {/* Guide & Apps Script code box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Mã Nguồn Google Apps Script (1-Click Copy)</span>
            </span>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>
          </div>

          <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-40">
            {APPS_SCRIPT_TEMPLATE}
          </pre>

          <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside">
            <li>Mở Google Sheets mới &gt; Chọn <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
            <li>Dán đoạn mã trên vào &gt; Nhấn <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong>.</li>
            <li>Chọn loại: <strong>Ứng dụng web (Web app)</strong> &gt; Ai có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>.</li>
            <li>Sao chép URL Web app nhận được và dán vào ô bên trên!</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Đã lưu thành công!' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
