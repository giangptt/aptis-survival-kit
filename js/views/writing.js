/* Writing: Task 1–4, bản nháp tự lưu, bài mẫu B2, checklist tự đánh giá */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const ui = A.ui;
  const { h } = ui;

  const exs = (task) => (globalThis.AptisData.writing || []).filter((x) => x.task === Number(task));
  const refStat = (id) => ((A.store.get('stats').writing || {}).refs || {})[id];

  const CHECKLIST = {
    1: ['Mỗi câu đúng số từ yêu cầu (1–5 từ / 20–30 từ)', 'Chính tả từng từ đúng, viết hoa tên riêng và “I”', 'Trả lời đúng thông tin được hỏi, không lan man'],
    2: ['Mỗi tin nhắn 30–40 từ, đúng giọng mạng xã hội thân thiện', 'Có ý kiến + lý do hoặc ví dụ ngắn', 'Trả lời đúng người/đúng chủ đề của từng tin nhắn', 'Ít nhất một từ nối (because, however, for example…)'],
    3: ['Lời chào (Hi …,) và lời kết (Take care, / Cheers,)', 'Đủ 40–50 từ', 'Giọng thân mật: viết tắt (I’m, don’t) và cụm quen thuộc', 'Trả lời đủ các câu hỏi của bạn bạn đưa ra'],
    4: ['Lời chào trang trọng (Dear Mr/Ms … / Dear Sir or Madam,)', 'Nêu mục đích ngay đoạn 1 (I am writing to…)', '2–3 ý chính, mỗi ý một đoạn có từ nối', 'Giọng trang trọng: không viết tắt, không tiếng lóng', 'Kết thư lịch sự + Yours sincerely/faithfully hoặc Kind regards', '120–150 từ'],
  };

  /** Hồ sơ lỗi hay mắc + xu hướng điểm + độ lệch so với giáo viên */
  function progressCards() {
    const log = A.wlog.list();
    if (!log.length) return ui.Card({ title: 'Nhận xét kiểu giáo viên' }, h('p', { class: 'muted' }, 'Sau mỗi bài, ứng dụng chấm 4 tiêu chí (hoàn thành yêu cầu, ngữ pháp, từ vựng, liên kết), đánh số từng lỗi trong bài và nêu việc nên sửa trước. Bài làm càng nhiều, “hồ sơ lỗi hay mắc” càng chính xác.'), h('p', { class: 'small muted' }, 'Lưu ý: đây là ước tính tự động bằng luật ngôn ngữ chạy trên máy bạn — không dùng AI, không gửi bài đi đâu, và không thay giáo viên.'));
    const prof = A.wlog.errorProfile(12).slice(0, 6);
    const trend = A.wlog.trend(12);
    const cal = A.wlog.calibration();
    const avg = A.wlog.criteriaAvg(5);
    const cards = [
      ui.Card(
        { title: 'Lỗi bạn hay mắc', sub: `Trong ${Math.min(12, log.length)} lần chấm gần nhất` },
        prof.length
          ? h('ol', { class: 'issue-list' }, prof.map((r) => h('li', null, h('strong', null, r.label), h('span', { class: 'muted small' }, ` — ${r.count} lần trong ${r.attempts} bài`), r.topic && [' ', h('a', { class: 'small', href: '#/grammar/' + r.topic }, 'Ôn ' + A.writingAnalyzer.TOPIC_NAME[r.topic] + ' →')])))
          : h('p', { class: 'good' }, 'Chưa phát hiện lỗi lặp lại — tuyệt!'),
      ),
      ui.Card(
        { title: 'Điểm các lần gần đây', sub: avg ? `Trung bình 5 bài: Hoàn thành ${avg.ta} · Ngữ pháp ${avg.gr} · Từ vựng ${avg.vo} · Liên kết ${avg.co} (thang 5)` : '' },
        ui.charts.line({ title: 'Điểm Writing theo thời gian', yMin: 0, yMax: 50, refLine: { y: A.scoring.B2_MIN, label: 'B2' }, series: [{ name: 'Điểm /50', tone: 1, points: trend.map((x, i) => ({ x: '#' + (i + 1), y: x.score50 })) }] }),
      ),
    ];
    const out = [h('div', { class: 'grid grid-2' }, cards)];
    if (cal.n)
      out.push(
        ui.Card(
          { title: 'Đối chiếu với giáo viên', sub: `${cal.n} bài có điểm giáo viên` },
          h('p', null, `Độ lệch tuyệt đối trung bình: ${cal.mae} điểm (thang 50). Bộ chấm tự động ${cal.bias >= 0 ? 'cao hơn' : 'thấp hơn'} giáo viên trung bình ${Math.abs(cal.bias)} điểm.`),
          ui.Button({ label: '⬇ Xuất dữ liệu hiệu chỉnh (không kèm bài viết)', kind: 'secondary', size: 'sm', onClick: () => {
            const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(A.wlog.exportCalibration(), null, 2)], { type: 'application/json' })), download: 'aptis-writing-calibration.json' });
            document.body.append(a);
            a.click();
            a.remove();
          } }),
        ),
      );
    out.push(h('p', { class: 'muted small' }, 'Nhận xét do bộ luật tự động tạo trên máy bạn (không AI, không gửi bài đi đâu). Đây là ước tính để định hướng, không thay giáo viên hay giám khảo Aptis.'));
    return h('div', null, out);
  }

  ui.router.add(
    '/writing',
    () => {
      const L = A.labels.writing;
      const grid = h('div', { class: 'grid grid-2' });
      [1, 2, 3, 4].forEach((t) => {
        const list = exs(t);
        const done = list.filter((x) => refStat(x.id)).length;
        grid.append(h('a', { class: 'card card-link', href: '#/writing/' + t }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, L[t].icon), h('h3', null, `${L[t].name}: ${L[t].vi}`), h('p', { class: 'muted' }, L[t].desc), h('p', null, ui.Chip(`${done}/${list.length} đề đã nộp`, 'neutral'))));
      });
      const drafts = Object.keys(A.store.get('drafts'));
      return {
        title: 'Writing',
        module: 'writing',
        node: h(
          'div',
          null,
          ui.PageHeader({ title: 'Writing', sub: 'Thi thật: 4 phần trong 50 phút. Viết → nộp → nhận xét tự động (điểm, lỗi, việc nên sửa) → sửa lại và chấm lại. Có thể nhờ giáo viên chấm để đối chiếu.' }),
          drafts.length ? ui.Callout('info', `Bạn có ${drafts.length} bản nháp chưa nộp (tự lưu trong trình duyệt).`) : null,
          grid,
          progressCards(),
        ),
      };
    },
    'writing',
  );

  ui.router.add(
    '/writing/:task',
    (ctx) => {
      const t = Number(ctx.params.task);
      if (![1, 2, 3, 4].includes(t)) return { redirect: '#/writing' };
      const L = A.labels.writing[t];
      const next = A.plan.nextRef('writing', t);
      const drafts = A.store.get('drafts');
      return {
        title: `Writing ${L.name}`,
        module: 'writing',
        node: h(
          'div',
          null,
          ui.PageHeader({ title: `${L.name}: ${L.vi}`, sub: L.desc, crumbs: [{ label: 'Writing', href: '#/writing' }, { label: L.name }], actions: next && ui.Button({ label: 'Làm đề tiếp theo', kind: 'accent', href: `#/writing/${t}/${next}` }) }),
          h(
            'div',
            { class: 'grid grid-2' },
            exs(t).map((x, i) => {
              const st = refStat(x.id);
              const last = A.wlog.forEx(x.id)[0];
              return h('a', { class: 'card card-link', href: `#/writing/${t}/${x.id}` }, h('div', { class: 'row-between' }, h('h3', null, `Đề ${i + 1}: ${x.title}`), drafts[x.id] && ui.Chip('có bản nháp', 'warn')), h('p', { class: 'muted small' }, x.context.split('\n')[0].slice(0, 110) + '…'), h('p', null, last ? ui.Chip(`${A.wlog.effectiveScore(last)}/50 · ${last.band}${last.teacher ? ' (giáo viên)' : ''}${last.revisions ? ' · đã sửa ' + last.revisions + ' lần' : ''}`, A.wlog.effectiveScore(last) >= 38 ? 'good' : 'primary') : st ? ui.Chip(`${st.n} lần`, 'neutral') : ui.Chip('Chưa làm', 'neutral')));
            }),
          ),
        ),
      };
    },
    'writing',
  );

  ui.router.add(
    '/writing/:task/:id',
    (ctx) => {
      const t = Number(ctx.params.task);
      const ex = exs(t).find((x) => x.id === ctx.params.id);
      if (!ex) return { redirect: '#/writing' };
      const L = A.labels.writing[t];
      const list = exs(t);
      const nextEx = list[(list.indexOf(ex) + 1) % list.length];
      const task = ui.WritingTask(ex, {
        mode: 'practice',
        onFinish: (res) => A.session.record({ module: 'writing', sub: 't' + t, ref: ex.id, rating: res.rating, seconds: res.seconds }),
        extraActions: () => [ui.Button({ label: 'Đề tiếp theo →', kind: 'accent', href: `#/writing/${t}/${nextEx.id}` }), ui.Button({ label: 'Viết lại đề này', kind: 'secondary', href: `#/writing/${t}/${ex.id}?r=${Date.now()}` }), ui.Button({ label: 'Danh sách', kind: 'ghost', href: '#/writing/' + t })],
      });
      ctx.onCleanup(() => task.stop && task.stop());
      return {
        title: ex.title,
        module: 'writing',
        node: h(
          'div',
          null,
          ui.PageHeader({ title: ex.title, sub: `${L.name} · ${L.vi}`, crumbs: [{ label: 'Writing', href: '#/writing' }, { label: L.name, href: '#/writing/' + t }, { label: 'Viết bài' }] }),
          ui.Accordion({ title: '✅ Checklist trước khi nộp' }, h('ul', { class: 'checklist' }, CHECKLIST[t].map((x) => h('li', null, h('label', null, h('input', { type: 'checkbox' }), ' ' + x))))),
          ui.Countdown({ seconds: { 1: 5, 2: 10, 3: 8, 4: 20 }[t] * 60, label: '⏱ Giờ gợi ý', controls: true, compact: true }),
          task,
        ),
      };
    },
    'writing',
  );
})();
