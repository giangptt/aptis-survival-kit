/* Nhật ký chấm Writing: lịch sử điểm, hồ sơ lỗi hay mắc, điểm giáo viên (nhập tay), độ lệch giữa bộ chấm và giáo viên.
 * Không chạm DOM. Dữ liệu lưu ở khoá "wlog" (xem docs/04-database-schema.md). */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const U = A.util;
  const store = () => A.store;

  const MAX = 80; // số lần chấm giữ lại
  const MAX_TEXT = 40; // chỉ giữ nội dung bài viết của 40 lần gần nhất (tiết kiệm dung lượng)
  const WT = { ta: 0.2, gr: 0.3, vo: 0.25, co: 0.25 };
  const round1 = (x) => Math.round(x * 10) / 10;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  const toEntry = (id, base, { ex, task, title, texts, report, seconds }) => {
    const issues = {};
    report.parts.forEach((p) => p.issues.forEach((i) => (issues[i.rule] = (issues[i.rule] || 0) + 1)));
    return Object.assign(base || {}, {
      id,
      ex,
      task,
      title,
      at: base && base.at ? base.at : Date.now(),
      score50: report.score50,
      band: report.band,
      range: report.range,
      confidence: report.confidence,
      criteria: { ta: report.criteria.ta.score, gr: report.criteria.gr.score, vo: report.criteria.vo.score, co: report.criteria.co.score },
      words: report.words,
      seconds: (base && base.seconds ? base.seconds : 0) + (seconds || 0),
      issues,
      texts: texts.slice(),
      v: report.version,
    });
  };

  const WL = (A.wlog = {
    MAX,
    WEIGHTS: WT,

    list: () => store().get('wlog'),
    get: (id) => store().get('wlog').find((e) => e.id === id) || null,
    /** Các lần chấm của một đề, mới nhất trước */
    forEx: (ex) => store().get('wlog').filter((e) => e.ex === ex).sort((a, b) => b.at - a.at),

    /** Ghi một lần chấm mới; trả về entry */
    add(data) {
      const id = U.uid();
      const entry = toEntry(id, { first50: data.report.score50, revisions: 0, teacher: null }, data);
      store().update('wlog', (list) => {
        list.push(entry);
        while (list.length > MAX) list.shift();
        list.slice(0, Math.max(0, list.length - MAX_TEXT)).forEach((e) => {
          if (e.texts) e.texts = [];
        });
      });
      return entry;
    },

    /** Người học sửa bài và chấm lại: cập nhật cùng entry, giữ điểm lần đầu để thấy tiến bộ */
    revise(id, data) {
      let out = null;
      store().update('wlog', (list) => {
        const e = list.find((x) => x.id === id);
        if (!e) return;
        const prev = e.score50;
        toEntry(id, e, data);
        e.revisions = (e.revisions || 0) + 1;
        e.prev50 = prev;
        e.teacher = null; // bài đã sửa → điểm giáo viên cũ không còn áp dụng
        out = e;
      });
      return out;
    },

    /** Điểm dùng để tính tiến bộ: điểm giáo viên nếu có, ngược lại điểm bộ chấm */
    effectiveScore: (e) => (e.teacher && typeof e.teacher.score50 === 'number' ? e.teacher.score50 : e.score50),

    /** Giáo viên chấm (nhập tay): scores {ta,gr,vo,co} mỗi mục 0–5 */
    setTeacher(id, { scores, comment = '' }) {
      let out = null;
      store().update('wlog', (list) => {
        const e = list.find((x) => x.id === id);
        if (!e) return;
        const s = {};
        Object.keys(WT).forEach((k) => {
          const v = Number(scores[k]);
          if (!Number.isFinite(v)) throw new Error('Điểm tiêu chí không hợp lệ: ' + k);
          s[k] = round1(clamp(v, 0, 5));
        });
        const avg5 = Object.keys(WT).reduce((a, k) => a + s[k] * WT[k], 0);
        e.teacher = { at: Date.now(), scores: s, score50: round1(avg5 * 10), comment: String(comment).slice(0, 2000) };
        out = e;
      });
      return out;
    },
    clearTeacher(id) {
      store().update('wlog', (list) => {
        const e = list.find((x) => x.id === id);
        if (e) e.teacher = null;
      });
    },

    /** Hồ sơ lỗi hay mắc trong n lần chấm gần nhất: [{rule,label,cat,topic,count}] giảm dần */
    errorProfile(n = 12) {
      const recent = store().get('wlog').slice(-n);
      const tot = {};
      recent.forEach((e) => Object.entries(e.issues || {}).forEach(([r, c]) => (tot[r] = (tot[r] || 0) + c)));
      const WA = A.writingAnalyzer;
      return Object.entries(tot)
        .map(([rule, count]) => Object.assign({ rule }, WA.ruleInfo(rule), { count, attempts: recent.filter((e) => (e.issues || {})[rule]).length }))
        .sort((a, b) => b.count - a.count || b.attempts - a.attempts);
    },

    /** Điểm theo thời gian [{at, score50}] (dùng điểm hiệu lực) */
    trend: (n = 12) => store().get('wlog').slice(-n).map((e) => ({ at: e.at, id: e.id, ex: e.ex, score50: WL.effectiveScore(e), auto50: e.score50, teacher: !!e.teacher })),

    /** Điểm trung bình các tiêu chí trong n lần gần nhất (cho radar) */
    criteriaAvg(n = 5) {
      const recent = store().get('wlog').slice(-n);
      if (!recent.length) return null;
      const out = {};
      Object.keys(WT).forEach((k) => (out[k] = round1(U.avg(recent.map((e) => e.criteria[k])))));
      return out;
    },

    /** Độ lệch giữa bộ chấm tự động và giáo viên trên các bài đã có điểm giáo viên */
    calibration() {
      const t = store().get('wlog').filter((e) => e.teacher);
      if (!t.length) return { n: 0, mae: null, bias: null };
      const diffs = t.map((e) => e.score50 - e.teacher.score50);
      return { n: t.length, mae: round1(U.avg(diffs.map(Math.abs))), bias: round1(U.avg(diffs)) };
    },

    /** Xuất dữ liệu hiệu chỉnh KHÔNG kèm nội dung bài viết: để người phát triển chỉnh bộ chấm khi có điểm giáo viên */
    exportCalibration() {
      return {
        app: 'aptis-b2-survival-kit',
        kind: 'writing-calibration',
        analyzerVersion: A.writingAnalyzer.VERSION,
        exportedAt: new Date().toISOString(),
        note: 'Không chứa nội dung bài viết. Mỗi dòng: điểm bộ chấm tự động và điểm giáo viên (0–5 từng tiêu chí).',
        rows: store().get('wlog').filter((e) => e.teacher).map((e) => ({ task: e.task, words: e.words, auto: { score50: e.score50, criteria: e.criteria }, teacher: { score50: e.teacher.score50, criteria: e.teacher.scores } })),
      };
    },

    /** Văn bản Markdown để gửi giáo viên chấm (kèm bảng chấm trống) */
    exportMarkdown(id) {
      const e = WL.get(id);
      if (!e) return '';
      const D = globalThis.AptisData || {};
      const ex = (D.writing || []).find((w) => w.id === e.ex);
      const WAcrit = A.writingAnalyzer.CRITERIA;
      const lines = [];
      lines.push(`# Bài viết Aptis Writing — ${e.title || e.ex}`, '');
      lines.push(`- Task: ${e.task} · Số từ: ${e.words} · Ngày viết: ${U.fmtDateTime(e.at)}`, '');
      if (ex) lines.push('## Đề bài', '', ex.context.split('\n')[0], '');
      lines.push('## Bài làm của học viên', '');
      (e.texts || []).forEach((t, i) => {
        const p = ex && ex.parts[i];
        if (p) lines.push(`**Phần ${i + 1}:** ${p.prompt.replace(/\n/g, ' ')} (${p.min}–${p.max} từ)`, '');
        lines.push('> ' + String(t || '(trống)').replace(/\n/g, '\n> '), '');
      });
      lines.push('## Ước tính tự động của ứng dụng (tham khảo, chưa phải điểm chính thức)', '');
      lines.push(`Tổng: ${e.score50}/50 (${e.band}, khoảng ${e.range[0]}–${e.range[1]}). Độ tin cậy: ${e.confidence}.`, '');
      WAcrit.forEach((c) => lines.push(`- ${c.name} (${c.en}): ${e.criteria[c.id]}/5`));
      lines.push('', '## Phiếu chấm của giáo viên (điền điểm 0–5, có thể lẻ 0,5)', '');
      lines.push('| Tiêu chí | Điểm 0–5 | Nhận xét |', '|---|---|---|');
      WAcrit.forEach((c) => lines.push(`| ${c.name} — ${c.help} |  |  |`));
      lines.push('', 'Nhận xét chung:', '', '');
      lines.push('---', '_Học viên nhập các điểm trên vào ứng dụng (Writing → bài viết → “Nhập điểm giáo viên”). Điểm giáo viên sẽ được ưu tiên hơn ước tính tự động._');
      return lines.join('\n');
    },
  });
})();
