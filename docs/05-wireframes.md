# 5. UI Wireframes

Ký hiệu: `[Nút]` nút · `( )` radio · `[x]` checkbox · `▓▓▓░░` thanh tiến độ · `◯` vòng tiến độ. Ảnh chụp thật của các màn này nằm trong quá trình kiểm thử (`SHOTS=… node tests/smoke.js` xuất PNG).

## 5.1 Khung chung (desktop ≥ 960px)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [A] Aptis B2 Survival Kit            Ngày 5/30  🔥 4  ⭐ Lv 3·182XP  [🎯][🌓] │  ← topbar (sticky)
├────────────────┬─────────────────────────────────────────────────────────┤
│ 🏠 Dashboard   │                                                           │
│ 🗺 Lộ trình    │              NỘI DUNG (tối đa 1040px)                     │
│ 🎯 Luyện tập   │                                                           │
│   ├ Từ vựng    │                                                           │
│   ├ Ngữ pháp   │                                                           │
│   ├ Reading    │                                                           │
│   ├ Listening  │                                                           │
│   ├ Writing    │                                                           │
│   └ Speaking   │                                                           │
│ 📝 Mock Test   │                                                           │
│ 🧭 Diagnostic  │                                                           │
│ 📊 Phân tích   │                                                           │
│ 🏅 Thành tích  │                                                           │
│ 📘 Cấu trúc    │                                                           │
│ ⚙ Cài đặt      │                                                           │
└────────────────┴─────────────────────────────────────────────────────────┘
```

## 5.2 Dashboard
```
┌ Hero ─────────────────────────────────────────────────────────────────────┐
│ TUẦN 1: FOUNDATION                                                 ◯ 12%   │
│ Chào Lan! Hôm nay là Ngày 5/30                                    lộ trình │
│ Modal verbs & nghe hội thoại — Bắt thông tin chính khi nghe                │
│ [▶ Làm tiếp: Ngữ pháp]  [Xem lộ trình]                                     │
└────────────────────────────────────────────────────────────────────────────┘
┌ 🔥 Streak ┐ ┌ ⏱ Đã học ┐ ┌ 🎯 Điểm → mục tiêu B2 ┐ ┌ ⭐ Cấp độ ┐
│ 4 ngày    │ │ 6,5 giờ  │ │ 31/50 · B1  (mục tiêu 38) │ │ Lv 3      │
└───────────┘ └──────────┘ └───────────────────────────┘ └───────────┘
┌ Nhiệm vụ hôm nay (2/5) ──────────────┐ ┌ Sẵn sàng B2? ──────────────────┐
│ ▓▓▓▓▓░░░░░                            │ │ ◯ 38% xác suất đạt B2          │
│ [x] 🔤 Từ vựng        12 phút  [Làm lại]│ │ 🧩 G&V      ▓▓▓▓▓▓▓|░░  33/50  │
│ [x] 🧩 Ngữ pháp       10 phút  [Làm lại]│ │ 📖 Reading  ▓▓▓▓▓▓|░░░  30/50  │
│ [ ] 📖 Reading ⭐ưu tiên 15 phút [Làm ngay]│ │ 🎧 Listening ▓▓▓▓▓|░░░ 27/50  │
│ [ ] 🎧 Listening      10 phút  [Làm ngay]│ │ ✍ Writing / 🎤 Speaking …     │
│ [ ] ✍ Writing         10 phút  [Làm ngay]│ │ [Làm Mock Test] [Phân tích]    │
└───────────────────────────────────────┘ └────────────────────────────────┘
┌ Lịch học 30 ngày ─────────────────────┐ ┌ Mục tiêu tuần này ─────────────┐
│ T2 T3 T4 T5 T6 T7 CN                   │ │ 📅 Học ≥5 ngày      ▓▓▓▓░ 4/5  │
│  ·  ·  1✓ 2✓ 3✓ 4✓ [5] ← hôm nay      │ │ ⏱ 300 phút         ▓▓▓░░      │
│  6  7  8  9 10 11 12 …  📝 ngày Mock   │ │ 💡 Mẹo trong ngày               │
└────────────────────────────────────────┘ └─────────────────────────────────┘
┌ Luyện nhanh ──────────────────────────────────────────────────────────────┐
│ [🔤 Từ vựng] [🧩 Ngữ pháp] [📖 Reading] [🎧 Listening] [✍ Writing] [🎤 Speaking]│
└────────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Diagnostic — làm bài và báo cáo
```
PHẦN 2/4 · Grammar                       ▓▓▓▓▓▓░░░░░░░░  (tiến độ tổng)
┌──────────────────────────────────────────────────────────────┐
│ Grammar · Câu 3/12                                            │
│ The meeting is ____ Monday at ten o'clock.                    │
│ [1] on    [2] in    [3] at    [4] by                          │
│ [← Trước]                                  [Câu tiếp →]       │
│ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ⑪ ⑫   (chấm đã trả lời)                │
└──────────────────────────────────────────────────────────────┘
```
```
┌ Hero ────────────────────────────────────────────────────────┐
│ CURRENT LEVEL            B1                       ◯ 52/100   │
│ Bạn giao tiếp được tình huống quen thuộc…                    │
│ [Điểm 52/100] [≈31/50 theo thang Aptis] [Còn ~7 điểm tới B2] │
└──────────────────────────────────────────────────────────────┘
┌ Điểm theo phần ─────────────┐ ┌ Điểm mạnh & điểm yếu ─────────┐
│ Vocabulary ▓▓▓▓▓▓▓░░ 71%    │ │ Weakest: [Listening][Grammar]  │
│ Grammar    ▓▓▓▓░░░░░ 45%    │ │ Strengths: [Vocabulary]        │
│ Reading    ▓▓▓▓▓▓░░░ 60%    │ │ Lộ trình dành thêm giờ cho…    │
│ Listening  ▓▓▓░░░░░░ 33%    │ └────────────────────────────────┘
└─────────────────────────────┘
┌ Suggested Plan: lộ trình B2 cường độ cao 30 ngày ────────────┐
│ 1. Tuần 1 Foundation … 2. Tuần 2 … 3. Tuần 3 … 4. Tuần 4 …   │
│ [Về Dashboard & bắt đầu hôm nay] [Xem lộ trình]               │
└──────────────────────────────────────────────────────────────┘
```

## 5.4 Flashcard (Từ vựng)
```
 Hôm nay · Còn 18 thẻ                                  (Từ mới)
 ▓▓▓▓▓░░░░░░░░
┌────────────────────────────────────────────────────┐
│                                                  ☆ │
│                   curriculum                       │
│            (n)  /kəˈrɪkjələm/  🔊                   │
└────────────────────────────────────────────────────┘
 [Lật thẻ (Space)]      ← sau khi lật:
┌────────────────────────────────────────────────────┐
│            chương trình học                         │
│  “The school updated its curriculum.” 🔊            │
│  Collocation: core curriculum; national curriculum  │
│  [Mức B2] [Education]                               │
└────────────────────────────────────────────────────┘
 [1 Quên·lại ngay] [2 Khó·1 ngày] [3 Được·3 ngày] [4 Dễ·7 ngày]
```

## 5.5 Quiz (Ngữ pháp / Reading Part 1 / Listening)
```
 Present Simple · Mức B2 · Câu 4/10           ⏱ 03:12
 ▓▓▓▓░░░░░░
 She ____ in HR since 2019.
 ┌──────────────────────────────┐
 │ [1] works                     │
 │ [2] has worked           ✓    │ ← sau khi Kiểm tra
 │ [3] is working                │
 └──────────────────────────────┘
 ┌ ✓ Chính xác! ───────────────────────────────────┐
 │ "since 2019" → hiện tại hoàn thành…              │  (aria-live)
 └─────────────────────────────────────────────────┘
 [Câu tiếp →]
```

## 5.6 Reading — Paragraph Ordering
```
 ⏱ Giờ gợi ý 05:00
 1 ▏Last Saturday I decided to visit my aunt…   (Cố định)
 2 ▏[câu bạn đã chọn]                            [↑][↓][✕]
 3 ▏[câu bạn đã chọn]                            [↑][↓][✕]
 Các câu còn lại — chọn câu tiếp theo:
 ┌ - - - - - - - - - - - - - - - - - - - - ┐
 ┆ Finally, I reached my aunt's house…      ┆
 └ - - - - - - - - - - - - - - - - - - - - ┘
 [Kiểm tra]  → mỗi câu xanh/đỏ + vị trí đúng + giải thích manh mối
```

## 5.7 Listening
```
 ℹ Nghe trước, trả lời sau. Transcript hiện sau khi làm xong.
┌ Player ────────────────────────────────────────────────┐
│ [▶ Nghe]  Tốc độ [Thường ▾]   Đã nghe 1 lần             │
│ 🔊 Anna đang nói…                                        │
└─────────────────────────────────────────────────────────┘
 [Không nghe được? Xem transcript]
 Quiz 3 câu …  → sau cùng: Transcript (từ khoá tô sáng) · Từ khoá · Common traps
```

## 5.8 Writing
```
 Task 3 · Email thân mật               ⏱ Giờ gợi ý 08:00
 [▸ ✅ Checklist trước khi nộp]   [▸ 💡 Mẹo & cụm B2]
 Prompt: Write an email to your friend…
┌────────────────────────────────────────────┐
│ (khung viết)                               │
└────────────────────────────────────────────┘
 43 từ · yêu cầu 40–50 ✓
 [Nộp & xem nhận xét]
 ──→ ┌ 21,1/50  [Ước tính A2–B1] [khoảng 16–26] [độ tin cậy: thấp (bài ngắn)] ┐
     │ Tóm tắt 2 câu · "Cách đọc điểm này: không hiểu nội dung…"               │
     └─────────────────────────────────────────────────────────────────────────┘
     Bốn tiêu chí (0–5): Hoàn thành ▓▓▓▓▓░ · Ngữ pháp ▓▓░░░░ · Từ vựng ▓▓░░░░ · Liên kết ▓▓▓░░░
     ⚠ Điều đang giữ điểm của bạn: Để lên B2: … (từng lý do cụ thể)
     [Nên sửa trước: 1…3, kèm link ôn chủ điểm]   [Điểm mạnh]
     Bài của bạn — lỗi đánh số: "hi①  jack … i② like … see③ you"
       1. [Dấu câu & viết hoa] hi → Hi — giải thích   2. …   3. …
     ▸ Bài mẫu B2 để so sánh
     🧑‍🏫 Giáo viên chấm: [⬇ Xuất bài (.md)]  ▸ Nhập điểm giáo viên (4 ô 0–5 + nhận xét)
     [✏️ Sửa lại bài & chấm lại]  [Đề tiếp theo →]  → hiện "+x điểm so với lần trước"
```

## 5.9 Speaking
```
 Part 2 · Mô tả ảnh · Bước 1/3
┌ ☕🧑‍💻 People working in a café ───────────────────────┐
│ Mô tả cảnh (vì không có ảnh thật, hãy hình dung)…     │
└───────────────────────────────────────────────────────┘
 Describe the picture. What can you see?
 [▶ Bắt đầu nói (45s)]  →  🎤 Nói  00:31 ▓▓▓▓▓░░░
 [🎙 Ghi âm] ▶ nghe lại      [Tiếp theo →]
 [▸ 🧭 Khung: Overview → Details → Guess → Feeling]
 Cuối: bài mẫu B2 + 🔊 + tự chấm (Trôi chảy / Từ vựng / Ngữ pháp / Nội dung)
```

## 5.10 Mock result
```
┌ ESTIMATED CEFR          B2 (hoặc B1…)                ◯ 61% xác suất đạt B2 ┐
│ Điểm TB 38,4/50 · ngưỡng B2 ước lượng 38/50 · [+2,1 so với Mock trước]      │
└─────────────────────────────────────────────────────────────────────────────┘
┌ Điểm từng kỹ năng ─────────────┐ ┌ Radar ──────────────────────┐
│ G&V       41/50 [B2] ▓▓▓▓▓▓▓  │ │      G&V                     │
│ Writing   36/50 [B1] (ước tính tự động) │ │  Speaking  Reading (vòng B2) │
└────────────────────────────────┘ └──────────────────────────────┘
┌ Weakest skills & gợi ý ───────────────────────────────────────────┐
│ ✍ Writing — 36/50: • … • … [Luyện Writing]                        │
└────────────────────────────────────────────────────────────────────┘
 ℹ Ghi chú phương pháp  ·  [Làm Mock khác] [Xem phân tích] [Về Dashboard]
```

## 5.11 Mobile (< 960px)
```
┌───────────────────────┐
│ [A]   Ngày 5/30 🔥4 ⭐ 🎯🌓 │
├───────────────────────┤
│ Hero (xếp dọc)         │
│ Stat × 4 (1 cột)       │
│ Nhiệm vụ (nút xuống dòng)│
│ Sẵn sàng B2?           │
│ Lịch 7 cột             │
│ Luyện nhanh (2 cột)    │
├───────────────────────┤
│ 🏠   🗺   🎯   📝   📊   ⚙ │ ← bottom nav
└───────────────────────┘
```
Bảng rộng cuộn trong khung; không cuộn ngang trang; vùng chạm nút ≥ 38px.
