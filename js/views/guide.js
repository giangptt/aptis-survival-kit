/* Cấu trúc Aptis ESOL: tổng quan bài thi, thang điểm, chiến thuật, cách ứng dụng ánh xạ với đề thật */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const ui = A.ui;
  const { h } = ui;

  const rows = [
    ['Core: Grammar & Vocabulary', '50 câu: 25 ngữ pháp + 25 từ vựng (chọn đáp án)', '25 phút', 'gv', '#/grammar'],
    ['Reading', '4 phần: điền từ vào câu · sắp xếp câu thành đoạn · ghép ý kiến với người · ghép tiêu đề với đoạn văn dài', '35 phút', 'reading', '#/reading'],
    ['Listening', '≈ 25 câu: hội thoại, thông báo, phỏng vấn, thảo luận, bài nghe dài', '≈ 40 phút', 'listening', '#/listening'],
    ['Writing', '4 phần: điền form 1–5 từ · 20–30 từ · 3 tin nhắn chat 30–40 từ · 2 email (thân mật 40–50 từ, trang trọng 120–150 từ)', '50 phút', 'writing', '#/writing'],
    ['Speaking', '4 phần ghi âm: thông tin cá nhân · mô tả ảnh · so sánh ảnh · nói 2 phút về chủ đề trừu tượng', '≈ 12 phút', 'speaking', '#/speaking'],
  ];

  ui.router.add(
    '/aptis',
    () => {
      const root = h('div', null, ui.PageHeader({ title: 'Cấu trúc Aptis ESOL', sub: 'Aptis General (British Council): 5 phần, mỗi kỹ năng chấm thang 0–50 và quy ra mức CEFR A0–C.' }));
      root.append(
        ui.Card(
          { title: 'Bài thi gồm những gì?', sub: 'Thông tin tham khảo — hãy kiểm tra lại với trung tâm tổ chức thi trước ngày thi vì định dạng có thể cập nhật.' },
          h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Phần', 'Nội dung', 'Thời gian', 'Luyện trong app'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, rows.map((r) => h('tr', null, h('th', { scope: 'row' }, r[0]), h('td', null, r[1]), h('td', null, r[2]), h('td', null, h('a', { href: r[4] }, 'Luyện ngay →'))))))),
        ),
        ui.Card(
          { title: 'Thang điểm → CEFR (ước lượng)', sub: 'Ngưỡng mà ứng dụng dùng để ước tính; ngưỡng chính thức có thể khác một chút giữa các phần.' },
          h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Điểm kỹ năng (0–50)', 'CEFR ước tính'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, [['0–3', 'A0'], ['4–15', 'A1'], ['16–25', 'A2'], ['26–37', 'B1'], ['38–43', 'B2 ← mục tiêu của bạn'], ['44–50', 'C']].map((r) => h('tr', null, r.map((c) => h('td', null, c))))))),
          h('p', { class: 'muted' }, 'Để nhận chứng nhận B2 tổng thể thường cần đạt B2 ở các kỹ năng — vì vậy ứng dụng tính xác suất đạt B2 theo kỹ năng yếu nhất chứ không chỉ điểm trung bình.'),
        ),
        h(
          'div',
          { class: 'grid grid-2' },
          ui.Card({ title: '🧩 Grammar & Vocabulary' }, h('ul', null, ['Câu nào cũng đọc hết câu trước khi chọn.', 'Loại đáp án sai ngữ pháp trước, rồi xét nghĩa.', 'Không dành quá 30 giây/câu; đánh dấu và quay lại.'].map((x) => h('li', null, x)))),
          ui.Card({ title: '📖 Reading' }, h('ul', null, ['Part 1: ngữ cảnh quyết định từ đúng.', 'Part 2: tìm đại từ, từ nối, mốc thời gian.', 'Part 3: gạch từ khoá câu hỏi, tìm paraphrase.', 'Part 4: câu đầu và câu cuối mỗi đoạn thường nêu ý chính.'].map((x) => h('li', null, x)))),
          ui.Card({ title: '🎧 Listening' }, h('ul', null, ['Đọc trước câu hỏi trong thời gian chờ.', 'Chú ý người nói đổi ý và đính chính.', 'Cẩn thận số, ngày giờ, giá tiền.'].map((x) => h('li', null, x)))),
          ui.Card({ title: '✍️ Writing' }, h('ul', null, ['Đúng số từ, đúng văn phong (thân mật vs trang trọng).', 'Bố cục: chào – mục đích – ý chính – kết.', 'Dùng từ nối B2 (however, as a result…).', 'Dành 3 phút cuối để rà lỗi chính tả.'].map((x) => h('li', null, x)))),
          ui.Card({ title: '🎤 Speaking' }, h('ul', null, ['Nói liên tục, đừng im lặng; ngập ngừng thì dùng “Well…”, “Let me think…”.', 'Dùng khung: ARD (Part 1), Overview→Details→Guess (ảnh), PREP (Part 4).', 'Trả lời đủ giờ; thêm ví dụ cá nhân nếu còn thời gian.'].map((x) => h('li', null, x)))),
          ui.Card({ title: '🗓️ Ngày thi' }, h('ul', null, ['Ngủ đủ, đến sớm, mang giấy tờ tuỳ thân.', 'Kiểm tra tai nghe/micro nếu thi trên máy.', 'Không dừng lại ở câu khó: đoán có cơ sở rồi đi tiếp.'].map((x) => h('li', null, x)))),
        ),
        ui.Card(
          { title: 'Ứng dụng này khác đề thật ở đâu?' },
          h('ul', null, ['Listening dùng giọng đọc tổng hợp của trình duyệt (text-to-speech), không phải bản ghi âm người thật — âm thanh sẽ “máy” hơn và không có tạp âm.', 'Writing không có giám khảo: ứng dụng ước tính điểm và nhận xét bằng bộ luật chạy trên máy bạn (độ dài, bố cục, từ nối, ngữ pháp, từ vựng, lỗi điển hình). Nó không hiểu nội dung nên chỉ mang tính định hướng; bạn có thể xuất bài cho giáo viên chấm rồi nhập điểm để đối chiếu. Speaking vẫn là tự chấm (hệ số 0,9).', 'Speaking: ứng dụng tách phần nói của đề thật thành 5 phần luyện (Part 4 = thảo luận ngắn, Part 5 = nói dài 2 phút theo định dạng Part 4 thật).', 'Phần mô tả ảnh dùng mô tả bằng chữ kèm emoji vì ứng dụng không chứa ảnh thật; hãy hình dung cảnh khi nói.', 'Xác suất đạt B2 và ngưỡng CEFR là ước lượng tham khảo.'].map((x) => h('li', null, x))),
        ),
        h('div', { class: 'quiz-actions' }, ui.Button({ label: 'Bắt đầu Diagnostic', kind: 'accent', href: '#/diagnostic' }), ui.Button({ label: 'Xem lộ trình 30 ngày', kind: 'secondary', href: '#/roadmap' })),
      );
      return { title: 'Cấu trúc Aptis', module: 'guide', node: root };
    },
    'guide',
  );
})();
