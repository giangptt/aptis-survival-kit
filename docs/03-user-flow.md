# 3. User Flow

## 3.1 Lần đầu truy cập → có kế hoạch
```mermaid
flowchart TD
  A([Mở index.html]) --> B{Đã thiết lập?}
  B -- chưa --> C["/welcome: tên, 30/60/90 phút, ngày thi"]
  C --> D{Chọn}
  D -- Bắt đầu Diagnostic --> E["Đề A: 4 phần, 36 câu, ~20 phút"]
  D -- Bỏ qua --> H
  E --> F["Báo cáo: Current Level, Weakest, Strengths, Suggested Plan"]
  F --> G["Ngày 1 = hôm nay; nhiệm vụ ưu tiên kỹ năng yếu"]
  G --> H["/ Dashboard"]
  B -- rồi --> H
```

## 3.2 Vòng lặp hằng ngày
```mermaid
flowchart TD
  A["Dashboard: Ngày X/30"] --> B["Bấm 'Làm tiếp' (nhiệm vụ chưa xong đầu tiên)"]
  B --> C["Làm phiên luyện tập"]
  C --> D["Hoàn thành phiên → ghi nhận thống kê, XP, đánh dấu nhiệm vụ cùng mô-đun"]
  D --> E{Còn nhiệm vụ?}
  E -- còn --> B
  E -- hết --> F["+40 XP, ngày hoàn thành, lịch xanh"]
  F --> G["Streak +1 nếu đủ 10 phút hoặc ≥ 1 phiên"]
  D --> H{Huy hiệu mới?}
  H -- có --> I[Toast huy hiệu]
```
Nếu bỏ lỡ ngày: lịch hiện ô đỏ; người học vẫn làm được mọi ngày qua `Lộ trình → Ngày N` và đánh dấu thủ công; "hôm nay" luôn là ngày dương lịch kể từ Ngày 1 (có thể đặt lại Ngày 1 trong Cài đặt).

## 3.3 Phiên luyện tập (Practice First)
```mermaid
flowchart LR
  A[Chọn mô-đun] --> B[Làm ngay: câu hỏi đầu tiên]
  B --> C{Chế độ}
  C -- Quiz --> D["Chọn → Kiểm tra → giải thích → Câu tiếp"]
  C -- Flashcard --> E["Lật → chấm Quên/Khó/Được/Dễ → SRS"]
  C -- Writing --> F["Viết → Nộp → báo cáo (điểm, lỗi đánh số, nên sửa trước) → sửa lại & chấm lại"]
  C -- Speaking --> G["Chuẩn bị → Nói (bấm giờ, ghi âm tuỳ chọn) → bài mẫu → tự chấm"]
  D --> H["Tổng kết: điểm, câu sai, làm lại câu sai, bộ tiếp theo"]
  E --> H
  F --> H
  G --> H
  H --> I["Lý thuyết liên quan (nếu cần)"]
```

## 3.4 Mock Test
```mermaid
flowchart TD
  A["/mock: chọn Mini hoặc Full"] --> B["Tạo đề (ưu tiên đề ít dùng) và lưu mockRun"]
  B --> C["Phần i: màn giới thiệu"]
  C --> D["Bắt đầu: đồng hồ phần chạy"]
  D --> E{Hết giờ?}
  E -- chưa --> F["Làm bài tuần tự các bài con"]
  E -- rồi --> G["Tự nộp bài đang làm"]
  F --> H["Hoàn thành phần"]
  G --> H
  H --> I["Lưu kết quả phần vào mockRun"]
  I --> J{Còn phần?}
  J -- còn --> C
  J -- hết --> K["Tính điểm 5 kỹ năng → CEFR → xác suất B2"]
  K --> L["/mock/result/:id: Estimated CEFR, Weakest, gợi ý"]
```
- Thoát giữa chừng: tiến độ giữ ở mức phần đã xong; phần đang làm dở làm lại từ đầu khi quay lại (`/mock` hiện nút "Tiếp tục").
- Writing: sau khi nộp có **báo cáo tự động** (điểm ước tính, lỗi, việc nên sửa) và bài mẫu; trong Mock bấm "Tiếp tục" để sang bài sau (không sửa lại). Speaking: bài mẫu rồi **tự chấm**, điểm nhân 0,9.

## 3.5 Diagnostic cuối (Ngày 30)
Ngày 30 giao Đề B (cùng độ khó, câu khác). Báo cáo so với Đề A: điểm tuyệt đối, % thay đổi, đạt/chưa đạt tiêu chí +20% (hoặc ≥ 90/100).

## 3.6 Sao lưu & khôi phục
`Cài đặt → Sao lưu` tải file JSON; `Khôi phục` ghi đè toàn bộ dữ liệu (có hộp thoại xác nhận); `Xoá toàn bộ` đưa về trạng thái lần đầu.
