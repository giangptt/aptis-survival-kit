# 8. Folder Structure

```
aptis-b2-survival-kit/
├─ index.html                  Điểm vào; khai báo thứ tự nạp script (app.js nạp cuối)
├─ package.json                Chỉ script tiện ích (không có dependency)
├─ README.md                   Cách chạy, tính năng, giới hạn
│
├─ css/
│  ├─ base.css                 Token màu (sáng/tối), reset, khung bố cục, responsive, giảm chuyển động
│  ├─ components.css           Nút, thẻ, chip, tiến độ, form, toast, modal, Quiz
│  └─ views.css                Hero/Dashboard, flashcard, Reading/Writing/Speaking, lịch, huy hiệu, biểu đồ
│
├─ js/
│  ├─ app.js                   Khởi động: shell (header/sidebar/bottom nav), chủ đề, toast sự kiện, router
│  ├─ core/                    Lõi — không chạm DOM (trừ audio.js)
│  │  ├─ util.js               Ngày, RNG có hạt giống, xáo trộn, đếm từ, normCdf…
│  │  ├─ store.js              LocalStorage có bộ nhớ đệm, mặc định, xuất/nhập
│  │  ├─ labels.js             Nhãn hiển thị dùng chung (mô-đun, dạng bài, phần thi)
│  │  ├─ srs.js                Lặp lại ngắt quãng
│  │  ├─ vocabdb.js            Truy vấn kho từ + sinh câu hỏi quiz tự động
│  │  ├─ scoring.js            CEFR, xác suất B2, chấm Diagnostic, ước tính điểm
│  │  ├─ writing-analyzer.js   Bộ chấm & nhận xét Writing offline (59 luật, 4 tiêu chí, điều kiện B2)
│  │  ├─ writing-log.js        Nhật ký chấm Writing, hồ sơ lỗi, điểm giáo viên, xuất cho giáo viên
│  │  ├─ plan.js               Dựng nhiệm vụ 30 ngày, tiến độ, kỹ năng yếu
│  │  ├─ game.js               XP, cấp độ, streak, mục tiêu tuần, 23 huy hiệu, bus sự kiện
│  │  ├─ session.js            Ghi nhận một phiên luyện tập (điểm vào mọi nơi)
│  │  └─ audio.js              TTS, ghi âm, đồng hồ, bíp, theo dõi thời gian học chủ động
│  ├─ ui/
│  │  ├─ h.js                  Dựng DOM, toast, modal, vá Element.append
│  │  ├─ router.js             Hash router + guard
│  │  ├─ components.js         Button, Card, Progress, Ring, Countdown, Quiz, AudioPlayer, WritingBox, SelfRating (Speaking)…
│  │  ├─ tasks.js              Reading/Listening/Writing/Speaking task + khung nói
│  │  ├─ widgets.js            TaskList, SkillBars, Calendar
│  │  └─ charts.js             Biểu đồ SVG: bars, line, radar
│  ├─ views/                   Mỗi file đăng ký một nhóm route
│  │  ├─ welcome.js  dashboard.js  diagnostic.js  roadmap.js  practice.js
│  │  ├─ vocab.js  grammar.js  reading.js  listening.js  writing.js  speaking.js
│  │  └─ mock.js  analytics.js  achievements.js  guide.js  settings.js
│  └─ data/                    Nội dung chỉ đọc (xem tools/CONTENT_SPEC.md)
│     ├─ vocab-{education,technology,business,environment,travel,health,work,dailylife}.js   1.374 từ
│     ├─ grammar-a.js  grammar-b.js     8 chủ điểm, 152 câu
│     ├─ reading.js  listening.js  writing.js  speaking.js
│     ├─ diagnostic.js                  2 đề A/B × 36 câu
│     └─ roadmap.js                     30 ngày (khai báo)
│
├─ tools/
│  ├─ CONTENT_SPEC.md          Đặc tả định dạng nội dung (nguồn sự thật cho người soạn nội dung)
│  └─ validate-data.js         Kiểm tra nội dung
├─ tests/
│  ├─ unit.js                  30 test lõi (Node)
│  ├─ analyzer.js              152 kiểm tra bộ chấm Writing (Node)
│  ├─ fixtures/writing-learner.js   Bài người học GIẢ LẬP (do người phát triển viết, chưa phải bài giáo viên chấm)
│  └─ smoke.js                 E2E trên Chromium (cần playwright-core)
└─ docs/                       Tài liệu này
```

## Quy ước
- **Một file, một IIFE**; chỉ xuất ra `globalThis.Aptis.*` hoặc `globalThis.AptisData.*`.
- Tên file kebab-case/ngắn; view đặt theo route đầu tiên.
- Chuỗi giao diện bằng **tiếng Việt**, thuật ngữ thi giữ nguyên tiếng Anh (Reading, Mock Test, PREP…).
- Nội dung học: giải thích tiếng Việt, ví dụ/đề tiếng Anh chuẩn Anh-Anh.
- Thêm nội dung → chạy `npm run validate`; thêm logic lõi → thêm test vào `tests/unit.js`; thêm luồng người dùng → thêm kiểm tra vào `tests/smoke.js`.
- Không thêm dependency khi chưa cần: ràng buộc "mở được bằng double-click" là tính năng của sản phẩm.
