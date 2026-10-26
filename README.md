# Aptis B2 Survival Kit

Website học **Aptis ESOL** chạy **hoàn toàn local**: không backend, không đăng nhập, không build, không cần mạng.
Dành cho người đi làm trình độ A2–B1, học 30–90 phút/ngày, mục tiêu **B2 trong 30 ngày**. Triết lý: **Practice First, Theory Later**.

## Chạy

**Cách 1 — mở thẳng file** (đơn giản nhất): mở `index.html` bằng Chrome/Edge/Firefox/Safari bản mới.

**Cách 2 — qua máy chủ tĩnh** (khuyến nghị nếu muốn ghi âm Speaking ổn định):
```bash
cd aptis-b2-survival-kit
python3 -m http.server 8080      # rồi mở http://localhost:8080
```
Tiến độ lưu trong **LocalStorage** của trình duyệt. Đổi trình duyệt/máy hoặc xoá dữ liệu trang sẽ mất tiến độ → dùng **Cài đặt → Sao lưu (JSON)** định kỳ.

## Có gì bên trong

| Phần | Nội dung |
|---|---|
| Diagnostic | 2 đề song song A/B × 36 câu (Vocabulary, Grammar, Reading, Listening) → trình độ A2/B1/B2, điểm mạnh/yếu |
| Lộ trình 30 ngày | 4 tuần (Foundation → Skill Building → Exam Strategy → Mock & Review), nhiệm vụ theo ngày, tự co giãn theo 30/60/90 phút và kỹ năng yếu |
| Từ vựng | **1.374 từ**, 8 chủ đề, IPA + nghĩa + ví dụ + collocation; flashcard, quiz, lặp lại ngắt quãng (SRS), bookmark |
| Ngữ pháp | 8 chủ điểm × giải thích, ví dụ, câu B1, câu B2, review quiz (tổng 150+ câu có giải thích) |
| Reading | 4 dạng Aptis (điền từ, sắp xếp đoạn, ghép ý kiến, ghép tiêu đề), timer, giải thích, thống kê |
| Listening | 16 bài (hội thoại, thông báo, phỏng vấn, thảo luận), phát bằng giọng đọc của trình duyệt, transcript, từ khoá, bẫy |
| Writing | 4 task × 4 đề, bài mẫu B2, đếm từ; **bộ chấm & nhận xét offline** (điểm /50 + khoảng tin cậy, 4 tiêu chí, lỗi đánh số trong bài, việc nên sửa trước, sửa lại và chấm lại, hồ sơ lỗi hay mắc, xuất bài cho giáo viên + nhập điểm giáo viên) |
| Speaking | 5 phần, câu hỏi ngẫu nhiên, bấm giờ, ghi âm (tuỳ chọn), bài mẫu B2, khung ARD/PREP |
| Mock Test | Mini (~1 giờ) và Full (~2,5 giờ): CEFR ước tính, xác suất đạt B2, kỹ năng yếu, gợi ý |
| Gamification | Streak, XP/cấp độ, mục tiêu tuần, 23 huy hiệu |
| Phân tích | Giờ học, điểm kỹ năng, tiến độ ngày, xu hướng Mock, 5 tiêu chí thành công |
| Trợ năng | Sáng/Tối, cỡ chữ, giảm chuyển động, chế độ tập trung, phím tắt, skip link, ARIA, tương phản ≥ 4,5:1 |

## Kiểm thử

```bash
npm test                 # (hoặc) node tools/validate-data.js && node tests/unit.js && node tests/analyzer.js
PLAYWRIGHT_CORE=/đường/dẫn/playwright-core node tests/smoke.js   # E2E trên Chromium thật (cần playwright-core, không kèm theo)
```
- `tools/validate-data.js`: kiểm tra toàn bộ nội dung (định dạng, trùng từ, đáp án, độ dài bài mẫu…).
- `tests/unit.js`: 30 test cho lõi (SRS, chấm điểm, lộ trình, streak, huy hiệu, lưu trữ).
- `tests/analyzer.js`: 152 kiểm tra bộ chấm Writing (từng luật, độ chính xác trên văn bản tự nhiên, bài mẫu, bài giả lập, độ nhạy, nhật ký giáo viên).
- `tests/smoke.js`: 113 kiểm tra đầu-cuối: onboarding, Diagnostic, mọi route, mọi luồng luyện tập, Mini Mock, mobile, trợ năng, không lỗi console.

## Giới hạn cần biết

- **Writing được chấm bằng bộ luật offline, không phải giám khảo hay AI**: nó ước tính độ dài, bố cục, từ nối, từ vựng, ngữ pháp và bắt ~60 loại lỗi điển hình, nhưng **không hiểu nội dung** và chỉ bắt được lỗi nằm trong danh sách luật. Điểm luôn kèm khoảng tin cậy; bài giả lập dùng để kiểm thử do người phát triển tự viết, **chưa hiệu chỉnh bằng bài giáo viên đã chấm** (xem [docs/12](docs/12-writing-assessment.md)). Có thể xuất bài cho giáo viên và nhập điểm để đối chiếu.
- **Speaking vẫn do bạn tự chấm** (điểm nhân hệ số 0,9 để bù xu hướng chấm cao).
- **Listening dùng giọng đọc tổng hợp** của trình duyệt (offline), không phải bản ghi người thật.
- **Ngưỡng CEFR và xác suất đạt B2 là ước lượng tham khảo**, không thay kết quả thi chính thức. Kiểm tra định dạng đề mới nhất với đơn vị tổ chức thi.
- Phần mô tả ảnh (Speaking Part 2–3) dùng **mô tả bằng chữ + emoji** vì ứng dụng không kèm ảnh thật.
- Nội dung (từ vựng, câu hỏi, bài mẫu) được soạn bằng AI và đã qua kiểm tra tự động + rà mẫu; IPA có vài từ có nhiều cách đọc — nên rà lại nếu dùng cho giảng dạy chính thức.

## Tài liệu

Xem [docs/README.md](docs/README.md): PRD, Sitemap, User Flow, Schema LocalStorage, Wireframe, Kiến trúc component, Kiến trúc kỹ thuật, Cấu trúc thư mục, Roadmap phát triển, MVP, Hướng mở rộng.

## Đóng góp

Mọi đề xuất cải thiện tài liệu, bài luyện tập hoặc công cụ đều được hoan nghênh. Vui lòng mở issue hoặc pull request để cùng phát triển dự án. Khi thêm hoặc sửa nội dung trong `js/data/`, hãy chạy `npm run validate`; khi đổi logic lõi, chạy `npm test`.

## Giấy phép

[MIT](LICENSE) © 2026 giangptt — áp dụng cho cả mã nguồn lẫn nội dung học (`js/data/`) và tài liệu (`docs/`). Nội dung học do AI soạn và chưa được giáo viên rà toàn bộ; phần mềm được cung cấp "nguyên trạng", không kèm bảo đảm nào (xem [LICENSE](LICENSE)).
