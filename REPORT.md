# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1: VKU Field Survey — Smartphone Market Research (Offline-First PWA & Capacitor)  
**Team / Student Name:** Nguyễn Thanh Toàn (23ITB)  
**Submission Date:** 03/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyễn Thanh Toàn — Student ID: 23ITB — Role: Fullstack Architecture & Mobile App Development — Contribution: 100%
* **🔗 Live Demo URL:** [https://miniproject-field-survey.vercel.app](https://miniproject-field-survey.vercel.app) *(Sẵn sàng triển khai trên Vercel / Cloudflare Pages)*
* **💻 GitHub Repository:** [https://github.com/Rinproplayer/miniproject--Field-Survey.git](https://github.com/Rinproplayer/miniproject--Field-Survey.git)
* **🎥 Video Demo (Optional):** Sẵn sàng trình chiếu demo thực nghiệm trực tiếp

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature (Rubric VKU) | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | **PWA Standalone Installation** | ✅ Complete | Cấu hình `manifest.json` chuẩn màu sắc `#0284c7`, background `#0f172a`, `display: standalone`, đầy đủ icons 192x192 và 512x512 (kèm bản maskable). Service Worker (`sw.js`) áp dụng chiến lược **Cache-First** đối với App Shell (HTML, CSS, JS, Icons) cho phép khởi động tức thì <1s trong điều kiện offline 100%. |
| 2 | **Multi-Step Form & Draft Persistence** | ✅ Complete | Thiết kế form khảo sát thị trường 3 bước chuyên nghiệp (1: Địa bàn & Thiết bị hiện tại; 2: Nhu cầu & Đánh giá 1-5 Sao; 3: Bằng chứng ảnh & Ghi chú). Tích hợp cơ chế tự động lưu nháp thời gian thực (Real-time Auto-Save) vào IndexedDB qua thư viện `idb`, khôi phục nguyên vẹn dữ liệu khi refresh trình duyệt. |
| 3 | **Offline Queue & Background Sync** | ✅ Complete | Mọi bản ghi khi gửi ở chế độ offline được cấp phát mã định danh UUID v4, timestamp ISO và gắn nhãn `PENDING_SYNC`. Lắng nghe sự kiện `window.addEventListener('online')` và Service Worker Background Sync API để tự động dispatch tuần tự (FIFO) các bản ghi lên máy chủ ngay khi có kết nối trở lại. |
| 4 | **Capacitor Native Integration** | ✅ Complete | Tích hợp `@capacitor/camera` phục vụ chụp ảnh thực địa và `@capacitor/network` theo dõi trạng thái mạng, có cơ chế fallback tự động cho trình duyệt PWA. Sẵn sàng đóng gói thành file APK Android với file cấu hình `capacitor.config.ts`. |
| 5 | **Google Sheets Database & Analytics** | ✅ Complete | Tích hợp Webhook đồng bộ trực tiếp vào cơ sở dữ liệu Google Sheets qua Google Apps Script theo ghi chú bài toán. Bảng Dashboard phân tích thị phần thương hiệu, xu hướng tài chính và xuất dữ liệu ra file CSV (Excel tiếng Việt) / JSON. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Sơ Đồ Kiến Trúc Hệ Thống (Architecture Flow)
```
[ User Input (Multi-Step Form) ]
               │
               ▼ (Real-time Auto-Save)
   ┌──────────────────────┐
   │ IndexedDB ('drafts') │  <── Phục hồi khi refresh trang
   └──────────────────────┘
               │ (Nộp phiếu khảo sát)
               ▼
   ┌───────────────────────┐
   │ IndexedDB ('surveys') │  <── Lưu với trạng thái PENDING_SYNC
   └───────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
[ Online Mode ]      [ Offline Mode ]
    │                     │
    │ (Gửi ngay)          │ (Lưu trong hàng đợi)
    │                     │
    │                     ▼
    │               [ Mạng phục hồi ]
    │                     │ (window.ononline / Background Sync)
    └──────────┬──────────┘
               │
               ▼ (FIFO Queue Dispatcher)
 ┌─────────────────────────────────────────┐
 │ • Mock API Endpoint (vk.udn.vn/api/...) │
 │ • Google Sheets Webhook (Apps Script)   │
 └─────────────────────────────────────────┘
               │
               ▼ (Thành công)
   ┌───────────────────────┐
   │ Cập nhật: SYNCED      │
   └───────────────────────┘
```

### 3.2. Cấu Trúc Thư Mục Dự Án
- **`public/manifest.json` & `public/sw.js`:** Cấu hình PWA Manifest và Service Worker thực hiện chiến lược Cache-First cho App Shell assets và bắt sự kiện `sync-surveys`.
- **`src/types/survey.ts`:** Định nghĩa kiểu dữ liệu nghiêm ngặt bằng TypeScript cho các đối tượng khảo sát, nhãn đồng bộ, phân khúc giá và thông số kỹ thuật.
- **`src/services/db.ts`:** Đóng gói toàn bộ các thao tác bất đồng bộ với IndexedDB bằng thư viện `idb` (Object Stores: `surveys`, `drafts`, `settings`).
- **`src/services/sync.ts`:** Bộ xử lý hàng đợi (Queue Dispatcher) gửi dữ liệu tuần tự, xử lý timeout, retry count và tích hợp webhook Google Sheets.
- **`src/services/network.ts` & `camera.ts`:** Lớp trung gian giữa Web API và Capacitor Native Bridge (@capacitor/network, @capacitor/camera).
- **`src/components/`:** Các thành phần giao diện module hóa cao (NetworkBanner, MultiStepForm, SurveyQueueList, StatisticsDashboard, GoogleSheetsConfigModal, InstallPrompt).

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

*(Ghi chú: Ảnh chụp thực nghiệm từ ứng dụng đang chạy)*

1. **Minh chứng 1: Khả năng cài đặt Standalone PWA & Offline Cache-First:**
   - Ứng dụng hiển thị thông báo "Cài đặt PWA" lên màn hình chính.
   - Khi ngắt toàn bộ kết nối mạng (Airplane mode), ứng dụng tải và hiển thị tức thì dưới 1 giây thông qua Service Worker Cache API.
2. **Minh chứng 2: Form 3 bước & Lưu nháp IndexedDB:**
   - Nhập thông tin khảo sát ở Bước 1 & Bước 2. Tải lại trang (F5), toàn bộ dữ liệu nhập dở được khôi phục nguyên vẹn 100% kèm thông báo "Đã khôi phục bản nháp".
3. **Minh chứng 3: Hàng đợi ngoại tuyến & Tự động đồng bộ (Auto-Sync):**
   - Sử dụng nút "Test Offline" tích hợp trên thanh header để ngắt mạng mô phỏng.
   - Thực hiện nộp 2 phiếu khảo sát: Cả 2 phiếu lập tức xuất hiện trong tab Hàng Đợi Ngoại Tuyến với trạng thái nhãn vàng `PENDING_SYNC`.
   - Tắt chế độ "Test Offline": Sự kiện `online` được kích hoạt, hệ thống tự động đẩy 2 phiếu lên server tuần tự và chuyển trạng thái sang nhãn xanh `SYNCED`.
4. **Minh chứng 4: Dashboard phân tích thị trường & Xuất file:**
   - Biểu đồ trực quan tỷ lệ các thương hiệu điện thoại (Apple, Samsung, Xiaomi...) và phân khúc giá.
   - Xuất dữ liệu hoàn chỉnh ra file CSV mở được trên Microsoft Excel hiển thị tiếng Việt chuẩn UTF-8.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Thách thức 1: Vấn đề mất dữ liệu khi người dùng vô tình thoát hoặc tải lại trình duyệt giữa chừng
- **Nguyên nhân:** Khảo sát thực địa ngoài trời thường xuyên gặp sự cố hết pin, bấm nhầm nút back hoặc tải lại trình duyệt, gây mất công sức nhập liệu.
- **Giải pháp:** Xây dựng cơ chế **Real-time Draft Persistence** sử dụng IndexedDB (`idb`). Mọi thao tác người dùng nhập vào form đều được debounce 400ms và ghi đè tự động vào Object Store `drafts`. Khi `MultiStepForm` mount lần đầu, hàm `getCurrentDraft()` sẽ tự động đổ lại dữ liệu vào state.

### Thách thức 2: Tránh xung đột truyền dữ liệu đồng thời khi mạng vừa phục hồi
- **Nguyên nhân:** Khi thiết bị vừa có mạng trở lại, việc gửi đồng loạt hàng chục phiếu khảo sát cùng một lúc có thể gây quá tải máy chủ (race condition) hoặc nghẽn băng thông di động.
- **Giải pháp:** Thiết kế hàm `syncQueue()` theo cơ chế **Sequential FIFO Dispatcher** (xử lý tuần tự từng bản ghi một bằng vòng lặp `for...of` và `await`). Mỗi bản ghi được xác nhận thành công mới chuyển sang bản ghi kế tiếp và cập nhật trạng thái `SYNCED` tức thời trong IndexedDB.
