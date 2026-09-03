# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1: VKU Field Survey — Offline Data Collection (PWA & Capacitor)  
**Team / Student Name:** Nguyễn Trung Nguyên   
**Submission Date:** 03/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyễn Trung Nguyên — Student ID: 23ITB.B143 — Role: Fullstack Architecture, PWA & State Management — Contribution: 100%
* **🔗 Live Demo URL:** [https://miniproject--field-survey.pages.dev](https://miniproject--field-survey.pages.dev)
* **💻 GitHub Repository:** [https://github.com/Rinproplayer/miniproject--Field-Survey.git](https://github.com/Rinproplayer/miniproject--Field-Survey.git)
* **🎥 Video Demo (Optional):**
  - **Video 1 (Màn hình Desktop / PWA Test & Offline Sync):** [Screen Recording 2026-09-03 151328.mp4](./Screen%20Recording%202026-09-03%20151328.mp4)
  - **Video 2 (Thực nghiệm trên thiết bị di động / Mobile Screen Recording):** [1788423309133_2071063104022555579_9030307350361711956.mp4](./1788423309133_2071063104022555579_9030307350361711956.mp4)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | **PWA Standalone Installation & App Shell Cache** | ✅ Complete | Cấu hình đầy đủ `manifest.json` (`display: standalone`, `theme_color: #0284c7`, bộ icons 192x192 & 512x512 có maskable). Service Worker (`sw.js`) áp dụng chiến lược **Cache-First** đối với App Shell (HTML, CSS, JS, Icons) đảm bảo khởi động tức thì <1s trong điều kiện 100% Offline. Hỗ trợ cài đặt trên cả Android và iOS Safari. |
| 2 | **Multi-Step Form & Local Draft Persistence** | ✅ Complete | Thiết kế form 3 bước chuyên nghiệp (Vị trí & Thiết bị hiện tại -> Nhu cầu & Đánh giá 1-5 Sao -> Bằng chứng ảnh & Ghi chú). Tích hợp cơ chế tự động lưu nháp thời gian thực (Debounced Auto-Save) vào **IndexedDB** (`idb`), chống mất dữ liệu khi F5 hoặc tắt trình duyệt đột ngột. |
| 3 | **Offline Queue & Automatic Background Sync** | ✅ Complete | Mỗi phiếu nộp ngoại tuyến được cấp phát mã định danh UUID v4, đóng dấu thời gian ISO 8601 và gán trạng thái `PENDING_SYNC`. Lắng nghe sự kiện `window.addEventListener('online')` và Service Worker Background Sync để tự động gửi dữ liệu tuần tự (FIFO) ngay khi có mạng trở lại. |
| 4 | **Capacitor Native APK Integration** | ✅ Complete | Tích hợp thư viện `@capacitor/camera` phục vụ chụp ảnh thực địa và `@capacitor/network` theo dõi trạng thái mạng theo thời gian thực (kèm cơ chế fallback tự động cho trình duyệt Web PWA). File cấu hình `capacitor.config.ts` sẵn sàng xuất bản Android APK. |
| 5 | **Google Sheets Database & Analytics Dashboard** | ✅ Complete | Kết nối đồng bộ trực tiếp vào cơ sở dữ liệu Google Sheets thông qua Google Apps Script Webhook. Dashboard trực quan hóa thị phần thương hiệu, phân khúc giá, tỷ lệ hài lòng và hỗ trợ xuất dữ liệu ra file **CSV (Excel tiếng Việt)** & **JSON**. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Luồng Hoạt Động Của Hệ Thống (Data & Sync Flow)
```
[ Người Dùng Nhập Liệu (Multi-Step Form) ]
                   │
                   ▼ (Debounced 400ms Auto-Save)
        ┌──────────────────────┐
        │ IndexedDB ('drafts') │  <── Tự động khôi phục khi tải lại trang
        └──────────────────────┘
                   │ (Bấm "Lưu & Nộp Khảo Sát")
                   ▼
        ┌───────────────────────┐
        │ IndexedDB ('surveys') │  <── Lưu với trạng thái PENDING_SYNC (UUID v4)
        └───────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [ Đang Online ]     [ Đang Offline ]
         │                   │
         │ (Gửi ngay)        │ (Lưu trong hàng đợi)
         │                   │
         │                   ▼
         │           [ Có mạng trở lại ]
         │                   │ (window.ononline / Background Sync)
         └─────────┬─────────┘
                   │
                   ▼ (FIFO Queue Dispatcher)
     ┌─────────────────────────────────────────┐
     │ • Mock API Endpoint (vk.udn.vn/api/...) │
     │ • Google Sheets Webhook (Apps Script)   │
     └─────────────────────────────────────────┘
                   │ (Xác nhận thành công 200 OK)
                   ▼
        ┌───────────────────────┐
        │ Cập nhật: SYNCED      │
        └───────────────────────┘
```

### 3.2. Cấu Trúc Thư Mục Dự Án (Modular Structure)
* `public/manifest.json`: Web App Manifest tiêu chuẩn PWA với theme màu `#0284c7`.
* `public/sw.js`: Service Worker quản lý vòng đời (Install -> Activate -> Fetch -> Sync) với chiến lược Cache-First.
* `src/types/survey.ts`: Hệ thống kiểu dữ liệu TypeScript nghiêm ngặt (Models, Status Enums, Interfaces).
* `src/services/db.ts`: Đóng gói các hàm thao tác với IndexedDB (`surveys`, `drafts`, `settings`) qua thư viện `idb`.
* `src/services/sync.ts`: Xử lý hàng đợi FIFO, điều phối gửi dữ liệu tự động lên Google Sheets và Mock Server.
* `src/services/network.ts`: Theo dõi trạng thái mạng qua `@capacitor/network`, hỗ trợ chế độ giả lập ngắt mạng (Test Offline).
* `src/services/camera.ts`: Cầu nối chụp ảnh native bằng `@capacitor/camera` và fallback Web File Picker.
* `src/components/`:
  * `NetworkBanner.tsx`: Banner thông báo trạng thái Online/Offline, bộ đếm phiếu chờ đồng bộ và nút Test Offline.
  * `MultiStepForm.tsx`: Form 3 bước thu thập thông tin và ảnh thực địa.
  * `SurveyQueueList.tsx`: Quản lý danh sách phiếu `PENDING_SYNC` và `SYNCED`, chi tiết phiếu khảo sát.
  * `StatisticsDashboard.tsx`: Biểu đồ phân tích dữ liệu thị trường và xuất file Excel/JSON.
  * `GoogleSheetsConfigModal.tsx`: Giao diện kết nối và hướng dẫn cấu hình Webhook Google Sheets.
  * `InstallPrompt.tsx`: Hướng dẫn cài đặt PWA thích ứng trên cả Android và iOS Safari.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

* **Hình 1 — Cài đặt PWA Standalone & Hoạt động 100% Ngoại Tuyến (Offline-First):**  
  Ứng dụng hiển thị thông báo cài đặt PWA lên màn hình chính. Khi kích hoạt chế độ Máy bay (Airplane Mode), ứng dụng vẫn tải và hoạt động trơn tru dưới 1 giây nhờ App Shell được lưu sẵn trong Cache API của Service Worker.
  
* **Hình 2 — Form Khảo Sát 3 Bước & Khôi Phục Bản Nháp (IndexedDB):**  
  Người dùng nhập thông tin khảo sát ở Bước 1 & Bước 2 (Địa bàn, Hãng máy, Phân khúc, Đánh giá 1-5 Sao). Khi người dùng vô tình bấm F5 tải lại trang hoặc tắt tab, toàn bộ nội dung được khôi phục nguyên vẹn kèm thông báo *"Đã khôi phục bản nháp"*.

* **Hình 3 — Hàng Đợi Ngoại Tuyến & Tự Động Đồng Bộ (Background Sync):**  
  Bật chế độ "Test Offline", thực hiện nộp phiếu: Bản ghi lập tức được lưu vào IndexedDB với nhãn màu vàng `PENDING_SYNC`. Khi tắt Test Offline (mạng được khôi phục), sự kiện `online` tự động kích hoạt `syncQueue()`, gửi dữ liệu tuần tự lên server và đổi trạng thái sang nhãn màu xanh `SYNCED`.

* **Hình 4 — Kết Nối Cơ Sở Dữ Liệu Google Sheets & Thống Kê Dữ Liệu:**  
  Dữ liệu khảo sát được truyền tự động và chèn trực tiếp thành từng hàng trong Google Sheets thông qua Google Apps Script Webhook. Màn hình Thống kê hiển thị biểu đồ thị phần thương hiệu, xu hướng phân khúc và hỗ trợ tải về file CSV (Excel tiếng Việt chuẩn UTF-8).

* **Minh Chứng Thực Nghiệm Trực Quan Qua Video (Live Screen Recordings):**
  - 🎬 **Video 1 (Màn hình Desktop / PWA Test & Offline Sync):** [Screen Recording 2026-09-03 151328.mp4](./Screen%20Recording%202026-09-03%20151328.mp4) — Ghi lại quá trình kiểm thử tính năng Offline-First, nhập dữ liệu tự động lưu nháp vào IndexedDB, và cơ chế tự động đồng bộ hàng đợi `PENDING_SYNC` -> `SYNCED` khi có mạng trở lại.
  - 📱 **Video 2 (Thực nghiệm trên thiết bị di động / Mobile Screen):** [1788423309133_2071063104022555579_9030307350361711956.mp4](./1788423309133_2071063104022555579_9030307350361711956.mp4) — Ghi lại thao tác thực tế trên giao diện điện thoại di động, cài đặt PWA vào màn hình chính và trải nghiệm toàn màn hình (Standalone).

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Thách thức 1: Nguy cơ mất dữ liệu khi người dùng thoát hoặc tải lại trình duyệt giữa chừng
* **Nguyên nhân:** Khi điều tra viên khảo sát thực tế ngoài hiện trường, sự cố hết pin, bấm nhầm nút quay lại hoặc tải lại trình duyệt rất dễ xảy ra, dẫn đến việc mất toàn bộ dữ liệu đang nhập dở.
* **Giải pháp:** Áp dụng kỹ thuật **Debounced Real-Time Draft Persistence** với IndexedDB (`idb`). Mọi thay đổi trên form được debounce 400ms và ghi tức thì vào Object Store `drafts`. Khi form khởi tạo, hook `useEffect` sẽ truy vấn IndexedDB và tự động điền lại toàn bộ dữ liệu vào form.

### Thách thức 2: Tránh xung đột truyền dữ liệu và quá tải khi mạng vừa kết nối trở lại
* **Nguyên nhân:** Nếu gửi đồng thời (song song) tất cả các phiếu khảo sát ngay khi vừa có mạng, hệ thống rất dễ gặp lỗi quá tải máy chủ (race conditions) hoặc nghẽn băng thông mạng di động.
* **Giải pháp:** Xây dựng cơ chế **Sequential FIFO Dispatcher** trong `syncQueue()`. Hàm sử dụng vòng lặp tuần tự có `await`, gửi từng bản ghi một đến Google Sheets/API Endpoint, kiểm tra mã phản hồi thành công (200 OK) rồi mới cập nhật trạng thái `SYNCED` và chuyển sang bản ghi kế tiếp.

### Thách thức 3: Trải nghiệm cài đặt PWA khác biệt trên hệ điều hành iOS
* **Nguyên nhân:** Apple không hỗ trợ sự kiện chuẩn `beforeinstallprompt` trên trình duyệt iOS Safari, khiến nút cài đặt PWA thông thường không thể hoạt động như trên Android.
* **Giải pháp:** Xây dựng module nhận diện thiết bị thông qua `userAgent`. Khi phát hiện người dùng truy cập từ iPhone/iPad, ứng dụng tự động hiển thị popup hướng dẫn trực quan 3 bước: Bấm nút **Chia sẻ (Share)** ở thanh đáy Safari -> Chọn **Thêm vào Màn hình chính (Add to Home Screen)**.
