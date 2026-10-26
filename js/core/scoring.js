/* Quy đổi điểm → CEFR, xác suất đạt B2, chấm Diagnostic, ước tính trình độ hiện tại.
   LƯU Ý: ngưỡng điểm là ước lượng tham khảo (thang 0–50 mỗi kỹ năng), không phải thông số chính thức. */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const U = A.util;

  const SKILLS = [
    { id: 'gv', name: 'Grammar & Vocabulary', short: 'G&V', icon: '🧩' },
    { id: 'reading', name: 'Reading', short: 'Reading', icon: '📖' },
    { id: 'listening', name: 'Listening', short: 'Listening', icon: '🎧' },
    { id: 'writing', name: 'Writing', short: 'Writing', icon: '✍️' },
    { id: 'speaking', name: 'Speaking', short: 'Speaking', icon: '🎤' },
  ];

  const B2_MIN = 38; // điểm tối thiểu (0–50) coi là B2 — ước lượng
  const LEVEL_RANGES = [
    { lv: 'A0', min: 0 },
    { lv: 'A1', min: 4 },
    { lv: 'A2', min: 16 },
    { lv: 'B1', min: 26 },
    { lv: 'B2', min: B2_MIN },
    { lv: 'C', min: 44 },
  ];

  const SUGGESTIONS = {
    gv: ['Làm lại quiz B2 của 2 chủ điểm ngữ pháp có % thấp nhất trong mục Ngữ pháp.', 'Ôn thẻ từ vựng đến hạn mỗi ngày — chỉ cần 10 phút nhưng đều đặn.', 'Với câu điền từ, hãy đọc cả câu và loại đáp án sai về ngữ pháp trước, rồi mới xét nghĩa.'],
    reading: ['Luyện “Paragraph Ordering” và “Long Text Match”: tìm đại từ (this, they), từ nối (however, then) và mốc thời gian.', 'Đọc tiêu đề trước, gạch ý chính mỗi đoạn trong 10 giây; không đọc từng chữ.', 'Đặt giờ như thi: mỗi phần tối đa 8 phút, không kẹt quá 1 phút ở một câu.'],
    listening: ['Nghe 2 lần: lần 1 nắm ý chung, lần 2 bắt chi tiết số liệu và đính chính.', 'Xem phần “Common traps” sau mỗi bài và ghi lại bẫy bạn hay mắc.', 'Sau khi làm xong, đọc transcript và nghe lại, vừa nghe vừa đọc theo (shadowing) 5 phút.'],
    writing: ['Luôn có bố cục: chào – mục đích – 2–3 ý có từ nối – kết thư. Thiếu bố cục mất điểm dù đúng ngữ pháp.', 'Mỗi bài đạt đủ số từ yêu cầu; dùng ít nhất 3 từ nối khác nhau (however, although, as a result…).', 'So bài của bạn với bài mẫu B2, chép lại 3 cấu trúc hay vào sổ.'],
    speaking: ['Dùng khung PREP (Point – Reason – Example – Point) để luôn có thứ để nói đủ thời gian.', 'Ghi âm và nghe lại: chú ý ngập ngừng dài và lặp từ; thay bằng “Well…”, “Let me think…”.', 'Luyện mô tả ảnh theo thứ tự: tổng quan → chi tiết → suy đoán → cảm nhận cá nhân.'],
  };

  const S = (A.scoring = {
    SKILLS,
    B2_MIN,
    skill: (id) => SKILLS.find((s) => s.id === id),
    suggestions: (id) => SUGGESTIONS[id] || [],

    cefr(score) {
      let r = 'A0';
      for (const x of LEVEL_RANGES) if (score >= x.min) r = x.lv;
      return r;
    },
    /** Xác suất đạt B2 cho một kỹ năng (sai số đo ±3.5 điểm) */
    skillProb: (score, sigma = 3.5) => U.normCdf((score - (B2_MIN - 0.5)) / sigma),
    /** Xác suất đạt B2 toàn bài: cần B2 ở MỌI kỹ năng nên pha trộn trung bình và giá trị thấp nhất */
    passProb(scores, sigma = 3.5) {
      const ps = Object.values(scores).filter((x) => typeof x === 'number').map((x) => S.skillProb(x, sigma));
      if (!ps.length) return 0;
      return 0.6 * U.avg(ps) + 0.4 * Math.min(...ps);
    },

    /** Điểm Diagnostic có trọng số theo mức: A2=1, B1=2, B2=3 */
    DIAG_W: { A2: 1, B1: 2, B2: 3 },
    diagLevel: (pct) => (pct >= 0.78 ? 'B2' : pct >= 0.45 ? 'B1' : 'A2'),
    scoreFromDiagPct(p) {
      if (p < 0.2) return 8 + p * 40;
      if (p < 0.45) return 16 + ((p - 0.2) / 0.25) * 9.9;
      if (p < 0.78) return 26 + ((p - 0.45) / 0.33) * 11.9;
      return 38 + ((p - 0.78) / 0.22) * 6;
    },
    /** sections: { vocab:[{lvl,ok}], grammar:[...], reading:[...], listening:[...] } */
    diagEvaluate(sections) {
      const out = { sections: {} };
      let got = 0;
      let tot = 0;
      for (const [k, items] of Object.entries(sections)) {
        let g = 0;
        let t = 0;
        let c = 0;
        items.forEach((it) => {
          const w = S.DIAG_W[it.lvl] || 1;
          t += w;
          if (it.ok) {
            g += w;
            c += 1;
          }
        });
        out.sections[k] = { pct: t ? g / t : 0, correct: c, total: items.length };
        got += g;
        tot += t;
      }
      out.pct = tot ? got / tot : 0;
      out.score100 = Math.round(out.pct * 100);
      out.level = S.diagLevel(out.pct);
      const ranked = Object.entries(out.sections).sort((a, b) => a[1].pct - b[1].pct);
      out.weakest = ranked.slice(0, 2).map((x) => x[0]);
      out.strengths = ranked.filter((x) => x[1].pct >= 0.6).map((x) => x[0]).reverse().slice(0, 2);
      if (!out.strengths.length) out.strengths = [ranked[ranked.length - 1][0]];
      out.weakest = out.weakest.filter((k) => !out.strengths.includes(k) || ranked.length <= 2);
      out.score50 = Math.round(S.scoreFromDiagPct(out.pct));
      return out;
    },

    /** Gộp nhãn Diagnostic → kỹ năng thi (vocab/grammar → gv) */
    diagToSkill: (k) => (k === 'vocab' || k === 'grammar' ? 'gv' : k),

    /**
     * Ước tính điểm hiện tại theo từng kỹ năng:
     * ưu tiên mock gần nhất → Diagnostic mới nhất → luyện tập (độ chính xác / tự chấm).
     * Trả về { gv:{score,src}, ... } (score null nếu chưa có dữ liệu).
     */
    estimates() {
      const store = A.store;
      const mocks = store.get('mocks');
      const diag = store.get('diag').attempts;
      const stats = store.get('stats');
      const est = {};
      const lastMock = mocks[mocks.length - 1];
      const lastDiag = diag[diag.length - 1];
      for (const sk of SKILLS) {
        let e = { score: null, src: null };
        if (lastMock && typeof lastMock.scores[sk.id] === 'number') e = { score: lastMock.scores[sk.id], src: 'mock' };
        else if (lastDiag) {
          const secs = lastDiag.sections || {};
          const vals = sk.id === 'gv' ? [secs.vocab, secs.grammar] : [secs[sk.id]];
          const pcts = vals.filter(Boolean).map((x) => x.pct);
          if (pcts.length) e = { score: Math.round(S.scoreFromDiagPct(U.avg(pcts))), src: 'diag' };
        }
        // luyện tập: chỉ khi chưa có mock và đủ dữ liệu, hoặc cho writing/speaking
        const acc = (m) => (stats[m] && stats[m].t >= 10 ? stats[m].c / stats[m].t : null);
        let prac = null;
        if (sk.id === 'gv') {
          const a = [acc('grammar'), acc('vocab')].filter((x) => x != null);
          if (a.length) prac = U.avg(a) * 50 * 0.9;
        } else if (sk.id === 'reading' || sk.id === 'listening') {
          const a = acc(sk.id);
          if (a != null) prac = a * 50 * 0.9;
        } else if (sk.id === 'writing' && A.wlog && store.get('wlog').length) {
          // Writing: điểm bộ chấm tự động (hoặc điểm giáo viên nếu đã nhập) của 6 lần gần nhất
          const w = store.get('wlog').slice(-6);
          prac = U.avg(w.map((e) => A.wlog.effectiveScore(e)));
        } else {
          const refs = Object.values((stats[sk.id] && stats[sk.id].refs) || {}).filter((r) => typeof r.rating === 'number');
          if (refs.length) prac = U.avg(refs.slice(-6).map((r) => r.rating)) * 10 * 0.9;
        }
        if (prac != null && (e.src == null || e.src === 'diag')) {
          e = { score: Math.round(e.score != null ? (e.score + prac) / 2 : prac), src: e.src ? 'diag+practice' : 'practice' };
        }
        est[sk.id] = e;
      }
      return est;
    },
    /** Điểm trung bình các kỹ năng đã có ước tính (0–50) hoặc null */
    overallEstimate() {
      const e = Object.values(S.estimates()).filter((x) => x.score != null).map((x) => x.score);
      return e.length ? U.avg(e) : null;
    },
  });
})();
