# 1. Product Requirements Document (PRD)

## 1.1 Tóm tắt
**Aptis B2 Survival Kit** là website học Aptis ESOL chạy hoàn toàn trên máy người học (không backend, không tài khoản, không hosting), giúp người đi làm trình độ A2–B1 đạt B2 trong 30 ngày với 30–90 phút/ngày.

**Triết lý: Practice First, Theory Later.** Mọi màn hình đưa người học vào làm bài trong 1–2 thao tác; lý thuyết nằm sẵn bên trong, mở khi cần (ví dụ trang ngữ pháp: nút quiz đứng trước phần lý thuyết).

## 1.2 Người dùng
| | Mô tả |
|---|---|
| Persona chính | Người đi làm Việt Nam, 25–40 tuổi, tiếng Anh A2–B1, cần chứng chỉ B2 cho công việc/xét tuyển, học buổi tối hoặc giờ nghỉ |
| Ràng buộc | 30–90 phút/ngày, hay gián đoạn, dùng cả laptop lẫn điện thoại, không muốn tạo tài khoản |
| Nhu cầu | Biết mình đang ở đâu; có người "dắt" từng ngày; luyện đúng dạng đề; biết khi nào đủ sức thi |

## 1.3 Mục tiêu sản phẩm
1. Hiểu cấu trúc Aptis ESOL.
2. Xác định trình độ hiện tại (Diagnostic).
3. Lập kế hoạch 30 ngày và theo dõi tiến độ hằng ngày.
4. Luyện Reading, Listening, Vocabulary, Grammar, Writing, Speaking.
5. Thi thử đầy đủ (Mock) và đánh giá khả năng đạt B2.

## 1.4 Tiêu chí thành công (đo được trong ứng dụng)
Màn **Phân tích → Tiêu chí thành công** tính tự động 5 tiêu chí:

| # | Tiêu chí | Cách đo |
|---|---|---|
| C1 | Học ≥ 30 phút/ngày | Tổng thời gian học chủ động ÷ số ngày đã trôi (tối đa 30) ≥ 30 phút |
| C2 | Hoàn thành lộ trình 30 ngày | Số ngày hoàn thành **đủ** nhiệm vụ = 30 |
| C3 | Diagnostic tăng ≥ 20% | `(điểm đề cuối − điểm đề đầu) / điểm đề đầu ≥ 0,2` **hoặc** điểm cuối ≥ 90/100 (tránh bất công với người bắt đầu từ điểm cao) |
| C4 | ≥ 3 Mock Test | Tổng số Mock (Mini + Full) đã hoàn thành |
| C5 | Xác suất đạt B2 ≥ 80% | Xác suất của Mock gần nhất |

Thời gian học chủ động được đo khi tab đang hiển thị và có thao tác trong 90 giây gần nhất (nghe audio/đồng hồ đang chạy cũng tính); ngày "có học" khi ≥ 10 phút hoặc có ≥ 1 phiên hoàn thành.

## 1.5 Yêu cầu chức năng

### Dashboard (FR-D)
- D1 Hiển thị Ngày X/30, % tiến độ lộ trình, streak, tổng giờ học, điểm hiện tại → mục tiêu B2.
- D2 Lịch 30 ngày (hoàn thành / một phần / bỏ lỡ / hôm nay / ngày Mock–Diagnostic).
- D3 Danh sách nhiệm vụ hôm nay có checkbox + nút "Làm ngay" + thời lượng; kỹ năng yếu gắn nhãn ưu tiên.
- D4 Mục tiêu tuần, khối "Sẵn sàng B2?", luyện nhanh 6 mô-đun, mẹo ngày.

### Diagnostic (FR-G)
- G1 Lần đầu truy cập chuyển tới màn chào → thiết lập (tên, thời lượng/ngày, ngày thi) → Diagnostic (có thể bỏ qua).
- G2 4 phần: Vocabulary 12, Grammar 12, Reading 2 đoạn × 3, Listening 2 bài × 3 (36 câu, mỗi câu gắn mức A2/B1/B2).
- G3 Kết quả: Current Level A2/B1/B2, điểm /100, điểm theo phần, Weakest skills, Strengths, Suggested Plan 30 ngày, xem lại câu sai.
- G4 Hai đề song song A/B (không trùng câu) để đo tiến bộ; so sánh với lần đầu.

### Lộ trình 30 ngày (FR-R)
- R1 4 tuần: Foundation, Skill Building, Exam Strategy, Mock Tests & Review.
- R2 Mỗi ngày: tiêu đề, trọng tâm, nhiệm vụ (học gì, thời lượng, checklist cuối ngày).
- R3 Co giãn theo 30/60/90 phút; kỹ năng yếu (từ Diagnostic/Mock) được thêm 5 phút và gắn ưu tiên.
- R4 Hoàn thành một phiên luyện tập tự đánh dấu nhiệm vụ cùng mô-đun của hôm nay; có thể đánh dấu thủ công.
- R5 Ngày đặc biệt: Diagnostic (1, 30), Mini Mock (14, 21), Full Mock (23, 26, 28).

### Từ vựng (FR-V)
- V1 ≥ 1000 từ (hiện **1.374**), 8 nhóm: Education, Technology, Business, Environment, Travel, Health, Work, Daily Life.
- V2 Mỗi thẻ: từ, loại từ, IPA, nghĩa, ví dụ, collocation, mức.
- V3 Flashcard, Quiz (nghĩa EN→VI, VI→EN, điền từ vào câu), Spaced repetition (4 mức chấm), Bookmark, danh sách + tìm kiếm.
- V4 Phiên hằng ngày = thẻ đến hạn (tối đa 30) + từ mới theo nhóm của ngày (15/25/35 theo thời lượng).

### Ngữ pháp (FR-GR)
- 8 chủ điểm: Tenses, Conditionals, Passive, Relative clauses, Reported speech, Modals, Articles, Prepositions.
- Mỗi chủ điểm: giải thích, ví dụ song ngữ, mẹo/lỗi hay gặp, câu B1, câu B2, Review Quiz; có quiz tổng hợp.

### Reading (FR-RD)
- 4 dạng: Sentence Completion, Paragraph Ordering, Short Text Match, Long Text Match. Timer gợi ý, giải thích đáp án, thống kê độ chính xác/thời gian theo dạng.

### Listening (FR-L)
- 4 loại: Conversation, Announcement, Interview, Discussion (16 bài). Phát bằng text-to-speech, tốc độ chậm/thường/nhanh, nghe lại, transcript (sau khi làm), từ khoá được tô sáng, Common traps.

### Writing (FR-W)
- Task 1 trả lời ngắn · Task 2 mạng xã hội · Task 3 email thân mật · Task 4 email trang trọng. Mỗi đề: yêu cầu, mẹo + cụm B2, đếm từ, bản nháp tự lưu, checklist. Nộp bài → **bộ chấm offline** cho điểm /50 kèm khoảng tin cậy, 4 tiêu chí (hoàn thành yêu cầu, ngữ pháp, từ vựng, liên kết), điều kiện còn thiếu để lên B2, lỗi đánh số ngay trong bài với lời giải thích tiếng Việt, việc nên sửa trước, bài mẫu B2; sửa lại và chấm lại; hồ sơ lỗi hay mắc; xuất bài cho giáo viên và nhập điểm giáo viên (ưu tiên hơn điểm tự động). Chi tiết: [12](12-writing-assessment.md).

### Speaking (FR-S)
- 5 phần (cá nhân · mô tả ảnh · so sánh ảnh · thảo luận · nói kéo dài). Câu hỏi ngẫu nhiên, bấm giờ (chuẩn bị + nói), ghi âm tuỳ chọn (không lưu), bài mẫu B2, khung ARD/Overview-Details-Guess/Both-Difference-Preference/Opinion-Because-Example/PREP.

### Mock Test (FR-M)
- Mini (~1 giờ) và Full (~2,5 giờ) gồm 5 phần: G&V, Reading, Listening, Writing, Speaking. Đồng hồ từng phần, tự nộp khi hết giờ, lưu tiến độ theo phần để làm tiếp.
- Kết quả: Estimated CEFR, điểm 5 kỹ năng, xác suất đạt B2, Weakest skills, gợi ý cải thiện, so với Mock trước.

### Gamification (FR-GM) · Analytics (FR-A)
- Streak, XP/cấp độ, mục tiêu tuần, 23 huy hiệu (gồm 7-Day Streak, Grammar Master, Reading Warrior, B2 Ready).
- Biểu đồ: giờ học 14 ngày, điểm kỹ năng, tiến độ lộ trình lũy kế, xu hướng Mock, thời gian theo mô-đun, trạng thái từ vựng.

## 1.6 Yêu cầu phi chức năng
| Nhóm | Yêu cầu | Hiện trạng |
|---|---|---|
| Offline/local | Chạy bằng `file://` hoặc máy chủ tĩnh, không gọi mạng | ✅ không có CDN, font, API ngoài |
| Dữ liệu | LocalStorage, có xuất/nhập JSON, xoá dữ liệu | ✅ |
| Responsive | Desktop + mobile; không cuộn ngang | ✅ kiểm thử ở 390px |
| Trợ năng | Dark mode, cỡ chữ, giảm chuyển động, bàn phím, ARIA, tương phản AA | ✅ mọi cặp màu ≥ 4,5:1 (đã tính) |
| Tập trung | Chế độ tập trung ẩn điều hướng | ✅ |
| Hiệu năng | Không build, nạp nhanh | ✅ ~1,0 MB tổng (mã 365 KB, dữ liệu 608 KB, CSS 40 KB), nạp một lần từ đĩa; chấm Writing ~14 ms/bài |
| Riêng tư | Không gửi dữ liệu đi đâu; bản ghi âm không được lưu | ✅ |
| Trình duyệt | Chrome/Edge/Safari/Firefox hiện hành | ✅ Chromium đã kiểm; Safari/Firefox chưa kiểm tự động |

## 1.7 Ngoài phạm vi
Tài khoản/đồng bộ nhiều thiết bị, chấm Writing/Speaking bằng AI hoặc giám khảo, audio người thật, ảnh thật cho Speaking, thanh toán, đa ngôn ngữ giao diện.

## 1.8 Giả định, giới hạn và rủi ro
| Mục | Nội dung | Giảm thiểu |
|---|---|---|
| Định dạng đề | Aptis General chính thức có 4 phần Speaking/Writing; yêu cầu của dự án chia Speaking thành 5 phần luyện (Part 4 = thảo luận ngắn, Part 5 = nói dài theo định dạng Part 4 thật) | Ghi rõ ở trang "Cấu trúc Aptis"; nhắc kiểm tra thông tin mới nhất |
| Ngưỡng điểm | Ngưỡng CEFR (B2 = 38/50) và công thức xác suất là **ước lượng**, không phải thông số chính thức | Ghi chú trong kết quả Mock và trang Aptis |
| Chấm Writing | Bộ luật offline không hiểu nội dung, chỉ bắt lỗi trong danh sách luật, chưa hiệu chỉnh bằng bài giáo viên chấm; có thể chấm thấp văn B2 ngắn gọn hoặc bỏ sót lỗi | Luôn ghi "ước tính tự động" + khoảng tin cậy; trần 43,9 (không trả mức C); điều kiện chạm B2; ưu tiên độ chính xác hơn độ phủ; đường dẫn giáo viên + đo độ lệch ([12](12-writing-assessment.md)) |
| Tự chấm Speaking | Điểm Speaking vẫn do người học tự chấm, thường cao hơn thực tế | Hệ số 0,9, tiêu chí rõ, so với bài mẫu |
| Listening | Giọng tổng hợp không giống bản ghi thật; chất lượng giọng phụ thuộc hệ điều hành | Chọn giọng/tốc độ trong Cài đặt; luôn có transcript |
| Nội dung | Soạn bằng AI; đã kiểm tự động và rà mẫu nhưng chưa có chuyên gia ngôn ngữ rà toàn bộ | Khuyến nghị rà soát nội dung trước khi dùng giảng dạy chính thức |
| Mất dữ liệu | LocalStorage gắn với trình duyệt | Sao lưu JSON; cảnh báo ở Cài đặt khi LocalStorage bị chặn |
| Ghi âm | Cần quyền micro; một số trình duyệt đòi ngữ cảnh an toàn | Tuỳ chọn, có đường lui "nói thành tiếng và tự chấm" |

## 1.9 Quyết định thiết kế đáng nhớ
- **Không framework, không build, không ES module**: để mở bằng double-click (`file://` chặn ES module) và để người không chuyên vẫn sửa được nội dung.
- **Một bộ chạy Quiz dùng chung** cho Diagnostic, ngữ pháp, từ vựng, Reading, Listening và Mock → hành vi nhất quán, kiểm thử một lần.
- **Lộ trình sinh từ dữ liệu khai báo + luật** (không lưu cứng nhiệm vụ) → đổi thời lượng/kỹ năng yếu là lộ trình tự cập nhật; chỉ lưu "đã làm gì".
- **Xác suất B2 phạt kỹ năng yếu nhất** vì chứng nhận B2 cần đủ các kỹ năng.
- **Chấm Writing bằng luật offline, chưa dùng AI**: repo public nên không thể nhúng khoá API; offline giữ được cam kết "không gửi bài đi đâu". AI chỉ là tuỳ chọn tương lai với ràng buộc ở [12](12-writing-assessment.md#1210-còn-chấm-bằng-ai-thì-sao).
