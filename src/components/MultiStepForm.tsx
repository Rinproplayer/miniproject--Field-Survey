import { useState, useEffect } from 'react';
import { 
  Smartphone, 
  MapPin, 
  User, 
  Star, 
  Camera as CameraIcon, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Save, 
  Upload, 
  X,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { 
  SmartphoneSurveyItem, 
  PhoneBrand, 
  BudgetSegment, 
  PrimaryUsage, 
  TargetAudience 
} from '../types/survey';
import { saveCurrentDraft, getCurrentDraft, clearCurrentDraft, saveSurvey } from '../services/db';
import { takePhoto, openWebFilePicker } from '../services/camera';
import { isOnline } from '../services/network';
import { syncQueue } from '../services/sync';

interface MultiStepFormProps {
  onSurveySubmitted: () => void;
}

const BRAND_OPTIONS: PhoneBrand[] = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme', 'Google Pixel', 'Khác'];

const BUDGET_OPTIONS: BudgetSegment[] = [
  'Dưới 5 triệu',
  '5 - 10 triệu',
  '10 - 15 triệu',
  '15 - 25 triệu',
  'Trên 25 triệu (Flagship)',
];

const USAGE_OPTIONS: PrimaryUsage[] = [
  'Học tập & Tra cứu',
  'Chơi game (Gaming đồ họa nặng)',
  'Chụp ảnh & Quay Vlog / TikTok',
  'Mạng xã hội & Giải trí',
  'Công việc & Đa nhiệm cao',
  'Pin trâu & Di chuyển nhiều',
];

const LOCATION_SUGGESTIONS = [
  'VKU - Giảng đường Khu A',
  'VKU - Giảng đường Khu V',
  'VKU - Thư viện trung tâm',
  'VKU - Ký túc xá sinh viên',
  'VKU - Căn tin & Khu thể thao',
  'Khu vực ngoài khuôn viên trường',
];

const FEATURE_OPTIONS = [
  'Thời lượng pin khủng (>5000mAh) & Sạc nhanh',
  'Hiệu năng chip mạnh (Snapdragon / Apple A-series)',
  'Cụm Camera chụp đêm, chống rung OIS sắc nét',
  'Màn hình OLED / AMOLED tần số quét 120Hz',
  'Thiết kế mỏng nhẹ, độ bền cao, kháng nước IP68',
  'Giá cả hợp lý, chế độ bảo hành dài hạn',
];

export const MultiStepForm: React.FC<MultiStepFormProps> = ({ onSurveySubmitted }) => {
  const [step, setStep] = useState<number>(1);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [auditorName, setAuditorName] = useState<string>('Nguyễn Thành Toàn');
  const [surveyLocation, setSurveyLocation] = useState<string>('VKU - Giảng đường Khu A');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Sinh viên VKU');
  const [currentBrand, setCurrentBrand] = useState<PhoneBrand>('Apple');
  const [currentDeviceName, setCurrentDeviceName] = useState<string>('iPhone 13 Pro');

  const [budgetSegment, setBudgetSegment] = useState<BudgetSegment>('5 - 10 triệu');
  const [primaryUsage, setPrimaryUsage] = useState<PrimaryUsage>('Học tập & Tra cứu');
  const [satisfactionRating, setSatisfactionRating] = useState<number>(4);
  const [priorityFeature, setPriorityFeature] = useState<string>(FEATURE_OPTIONS[0]);
  const [expectedUpgradeTime, setExpectedUpgradeTime] = useState<string>('Trong 3 - 6 tháng');

  const [defectOrFeedbackNotes, setDefectOrFeedbackNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  // 1. Load Draft from IndexedDB on initial mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const draft = await getCurrentDraft();
        if (draft) {
          if (draft.step) setStep(draft.step);
          if (draft.auditorName) setAuditorName(draft.auditorName);
          if (draft.surveyLocation) setSurveyLocation(draft.surveyLocation);
          if (draft.targetAudience) setTargetAudience(draft.targetAudience);
          if (draft.currentBrand) setCurrentBrand(draft.currentBrand);
          if (draft.currentDeviceName) setCurrentDeviceName(draft.currentDeviceName);
          if (draft.budgetSegment) setBudgetSegment(draft.budgetSegment);
          if (draft.primaryUsage) setPrimaryUsage(draft.primaryUsage);
          if (draft.satisfactionRating) setSatisfactionRating(draft.satisfactionRating);
          if (draft.priorityFeature) setPriorityFeature(draft.priorityFeature);
          if (draft.expectedUpgradeTime) setExpectedUpgradeTime(draft.expectedUpgradeTime);
          if (draft.defectOrFeedbackNotes) setDefectOrFeedbackNotes(draft.defectOrFeedbackNotes);
          if (draft.photoUrl) setPhotoUrl(draft.photoUrl);
          setDraftLoaded(true);
        }
      } catch (err) {
        console.error('Lỗi khi đọc draft từ IndexedDB:', err);
      }
    }
    loadDraft();
  }, []);

  // 2. Real-time auto-save to IndexedDB draft
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await saveCurrentDraft({
          step,
          auditorName,
          surveyLocation,
          targetAudience,
          currentBrand,
          currentDeviceName,
          budgetSegment,
          primaryUsage,
          satisfactionRating,
          priorityFeature,
          expectedUpgradeTime,
          defectOrFeedbackNotes,
          photoUrl,
          lastUpdated: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Lỗi tự động lưu nháp:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    step,
    auditorName,
    surveyLocation,
    targetAudience,
    currentBrand,
    currentDeviceName,
    budgetSegment,
    primaryUsage,
    satisfactionRating,
    priorityFeature,
    expectedUpgradeTime,
    defectOrFeedbackNotes,
    photoUrl,
  ]);

  // Handle Photo Capture
  const handleCapturePhoto = async () => {
    const captured = await takePhoto();
    if (captured) {
      setPhotoUrl(captured);
    }
  };

  const handlePickPhoto = async () => {
    const picked = await openWebFilePicker();
    if (picked) {
      setPhotoUrl(picked);
    }
  };

  const handleClearDraft = async () => {
    if (window.confirm('Bạn có chắc muốn xóa bản nháp và nhập lại từ đầu?')) {
      await clearCurrentDraft();
      setStep(1);
      setSurveyLocation('VKU - Giảng đường Khu A');
      setCurrentDeviceName('');
      setDefectOrFeedbackNotes('');
      setPhotoUrl(undefined);
      setSatisfactionRating(4);
      setDraftLoaded(false);
    }
  };

  // Submit Survey Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newSurvey: SmartphoneSurveyItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `survey-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        syncStatus: 'PENDING_SYNC',
        retryCount: 0,
        auditorName,
        surveyLocation,
        targetAudience,
        currentBrand,
        currentDeviceName: currentDeviceName.trim() || `${currentBrand} Standard`,
        budgetSegment,
        primaryUsage,
        satisfactionRating,
        priorityFeature,
        expectedUpgradeTime,
        defectOrFeedbackNotes: defectOrFeedbackNotes.trim(),
        photoUrl,
      };

      // 1. Save locally to IndexedDB Survey Queue
      await saveSurvey(newSurvey);

      // 2. Clear current draft
      await clearCurrentDraft();

      // 3. Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 4. If online, trigger immediate sync
      if (isOnline()) {
        syncQueue().catch(console.error);
      }

      // 5. Reset form state
      setStep(1);
      setCurrentDeviceName('');
      setDefectOrFeedbackNotes('');
      setPhotoUrl(undefined);
      setDraftLoaded(false);

      onSurveySubmitted();
    } catch (error) {
      console.error('Lỗi khi nộp phiếu khảo sát:', error);
      alert('Đã xảy ra lỗi khi lưu phiếu khảo sát vào IndexedDB.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header & Steps Indicator */}
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg leading-tight">Khảo Sát Nhu Cầu Sử Dụng Điện Thoại</h2>
              <p className="text-xs text-sky-100">Dữ liệu được lưu trữ ngoại tuyến tức thì vào IndexedDB</p>
            </div>
          </div>
          {draftLoaded && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Save className="w-3 h-3" /> Đã khôi phục bản nháp
            </span>
          )}
        </div>

        {/* Multi-step progress bar */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-medium">
          <div 
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 cursor-pointer transition ${step === 1 ? 'text-white font-bold' : 'text-sky-200 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-white text-sky-700 font-bold' : 'bg-sky-500/40 text-white'}`}>1</span>
            <span>Địa bàn & Thiết bị</span>
          </div>

          <div className="h-[2px] flex-1 mx-2 bg-white/20">
            <div className={`h-full bg-white transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
          </div>

          <div 
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 cursor-pointer transition ${step === 2 ? 'text-white font-bold' : 'text-sky-200 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-white text-sky-700 font-bold' : 'bg-sky-500/40 text-white'}`}>2</span>
            <span>Nhu cầu & Tiêu chí</span>
          </div>

          <div className="h-[2px] flex-1 mx-2 bg-white/20">
            <div className={`h-full bg-white transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
          </div>

          <div 
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 cursor-pointer transition ${step === 3 ? 'text-white font-bold' : 'text-sky-200 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-white text-sky-700 font-bold' : 'bg-sky-500/40 text-white'}`}>3</span>
            <span>Ảnh & Ghi chú</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
        {/* ================= STEP 1: ĐỊA BÀN & THIẾT BỊ HIỆN TẠI ================= */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 flex items-start gap-2.5 text-xs text-sky-800">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bước 1:</strong> Thu thập thông tin địa bàn thực địa (tương đương tiêu chí Building/Floor trong VKU Campus Inspection) và thiết bị hiện có của người được khảo sát.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auditor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên điều tra viên / Sinh viên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    placeholder="VD: Nguyễn Thành Toàn (23ITB)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đối tượng người được khảo sát
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                >
                  <option value="Sinh viên VKU">Sinh viên VKU</option>
                  <option value="Học sinh">Học sinh THPT</option>
                  <option value="Nhân viên văn phòng">Nhân viên văn phòng / Giảng viên</option>
                  <option value="Tự do / Khác">Tự do / Khác</option>
                </select>
              </div>
            </div>

            {/* Survey Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa điểm thực địa khảo sát (Khuôn viên / Phòng học)
              </label>
              <input
                type="text"
                list="locations-list"
                value={surveyLocation}
                onChange={(e) => setSurveyLocation(e.target.value)}
                placeholder="Chọn hoặc nhập địa điểm khảo sát..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
              <datalist id="locations-list">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Current Brand Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Hãng điện thoại đang sử dụng hiện tại
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BRAND_OPTIONS.map((brand) => {
                  const selected = currentBrand === brand;
                  return (
                    <button
                      type="button"
                      key={brand}
                      onClick={() => setCurrentBrand(brand)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition text-center cursor-pointer ${
                        selected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Device Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên dòng máy cụ thể đang dùng
              </label>
              <input
                type="text"
                value={currentDeviceName}
                onChange={(e) => setCurrentDeviceName(e.target.value)}
                placeholder="VD: iPhone 13 128GB, Samsung Galaxy A54 5G, Xiaomi Redmi Note 12..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: NHU CẦU & TIÊU CHÍ KỸ THUẬT ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 flex items-start gap-2.5 text-xs text-sky-800">
              <Cpu className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bước 2:</strong> Khảo sát nhu cầu thực tế, phân khúc tài chính và đánh giá mức độ hài lòng (1-5 Sao) từ người dùng.
              </span>
            </div>

            {/* Satisfaction Rating (1-5 Stars) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mức độ hài lòng với máy hiện tại (1 - 5 Sao)
              </label>
              <p className="text-xs text-slate-500 mb-3">Tương đương tiêu chí Condition Rating theo đề bài</p>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSatisfactionRating(star)}
                    className="p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition ${
                        star <= satisfactionRating
                          ? 'text-amber-400 fill-amber-400 scale-105'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm font-semibold text-slate-700">
                  {satisfactionRating === 1 && '1 Sao: Rất kém / Hay hỏng'}
                  {satisfactionRating === 2 && '2 Sao: Xuống cấp / Pin chai'}
                  {satisfactionRating === 3 && '3 Sao: Tạm ổn / Đủ dùng'}
                  {satisfactionRating === 4 && '4 Sao: Hoạt động tốt / Hài lòng'}
                  {satisfactionRating === 5 && '5 Sao: Rất tuyệt vời / Xuất sắc'}
                </span>
              </div>
            </div>

            {/* Budget Segment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Phân khúc ngân sách dự kiến khi mua / đổi máy mới
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BUDGET_OPTIONS.map((bg) => {
                  const selected = budgetSegment === bg;
                  return (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setBudgetSegment(bg)}
                      className={`py-2.5 px-3 text-xs font-medium rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selected
                          ? 'bg-sky-50 text-sky-900 border-sky-600 font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{bg}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Usage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Mục đích sử dụng chính quan trọng nhất
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {USAGE_OPTIONS.map((usg) => {
                  const selected = primaryUsage === usg;
                  return (
                    <button
                      type="button"
                      key={usg}
                      onClick={() => setPrimaryUsage(usg)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selected
                          ? 'bg-sky-50 text-sky-900 border-sky-600 font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{usg}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Feature */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tiêu chí công nghệ ưu tiên hàng đầu
              </label>
              <select
                value={priorityFeature}
                onChange={(e) => setPriorityFeature(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                {FEATURE_OPTIONS.map((feat) => (
                  <option key={feat} value={feat}>{feat}</option>
                ))}
              </select>
            </div>

            {/* Expected Upgrade Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Thời gian dự kiến lên đời / mua máy
              </label>
              <select
                value={expectedUpgradeTime}
                onChange={(e) => setExpectedUpgradeTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="Trong 1 - 3 tháng tới">Trong 1 - 3 tháng tới</option>
                <option value="Trong 3 - 6 tháng tới">Trong 3 - 6 tháng tới</option>
                <option value="Dịp cuối năm / Tết">Dịp cuối năm / Tết</option>
                <option value="Chưa có nhu cầu đổi máy">Chưa có nhu cầu đổi máy</option>
              </select>
            </div>
          </div>
        )}

        {/* ================= STEP 3: BẰNG CHỨNG THỰC ĐỊA & HÌNH ẢNH ================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 flex items-start gap-2.5 text-xs text-sky-800">
              <CameraIcon className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bước 3:</strong> Chụp ảnh bằng chứng thực địa (sử dụng Capacitor Camera / Web Media API) và ghi nhận phản hồi lỗi hoặc kỳ vọng thị trường.
              </span>
            </div>

            {/* Photo Capture Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Ảnh minh chứng thiết bị / hiện trường khảo sát
              </label>

              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-64">
                  <img src={photoUrl} alt="Captured preview" className="max-h-64 object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-500 transition cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/40 hover:bg-sky-50 transition cursor-pointer group"
                  >
                    <div className="p-3 bg-sky-100 text-sky-600 rounded-full group-hover:scale-110 transition">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <span className="mt-2 text-xs font-semibold text-sky-800">Chụp bằng Camera</span>
                    <span className="text-[11px] text-sky-600">Capacitor Camera Native</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer group"
                  >
                    <div className="p-3 bg-slate-200 text-slate-600 rounded-full group-hover:scale-110 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="mt-2 text-xs font-semibold text-slate-700">Tải ảnh từ thư viện</span>
                    <span className="text-[11px] text-slate-500">File Picker Fallback</span>
                  </button>
                </div>
              )}
            </div>

            {/* Defect Notes & Market Feedback */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú lỗi thiết bị cũ / Nhu cầu cải tiến (Defect Notes & Feedback)
              </label>
              <textarea
                rows={4}
                value={defectOrFeedbackNotes}
                onChange={(e) => setDefectOrFeedbackNotes(e.target.value)}
                placeholder="VD: Điện thoại hiện tại chai pin sau 2 năm dùng, máy nóng khi chơi game. Nhu cầu máy mới cần sạc nhanh 67W, màn hình chống lóa khi dùng ngoài trời..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <div className="font-semibold text-slate-800 mb-1">Tóm tắt phiếu khảo sát:</div>
              <div>• <strong>Địa bàn:</strong> {surveyLocation} ({targetAudience})</div>
              <div>• <strong>Thiết bị:</strong> {currentBrand} {currentDeviceName} - Đánh giá: {satisfactionRating}/5 Sao</div>
              <div>• <strong>Nhu cầu:</strong> {budgetSegment} | {primaryUsage}</div>
            </div>
          </div>
        )}

        {/* Navigation Actions Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearDraft}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Xóa nháp và làm lại"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nháp</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition cursor-pointer"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Đang lưu vào IndexedDB...' : 'Lưu & Nộp Khảo Sát'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
