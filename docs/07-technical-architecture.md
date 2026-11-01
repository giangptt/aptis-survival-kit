# 7. Technical Architecture

## 7.1 Ràng buộc quyết định kiến trúc
| Ràng buộc | Hệ quả |
|---|---|
| Chạy local, mở được bằng double-click (`file://`) | **Không ES module** (Chrome chặn module qua `file://`), không `fetch` dữ liệu, không service worker; tất cả là script cổ điển nạp theo thứ tự |
| Không backend, không đăng nhập | Dữ liệu người học ở LocalStorage; có xuất/nhập JSON để sao lưu |
| Không cần mạng | Không CDN/font/ảnh ngoài; biểu đồ tự vẽ bằng SVG; âm thanh dùng TTS của trình duyệt |
| Người không chuyên phải sửa được nội dung | Nội dung là file JS khai báo + trình kiểm tra `validate-data.js` |
| Không build | Không npm dependency; `package.json` chỉ chứa script tiện ích |

Ngăn xếp: **HTML + CSS (biến, grid) + JavaScript thuần (ES2020)** · Web Speech API (đọc) · MediaRecorder (ghi âm) · LocalStorage · SVG. Tương thích: Chrome/Edge ≥ 80, Firefox ≥ 78, Safari ≥ 14 (cần `\p{L}` trong regex, `flatMap`, `async/await`).

## 7.2 Phân tầng
```
┌──────────────────────────────────────────────────────────────┐
│ Views (js/views)         một route = một hàm trả về {title,node}│
├──────────────────────────────────────────────────────────────┤
│ UI (js/ui)               h · router · components · tasks ·    │
│                          widgets · charts                      │
├──────────────────────────────────────────────────────────────┤
│ Miền / lõi (js/core)     plan · srs · vocabdb · scoring ·      │
│                          writing-analyzer · writing-log ·      │
│                          game · session · audio(tts,rec,timer) │
├──────────────────────────────────────────────────────────────┤
│ Hạ tầng (js/core)        util · store · labels                 │
├──────────────────────────────────────────────────────────────┤
│ Dữ liệu (js/data)        nội dung chỉ đọc → globalThis.AptisData│
└──────────────────────────────────────────────────────────────┘
```
Quy tắc phụ thuộc: tầng trên gọi tầng dưới, **không ngược lại**. Lõi (trừ `audio.js`) **không chạm DOM** nên chạy được trong Node → có test đơn vị.

**Không gian tên:** `globalThis.Aptis` (`util, store, labels, srs, vocabdb, scoring, plan, game, session, tts, recorder, activity, bus, ui`) và `globalThis.AptisData` (nội dung). Mỗi file bọc trong IIFE để tránh trùng tên biến toàn cục giữa các script.

**Thứ tự nạp** (xem `index.html`): util → store → labels → data → srs → vocabdb → scoring → writing-analyzer → writing-log → plan → game → session → audio → ui (h, router, charts, components, tasks, widgets) → views → `app.js` (cuối cùng, vì đăng ký route xong mới khởi động router).

## 7.3 Luồng dữ liệu
```
Người dùng thao tác ──► component (closure state) ──► onFinish(result)
                                                         │
                                         view gọi A.session.record({module, sub, ref, correct, total, seconds|rating})
                                                         │
        ┌────────────────────────────────────────────────┼─────────────────────────────┐
        ▼                         ▼                      ▼                             ▼
  stats[module] cập nhật   log[ngày] (q,c,sessions)   XP (game)               plan.completeModule(module)
        └────────────────────────────────────────────────┴──► game.checkBadges() ──► bus.emit('session'|'badge')
                                                                                         │
                                                                              Shell: toast + header
```
`store.update(key, fn)` **chỉ sửa tại chỗ** (giá trị trả về của `fn` bị bỏ qua) rồi ghi LocalStorage; `store.set()` thay cả khối.

## 7.4 Định tuyến
Hash router (`#/đường/dẫn?tham=số`). `ui.router.add(pattern, handler, module)`; pattern có `:param`. Handler nhận `ctx = { params, query, onCleanup, navigate }` và trả về `{ title, module, node }` hoặc `{ redirect }`. Mỗi lần đổi route: chạy các hàm dọn dẹp cũ, dừng TTS/ghi âm, vẽ view mới, đưa focus vào `h1`, cuộn lên đầu. `router.guard` chuyển về `/welcome` khi chưa thiết lập.

## 7.5 Thuật toán

### <a id="srs"></a>Lặp lại ngắt quãng (SM-2 gọn) — `core/srs.js`
Chấm 0 Quên · 1 Khó · 2 Được · 3 Dễ. Thẻ: `{ ef, iv, reps, lapses, due }`.
- Quên: `reps=0`, `lapses++`, `ef=max(1.3, ef−0.2)`, đến hạn ngay (xếp lại sau ~3 thẻ trong phiên).
- Khó: `iv = reps==0 ? 1 : max(1, round(iv×1.2))`, `ef−0.15`.
- Được: `iv = 1 → 3 → round(iv×ef)`.
- Dễ: `iv = 3 (lần đầu) hoặc round(iv×ef×1.3)`, `ef+0.15`.
- **Đã thuộc** = `iv ≥ 21` ngày. Từ trả lời sai trong Quiz bị chấm "Quên" → quay lại ôn hôm nay.

### Chấm Diagnostic — `core/scoring.js`
Trọng số theo mức câu A2=1, B1=2, B2=3; `pct = Σ điểm đúng có trọng số / Σ trọng số`. Phân loại: `≥0,78 → B2`, `≥0,45 → B1`, còn lại `A2`. Quy đổi `score50` tuyến tính từng đoạn (A2: 8–25, B1: 26–37, B2: 38–44). Weakest = 2 phần có % thấp nhất (không trùng Strengths); Strengths = phần ≥ 60% cao nhất.

### Điểm kỹ năng Mock (0–50)
- G&V, Reading, Listening: `đúng/tổng × 50`.
- Writing: điểm /50 của bộ chấm offline (4 tiêu chí + điều kiện B2, xem [12](12-writing-assessment.md)); không nhân hệ số, trần 43,9.
- Speaking (tự chấm): `trung bình rating(0–5) / 5 × 50 × 0,9`.
- CEFR theo điểm: `<4 A0 · <16 A1 · <26 A2 · <38 B1 · <44 B2 · ≥44 C` (ước lượng).

### Xác suất đạt B2
Mỗi kỹ năng: `p = Φ((điểm − 37,5)/σ)` với σ = 3,5 (Full) hoặc 5 (Mini — ít câu nên bất định hơn). Toàn bài: `P = 0,6 × trung bình(p) + 0,4 × min(p)` — cố ý phạt kỹ năng yếu nhất vì chứng nhận B2 cần đủ các kỹ năng. Ví dụ (5 kỹ năng cùng điểm, Full): 30 → ~2% · 38 → ~56% · 41 → ~84% · 44 → ~97%. Các con số σ, ngưỡng 38 và trọng số 0,6/0,4 là **giả định hiệu chỉnh**, không phải số liệu chính thức; chúng nằm ở `scoring.js` để chỉnh khi có dữ liệu thật.

### Ước tính điểm hiện tại (Dashboard)
Ưu tiên: Mock gần nhất → Diagnostic → luyện tập (độ chính xác × 50 × 0,9; Writing dùng trung bình 6 bài gần nhất trong nhật ký, ưu tiên điểm giáo viên; Speaking dùng trung bình tự chấm gần nhất). Khi có Diagnostic + luyện tập: lấy trung bình hai nguồn.

### Lộ trình — `core/plan.js`
`tasksFor(d)` = (dữ liệu ngày từ `roadmap.js`) × (thời lượng 30/60/90) × (kỹ năng yếu). Ngày đặc biệt thay nhiệm vụ bằng Diagnostic/Mock (+ ôn từ vựng). Ngày hiện tại = `clamp(ngày dương lịch kể từ startDate + 1, 1, 30)`. Mode 30 phút: từ vựng + 2 kỹ năng luân phiên (đổi một kỹ năng sang kỹ năng yếu vào ngày chẵn).

### Chọn đề cho Mock
Mỗi bài con lấy đề **ít được dùng nhất** (đếm theo lịch sử luyện tập + Mock trước), ngẫu nhiên khi hoà; không trùng trong cùng bài thi.

### Đo thời gian học chủ động — `audio.js → Activity`
Mỗi giây cộng 1 vào `log[ngày].sec` nếu tab đang hiển thị và (có thao tác trong 90 giây **hoặc** audio/đồng hồ đang chạy `hold`). Bỏ qua trang Cài đặt. Ghi LocalStorage mỗi 10 giây và khi ẩn tab/đóng trang.

## 7.6 Âm thanh
- **TTS**: `speechSynthesis`, đọc từng lượt thoại; chọn giọng en-GB, phân biệt giới tính theo tên giọng (dự phòng: đổi cao độ); huỷ bằng mã lượt (`run`) khi rời trang. Không có giọng/không hỗ trợ → cảnh báo và hiện transcript.
- **Ghi âm**: `getUserMedia` + `MediaRecorder`, **chỉ yêu cầu quyền khi bấm ghi**; blob nằm trong bộ nhớ, không lưu.
- **Bíp** hết giờ: `AudioContext` (tắt được trong Cài đặt).

## 7.7 Giao diện & trợ năng
Biến CSS cho chủ đề sáng/tối (`:root[data-theme]` + `prefers-color-scheme`), cỡ chữ theo `html{font-size}`, `body.reduce-motion`, `body.focus-mode`. Tương phản mọi cặp màu ≥ 4,5:1 (đã tính bằng script). Bàn phím: phím số, Enter, Space, B, S; vòng focus rõ; `skip-link`; `main`/`nav` landmark; `aria-live` cho phản hồi; biểu đồ có bảng dữ liệu ẩn (`sr-only`) cho trình đọc màn hình.

## 7.8 Kiểm thử
| Lớp | Công cụ | Phạm vi |
|---|---|---|
| Dữ liệu | `tools/validate-data.js` | Cấu trúc mọi nội dung, trùng từ, vị trí đáp án, độ dài bài mẫu, số bộ đề tối thiểu |
| Đơn vị | `tests/unit.js` (30 test, Node thuần, `vm`) | util, store, SRS, vocabdb (sinh câu hỏi), scoring, plan (30 ngày × 3 mức), game, session, nhất quán chéo |
| Bộ chấm Writing | `tests/analyzer.js` (152 kiểm tra, Node thuần) | Từng luật (dương/âm tính), 0 báo nhầm trên văn bản tự nhiên và bài mẫu, hiệu chuẩn A2/B1/B2, độ nhạy, độ bền, nhật ký + điểm giáo viên |
| Đầu-cuối | `tests/smoke.js` (playwright-core + Chromium, 113 kiểm tra) | Onboarding, Diagnostic, 40 route, 30 trang ngày, mọi luồng luyện tập, Mini Mock, lưu & tải lại, mobile không cuộn ngang, tên truy cập, lỗi console |

Kết quả lần chạy cuối: `validate` OK (16 file) · unit 30/30 · bộ chấm Writing 152/152 · e2e 113/113. **Chưa kiểm**: Safari/Firefox, ghi âm thật (cần micro), chất lượng giọng TTS trên từng hệ điều hành, thiết bị cảm ứng thật.

## 7.9 Bảo mật & riêng tư
Không có mạng, không có tài khoản, không có bí mật. Nội dung do người dùng nhập (tên, bài viết) chỉ đi qua `textContent`/`value`, không `innerHTML`. File sao lưu chứa toàn bộ tiến độ và bản nháp Writing — hãy coi là dữ liệu cá nhân. Bản ghi âm không rời bộ nhớ trình duyệt.

## 7.10 Hiệu năng và giới hạn
- Tải: ~1,0 MB (mã 365 KB, dữ liệu 608 KB, CSS 40 KB). Dữ liệu LocalStorage thường < 100 KB sau 30 ngày.
- Vẽ: các view nhỏ, vẽ lại cục bộ; danh sách từ vựng phân trang 40 mục.
- Giới hạn LocalStorage ~5 MB/miền: dư dả; `drafts` bị xoá khi nộp.
- Điểm mở rộng: thêm view = thêm file trong `js/views/` + một thẻ `<script>`; thêm nội dung = sửa `js/data/*.js` rồi `npm run validate`.
