/* Các "bài tập" hoàn chỉnh dùng chung cho Luyện tập, Diagnostic và Mock Test:
   ReadingTask, ListeningTask, WritingTask, SpeakingTask.
   Mỗi hàm trả về một Node; onFinish(result) được gọi đúng một lần khi hoàn thành. */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const ui = (A.ui = A.ui || {});
  const U = A.util;
  const { h } = ui;

  /* ================= Khung tư duy Speaking ================= */
  ui.frameworks = {
    ard: { name: 'ARD — Answer · Reason · Detail', use: 'Part 1', steps: [['A', 'Answer', 'Trả lời thẳng vào câu hỏi trong câu đầu tiên.'], ['R', 'Reason', 'Thêm lý do: “mainly because…”.'], ['D', 'Detail', 'Thêm một chi tiết/ví dụ ngắn của riêng bạn.']], phrases: ['Yes, I do. Mainly because…', 'To be honest, …', 'For instance, last week I…'] },
    photo: { name: 'Mô tả ảnh: Overview → Details → Guess → Feeling', use: 'Part 2', steps: [['O', 'Overview', 'Tổng quan: ai, ở đâu, đang làm gì.'], ['D', 'Details', 'Chi tiết: vị trí (on the left, in the background), đồ vật, quần áo.'], ['G', 'Guess', 'Suy đoán: “It looks as if…”, “They seem to be…”.'], ['F', 'Feeling', 'Cảm nhận/liên hệ bản thân.']], phrases: ['In this picture I can see…', 'In the background there is…', 'It looks as if…', 'It reminds me of…'] },
    compare: { name: 'So sánh: Both → Difference → Preference', use: 'Part 3', steps: [['B', 'Both', 'Điểm chung: “Both pictures show…”.'], ['D', 'Difference', 'Khác biệt: “In the first… whereas in the second…”.'], ['P', 'Preference', 'Ý kiến cá nhân + lý do: “I would prefer… because…”.']], phrases: ['Both pictures show…', 'Unlike the first one, the second…', 'On the one hand… on the other hand…', 'I would rather… because…'] },
    opinion: { name: 'Thảo luận: Opinion → Because → Example → However', use: 'Part 4', steps: [['O', 'Opinion', 'Nêu quan điểm rõ ràng.'], ['B', 'Because', 'Lý do chính.'], ['E', 'Example', 'Ví dụ cụ thể.'], ['H', 'However', 'Nhìn mặt trái để thể hiện tư duy B2.']], phrases: ['In my opinion…', 'The main reason is that…', 'For example…', 'Having said that, …'] },
    prep: { name: 'PREP — Point · Reason · Example · Point', use: 'Part 5 (2 phút)', steps: [['P', 'Point', 'Nêu ý chính ngay câu đầu.'], ['R', 'Reason', 'Giải thích vì sao.'], ['E', 'Example', 'Cho ví dụ cụ thể (của bản thân càng tốt).'], ['P', 'Point', 'Nhắc lại ý chính để kết.']], phrases: ['I strongly believe that…', 'This is because…', 'A good example is…', 'So, to sum up, …'] },
  };
  const FW_OF = { p1: 'ard', p2: 'photo', p3: 'compare', p4: 'opinion', p5: 'prep' };
  ui.FrameworkCard = (key) => {
    const f = ui.frameworks[key];
    return h(
      'div',
      { class: 'framework' },
      h('h4', null, f.name),
      h('ol', { class: 'fw-steps' }, f.steps.map(([k, n, d]) => h('li', null, h('span', { class: 'fw-key', 'aria-hidden': 'true' }, k), h('div', null, h('strong', null, n), ' — ', d)))),
      h('p', { class: 'small muted' }, 'Cụm hữu ích: ', f.phrases.join(' · ')),
    );
  };

  /* ================= Reading ================= */
  const practiceTimer = (minutes) => ui.Countdown({ seconds: minutes * 60, label: '⏱ Giờ gợi ý', controls: false, compact: true, autoStart: true, onEnd: () => ui.toast('Hết giờ gợi ý — làm nốt rồi xem lại bạn mất thời gian ở đâu.', { kind: 'warn', icon: '⏰' }) });

  const mkResult = (items, t0, tag) => {
    const correct = items.filter((i) => i.ok).length;
    return { correct, total: items.length, pct: items.length ? Math.round((correct / items.length) * 100) : 0, seconds: Math.round((Date.now() - t0) / 1000), items: items.map((i) => ({ tag, ...i })) };
  };

  function OrderTask(set, { exam, onFinish, extraActions }) {
    const t0 = Date.now();
    const root = h('div', { class: 'task task-order' });
    let pool = U.shuffle(set.order.map((s, i) => ({ s, i })));
    if (pool.every((x, k) => x.i === k)) pool = pool.reverse();
    let picked = [];
    let checked = false;
    const timer = exam ? null : practiceTimer(A.labels.reading.ordering.minutes);

    const move = (k, d) => {
      const j = k + d;
      if (j < 0 || j >= picked.length) return;
      [picked[k], picked[j]] = [picked[j], picked[k]];
      render();
    };
    function check() {
      checked = true;
      timer && timer.stop();
      const items = picked.map((p, k) => ({ q: p.s, ok: p.i === k, pickedText: p.s, correctText: set.order[k] }));
      const res = mkResult(items, t0, 'ordering');
      onFinish && onFinish(res);
      root.result = res;
      render(res);
    }
    function render(res) {
      ui.clear(root);
      root.append(
        timer,
        h('p', { class: 'muted' }, 'Câu đầu tiên đã cố định. Bấm vào các câu bên dưới theo đúng thứ tự để đặt chúng vào đoạn văn.'),
        h('ol', { class: 'order-list', start: 1 }, h('li', { class: 'order-item fixed' }, h('span', { class: 'order-text' }, set.first), h('span', { class: 'chip chip-neutral' }, 'Cố định')), picked.map((p, k) => {
          const ok = checked && p.i === k;
          const bad = checked && p.i !== k;
          return h(
            'li',
            { class: ['order-item', 'placed', ok && 'ok', bad && 'bad'] },
            h('span', { class: 'order-text' }, p.s),
            !checked &&
              h(
                'span',
                { class: 'order-ctl' },
                h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Đưa lên', disabled: k === 0, onClick: () => move(k, -1) }, '↑'),
                h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Đưa xuống', disabled: k === picked.length - 1, onClick: () => move(k, 1) }, '↓'),
                h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Bỏ chọn', onClick: () => ((pool.push(p), (picked = picked.filter((x) => x !== p))), render()) }, '✕'),
              ),
            checked && h('span', { class: 'small' }, ok ? '✓' : '✗ vị trí đúng là câu ' + (set.order.indexOf(p.s) + 2)),
          );
        })),
        !checked && pool.length
          ? h('div', { class: 'pool' }, h('h4', null, 'Các câu còn lại — chọn câu tiếp theo:'), pool.map((p) => h('button', { type: 'button', class: 'pool-item', onClick: () => ((picked.push(p), (pool = pool.filter((x) => x !== p))), render()) }, p.s)))
          : null,
      );
      if (!checked) root.append(h('div', { class: 'quiz-actions' }, h('button', { type: 'button', class: 'btn btn-accent', disabled: picked.length < set.order.length, onClick: check }, exam ? 'Nộp bài' : 'Kiểm tra')));
      else if (!exam) {
        root.append(
          h('div', { class: ['feedback', res.correct === res.total ? 'fb-ok' : 'fb-bad'], role: 'status' }, h('strong', null, `${res.correct}/${res.total} câu đúng vị trí`), h('p', null, ui.rich(set.e)), h('p', { class: 'small muted' }, 'Thứ tự đúng: ', set.first, ' → ', set.order.join(' → '))),
          h('div', { class: 'quiz-actions' }, extraActions && extraActions(res)),
        );
      }
    }
    render();
    root.finish = () => {
      if (!checked) check();
    };
    return root;
  }

  function MatchTask(set, { exam, onFinish, extraActions }) {
    const t0 = Date.now();
    const root = h('div', { class: 'task task-match' });
    const ans = set.qs.map(() => null);
    let checked = false;
    const timer = exam ? null : practiceTimer(A.labels.reading.shortMatch.minutes);
    const checkBtn = h('button', { type: 'button', class: 'btn btn-accent', disabled: true, onClick: check }, exam ? 'Nộp bài' : 'Kiểm tra');
    const qBox = h('div', { class: 'match-qs' });

    function check() {
      checked = true;
      timer && timer.stop();
      const items = set.qs.map((q, i) => ({ q: q.q, ok: ans[i] === q.a, pickedText: ans[i] != null ? set.people[ans[i]].n : '(chưa chọn)', correctText: set.people[q.a].n, e: q.e }));
      const res = mkResult(items, t0, 'shortMatch');
      onFinish && onFinish(res);
      root.result = res;
      drawQs();
      checkBtn.remove();
      if (!exam) root.append(h('div', { class: ['feedback', res.pct >= 70 ? 'fb-ok' : 'fb-bad'], role: 'status' }, h('strong', null, `${res.correct}/${res.total} đúng`)), h('div', { class: 'quiz-actions' }, extraActions && extraActions(res)));
    }
    function drawQs() {
      ui.clear(qBox);
      set.qs.forEach((q, i) => {
        const ok = checked && ans[i] === q.a;
        const bad = checked && ans[i] !== q.a;
        qBox.append(
          h(
            'fieldset',
            { class: ['match-q', ok && 'ok', bad && 'bad'] },
            h('legend', null, `${i + 1}. ${q.q}`),
            h(
              'div',
              { class: 'match-opts' },
              set.people.map((p, pi) => {
                const id = `mq${i}-${pi}`;
                return h(
                  'span',
                  null,
                  h('input', { type: 'radio', name: 'mq' + i, id, checked: ans[i] === pi, disabled: checked, onChange: () => ((ans[i] = pi), (checkBtn.disabled = ans.some((x) => x == null))) }),
                  h('label', { for: id, class: ['pill', checked && pi === q.a && 'is-correct'] }, p.n),
                );
              }),
            ),
            checked && !exam && h('p', { class: 'small muted' }, (ok ? '✓ ' : `✗ Đáp án: ${set.people[q.a].n}. `) + q.e),
          ),
        );
      });
    }
    root.append(
      timer,
      h('p', { class: 'muted' }, set.intro),
      h('div', { class: 'people' }, set.people.map((p) => h('article', { class: 'person' }, h('h3', null, p.n), h('p', null, p.t)))),
      h('h3', null, 'Ai nói điều này?'),
      qBox,
      h('div', { class: 'quiz-actions' }, checkBtn),
    );
    drawQs();
    root.finish = () => !checked && check();
    return root;
  }

  function HeadingTask(set, { exam, onFinish, extraActions }) {
    const t0 = Date.now();
    const root = h('div', { class: 'task task-heading' });
    const sel = set.paras.map(() => -1);
    let checked = false;
    const timer = exam ? null : practiceTimer(A.labels.reading.longMatch.minutes);
    const msg = h('p', { class: 'bad small', role: 'alert' });
    const checkBtn = h('button', { type: 'button', class: 'btn btn-accent', onClick: check }, exam ? 'Nộp bài' : 'Kiểm tra');
    const selects = [];

    function check() {
      if (sel.some((x) => x < 0)) {
        if (!exam || !root.forced) return (msg.textContent = 'Hãy chọn tiêu đề cho mọi đoạn trước khi kiểm tra.');
      }
      const used = sel.filter((x) => x >= 0);
      if (!exam && new Set(used).size !== used.length) return (msg.textContent = 'Mỗi tiêu đề chỉ dùng một lần — có tiêu đề bị chọn trùng.');
      checked = true;
      timer && timer.stop();
      const items = set.paras.map((p, i) => ({ q: 'Đoạn ' + (i + 1), ok: sel[i] === set.a[i], pickedText: sel[i] >= 0 ? set.headings[sel[i]] : '(chưa chọn)', correctText: set.headings[set.a[i]], e: set.e[i] }));
      const res = mkResult(items, t0, 'longMatch');
      onFinish && onFinish(res);
      root.result = res;
      selects.forEach((s) => (s.disabled = true));
      checkBtn.remove();
      msg.textContent = '';
      if (!exam) {
        root.querySelectorAll('.para').forEach((el, i) => {
          el.classList.add(items[i].ok ? 'ok' : 'bad');
          el.append(h('p', { class: 'small muted' }, (items[i].ok ? '✓ ' : `✗ Tiêu đề đúng: “${items[i].correctText}”. `) + set.e[i]));
        });
        root.append(h('div', { class: ['feedback', res.pct >= 70 ? 'fb-ok' : 'fb-bad'], role: 'status' }, h('strong', null, `${res.correct}/${res.total} đúng`)), h('div', { class: 'quiz-actions' }, extraActions && extraActions(res)));
      }
    }
    root.append(
      timer,
      h('div', { class: 'headings' }, h('h3', null, 'Danh sách tiêu đề (1 tiêu đề thừa)'), h('ol', null, set.headings.map((x) => h('li', null, x)))),
      set.paras.map((p, i) => {
        const s = h(
          'select',
          { 'aria-label': `Tiêu đề cho đoạn ${i + 1}`, onChange: (e) => ((sel[i] = Number(e.target.value)), (msg.textContent = '')) },
          h('option', { value: -1 }, '— chọn tiêu đề —'),
          set.headings.map((x, k) => h('option', { value: k }, `${k + 1}. ${x}`)),
        );
        selects.push(s);
        return h('article', { class: 'para' }, h('h4', null, 'Đoạn ' + (i + 1)), h('p', null, p.t), h('label', { class: 'para-pick' }, 'Tiêu đề: ', s));
      }),
      msg,
      h('div', { class: 'quiz-actions' }, checkBtn),
    );
    root.finish = () => {
      if (!checked) {
        root.forced = true;
        check();
      }
    };
    return root;
  }

  ui.ReadingTask = (type, set, { mode = 'practice', onFinish, extraActions } = {}) => {
    const exam = mode === 'exam';
    if (type === 'sentence') {
      return ui.Quiz({
        questions: set.items.map((q) => ({ ...q, tag: 'sentence' })),
        mode,
        title: set.title,
        summary: !exam,
        timerSec: exam ? null : A.labels.reading.sentence.minutes * 60,
        onFinish,
        extraActions,
      });
    }
    const o = { exam, onFinish, extraActions };
    return type === 'ordering' ? OrderTask(set, o) : type === 'shortMatch' ? MatchTask(set, o) : HeadingTask(set, o);
  };

  /* ================= Listening ================= */
  ui.ListeningTask = (item, { mode = 'practice', onFinish, extraActions } = {}) => {
    const exam = mode === 'exam';
    const root = h('div', { class: 'task task-listen' });
    const player = ui.AudioPlayer({ script: item.script, speakers: item.speakers, maxPlays: exam ? 2 : Infinity });
    const tBox = h('div', { class: 'hidden-transcript' });
    const showT = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: () => (tBox.hasChildNodes() ? ui.clear(tBox) : tBox.append(ui.Transcript(item.script, item.keywords))) }, 'Không nghe được? Xem transcript');
    const quiz = ui.Quiz({
      questions: item.qs.map((q) => ({ ...q, tag: item.type })),
      mode,
      title: item.title,
      summary: !exam,
      onFinish: (res) => {
        player.stop();
        onFinish && onFinish({ ...res, plays: player.plays() });
      },
      extraActions,
      summaryExtra: () =>
        h(
          'div',
          { class: 'listen-after' },
          h('h3', null, 'Transcript'),
          ui.Transcript(item.script, item.keywords),
          h('h3', null, 'Từ khoá cần nghe'),
          h('p', null, item.keywords.map((k) => ui.Chip(k, 'primary'))),
          h('h3', null, 'Bẫy thường gặp (Common traps)'),
          h('ul', null, item.traps.map((t) => h('li', null, ui.rich(t)))),
        ),
    });
    root.append(
      ui.Callout('info', exam ? 'Bạn được nghe tối đa 2 lần, như bài thi thật.' : 'Nghe trước, trả lời sau. Transcript, từ khoá và bẫy sẽ hiện sau khi bạn làm xong.'),
      !exam && item.setting && h('p', { class: 'muted small' }, 'Bối cảnh: ' + item.setting),
      player,
      !exam && showT,
      tBox,
      quiz,
    );
    root.finish = () => quiz.finish();
    root.stop = () => player.stop();
    return root;
  };

  /* ================= Writing ================= */
  const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  const CAT_CLASS = { gram: 'iss-gram', spell: 'iss-spell', punct: 'iss-punct', vocab: 'iss-vocab', register: 'iss-register' };

  /** Đánh số lỗi ngay trong bài: văn bản + <mark>lỗi<sup>n</sup></mark>; trả về { nodes, list } */
  function annotate(text, issues) {
    const sorted = issues.slice().sort((a, b) => a.start - b.start);
    const used = [];
    sorted.forEach((it) => {
      const last = used[used.length - 1];
      if (!last || it.start >= last.end) used.push(it);
    });
    const nodes = [];
    let pos = 0;
    used.forEach((it, k) => {
      if (it.start > pos) nodes.push(text.slice(pos, it.start));
      nodes.push(h('mark', { class: ['iss', CAT_CLASS[it.cat] || 'iss-gram'], id: `iss-${it._n || k + 1}` }, text.slice(it.start, it.end), h('sup', { 'aria-hidden': 'true' }, String(k + 1))));
      it._n = k + 1;
      pos = it.end;
    });
    if (pos < text.length) nodes.push(text.slice(pos));
    return { nodes, list: used };
  }

  function scoreBar(label, en, c, help) {
    return h(
      'div',
      { class: 'wcrit' },
      h('div', { class: 'goal-head' }, h('span', null, h('strong', null, label), h('span', { class: 'muted small' }, ' · ' + en)), h('span', null, h('strong', null, f1(c.score) + '/5'), ' ', ui.Chip(c.band, c.score >= 3.8 ? 'good' : 'warn'))),
      ui.Progress({ value: (c.score / 5) * 100, thin: true, tone: c.score >= 3.8 ? 'good' : 'primary', label }),
      help && h('p', { class: 'muted small' }, help),
      c.notes && c.notes.length ? h('ul', { class: 'small' }, c.notes.map((n) => h('li', null, n))) : null,
    );
  }

  ui.WritingTask = (ex, { mode = 'practice', onFinish, extraActions } = {}) => {
    const exam = mode === 'exam';
    const root = h('div', { class: 'task task-write' });
    const drafts = A.store.get('drafts');
    const saved = !exam && drafts[ex.id] ? drafts[ex.id].texts || [] : [];
    const texts = ex.parts.map((_, i) => saved[i] || '');
    const boxes = [];
    let submitted = false;
    let delivered = false; // onFinish chỉ gọi một lần
    let entry = null; // dòng nhật ký (wlog)
    let lastReport = null;
    const t0 = Date.now();
    let saveH = null;
    const saveDraft = () => {
      if (exam) return;
      clearTimeout(saveH);
      saveH = setTimeout(() => {
        drafts[ex.id] = { texts: boxes.map((b) => b.get()), at: Date.now() };
        A.store.save('drafts');
      }, 600);
    };

    const write = () => {
      submitted = false;
      ui.clear(root);
      root.append(h('div', { class: 'task-context' }, h('h3', null, ex.title), h('p', null, ui.rich(ex.context))));
      if (!exam) {
        root.append(ui.Accordion({ title: '💡 Mẹo & cụm B2 hữu ích (mở nếu cần)' }, h('ul', null, ex.tips.map((t) => h('li', null, ui.rich(t)))), h('p', null, ex.phrases.map((p) => h('span', { class: 'chip chip-primary' }, p)))));
      }
      boxes.length = 0;
      ex.parts.forEach((p, i) => {
        const box = ui.WritingBox({ min: p.min, max: p.max, value: texts[i], rows: p.max > 60 ? 10 : p.max > 25 ? 5 : 2, label: `Phần ${i + 1}`, onChange: (v) => ((texts[i] = v), saveDraft()) });
        boxes.push(box);
        root.append(h('div', { class: 'wpart' }, ex.parts.length > 1 && h('h4', null, `Phần ${i + 1}/${ex.parts.length}`), h('p', { class: 'wprompt' }, ui.rich(p.prompt)), !exam && p.hint && h('p', { class: 'muted small' }, 'Gợi ý: ' + p.hint), box));
      });
      root.append(
        h('div', { class: 'quiz-actions' }, h('button', { type: 'button', class: 'btn btn-accent', onClick: submit }, entry ? 'Chấm lại bài đã sửa' : 'Nộp & xem nhận xét')),
        !exam && h('p', { class: 'muted small' }, 'Bản nháp tự lưu trong trình duyệt. Nhận xét được tạo ngay trên máy bạn bằng các luật ngôn ngữ — không gửi bài đi đâu.'),
      );
    };

    function submit() {
      const finalTexts = boxes.map((b) => b.get());
      if (!exam && finalTexts.every((t) => !t.trim())) return ui.toast('Hãy viết ít nhất một phần trước khi nộp.', { kind: 'warn' });
      submitted = true;
      finalTexts.forEach((t, i) => (texts[i] = t));
      const report = A.writingAnalyzer.analyze({ task: ex.task, parts: ex.parts.map((p, i) => ({ prompt: p.prompt, min: p.min, max: p.max, text: finalTexts[i] })), context: ex.context });
      lastReport = report;
      const seconds = Math.round((Date.now() - t0) / 1000);
      let delta = null;
      if (entry) {
        delta = report.score50 - entry.score50;
        entry = A.wlog.revise(entry.id, { ex: ex.id, task: ex.task, title: ex.title, texts: finalTexts, report, seconds: 0 });
      } else {
        entry = A.wlog.add({ ex: ex.id, task: ex.task, title: ex.title, texts: finalTexts, report, seconds });
        delete drafts[ex.id];
        A.store.save('drafts');
      }
      const res = { rating: report.rating5, score50: report.score50, band: report.band, words: report.parts.map((p) => p.words), seconds, report, logId: entry.id };
      root.result = res;
      if (!exam && !delivered) {
        delivered = true;
        onFinish && onFinish(res);
      }
      renderReport(report, delta, res);
      globalThis.scrollTo(0, 0);
    }

    function renderReport(report, delta, res) {
      ui.clear(root);
      const probB2 = report.score50 >= 38;
      root.append(
        h('div', { class: 'task-context' }, h('h3', null, ex.title), h('p', { class: 'muted' }, 'Nhận xét tự động (offline, theo luật) — thử nghiệm để định hướng, không thay giáo viên.')),
        h(
          'div',
          { class: 'wscore', role: 'group', 'aria-label': 'Điểm ước tính' },
          h('div', { class: 'wscore-main' }, h('div', { class: 'wscore-num' }, f1(report.score50), h('span', null, '/50')), h('div', null, ui.Chip('Ước tính ' + report.bandRange, probB2 ? 'good' : 'primary'), ' ', ui.Chip(`khoảng ${f1(report.range[0])}–${f1(report.range[1])}`, 'neutral'), ' ', ui.Chip('độ tin cậy: ' + { low: 'thấp (bài ngắn)', medium: 'vừa', high: 'khá' }[report.confidence], report.confidence === 'low' ? 'warn' : 'neutral'), delta != null && ' ', delta != null && ui.Chip(`${delta >= 0 ? '+' : ''}${f1(delta)} so với lần trước`, delta > 0 ? 'good' : delta < 0 ? 'warn' : 'neutral'))),
          h('p', null, report.summary),
        ),
        ui.Callout('info', h('strong', null, 'Cách đọc điểm này: '), 'điểm do bộ luật tự động ước tính độ dài, bố cục, từ nối, độ phong phú ngữ pháp/từ vựng và các lỗi điển hình. Nó ', h('strong', null, 'không hiểu nội dung'), ' và chỉ bắt được các lỗi nằm trong danh sách luật. Khi cần điểm đáng tin hơn, hãy nhờ giáo viên chấm (xem mục bên dưới).'),
      );

      // tiêu chí
      const crit = A.writingAnalyzer.CRITERIA;
      root.append(h('div', { class: 'wcrits' }, h('h4', null, 'Bốn tiêu chí (0–5)'), crit.map((c) => scoreBar(c.name, c.en, report.criteria[c.id], c.help))));

      // điều đang giữ điểm dưới B2
      if (report.bandNotes.length) root.append(ui.Callout('warn', h('strong', null, 'Điều đang giữ điểm của bạn: '), h('ul', null, report.bandNotes.map((n) => h('li', null, n)))));

      // việc nên sửa trước + điểm mạnh
      root.append(
        h(
          'div',
          { class: 'grid grid-2' },
          ui.Card({ title: 'Nên sửa trước' }, report.priorities.length ? h('ol', null, report.priorities.map((p) => h('li', null, h('strong', null, p.title), h('br'), h('span', { class: 'small muted' }, p.detail), p.topic && [' ', h('a', { class: 'small', href: '#/grammar/' + p.topic }, 'Ôn ' + A.writingAnalyzer.TOPIC_NAME[p.topic] + ' →')]))) : h('p', { class: 'muted' }, 'Không có lỗi nổi bật theo bộ luật. Hãy so sánh với bài mẫu để nâng cấp cách diễn đạt.')),
          ui.Card({ title: 'Điểm mạnh' }, report.strengths.length ? h('ul', null, report.strengths.map((x) => h('li', null, x))) : h('p', { class: 'muted' }, 'Chưa có điểm mạnh rõ ràng theo bộ luật — hãy xem bài mẫu để lấy ý.')),
        ),
      );

      // bài viết có đánh dấu lỗi
      const annot = h('div', { class: 'wannot' }, h('h4', null, `Bài của bạn — ${report.issues.length} chỗ cần xem lại`));
      report.parts.forEach((p, i) => {
        const a = annotate(p.text || '', p.issues);
        annot.append(
          h(
            'div',
            { class: 'wcompare' },
            ex.parts.length > 1 && h('h5', null, `Phần ${i + 1}: ${p.words} từ`),
            h('div', { class: 'textbox annotated', lang: 'en' }, p.text ? a.nodes : '(trống)'),
            a.list.length
              ? h('ol', { class: 'issue-list' }, a.list.map((it, k) => h('li', { value: k + 1 }, h('span', { class: ['chip', 'cat-' + it.cat] }, A.writingAnalyzer.CAT_NAME[it.cat]), ' ', h('code', null, it.quote), it.fix && it.fix !== it.quote ? [' → ', h('code', { class: 'fix' }, it.fix)] : null, h('div', { class: 'small muted' }, it.message))))
              : h('p', { class: 'good small' }, '✓ Không phát hiện lỗi trong phần này (theo bộ luật).'),
            ex.parts.length > 1 && p.notes.length ? h('ul', { class: 'small' }, p.notes.map((n) => h('li', null, n))) : null,
          ),
        );
      });
      root.append(exam ? ui.Accordion({ title: `Xem lỗi được đánh dấu (${report.issues.length})` }, annot) : annot);

      // bài mẫu
      root.append(
        ui.Accordion(
          { title: 'Bài mẫu B2 để so sánh', open: !exam },
          ex.parts.map((p, i) => h('div', { class: 'wcompare' }, ex.parts.length > 1 && h('h5', null, `Phần ${i + 1}`), h('p', { class: 'wprompt small' }, ui.rich(p.prompt)), h('div', { class: 'textbox sample', lang: 'en' }, p.sample))),
        ),
      );

      if (!exam) {
        root.append(teacherSection(res));
        root.append(h('div', { class: 'quiz-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onClick: write }, '✏️ Sửa lại bài & chấm lại'), extraActions && extraActions(res)));
        root.append(h('p', { class: 'muted small' }, 'Mẹo: sửa theo mục “Nên sửa trước”, rồi chấm lại để thấy điểm thay đổi.'));
      } else {
        root.append(h('div', { class: 'quiz-actions' }, h('button', { type: 'button', class: 'btn btn-accent', onClick: () => !delivered && ((delivered = true), onFinish && onFinish(res)) }, 'Tiếp tục →')));
      }
    }

    /** Khu vực giáo viên: xuất bài để chấm + nhập điểm giáo viên */
    function teacherSection(res) {
      const wrap = h('div', { class: 'card teacher' });
      const draw = () => {
        ui.clear(wrap);
        const e = A.wlog.get(entry.id);
        wrap.append(h('h3', null, '🧑‍🏫 Giáo viên chấm (tuỳ chọn)'), h('p', { class: 'muted small' }, 'Điểm giáo viên được ưu tiên hơn điểm tự động trong mọi thống kê, và giúp hiệu chỉnh bộ chấm theo thời gian.'));
        wrap.append(
          h(
            'div',
            { class: 'quiz-actions' },
            ui.Button({ label: '⬇ Xuất bài cho giáo viên (.md)', kind: 'secondary', size: 'sm', onClick: () => download(`aptis-writing-${ex.id}.md`, A.wlog.exportMarkdown(entry.id), 'text/markdown') }),
          ),
        );
        if (e.teacher) {
          const diff = e.score50 - e.teacher.score50;
          wrap.append(
            h('div', { class: 'callout callout-tip' }, h('strong', null, `Điểm giáo viên: ${f1(e.teacher.score50)}/50`), ` (${A.scoring.cefr(e.teacher.score50)}). Bộ chấm tự động ${diff >= 0 ? 'cao hơn' : 'thấp hơn'} ${f1(Math.abs(diff))} điểm.`, e.teacher.comment && h('p', null, '“' + e.teacher.comment + '”'), ui.Button({ label: 'Xoá điểm giáo viên', kind: 'ghost', size: 'sm', onClick: () => (A.wlog.clearTeacher(entry.id), draw()) })),
          );
          return;
        }
        const inputs = {};
        const form = h('form', { class: 'form teacher-form', onSubmit: (ev) => ev.preventDefault() });
        A.writingAnalyzer.CRITERIA.forEach((c) => {
          inputs[c.id] = h('input', { type: 'number', min: 0, max: 5, step: 0.5, 'aria-label': `${c.name} (0–5)`, placeholder: '0–5' });
          form.append(h('label', { class: 'field' }, h('span', null, `${c.name} (0–5)`), inputs[c.id]));
        });
        const comment = h('textarea', { rows: 2, 'aria-label': 'Nhận xét của giáo viên', placeholder: 'Nhận xét của giáo viên (tuỳ chọn)' });
        const msg = h('p', { class: 'bad small', role: 'alert' });
        wrap.append(
          h('details', null, h('summary', null, 'Nhập điểm giáo viên đã chấm'), form, h('label', { class: 'field' }, h('span', null, 'Nhận xét'), comment), msg, ui.Button({ label: 'Lưu điểm giáo viên', kind: 'primary', size: 'sm', onClick: () => {
            const scores = {};
            for (const c of A.writingAnalyzer.CRITERIA) {
              const v = inputs[c.id].value;
              if (v === '' || !(Number(v) >= 0 && Number(v) <= 5)) return (msg.textContent = `Hãy nhập điểm 0–5 cho “${c.name}”.`);
              scores[c.id] = Number(v);
            }
            A.wlog.setTeacher(entry.id, { scores, comment: comment.value });
            ui.toast('Đã lưu điểm giáo viên.', { kind: 'good', icon: '🧑‍🏫' });
            draw();
          } })),
        );
      };
      draw();
      return wrap;
    }

    function download(name, content, type) {
      const a = h('a', { href: URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' })), download: name });
      document.body.append(a);
      a.click();
      a.remove();
    }

    write();
    root.finish = () => {
      if (!submitted) submit();
    };
    root.stop = () => saveH && clearTimeout(saveH);
    return root;
  };

  /* ================= Speaking ================= */
  function speakingSteps(key, item) {
    if (key === 'p1') return item.qs.map((q, i) => ({ label: `Câu ${i + 1}/3`, prompt: q, speak: 30 }));
    if (key === 'p2') return [{ label: 'Mô tả bức ảnh', prompt: 'Describe the picture. What can you see? What are the people doing?', speak: 45 }, ...item.qs.map((q, i) => ({ label: `Câu hỏi ${i + 1}/2`, prompt: q, speak: 45 }))];
    if (key === 'p3') return [{ label: 'So sánh hai bức ảnh', prompt: 'Compare the two pictures. What are the similarities and differences?', speak: 45 }, ...item.qs.map((q, i) => ({ label: `Câu hỏi ${i + 1}/2`, prompt: q, speak: 45 }))];
    if (key === 'p4') return item.qs.map((q, i) => ({ label: `Câu ${i + 1}/3`, prompt: q, prep: 10, speak: 45 }));
    return [{ label: 'Chủ đề nói dài', prompt: item.topic, extra: item.qs, prep: 60, speak: 120 }];
  }

  ui.SpeakingTask = (key, item, { mode = 'practice', onFinish, extraActions } = {}) => {
    const exam = mode === 'exam';
    const steps = speakingSteps(key, item);
    const root = h('div', { class: 'task task-speak' });
    let i = 0;
    const t0 = Date.now();

    const sceneCard = () => {
      if (key === 'p2') return h('div', { class: 'scene' }, h('div', { class: 'scene-emoji', 'aria-hidden': 'true' }, item.emoji), h('div', null, h('strong', null, item.title), h('p', null, item.scene), h('p', { class: 'muted small' }, 'Ứng dụng không có ảnh thật: hãy hình dung bức ảnh theo mô tả này.')));
      if (key === 'p3')
        return h(
          'div',
          { class: 'scene-pair' },
          [['A', item.emojiA, item.sceneA], ['B', item.emojiB, item.sceneB]].map(([k, e, s]) => h('div', { class: 'scene' }, h('div', { class: 'scene-emoji', 'aria-hidden': 'true' }, e), h('div', null, h('strong', null, 'Ảnh ' + k), h('p', null, s)))),
        );
      return null;
    };

    function renderStep() {
      ui.clear(root);
      const s = steps[i];
      let phase = 'ready';
      const area = h('div', { class: 'speak-area' });
      const hint = h('p', { class: 'muted small', 'aria-live': 'polite' });
      const nextBtn = h('button', { type: 'button', class: 'btn btn-primary', onClick: () => (i < steps.length - 1 ? (i++, renderStep()) : renderReview()) }, i < steps.length - 1 ? 'Tiếp theo →' : 'Xong — xem bài mẫu');
      function startSpeak() {
        phase = 'speak';
        ui.clear(area);
        hint.textContent = 'Đang nói — hãy nói liên tục đến khi hết giờ.';
        area.append(ui.Countdown({ seconds: s.speak, label: '🎤 Nói', controls: false, autoStart: true, onEnd: () => (hint.textContent = 'Hết giờ. Bạn có thể bấm “Tiếp theo”.') }), ui.RecorderWidget());
      }
      function startPrep() {
        phase = 'prep';
        ui.clear(area);
        hint.textContent = 'Chuẩn bị: ghi nhanh 3 ý theo khung bên dưới. Hết giờ chuẩn bị sẽ tự chuyển sang phần nói.';
        area.append(ui.Countdown({ seconds: s.prep, label: '📝 Chuẩn bị', controls: false, autoStart: true, onEnd: startSpeak }), h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: startSpeak }, 'Bỏ qua, nói luôn'));
      }
      area.append(h('button', { type: 'button', class: 'btn btn-accent', onClick: () => (s.prep ? startPrep() : startSpeak()) }, s.prep ? `▶ Bắt đầu (chuẩn bị ${s.prep}s, nói ${s.speak}s)` : `▶ Bắt đầu nói (${s.speak}s)`));
      root.append(
        h('div', { class: 'quiz-top' }, h('div', { class: 'quiz-meta' }, h('strong', null, item.title || item.topic), ' · ', s.label, ` (${i + 1}/${steps.length})`)),
        ui.Progress({ value: (i / steps.length) * 100, thin: true, label: 'Tiến độ Speaking' }),
        sceneCard(),
        h('p', { class: 'speak-prompt' }, s.prompt),
        s.extra && h('ul', { class: 'muted' }, s.extra.map((q) => h('li', null, q))),
        area,
        hint,
        !exam && ui.Accordion({ title: '🧭 Khung gợi ý cho phần này' }, ui.FrameworkCard(FW_OF[key])),
        h('div', { class: 'quiz-actions' }, nextBtn),
      );
    }

    function renderReview() {
      ui.clear(root);
      const sample = item.sample;
      root.append(
        h('h3', null, 'Bài mẫu mức B2 — nghe lại bằng giọng đọc và so với câu trả lời của bạn'),
        ...(Array.isArray(sample) ? item.qs.map((q, k) => h('div', { class: 'sample-block' }, h('p', { class: 'wprompt' }, q), h('div', { class: 'textbox sample' }, sample[k]), speakBtn(sample[k]))) : [h('div', { class: 'sample-block' }, h('div', { class: 'textbox sample' }, sample), speakBtn(sample))]),
        item.vocab && h('p', null, h('strong', null, 'Từ/cụm hữu ích: '), item.vocab.map((v) => ui.Chip(v, 'primary'))),
        item.points && h('p', null, h('strong', null, 'Ý nên triển khai: '), item.points.join(' · ')),
        ui.FrameworkCard(FW_OF[key]),
        ui.SelfRating({
          title: 'Tự đánh giá phần nói của bạn (nghe lại bản ghi nếu có)',
          criteria: [
            { id: 'fluency', label: 'Trôi chảy', help: '5 = nói liền mạch, ít ngập ngừng dài; 3 = ngập ngừng vài lần.' },
            { id: 'vocab', label: 'Từ vựng', help: '5 = đa dạng, chính xác; 3 = lặp từ cơ bản.' },
            { id: 'grammar', label: 'Ngữ pháp', help: '5 = ít lỗi, có cấu trúc phức; 3 = lỗi nhưng vẫn hiểu được.' },
            { id: 'content', label: 'Nội dung & thời lượng', help: '5 = trả lời đúng ý, nói đủ thời gian; 3 = đúng ý nhưng ngắn.' },
          ],
          onSubmit: (rating) => {
            const res = { rating, seconds: Math.round((Date.now() - t0) / 1000) };
            onFinish && onFinish(res);
            root.result = res;
            if (!exam) {
              ui.clear(root);
              root.append(h('div', { class: 'quiz-summary' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🎤'), h('h2', null, `Tự chấm: ${rating.toFixed(1)}/5`), h('div', { class: 'quiz-actions' }, extraActions && extraActions(res))));
            }
          },
        }),
      );
      globalThis.scrollTo(0, 0);
    }
    const speakBtn = (text) => h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: !A.tts.supported, onClick: () => A.tts.speak(text, { gender: 'f' }) }, '🔊 Nghe bài mẫu');

    renderStep();
    root.finish = () => renderReview();
    return root;
  };
})();
