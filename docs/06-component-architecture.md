# 6. Component Architecture

Không dùng framework: "component" là **hàm trả về một DOM Node**, dựng bằng `h(tag, props, ...children)` (`js/ui/h.js`). Không dùng `innerHTML` nên không có XSS từ nội dung. Trạng thái cục bộ nằm trong closure; khi đổi trạng thái, component tự vẽ lại phần của nó (`clear` + `append`).

## 6.1 Cây thành phần
```
app.js (Shell)
├─ Topbar            Ngày X/30 · streak · XP · [Tập trung] [Sáng/Tối]
├─ Sidebar / BottomNav
├─ Router outlet <main>
│   └─ View (một hàm cho mỗi route)
│       ├─ PageHeader (+ breadcrumbs, actions)
│       ├─ Card / Stat / Chip / Progress / Ring / Callout / Accordion / Tabs
│       ├─ Widgets:   TaskList · SkillBars · Calendar
│       ├─ Charts:    bars · line · radar
│       ├─ Quiz       ◄── dùng bởi Diagnostic, Grammar, Vocab quiz, Reading P1, Listening, Mock G&V
│       ├─ Tasks:     ReadingTask(sentence|ordering|shortMatch|longMatch) · ListeningTask · WritingTask · SpeakingTask
│       │     ├─ AudioPlayer + Transcript        (Listening)
│       │     ├─ WritingBox + báo cáo chấm tự động (Writing; SelfRating chỉ còn ở Speaking)
│       │     └─ Countdown + RecorderWidget + FrameworkCard (Speaking)
│       └─ FlashSession (flashcard SRS, trong views/vocab.js)
├─ Toasts (aria-live)  ·  Modal / confirm
└─ Services (không có UI): store · plan · srs · scoring · game · session · tts · recorder · activity
```

## 6.2 Hợp đồng các thành phần chính

### Quiz — `ui.Quiz(opts)`
| Tuỳ chọn | Ý nghĩa |
|---|---|
| `questions` | `[{ q, o:[...], a, e, tag?, lvl?, ctx?, hint? }]` — `ctx` là chuỗi hoặc Node (đoạn đọc, trình phát nghe) hiện phía trên câu hỏi |
| `mode` | `'practice'` (chọn → Kiểm tra → giải thích → tiếp) hoặc `'exam'` (không phản hồi, có Trước/Tiếp, chấm điểm, nộp bài) |
| `timerSec` | Đồng hồ đếm lùi; ở `exam` hết giờ tự nộp |
| `summary` | `true`: tự hiện màn tổng kết (điểm, câu sai, làm lại câu sai); `false`: người gọi tự xử lý |
| `onFinish(res)` | Gọi **một lần** khi hoàn thành bản đầu tiên; `res = { correct, total, pct, seconds, items:[{ q, ok, pickedText, correctText, e, tag, lvl, wordId }] }` |
| `extraActions(res)`, `summaryExtra(res)` | Nút/khối bổ sung trong tổng kết |
| Trả về | Node có `.finish()` (ép nộp, dùng khi hết giờ) và `.getResult()` |

Phím tắt: `1–9` chọn, `Enter` kiểm tra/tiếp (không tự nộp bài ở câu cuối chế độ thi). Đáp án được xáo thứ tự (`shuffle`), có thể tắt.

### Tasks (`js/ui/tasks.js`)
Mọi task có chữ ký `Task(…, { mode:'practice'|'exam', onFinish, extraActions }) → Node` và `node.finish()` để Mock ép nộp khi hết giờ.

| Task | `onFinish(res)` | Ghi chú |
|---|---|---|
| `ReadingTask(type, set)` | `{correct,total,pct,seconds,items}` | `ordering` chấm theo vị trí từng câu; `longMatch` không cho dùng trùng tiêu đề (chế độ luyện) |
| `ListeningTask(item)` | như trên + `plays` | exam: tối đa 2 lượt nghe |
| `WritingTask(ex)` | `{rating(0–5), score50, band, words[], seconds, report, logId}` | Gọi `A.writingAnalyzer.analyze`, ghi `A.wlog`; luyện: `onFinish` gọi **một lần** ngay lần chấm đầu (sửa lại không tính phiên mới); thi (`exam`): gọi khi bấm "Tiếp tục". `rating` = điểm /10 của bộ chấm |
| `SpeakingTask(part,item)` | `{rating(0–5), seconds}` | các bước chuẩn bị/nói có đồng hồ riêng |

### Các thành phần khác
| Thành phần | Chữ ký | Việc |
|---|---|---|
| `Countdown` | `({seconds,label,autoStart,controls,onEnd,compact})` | Node có `.start/.pause/.reset/.stop/.timer` |
| `AudioPlayer` | `({script,speakers,maxPlays})` | Phát bằng TTS từng lượt thoại; `.stop()`, `.plays()` |
| `WritingBox` | `({min,max,value,onChange})` | Đếm từ, đổi màu theo khoảng yêu cầu |
| `SelfRating` | `({criteria,onSubmit(avg,values)})` | Nhóm radio 1–5, hỗ trợ bàn phím; chỉ dùng cho Speaking |
| `RecorderWidget` | `()` | Ghi/nghe lại; bản ghi chỉ ở bộ nhớ |
| `TaskList` | `(day,{onChange})` | Checkbox đánh dấu thủ công + nút "Làm ngay" |
| `FlashSession` | `({words,title,ctx})` | Hàng đợi thẻ, chấm SRS, tổng kết, phím tắt |

## 6.3 Quy tắc viết component
1. Không dùng `innerHTML`. Văn bản có định dạng đi qua `ui.rich()` (chỉ `**đậm**` và xuống dòng).
2. Mọi điều khiển tương tác là `<button>`/`<a>`/`<input>` thật, có tên truy cập (`aria-label` khi chỉ có icon).
3. Phản hồi động đặt trong vùng `aria-live`; đổi trang đưa focus vào `h1`.
4. Việc dọn dẹp (timer, TTS, ghi âm, listener bàn phím) gắn vào `ctx.onCleanup()` của router hoặc tự gỡ khi node bị tháo khỏi DOM (`isConnected`).
5. Component không tự ghi LocalStorage — **view** gọi `A.session.record(...)` khi `onFinish`.

## 6.4 Quy ước về `Element.append`
`h.js` vá `Element.prototype.append` để **bỏ qua `undefined/null/false` và làm phẳng mảng** (bản gốc biến chúng thành chữ "undefined"/"false"). Nhờ vậy viết `el.append(cond && node, list)` an toàn trong toàn bộ mã giao diện.

## 6.5 Sự kiện lõi → giao diện (`Aptis.bus`)
| Sự kiện | Phát khi | Người nghe |
|---|---|---|
| `session` | `session.record()` xong (`{xp, task, badges}`) | Shell: toast "+XP · Hoàn thành nhiệm vụ", cập nhật header |
| `badge` | Đạt huy hiệu mới | Shell: toast huy hiệu |
| `xp` | Cộng XP / đổi hồ sơ | Shell: cập nhật header |
| `tick` | Bộ đo thời gian lưu nhật ký | Shell: cập nhật header |
