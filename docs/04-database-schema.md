# 4. Schema LocalStorage

Tất cả khoá có tiền tố **`aptis.v1.`** (hằng `PREFIX` trong `js/core/store.js`). Mỗi khoá lưu một giá trị JSON. Nếu LocalStorage bị chặn (chế độ riêng tư…), ứng dụng vẫn chạy bằng bộ nhớ trong phiên và cảnh báo ở Cài đặt.

Ngày dùng khoá `YYYY-MM-DD` theo **giờ địa phương** (`util.dateKey`).

| Khoá (sau tiền tố) | Kiểu | Mục đích |
|---|---|---|
| `profile` | object | Hồ sơ + tuỳ chọn |
| `diag` | object | Lịch sử Diagnostic |
| `plan` | object | Nhiệm vụ lộ trình đã làm + ghi chú checklist |
| `log` | object | Nhật ký học theo ngày |
| `srs` | object | Trạng thái lặp lại ngắt quãng từng từ |
| `bookmarks` | object | Từ đã đánh dấu |
| `stats` | object | Thống kê theo mô-đun / nhóm / bài |
| `mocks` | array | Lịch sử Mock Test |
| `mockRun` | object \| null | Mock đang làm dở |
| `game` | object | XP, huy hiệu, cờ |
| `drafts` | object | Bản nháp Writing |
| `wlog` | array | Nhật ký chấm Writing (điểm, lỗi, điểm giáo viên) |

## 4.1 Chi tiết

### `profile`
```jsonc
{
  "onboarded": true,            // false → mọi route chuyển về /welcome (trừ /aptis, /settings)
  "createdAt": 1761200000000,   // ms, lúc đặt Ngày 1 lần đầu
  "startDate": "2026-10-23",    // Ngày 1 của lộ trình
  "name": "Lan",
  "dailyMinutes": 60,           // 30 | 60 | 90
  "examDate": "",               // "" hoặc YYYY-MM-DD
  "theme": "auto",              // auto | light | dark
  "fontScale": 100,             // 85..140 (%)
  "reduceMotion": false,
  "focusMode": false,
  "sound": true,                // tiếng bíp hết giờ
  "ttsVoice": "",               // voiceURI hoặc "" (tự chọn, ưu tiên en-GB)
  "ttsRate": 0.95
}
```

### `diag`
```jsonc
{ "attempts": [ {
  "id": "lq3k9xz1", "form": "A", "at": 1761200000000, "seconds": 1180,
  "sections": { "vocab": {"pct":0.55,"correct":7,"total":12}, "grammar": {...}, "reading": {...}, "listening": {...} },
  "pct": 0.52, "score100": 52, "level": "B1",       // A2 | B1 | B2
  "weakest": ["listening","grammar"], "strengths": ["vocab"],
  "score50": 31                                     // quy đổi ước tính theo thang Aptis
} ] }
```
`pct` có **trọng số theo mức câu** (A2=1, B1=2, B2=3). Phân loại: ≥ 0,78 → B2; ≥ 0,45 → B1; còn lại A2.

### `plan`
```jsonc
{ "done":  { "d3.vocab": "2026-10-25", "d3.grammar": "2026-10-25" },   // taskId → ngày hoàn thành
  "notes": { "d3.c0": 1 } }                                           // checklist cuối ngày
```
`taskId = d{ngày}.{mô-đun}`. **Danh sách nhiệm vụ không được lưu** — sinh từ `js/data/roadmap.js` + hồ sơ + kỹ năng yếu mỗi lần hiển thị; chỉ lưu "đã làm".

### `log`
```jsonc
{ "2026-10-23": { "sec": 2710, "by": {"vocab":600,"grammar":420}, "q": 52, "c": 38, "words": 31, "sessions": 4, "xp": 188 } }
```
`sec` = giây học chủ động (tab hiển thị + có thao tác trong 90 giây, hoặc audio/đồng hồ đang chạy). `q`/`c` = số câu đã làm/đúng. `words` = lượt ôn thẻ. Ngày được tính là "có học" khi `sec ≥ 600` hoặc `sessions ≥ 1` (cơ sở của streak).

### `srs`
```jsonc
{ "curriculum": { "ef": 2.5, "iv": 3, "reps": 2, "lapses": 0, "due": "2026-10-28", "last": "2026-10-25" } }
```
Khoá = từ viết thường. `iv` = khoảng nghỉ (ngày); `iv ≥ 21` coi là **đã thuộc**. Thuật toán ở [07](07-technical-architecture.md#srs).

### `stats`
```jsonc
{ "grammar": {
    "c": 120, "t": 160, "n": 18, "sec": 2100,                    // tổng đúng / tổng câu / số phiên / giây
    "subs": { "tenses:b1": {"c":9,"t":10,"n":1,"best":0.9,"last":0.9,"at":1761200000000} },
    "refs": { } },
  "reading": { "subs": {"sentence":{...}}, "refs": {"rs1":{"best":0.8,"last":0.8,"n":2,...}} },
  "writing": { "refs": {"w3-1": {"n":1,"rating":3.8,...}} } }    // Writing/Speaking có rating 0–5 thay vì c/t
```
`sub` = nhóm (grammar: `chủ_điểm:mức`; reading: dạng bài; listening: loại; writing: `t1..t4`; speaking: `p1..p5`; vocab: `daily|due|new|all|bookmarks|quiz`; mock: `mini|full`). `ref` = id bài cụ thể.

### `mocks`
```jsonc
[ { "id": "…", "mode": "full", "at": 1761200000000, "seconds": 8700,
    "scores": {"gv":41,"reading":39,"listening":38,"writing":36.2,"speaking":37.8},   // /50
    "cefr": {"gv":"B2",…}, "overall": 38.4, "overallCefr": "B2",
    "prob": 0.61,                                    // 0..1
    "weakest": ["writing","speaking"],
    "details": {"gv":{"c":40,"t":50}, "writing":{"ratings":[3.8,4.1,4,3.9],"n":4}},
    "used": ["rs1","l-conv-2"] } ]                   // id đề đã dùng (để lần sau ưu tiên đề khác)
```

### `mockRun` (khi đang làm dở; `null` khi không)
```jsonc
{ "id": "…", "mode": "mini", "startedAt": 1761200000000, "stageIdx": 2,
  "results": { "gv": {"c":9,"t":12}, "reading": {"c":8,"t":10} },
  "plan": { "gv": {"qs":[ …câu hỏi đã sinh… ]}, "reading": [{"type":"sentence","id":"rs3"}], "listening": ["l-int-2"], "writing": ["w2-1"], "speaking": [{"part":"p1","id":"s1-3"}] },
  "used": [ … ] }
```
Lưu cả câu hỏi G&V đã sinh để quay lại vẫn cùng đề.

### `game`
```jsonc
{ "xp": 1240, "badges": { "streak-7": "2026-10-30" }, "flags": { "perfect": true } }
```
Cấp độ tính từ XP: `level = floor(sqrt(xp/60)) + 1`. Streak **không lưu** — tính lại từ `log`.

### `drafts`
```jsonc
{ "w3-1": { "texts": ["Hi Sam, …"], "at": 1761200000000 } }   // xoá khi nộp xong
```

### `wlog`
```jsonc
[ { "id": "…", "ex": "w3-1", "task": 3, "title": "Weekend hiking invitation", "at": 1761200000000,
    "first50": 21.1,            // điểm lần chấm đầu (để thấy tiến bộ khi sửa lại)
    "score50": 43.9, "prev50": 21.1, "revisions": 1,
    "band": "B2", "range": [38.9, 48.9], "confidence": "low",   // low | medium | high theo độ dài bài
    "criteria": { "ta": 4.6, "gr": 4.0, "vo": 4.5, "co": 4.9 }, // thang 0–5
    "words": 43, "seconds": 310,
    "issues": { "look-forward": 1, "lower-start": 2 },          // số lỗi theo luật
    "texts": ["Hi Jack, …"],                                    // chỉ giữ cho 40 bài gần nhất
    "teacher": { "at": 1761200999999, "scores": {"ta":4,"gr":3.5,"vo":4,"co":3.5}, "score50": 37.3, "comment": "…" } // hoặc null
    , "v": 1 } ]
```
Tối đa 80 phần tử. Điểm hiệu lực = `teacher.score50` nếu có, ngược lại `score50`. Sửa lại bài xoá điểm giáo viên cũ. Chi tiết chấm: [12](12-writing-assessment.md).

## 4.2 Sao lưu/khôi phục
`store.exportAll()` → `{ app: "aptis-b2-survival-kit", version: 1, exportedAt, data: { <mọi khoá> } }`. `importAll()` từ chối file không đúng `app`; khoá thiếu được đặt về mặc định. `resetAll()` xoá mọi khoá có tiền tố.

## 4.3 Quy tắc phiên bản
- Tiền tố `v1` là phiên bản schema. Thay đổi **tương thích ngược** (thêm trường) → không đổi tiền tố; đọc luôn trộn với mặc định (`Object.assign(defaults, stored)`).
- Thay đổi **phá vỡ** → tăng `PREFIX` lên `v2` và viết bước di trú đọc `v1` → ghi `v2` trước khi dùng.
- Dữ liệu hỏng (JSON lỗi) → dùng giá trị mặc định cho khoá đó, không làm sập ứng dụng.

## 4.4 Dữ liệu nội dung (chỉ đọc, không nằm trong LocalStorage)
Nằm trong `js/data/*.js` dưới dạng script cổ điển gán vào `globalThis.AptisData`. Định dạng chi tiết và quy tắc kiểm tra: [`tools/CONTENT_SPEC.md`](../tools/CONTENT_SPEC.md); kiểm tra tự động bằng `node tools/validate-data.js`.
