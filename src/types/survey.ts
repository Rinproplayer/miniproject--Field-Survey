export type SyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'FAILED';

export type PhoneBrand = 'Apple' | 'Samsung' | 'Xiaomi' | 'OPPO' | 'Vivo' | 'Realme' | 'Google Pixel' | 'Khác';

export type BudgetSegment = 'Dưới 5 triệu' | '5 - 10 triệu' | '10 - 15 triệu' | '15 - 25 triệu' | 'Trên 25 triệu (Flagship)';

export type PrimaryUsage = 
  | 'Học tập & Tra cứu' 
  | 'Chơi game (Gaming đồ họa nặng)' 
  | 'Chụp ảnh & Quay Vlog / TikTok' 
  | 'Mạng xã hội & Giải trí' 
  | 'Công việc & Đa nhiệm cao'
  | 'Pin trâu & Di chuyển nhiều';

export type TargetAudience = 'Sinh viên VKU' | 'Học sinh' | 'Nhân viên văn phòng' | 'Tự do / Khác';

export interface SmartphoneSurveyItem {
  id: string; // UUID v4
  timestamp: string; // ISO 8601 string
  syncStatus: SyncStatus;
  syncedAt?: string;
  errorMessage?: string;
  retryCount: number;

  // Step 1: Địa bàn & Thông tin đối tượng khảo sát
  surveyLocation: string; // Ví dụ: Giảng đường Khu A, Khu V, Căn tin VKU, Ký túc xá, v.v.
  targetAudience: TargetAudience;
  currentBrand: PhoneBrand;
  currentDeviceName: string; // Ví dụ: iPhone 12, Redmi Note 11...

  // Step 2: Nhu cầu thị trường & Tiêu chí kỹ thuật
  budgetSegment: BudgetSegment;
  primaryUsage: PrimaryUsage;
  satisfactionRating: number; // 1 đến 5 sao (Tương đương 1-5 Star Rating từ tiêu chí VKU)
  priorityFeature: string; // Pin > 5000mAh, Chipset mạnh, Camera AI nét, Màn hình 120Hz, Thiết kế sang trọng...
  expectedUpgradeTime: string; // Trong 1-3 tháng, 3-6 tháng, Cuối năm, Chưa có nhu cầu

  // Step 3: Bằng chứng thực tế & Ghi chú
  defectOrFeedbackNotes: string; // Phản ánh lỗi thiết bị cũ / Nhu cầu cải tiến thị trường
  photoUrl?: string; // Base64 data URI chụp ảnh thiết bị hoặc phiếu thực địa qua Camera
  auditorName: string; // Tên điều tra viên / sinh viên khảo sát
}

export type SmartphoneDraft = Partial<SmartphoneSurveyItem> & {
  step: number;
  lastUpdated: string;
};

export interface AppSettings {
  googleSheetsWebhookUrl: string;
  mockApiUrl: string;
  autoSyncOnReconnect: boolean;
  simulateOffline: boolean;
}
