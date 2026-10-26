/* Mock Test: mô phỏng bài thi Aptis (G&V, Reading, Listening, Writing, Speaking), tiến độ lưu để làm tiếp */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const ui = A.ui;
  const { h } = ui;
  const U = A.util;
  const D = () => globalThis.AptisData;

  // Speaking vẫn do người học tự chấm → nhân hệ số hiệu chỉnh (người học thường chấm cao hơn thực tế).
  // Writing do bộ chấm tự động theo luật → không nhân hệ số (đã có trần B1 khi thiếu điều kiện B2).
  const SELF_FACTOR = 0.9;

  const CONFIG = {
    full: { label: 'Full Mock', approx: '≈ 2 giờ 30 phút', sigma: 3.5, stages: [
      { id: 'gv', minutes: 25, grammar: 25, vocab: 25 },
      { id: 'reading', minutes: 35, parts: ['sentence', 'ordering', 'shortMatch', 'longMatch'] },
      { id: 'listening', minutes: 30, types: ['conversation', 'announcement', 'interview', 'discussion', 'conversation', 'announcement', 'interview', 'discussion'] },
      { id: 'writing', minutes: 50, tasks: [1, 2, 3, 4] },
      { id: 'speaking', minutes: 15, parts: ['p1', 'p2', 'p3', 'p4', 'p5'] },
    ] },
    mini: { label: 'Mini Mock', approx: '≈ 1 giờ', sigma: 5, stages: [
      { id: 'gv', minutes: 10, grammar: 6, vocab: 6 },
      { id: 'reading', minutes: 12, parts: ['sentence', 'longMatch'] },
      { id: 'listening', minutes: 12, types: ['conversation', 'announcement', 'interview', 'discussion'] },
      { id: 'writing', minutes: 15, tasks: [2, 3] },
      { id: 'speaking', minutes: 8, parts: ['p1', 'p2'] },
    ] },
  };
  const STAGE_NAME = { gv: 'Grammar & Vocabulary', reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking' };
  const STAGE_HELP = {
    gv: 'Chọn đáp án đúng cho từng câu. Thi thật: 50 câu (25 ngữ pháp + 25 từ vựng) trong 25 phút.',
    reading: 'Bốn dạng bài liên tiếp. Không có phản hồi từng câu; hết giờ hệ thống tự nộp.',
    listening: 'Mỗi bài nghe tối đa 2 lần. Hết giờ hệ thống tự nộp phần đang làm.',
    writing: 'Viết từng task rồi nộp: ứng dụng chấm tự động theo luật (điểm Writing là ước tính tự động, không phải điểm giám khảo) và cho nhận xét.',
    speaking: 'Nói to thành tiếng từng phần theo bấm giờ rồi tự chấm (điểm Speaking là điểm tự chấm, đã hiệu chỉnh ×0,9).',
  };

  const usedCount = (id) => {
    const stats = A.store.get('stats');
    let n = 0;
    ['reading', 'listening', 'writing', 'speaking'].forEach((m) => {
      const r = ((stats[m] || {}).refs || {})[id];
      if (r) n += r.n;
    });
    A.store.get('mocks').forEach((m) => (m.used || []).includes(id) && n++);
    return n;
  };
  /** Chọn đề ít dùng nhất (ngẫu nhiên khi hoà), không trùng trong cùng bài */
  const pickLeastUsed = (list, taken) => {
    const cands = list.filter((x) => !taken.has(x.id));
    const min = Math.min(...cands.map((x) => usedCount(x.id)));
    const x = U.pick(cands.filter((c) => usedCount(c.id) === min));
    taken.add(x.id);
    return x;
  };

  function makePlan(mode) {
    const cfg = CONFIG[mode];
    const taken = new Set();
    const plan = {};
    cfg.stages.forEach((st) => {
      if (st.id === 'gv') {
        const topics = D().grammar;
        const gq = U.sample(topics.flatMap((t) => [...t.b1, ...t.b2].map((q) => ({ ...q, tag: 'grammar:' + t.id }))), st.grammar);
        const words = U.sample(A.vocabdb.all().filter((w) => w.lv === 'B1' || w.lv === 'B2'), st.vocab);
        plan.gv = { qs: [...gq, ...A.vocabdb.makeQuestions(words)] };
      } else if (st.id === 'reading') plan.reading = st.parts.map((type) => ({ type, id: pickLeastUsed(D().reading[type], taken).id }));
      else if (st.id === 'listening') plan.listening = st.types.map((type) => pickLeastUsed(D().listening.filter((x) => x.type === type), taken).id);
      else if (st.id === 'writing') plan.writing = st.tasks.map((t) => pickLeastUsed(D().writing.filter((x) => x.task === t), taken).id);
      else if (st.id === 'speaking') plan.speaking = st.parts.map((p) => ({ part: p, id: pickLeastUsed(D().speaking[p], taken).id }));
    });
    return { id: U.uid(), mode, startedAt: Date.now(), stageIdx: 0, results: {}, plan, used: [...taken] };
  }

  const partTotal = (type, set) => (type === 'sentence' ? set.items.length : type === 'ordering' ? set.order.length : type === 'shortMatch' ? set.qs.length : set.paras.length);

  /** Chạy tuần tự các bài con trong một giai đoạn; hỗ trợ hết giờ → nộp phần đang làm */
  function sequence({ count, make, onPart, done }) {
    const box = h('div', { class: 'seq' });
    let i = 0;
    let cur = null;
    let timedOut = false;
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      done();
    };
    function show() {
      ui.clear(box);
      if (i >= count) return end();
      box.append(h('p', { class: 'eyebrow' }, `Bài ${i + 1}/${count}`));
      cur = make(i, (res) => {
        onPart(i, res);
        i++;
        if (timedOut) end();
        else setTimeout(show, 0);
      });
      box.append(cur);
      globalThis.scrollTo(0, 0);
    }
    show();
    box.forceFinish = () => {
      if (ended) return;
      timedOut = true;
      if (cur && cur.finish) cur.finish();
      else end();
    };
    return box;
  }

  function runStage(run, st, finishStage) {
    const D_ = D();
    const body = h('div', { class: 'stage-body' });
    let seq = null;
    const plan = run.plan;
    const result = {};
    if (st.id === 'gv') {
      const quiz = ui.Quiz({ questions: plan.gv.qs, mode: 'exam', title: 'G&V', summary: false, shuffle: true, onFinish: (res) => finishStage({ c: res.correct, t: res.total }) });
      seq = { forceFinish: () => quiz.finish() };
      body.append(quiz);
    } else if (st.id === 'reading') {
      let c = 0;
      let t = 0;
      const total = plan.reading.reduce((n, p) => n + partTotal(p.type, D_.reading[p.type].find((s) => s.id === p.id)), 0);
      const box = sequence({
        count: plan.reading.length,
        make: (i, cb) => {
          const p = plan.reading[i];
          const set = D_.reading[p.type].find((s) => s.id === p.id);
          return h('div', null, h('h3', null, `${A.labels.reading[p.type].part}: ${A.labels.reading[p.type].name}`), ui.ReadingTask(p.type, set, { mode: 'exam', onFinish: (res) => cb(res) }));
        },
        onPart: (i, res) => { c += res.correct; t += res.total; },
        done: () => finishStage({ c, t: total }),
      });
      seq = box;
      body.append(box);
    } else if (st.id === 'listening') {
      let c = 0;
      const box = sequence({
        count: plan.listening.length,
        make: (i, cb) => ui.ListeningTask(D_.listening.find((x) => x.id === plan.listening[i]), { mode: 'exam', onFinish: (res) => cb(res) }),
        onPart: (i, res) => { c += res.correct; },
        done: () => finishStage({ c, t: plan.listening.length * 3 }),
      });
      seq = box;
      body.append(box);
    } else if (st.id === 'writing') {
      const ratings = [];
      const box = sequence({
        count: plan.writing.length,
        make: (i, cb) => {
          const ex = D_.writing.find((x) => x.id === plan.writing[i]);
          return h('div', null, h('h3', null, `${A.labels.writing[ex.task].name}: ${A.labels.writing[ex.task].vi}`), ui.WritingTask(ex, { mode: 'exam', onFinish: (res) => cb(res) }));
        },
        onPart: (i, res) => ratings.push(res.rating),
        done: () => finishStage({ ratings, n: plan.writing.length }),
      });
      seq = box;
      body.append(box);
    } else {
      const ratings = [];
      const box = sequence({
        count: plan.speaking.length,
        make: (i, cb) => {
          const p = plan.speaking[i];
          const item = D_.speaking[p.part].find((x) => x.id === p.id);
          return h('div', null, h('h3', null, `${A.labels.speaking[p.part].name}: ${A.labels.speaking[p.part].vi}`), ui.SpeakingTask(p.part, item, { mode: 'exam', onFinish: (res) => cb(res) }));
        },
        onPart: (i, res) => ratings.push(res.rating),
        done: () => finishStage({ ratings, n: plan.speaking.length }),
      });
      seq = box;
      body.append(box);
    }
    body.forceFinish = () => seq && seq.forceFinish && seq.forceFinish();
    return body;
  }

  function scoreOf(id, r) {
    if (id === 'writing' || id === 'speaking') {
      const sum = U.sum(r.ratings || []);
      return Math.min(50, (sum / (r.n * 5)) * 50 * (id === 'speaking' ? SELF_FACTOR : 1));
    }
    return r.t ? (r.c / r.t) * 50 : 0;
  }

  function finishMock(run) {
    const cfg = CONFIG[run.mode];
    const scores = {};
    const details = {};
    cfg.stages.forEach((st) => {
      const r = run.results[st.id] || { c: 0, t: 1, ratings: [], n: 1 };
      scores[st.id] = Math.round(scoreOf(st.id, r) * 10) / 10;
      details[st.id] = r.ratings ? { ratings: r.ratings, n: r.n } : { c: r.c, t: r.t };
    });
    const vals = Object.values(scores);
    const overall = U.avg(vals);
    const ranked = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const cefr = {};
    Object.entries(scores).forEach(([k, v]) => (cefr[k] = A.scoring.cefr(v)));
    const rec = {
      id: run.id,
      mode: run.mode,
      at: Date.now(),
      seconds: Math.round((Date.now() - run.startedAt) / 1000),
      scores,
      cefr,
      overall: Math.round(overall * 10) / 10,
      overallCefr: A.scoring.cefr(overall),
      prob: A.scoring.passProb(scores, cfg.sigma),
      weakest: ranked.slice(0, 2).map((x) => x[0]),
      details,
      used: run.used,
    };
    A.store.update('mocks', (m) => m.push(rec));
    A.store.set('mockRun', null);
    const obj = ['gv', 'reading', 'listening'].reduce((a, k) => ({ c: a.c + (details[k].c || 0), t: a.t + (details[k].t || 0) }), { c: 0, t: 0 });
    A.session.record({ module: 'mock', sub: run.mode, ref: run.id, correct: obj.c, total: obj.t, seconds: rec.seconds });
    A.game.addXP(100);
    A.game.checkBadges();
    ui.router.go('#/mock/result/' + rec.id, true);
  }

  /* ------------------------- Trang tổng quan ------------------------- */
  ui.router.add(
    '/mock',
    (ctx) => {
      const mocks = A.store.get('mocks');
      const run = A.store.get('mockRun');
      const mode = ctx.query.mode;
      const root = h('div', null, ui.PageHeader({ title: 'Mock Test', sub: 'Mô phỏng bài thi Aptis: G&V → Reading → Listening → Writing → Speaking, kết thúc bằng CEFR ước tính và xác suất đạt B2.' }));
      if (run) {
        const next = CONFIG[run.mode].stages[run.stageIdx];
        root.append(ui.Callout('warn', h('div', null, h('strong', null, `Bạn đang làm dở ${CONFIG[run.mode].label}`), ` (đang ở phần ${run.stageIdx + 1}/5: ${STAGE_NAME[next.id]}). `, ui.Button({ label: 'Tiếp tục', kind: 'accent', size: 'sm', href: '#/mock/run' }), ' ', ui.Button({ label: 'Bỏ bài đang làm', kind: 'ghost', size: 'sm', onClick: async () => { if (await ui.confirm('Bỏ bài thi thử đang làm dở? Kết quả các phần đã làm sẽ mất.', { danger: true, ok: 'Bỏ bài' })) { A.store.set('mockRun', null); ui.router.refresh(); } } }))));
      }
      const card = (m) => {
        const c = CONFIG[m];
        return ui.Card(
          { title: c.label, sub: c.approx, class: mode === m ? 'highlight' : '' },
          h('ul', { class: 'checklist' }, c.stages.map((s) => h('li', null, `${STAGE_NAME[s.id]} — ${s.minutes} phút`))),
          ui.Button({ label: 'Bắt đầu ' + c.label, kind: m === 'full' ? 'accent' : 'primary', icon: '▶', onClick: async () => {
            if (A.store.get('mockRun') && !(await ui.confirm('Đang có một bài thi thử làm dở. Bắt đầu bài mới sẽ bỏ bài cũ. Tiếp tục?', { danger: true, ok: 'Bắt đầu bài mới' }))) return;
            A.store.set('mockRun', makePlan(m));
            ui.router.go('#/mock/run');
          } }),
        );
      };
      root.append(h('div', { class: 'grid grid-2' }, card('mini'), card('full')));
      root.append(ui.Card({ title: 'Lưu ý khi thi thử' }, h('ul', null, ['Làm trong điều kiện như thi thật: yên tĩnh, bấm giờ, không tra từ điển.', 'Reading, Listening, G&V được chấm tự động. Writing và Speaking là điểm TỰ CHẤM theo tiêu chí, đã nhân hệ số 0,9 để bù xu hướng chấm cao.', 'Ngưỡng CEFR và xác suất là ước lượng tham khảo, không thay thế kết quả thi chính thức.', 'Full Mock có thể chia 2 lần: tiến độ lưu theo từng phần (phần đang làm dở sẽ làm lại từ đầu).'].map((x) => h('li', null, x)))));
      if (mocks.length) {
        root.append(
          ui.Card(
            { title: 'Lịch sử Mock', sub: `${mocks.length} bài` },
            ui.charts.line({ title: 'Xu hướng điểm Mock', yMin: 0, yMax: 50, refLine: { y: A.scoring.B2_MIN, label: 'B2 = ' + A.scoring.B2_MIN }, series: [{ name: 'Điểm trung bình /50', tone: 1, points: mocks.map((m, i) => ({ x: '#' + (i + 1), y: m.overall })) }] }),
            h('table', { class: 'table' }, h('thead', null, h('tr', null, ['#', 'Ngày', 'Loại', 'Điểm TB', 'CEFR', 'Xác suất B2', ''].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, mocks.map((m, i) => [m, i]).reverse().map(([m, i]) => h('tr', null, h('td', null, i + 1), h('td', null, U.fmtDateTime(m.at)), h('td', null, CONFIG[m.mode].label), h('td', null, m.overall + '/50'), h('td', null, m.overallCefr), h('td', null, Math.round(m.prob * 100) + '%'), h('td', null, h('a', { href: '#/mock/result/' + m.id }, 'Chi tiết →')))))),
          ),
        );
      }
      return { title: 'Mock Test', module: 'mock', node: root };
    },
    'mock',
  );

  /* ------------------------- Chạy bài thi ------------------------- */
  ui.router.add(
    '/mock/run',
    (ctx) => {
      const run = A.store.get('mockRun');
      if (!run) return { redirect: '#/mock' };
      const cfg = CONFIG[run.mode];
      const st = cfg.stages[run.stageIdx];
      const root = h('div', { class: 'mock-run' });
      const header = h('div', { class: 'diag-head' }, h('p', { class: 'eyebrow' }, `${cfg.label} · Phần ${run.stageIdx + 1}/${cfg.stages.length}`), h('h2', null, STAGE_NAME[st.id]), h('p', { class: 'muted' }, STAGE_HELP[st.id]));

      const intro = () => {
        ui.clear(root);
        root.append(
          ui.PageHeader({ title: `${STAGE_NAME[st.id]} — ${st.minutes} phút`, sub: `${cfg.label} · Phần ${run.stageIdx + 1}/${cfg.stages.length}` }),
          ui.Progress({ value: (run.stageIdx / cfg.stages.length) * 100, tone: 'accent', label: 'Tiến độ Mock' }),
          ui.Card({}, h('p', null, STAGE_HELP[st.id]), h('ul', { class: 'checklist' }, [`Thời gian: ${st.minutes} phút${st.id === 'speaking' ? ' (gợi ý, mỗi phần có bấm giờ riêng)' : ''}`, 'Bấm “Bắt đầu” là đồng hồ chạy', st.id === 'listening' ? 'Bật loa/tai nghe; mỗi bài nghe tối đa 2 lần' : 'Không tra từ điển', 'Có thể thoát và quay lại sau: phần đang làm dở sẽ làm lại từ đầu'].map((x) => h('li', null, x))), h('div', { class: 'quiz-actions' }, ui.Button({ label: 'Bắt đầu phần này', kind: 'accent', icon: '▶', onClick: start }), ui.Button({ label: 'Thoát (giữ tiến độ)', kind: 'ghost', href: '#/mock' }))),
        );
      };

      function start() {
        ui.clear(root);
        let stageBody = null;
        let over = false;
        const finishStage = (r) => {
          if (over) return;
          over = true;
          A.tts.stop();
          const cur = A.store.get('mockRun');
          cur.results[st.id] = r;
          cur.stageIdx += 1;
          A.store.set('mockRun', cur);
          if (cur.stageIdx >= cfg.stages.length) finishMock(cur);
          else ui.router.go('#/mock/run', true);
        };
        const bar = ui.Countdown({
          seconds: st.minutes * 60,
          label: '⏱ Còn lại',
          controls: false,
          autoStart: true,
          onEnd: () => {
            if (st.id === 'speaking') return ui.toast('Hết thời gian gợi ý của phần Speaking.', { kind: 'warn', icon: '⏰' });
            ui.toast('Hết giờ — hệ thống nộp phần đang làm.', { kind: 'warn', icon: '⏰', ms: 5000 });
            stageBody && stageBody.forceFinish();
          },
        });
        stageBody = runStage(run, st, finishStage);
        root.append(header, h('div', { class: 'sticky-timer' }, bar), stageBody);
        ctx.onCleanup(() => {
          bar.stop();
          A.tts.stop();
        });
      }
      intro();
      return { title: `Mock — ${STAGE_NAME[st.id]}`, module: 'mock', node: root };
    },
    'mock',
  );

  /* ------------------------- Kết quả ------------------------- */
  ui.router.add(
    '/mock/result/:id',
    (ctx) => {
      const mocks = A.store.get('mocks');
      const idx = mocks.findIndex((x) => x.id === ctx.params.id);
      if (idx < 0) return { redirect: '#/mock' };
      const m = mocks[idx];
      const prev = idx > 0 ? mocks[idx - 1] : null;
      const probPct = Math.round(m.prob * 100);
      const target = probPct >= 80;
      const sk = A.scoring.SKILLS;
      const root = h('div', null, ui.PageHeader({ title: 'Kết quả ' + CONFIG[m.mode].label, sub: `${U.fmtDateTime(m.at)} · ${U.fmtMinutes(m.seconds)}` }));
      root.append(
        h(
          'section',
          { class: 'hero hero-dash' },
          h('div', { class: 'hero-main' }, h('p', { class: 'eyebrow' }, 'Estimated CEFR'), h('h2', { class: 'level-big' }, m.overallCefr), h('p', { class: 'lead' }, `Điểm trung bình ${m.overall}/50 · ngưỡng B2 ước lượng ${A.scoring.B2_MIN}/50.`), h('p', null, target ? ui.Chip('Đạt mục tiêu: xác suất ≥ 80%', 'good') : ui.Chip(`Còn ${80 - probPct} điểm % để tới mục tiêu 80%`, 'warn'), ' ', prev && ui.Chip(`${m.overall >= prev.overall ? '+' : ''}${(m.overall - prev.overall).toFixed(1)} điểm so với Mock trước`, m.overall >= prev.overall ? 'good' : 'warn'))),
          h('div', { class: 'hero-side' }, ui.Ring({ value: probPct, size: 130, stroke: 13, label: probPct + '%', sub: 'xác suất đạt B2', tone: target ? 'good' : 'primary' })),
        ),
        h(
          'div',
          { class: 'grid grid-2' },
          ui.Card(
            { title: 'Điểm từng kỹ năng' },
            sk.map((s) => {
              const v = m.scores[s.id];
              const tag = s.id === 'speaking' ? ' (tự chấm)' : s.id === 'writing' ? ' (ước tính tự động)' : '';
              return h('div', { class: 'goal' }, h('div', { class: 'goal-head' }, h('span', null, `${s.icon} ${s.name}`, tag && h('span', { class: 'muted small' }, tag)), h('span', null, h('strong', null, `${v}/50`), ' ', ui.Chip(m.cefr[s.id], v >= A.scoring.B2_MIN ? 'good' : 'warn'))), ui.Progress({ value: (v / 50) * 100, tone: v >= A.scoring.B2_MIN ? 'good' : 'primary', thin: true, label: s.name }));
            }),
          ),
          ui.Card({ title: 'Hồ sơ kỹ năng' }, ui.charts.radar({ labels: sk.map((s) => s.short), series: [{ name: 'Mock này', values: sk.map((s) => m.scores[s.id] / 50), tone: 1 }, ...(prev ? [{ name: 'Mock trước', values: sk.map((s) => prev.scores[s.id] / 50), tone: 3 }] : [])], target: A.scoring.B2_MIN / 50, title: 'Radar kỹ năng' })),
        ),
        ui.Card(
          { title: 'Weakest skills & gợi ý cải thiện' },
          m.weakest.map((id) => {
            const s = A.scoring.skill(id);
            const mod = id === 'gv' ? 'grammar' : id;
            return h('div', { class: 'improve' }, h('h3', null, `${s.icon} ${s.name} — ${m.scores[id]}/50`), h('ul', null, A.scoring.suggestions(id).map((x) => h('li', null, x))), ui.Button({ label: 'Luyện ' + A.labels.modules[mod].name, kind: 'primary', size: 'sm', href: A.labels.modules[mod].route }));
          }),
        ),
        ui.Callout('info', `Ghi chú phương pháp: Reading, Listening và G&V chấm theo đáp án; Writing do bộ luật tự động ước tính (bài ngắn thì độ tin cậy thấp); Speaking là điểm tự chấm đã nhân ${SELF_FACTOR}. Xác suất = 0,6 × trung bình + 0,4 × giá trị thấp nhất của xác suất từng kỹ năng (sai số đo ${CONFIG[m.mode].sigma} điểm${m.mode === 'mini' ? ' — Mini Mock ít câu nên độ tin cậy thấp hơn' : ''}). Đây là ước lượng, không phải kết quả chính thức.`),
        h('div', { class: 'quiz-actions' }, ui.Button({ label: 'Làm Mock khác', kind: 'accent', href: '#/mock' }), ui.Button({ label: 'Xem phân tích', kind: 'secondary', href: '#/analytics' }), ui.Button({ label: 'Về Dashboard', kind: 'ghost', href: '#/' })),
      );
      return { title: 'Kết quả Mock', module: 'mock', node: root };
    },
    'mock',
  );
})();
