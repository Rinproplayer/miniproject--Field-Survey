# VKU Field Survey — Ứng Dụng Khảo Sát Thị Trường Nhu Cầu Sử Dụng Điện Thoại (PWA & Capacitor)

> **Môn học:** Phát triển Ứng dụng Di động Đa nền tảng (Cross-Platform Mobile App Development)  
> **Khoa:** Khoa Công nghệ Thông tin, Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
> **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn  
> **Sinh viên thực hiện:** Nguyễn Thanh Toàn (23ITB)  
> **GitHub Repository:** [https://github.com/Rinproplayer/miniproject--Field-Survey.git](https://github.com/Rinproplayer/miniproject--Field-Survey.git)

---

## 📱 Giới Thiệu Dự Án

Ứng dụng **VKU Field Survey (Smartphone Market Demand)** là giải pháp thu thập dữ liệu điều tra thị trường thực địa hoạt động theo kiến trúc **Offline-First**. Ứng dụng được thiết kế chuyên biệt cho điều tra viên và sinh viên thực hiện khảo sát thị hiếu, nhu cầu sử dụng điện thoại thông minh ngay tại các khu vực mất sóng Wi-Fi/4G (như tầng hầm giảng đường VKU, khu vực xa xôi hoặc môi trường không có kết nối Internet).

Toàn bộ các tiêu chí kỹ thuật cốt lõi của đề tài **VKU Campus Facility Inspection** được ánh xạ và áp dụng trọn vẹn vào bài toán điều tra thị trường điện thoại:

| Tiêu Chí Kỹ Thuật Đề Bài VKU | Hiện Thực Trong Ứng Dụng Khảo Sát Điện Thoại | Mức Độ Đạt Được |
|---|---|:---:|
| **1. PWA Standalone & Cache-First** | `manifest.json` chuẩn màu sắc `#0284c7`, `display: standalone`, icons 192x192 & 512x512. Service Worker (`sw.js`) cache App Shell theo chiến lược **Cache-First** cho tốc độ khởi động <1s offline. | 100% |
| **2. Multi-step Form & Lưu Nháp IndexedDB** | Form 3 bước (Địa bàn & Thông tin đối tượng -> Nhu cầu & Đánh giá 1-5 Sao -> Bằng chứng ảnh & Ghi chú). Tự động lưu nháp thời gian thực vào IndexedDB qua `idb`. | 100% |
| **3. Offline Queue & Background Sync** | Phiếu nộp offline được gắn UUID v4, timestamp ISO, trạng thái `PENDING_SYNC`. Lắng nghe `window.ononline` và Service Worker Background Sync để tự động gửi dữ liệu tuần tự khi có mạng. | 100% |
| **4. Capacitor Bridge (Camera & Network)** | Tích hợp `@capacitor/camera` chụp ảnh thiết bị thực địa và `@capacitor/network` theo dõi trạng thái mạng, có fallback mượt mà cho Web PWA. | 100% |
| **5. Database Google Sheets & Thống Kê** | Hỗ trợ đẩy dữ liệu trực tiếp vào Google Sheets qua Apps Script Webhook. Dashboard biểu đồ thống kê thị phần & xuất file CSV (Excel tiếng Việt), JSON. | 100% |

---

## 🚀 Tính Năng Nổi Bật

### 1. Khả Năng Ngoại Tuyến Toàn Diện (100% Offline-First)
- **App Shell Cache-First:** Toàn bộ mã nguồn giao diện HTML, CSS, JavaScript và Icons được lưu vào Cache API của trình duyệt. Ứng dụng có thể mở và hoạt động bình thường ngay cả khi thiết bị đang ở chế độ Máy bay (Airplane Mode).
- **Lưu nháp tức thời (Real-time Draft Auto-Save):** Mỗi ký tự nhập vào hoặc mỗi tùy chọn thay đổi đều được ghi ngay vào Object Store `drafts` của IndexedDB. Dù vô tình F5, đóng tab hay sập nguồn, dữ liệu vẫn được khôi phục 100%.

### 2. Form Khảo Sát 3 Bước Chuyên Nghiệp
- **Bước 1 (Địa bàn & Thiết bị hiện tại):** Chọn vị trí khảo sát (Giảng đường Khu A, Khu V, Ký túc xá, Căn tin VKU...), đối tượng người dùng, hãng điện thoại đang dùng (Apple, Samsung, Xiaomi, OPPO, Pixel...) và tên dòng máy.
- **Bước 2 (Nhu cầu thị trường & Tiêu chí kỹ thuật):** Phân khúc giá dự kiến (Dưới 5tr, 5-10tr, 10-15tr, 15-25tr, Flagship), mục đích sử dụng chính, đánh giá mức độ hài lòng với máy hiện tại (**1–5 Sao Condition Rating**), tiêu chí ưu tiên (Pin trâu, Chip mạnh, Camera OIS, Màn hình 120Hz).
- **Bước 3 (Bằng chứng thực địa & Hình ảnh):** Chụp ảnh thiết bị/phiếu khảo sát thực tế thông qua Camera máy tính/điện thoại, ghi chú lỗi thiết bị cũ hoặc phản hồi thị trường.

### 3. Hàng Đợi Đồng Bộ Tự Động (Offline Queue & Auto-Sync)
- Mỗi phiếu khảo sát khi gửi lúc mất mạng được gán UUID chuẩn v4, lưu trạng thái `PENDING_SYNC` vào IndexedDB.
- Khi thiết bị kết nối mạng trở lại, sự kiện `window.addEventListener('online')` và Service Worker kích hoạt tiến trình đồng bộ tuần tự (FIFO) tự động đẩy các bản ghi lên máy chủ.
- Có banner trạng thái mạng thời gian thực, nút **"Test Offline"** (giả lập mất mạng phục vụ kiểm thử/chấm điểm nhanh không cần tắt Wi-Fi máy tính) và nút **"Đồng bộ ngay"**.

### 4. Kết Nối Trực Tiếp Cơ Sở Dữ Liệu Google Sheets
- Cho phép người dùng cấu hình URL Google Apps Script Web App để lưu trữ các phiếu khảo sát trực tiếp vào trang tính Google Sheets (mỗi phiếu tạo thành 1 hàng với đầy đủ thông tin).
- Cung cấp sẵn mã nguồn Apps Script chỉ với 1 click sao chép.

### 5. Bảng Thống Kê Thị Hiếu & Xuất Báo Cáo
- Biểu đồ phân bổ thị phần các hãng điện thoại thông minh đang được sử dụng trong trường học.
- Biểu đồ phân khúc ngân sách dự kiến của sinh viên và người tiêu dùng.
- Tỉ lệ hài lòng trung bình (Thang điểm 1-5 sao).
- Tính năng xuất toàn bộ cơ sở dữ liệu ra định dạng **CSV (Excel tiếng Việt)** và **JSON**.

---

## 🛠️ Cấu Trúc Mã Nguồn (Project Structure)

```text
miniproject-Field-Survey/
├── public/
│   ├── favicon.svg
│   ├── manifest.json              # Web App Manifest PWA (theme: #0284c7)
│   ├── sw.js                      # Service Worker (Cache-First & Background Sync)
│   └── icons/
│       ├── icon-192x192.png       # PWA Icon 192x192
│       ├── icon-512x512.png       # PWA Icon 512x512
│       └── ...                    # Maskable icons
├── src/
│   ├── types/
│   │   └── survey.ts              # Data Models, Enums & TypeScript Interfaces
│   ├── services/
│   │   ├── db.ts                  # Tầng tương tác IndexedDB (idb)
│   │   ├── sync.ts                # Auto-sync queue, FIFO dispatcher & Google Sheets
│   │   ├── network.ts             # Theo dõi mạng qua @capacitor/network + Web API
│   │   └── camera.ts              # Wrapper @capacitor/camera + Web Media Fallback
│   ├── components/
│   │   ├── NetworkBanner.tsx      # Thanh thông báo Online/Offline & Test Offline
│   │   ├── MultiStepForm.tsx      # Form khảo sát 3 bước + Auto-save Draft
│   │   ├── SurveyQueueList.tsx    # Danh sách PENDING_SYNC & SYNCED + Quản lý
│   │   ├── StatisticsDashboard.tsx# Biểu đồ phân tích thị trường & Xuất CSV/JSON
│   │   ├── GoogleSheetsConfigModal.tsx # Cấu hình Webhook Google Sheets
│   │   └── InstallPrompt.tsx      # Hộp thoại cài đặt PWA Standalone
│   ├── App.tsx                    # Giao diện chính và hệ thống Tab Navigation
│   ├── main.tsx                   # Entrypoint React
│   └── index.css                  # Tailwind CSS v4 & Mobile Viewport Styling
├── capacitor.config.ts            # Cấu hình Capacitor Android
├── package.json                   # Dependencies & Scripts
├── tsconfig.json                  # TypeScript Configuration
├── vite.config.ts                 # Cấu hình Vite & Tailwind plugin
├── REPORT.md                      # Báo cáo kỹ thuật chuẩn mẫu môn học VKU
└── README.md                      # Hướng dẫn chi tiết dự án
```

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

### 1. Khởi chạy ở môi trường phát triển (Local Development)
```bash
# Cài đặt các gói thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
Mở trình duyệt tại địa chỉ: `http://localhost:5173`

### 2. Kiểm tra tính năng PWA & Offline trong trình duyệt
1. Chạy lệnh đóng gói và preview:
   ```bash
   npm run build
   npm run preview
   ```
2. Mở **Chrome DevTools (F12)** > chuyển sang tab **Application**:
   - **Manifest:** Kiểm tra các icon, `display: standalone`, `theme_color: #0284c7`.
   - **Service Workers:** Trạng thái Service Worker đã đăng ký và đang chạy (`activated and is running`).
   - **IndexedDB:** Kiểm tra database `smartphone-survey-db` gồm các store `surveys`, `drafts`, `settings`.
3. Kiểm tra lưu nháp:
   - Nhập một số thông tin ở Bước 1 & Bước 2 > Bấm F5 tải lại trang > Dữ liệu vẫn được giữ nguyên vẹn.
4. Kiểm tra hàng đợi Offline & Tự động đồng bộ:
   - Trên thanh trạng thái của ứng dụng, bấm nút **"Test Offline"** (hoặc tích chọn Throttling: Offline trong DevTools Network).
   - Nộp 1-2 phiếu khảo sát > Phiếu được lưu với nhãn màu vàng `PENDING_SYNC`.
   - Bấm tắt "Test Offline" (hoặc kết nối lại mạng) > Ứng dụng tự động phát hiện mạng và gửi toàn bộ các phiếu lên server tuần tự, chuyển thành `SYNCED`.

### 3. Đóng gói ứng dụng Android bằng Capacitor
```bash
# 1. Build ứng dụng web ra thư mục dist
npm run build

# 2. Thêm nền tảng Android (nếu chưa thêm)
npx cap add android

# 3. Đồng bộ web assets vào dự án Android
npx cap sync android

# 4. Mở Android Studio để xuất file APK cài đặt
npx cap open android
```

---

## 📊 Hướng Dẫn Đồng Bộ Google Sheets (Tùy Chọn)

1. Mở trang tính Google Sheets mới trên Google Drive của bạn.
2. Vào menu **Tiện ích mở rộng (Extensions)** > chọn **Apps Script**.
3. Xóa mã mặc định và dán đoạn mã sau:
```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
      data.id, data.timestamp, data.auditorName, data.surveyLocation,
      data.targetAudience, data.currentBrand, data.currentDeviceName,
      data.budgetSegment, data.primaryUsage, data.satisfactionRating,
      data.priorityFeature, data.expectedUpgradeTime,
      data.defectOrFeedbackNotes, data.hasPhoto
    ]);
    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
4. Bấm **Triển khai (Deploy)** > **Triển khai mới (New deployment)** > Chọn loại **Ứng dụng web (Web app)** > Đặt mục Ai có quyền truy cập là **Bất kỳ ai (Anyone)**.
5. Sao chép liên kết URL Web App vừa tạo > Mở ứng dụng > Bấm vào nút **"Google Sheets DB"** trên thanh tiêu đề > Dán URL và bấm **Lưu cấu hình**. Mọi khảo sát sau này sẽ tự động ghi thẳng vào Google Sheet của bạn!

---

## 📄 Bản Quyền & Học Thuật
Dự án được xây dựng phục vụ học phần Cross-Platform Mobile App Development tại VKU.
Mọi đóng góp mã nguồn tuân thủ tiêu chuẩn mã nguồn mở MIT License.
