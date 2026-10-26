# 11. Future Enhancements

Sắp theo giá trị cho người học / công sức. Mỗi mục nêu ràng buộc cần cân nhắc vì sản phẩm đang "local, không backend".

## Giá trị cao, công sức vừa
1. **Chấm Writing bằng AI (tuỳ chọn)** — bản offline đã có ([12](12-writing-assessment.md)); AI sẽ hiểu nội dung và lập luận tốt hơn. **Chưa làm có chủ ý vì repo public**: không được nhúng khoá API. *Ràng buộc nếu làm*: mỗi người dùng tự cung cấp khoá hoặc dùng máy chủ trung gian giữ khoá có giới hạn lượt; khoá không bao giờ vào repo/file sao lưu/xuất dữ liệu; tắt mặc định; thông báo bài viết gửi ra ngoài; giữ bộ chấm offline làm dự phòng; đánh giá lại bằng bài đã có điểm giáo viên.
2. **Chấm Speaking bằng nhận dạng giọng nói** (Web Speech `SpeechRecognition` để đếm từ/độ trôi chảy thô, hoặc mô hình chạy cục bộ WASM). *Ràng buộc*: độ chính xác với giọng Việt; `SpeechRecognition` của Chrome gửi âm thanh lên máy chủ.
3. **Ngân hàng đề lớn hơn + chế độ "đề theo kỹ năng yếu"**: chọn câu theo thẻ lỗi (`tag`) đã sai nhiều; hiện đã có `tag`/`lvl` trên câu hỏi nên khả thi.
4. **Sổ tay lỗi (error log)**: tự gom các câu sai (cả từ vựng và ngữ pháp) thành một bộ ôn riêng theo SRS.
5. **Nhắc học**: thông báo của trình duyệt/PWA vào giờ người dùng chọn; xuất lịch `.ics` cho 30 ngày.

## Giá trị cao, công sức lớn
6. **PWA đầy đủ** (manifest + service worker): cài như ứng dụng, chạy offline thật sự trên điện thoại. *Cần phục vụ qua HTTP(S)/localhost, không còn `file://`.*
7. **Audio người thật cho Listening** (file mp3 cục bộ, nhiều giọng/giọng vùng miền) kèm tạp âm nền như phòng thi.
8. **Ảnh thật cho Speaking Part 2–3** (ảnh có giấy phép) + gợi ý từ vựng theo ảnh.
9. **Đồng bộ nhiều thiết bị** qua tệp (File System Access API/Dropbox) hoặc backend mỏng; vẫn giữ chế độ chỉ-local.
10. **Chế độ giáo viên/nhóm**: xuất báo cáo tiến độ PDF cho giáo viên hoặc quản lý đào tạo.

## Chất lượng & vận hành
11. **Hiệu chỉnh mô hình chấm bằng dữ liệu thật**: thu (ẩn danh, đồng ý) điểm Mock + kết quả thi chính thức để chỉnh ngưỡng, σ, hệ số tự chấm Speaking, và (quan trọng nhất) bộ chấm Writing bằng bài có điểm giáo viên ([12.9](12-writing-assessment.md)).
12. **Rà soát nội dung bởi giáo viên** và quy trình đóng góp nội dung (PR + `validate-data` chạy trong CI).
13. **CI**: chạy `npm test` và `smoke.js` trên mỗi thay đổi; thêm kiểm trên Firefox/WebKit (Playwright).
14. **Kiểm thử trợ năng sâu hơn**: axe-core, kiểm bằng NVDA/VoiceOver, chế độ tương phản cao, font hỗ trợ đọc (dyslexia-friendly).
15. **Đa ngôn ngữ giao diện** (EN/VI) và hướng dẫn cho người học các nước khác.
16. **Tối ưu dung lượng**: tách dữ liệu thành các gói nạp khi cần (cần `fetch` → chỉ khả dụng khi phục vụ qua HTTP).

## Tính năng sản phẩm
17. **Kế hoạch tuỳ biến**: rút ngắn/kéo dài lộ trình (14/45/60 ngày) theo ngày thi và điểm Diagnostic; tự dịch lịch khi bỏ lỡ nhiều ngày.
18. **Mục tiêu theo kỹ năng thi** (ví dụ chỉ cần B2 Reading/Listening) và các cấp độ khác (B1, C1).
19. **Thi đấu nhẹ/nhóm học**: bảng xếp hạng cục bộ giữa các hồ sơ trên cùng máy, thử thách tuần.
20. **Từ vựng nâng cao**: sinh thẻ từ văn bản người dùng dán vào, hình ảnh minh hoạ, phát âm so sánh bằng ghi âm.

## Những thứ có chủ ý không làm
Quảng cáo, theo dõi hành vi, tài khoản bắt buộc, gửi dữ liệu học đi bất kỳ đâu mà người dùng không chủ động bật.
