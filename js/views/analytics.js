/* Phân tích: giờ học, điểm kỹ năng, tiến độ hằng ngày, xu hướng Mock, tiêu chí thành công */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const ui = A.ui;
  const { h } = ui;
  const U = A.util;

  /** 5 tiêu chí thành công của sản phẩm */
  function criteria() {
    const log = A.store.get('log');
    const raw = A.plan.rawDay();
    const elapsed = Math.max(1, Math.min(raw, A.plan.DAYS));
    const totalSec = Object.values(log).reduce((n, l) => n + (l.sec || 0), 0);
    const avgMin = totalSec / 60 / elapsed;
    const days30 = Object.values(log).filter((l) => (l.sec || 0) >= 1800).length;
    const diag = A.game.diagImprovement();
    const mocks = A.store.get('mocks');
    const last = mocks[mocks.length - 1];
    const done = A.plan.completedDays();
    return [
      { id: 'c1', label: 'Học ≥ 30 phút/ngày', value: `${Math.round(avgMin)} phút/ngày TB · ${days30} ngày đạt ≥ 30 phút`, ok: avgMin >= 30 && elapsed >= 3, pct: (avgMin / 30) * 100 },
      { id: 'c2', label: 'Hoàn thành lộ trình 30 ngày', value: `${done}/30 ngày đủ nhiệm vụ`, ok: done >= 30, pct: (done / 30) * 100 },
      { id: 'c3', label: 'Điểm Diagnostic tăng ≥ 20%', value: diag.last == null ? 'Chưa làm Diagnostic lần 2 (đề B)' : `${diag.first} → ${diag.last} (${diag.relative >= 0 ? '+' : ''}${Math.round(diag.relative * 100)}%)`, ok: !!diag.ok, pct: diag.relative == null ? 0 : (diag.relative / 0.2) * 100 },
      { id: 'c4', label: 'Hoàn thành ≥ 3 Mock Test', value: `${mocks.length} bài (${mocks.filter((m) => m.mode === 'full').length} Full)`, ok: mocks.length >= 3, pct: (mocks.length / 3) * 100 },
      { id: 'c5', label: 'Xác suất đạt B2 ≥ 80%', value: last ? `${Math.round(last.prob * 100)}% ở Mock gần nhất` : 'Chưa có Mock', ok: !!last && last.prob >= 0.8, pct: last ? (last.prob / 0.8) * 100 : 0 },
    ];
  }

  /** Writing: tiêu chí trung bình + lỗi hay mắc (chỉ khi đã có bài được chấm) */
  function writingCard() {
    const avg = A.wlog.criteriaAvg(5);
    if (!avg) return null;
    const crit = A.writingAnalyzer.CRITERIA;
    const prof = A.wlog.errorProfile(12).slice(0, 5);
    return h(
      'div',
      { class: 'grid grid-2' },
      ui.Card({ title: 'Writing: bốn tiêu chí (5 bài gần nhất)', sub: 'Vòng cam = mức B2 (3,8/5). Ước tính tự động, không phải điểm giám khảo.' }, ui.charts.radar({ labels: crit.map((c) => c.name), series: [{ name: 'Điểm trung bình', values: crit.map((c) => avg[c.id] / 5), tone: 1 }], target: 3.8 / 5, title: 'Radar tiêu chí Writing' })),
      ui.Card({ title: 'Writing: lỗi hay mắc nhất' }, prof.length ? h('ol', { class: 'issue-list' }, prof.map((r) => h('li', null, h('strong', null, r.label), h('span', { class: 'muted small' }, ` — ${r.count} lần`), r.topic && [' ', h('a', { class: 'small', href: '#/grammar/' + r.topic }, 'Ôn ' + A.writingAnalyzer.TOPIC_NAME[r.topic] + ' →')]))) : h('p', { class: 'good' }, 'Chưa phát hiện lỗi lặp lại.'), ui.Button({ label: 'Luyện Writing', kind: 'primary', size: 'sm', href: '#/writing' })),
    );
  }

  ui.router.add(
    '/analytics',
    () => {
      const log = A.store.get('log');
      const stats = A.store.get('stats');
      const mocks = A.store.get('mocks');
      const today = U.dateKey();
      const root = h('div', null, ui.PageHeader({ title: 'Phân tích tiến độ', sub: 'Mọi số liệu được tính từ dữ liệu lưu trong trình duyệt của bạn.' }));

      // Tiêu chí thành công
      const cs = criteria();
      root.append(
        ui.Card(
          { title: 'Tiêu chí thành công', sub: `${cs.filter((c) => c.ok).length}/5 tiêu chí đã đạt` },
          cs.map((c) => h('div', { class: 'goal' }, h('div', { class: 'goal-head' }, h('span', null, (c.ok ? '✅ ' : '⬜ ') + c.label), h('span', { class: 'muted small' }, c.value)), ui.Progress({ value: Math.min(100, c.pct), tone: c.ok ? 'good' : 'primary', thin: true, label: c.label }))),
        ),
      );

      // Giờ học 14 ngày
      const days14 = [];
      for (let i = 13; i >= 0; i--) days14.push(U.addDays(today, -i));
      const hours = days14.map((k) => ({ label: U.fmtDate(k).slice(0, 5), value: +(((log[k] || {}).sec || 0) / 3600).toFixed(2), tone: (log[k] || {}).sec >= (A.store.get('profile').dailyMinutes * 60) ? 2 : 1 }));
      const totalSec = Object.values(log).reduce((n, l) => n + (l.sec || 0), 0);

      // Điểm kỹ năng
      const est = A.scoring.estimates();
      const skillBars = A.scoring.SKILLS.map((s) => ({ label: s.short, value: est[s.id].score || 0, tone: est[s.id].score >= A.scoring.B2_MIN ? 2 : 1 }));

      // Tiến độ hằng ngày (lũy kế % nhiệm vụ lộ trình)
      const byDate = A.plan.doneByDate();
      const total = A.plan.overall().total || 1;
      const span = Math.min(A.plan.DAYS, Math.max(1, A.plan.rawDay()));
      const pts = [];
      let cum = 0;
      for (let i = 0; i < span; i++) {
        const k = A.plan.dateOfDay(i + 1);
        cum += byDate[k] || 0;
        pts.push({ x: 'N' + (i + 1), y: Math.round((cum / total) * 100) });
      }
      // Cộng cả nhiệm vụ hoàn thành ngoài khoảng ngày lộ trình vào điểm cuối
      const mockSeries = mocks.map((m, i) => ({ x: '#' + (i + 1), y: m.overall }));
      const probSeries = mocks.map((m, i) => ({ x: '#' + (i + 1), y: Math.round(m.prob * 100) }));

      root.append(
        h('div', { class: 'grid grid-2' },
          ui.Card({ title: 'Giờ học 14 ngày gần nhất', sub: `Tổng ${U.fmtHours(totalSec)} giờ · cột xanh lá = đạt mục tiêu ngày` }, ui.charts.bars({ data: hours, max: Math.max(1, Math.ceil(Math.max(...hours.map((x) => x.value)) * 2) / 2), fmt: (v) => +(+v).toFixed(2), unit: ' giờ', title: 'Giờ học mỗi ngày' })),
          ui.Card({ title: 'Điểm ước tính từng kỹ năng', sub: 'Thang 0–50; xanh lá = đạt ngưỡng B2 (38)' }, ui.charts.bars({ data: skillBars, max: 50, title: 'Điểm kỹ năng', fmt: (v) => Math.round(v) }), h('p', { class: 'muted small' }, 'Nguồn: Mock gần nhất → Diagnostic → luyện tập.')),
        ),
        h('div', { class: 'grid grid-2' },
          ui.Card({ title: 'Tiến độ lộ trình theo ngày', sub: '% nhiệm vụ 30 ngày đã hoàn thành (lũy kế)' }, pts.length ? ui.charts.line({ series: [{ name: '% hoàn thành', tone: 2, points: pts }], yMin: 0, yMax: 100, fmt: (v) => v + '%', title: 'Tiến độ lộ trình lũy kế' }) : ui.Empty({ title: 'Chưa có dữ liệu' })),
          ui.Card({ title: 'Xu hướng Mock Test' }, mocks.length ? h('div', null, ui.charts.line({ series: [{ name: 'Điểm TB /50', tone: 1, points: mockSeries }], yMin: 0, yMax: 50, refLine: { y: A.scoring.B2_MIN, label: 'B2' }, title: 'Điểm Mock' }), ui.charts.line({ series: [{ name: 'Xác suất B2 %', tone: 3, points: probSeries }], yMin: 0, yMax: 100, fmt: (v) => v + '%', refLine: { y: 80, label: 'Mục tiêu 80%' }, title: 'Xác suất đạt B2' })) : ui.Empty({ icon: '📝', title: 'Chưa có Mock', text: 'Làm Mini Mock để bắt đầu theo dõi xu hướng.', action: ui.Button({ label: 'Làm Mock', href: '#/mock' }) })),
        ),
      );

      // Thời gian theo kỹ năng
      const by = {};
      Object.values(log).forEach((l) => Object.entries(l.by || {}).forEach(([k, v]) => (by[k] = (by[k] || 0) + v)));
      const mods = ['vocab', 'grammar', 'reading', 'listening', 'writing', 'speaking', 'mock', 'diagnostic'];
      const SHORT = { vocab: 'Vocab', grammar: 'Gram.', reading: 'Read', listening: 'Listen', writing: 'Write', speaking: 'Speak', mock: 'Mock', diagnostic: 'Diag' };
      const timeBars = mods.map((m) => ({ label: SHORT[m], value: Math.round((by[m] || 0) / 60), tone: 1 }));

      // Bảng chính xác
      const rows = ['vocab', 'grammar', 'reading', 'listening'].map((m) => {
        const s = stats[m];
        return [A.labels.modules[m].name, s ? s.n : 0, s && s.t ? `${s.c}/${s.t}` : '—', s && s.t ? Math.round((s.c / s.t) * 100) + '%' : '—', s ? U.fmtMinutes(s.sec || 0) : '—'];
      });
      const wl = A.wlog.list();
      rows.push(['Writing', wl.length, '—', wl.length ? 'ước tính TB ' + U.avg(wl.slice(-6).map((e) => A.wlog.effectiveScore(e))).toFixed(0) + '/50 (6 bài gần nhất)' : '—', '—']);
      {
        const refs = Object.values((stats.speaking && stats.speaking.refs) || {});
        rows.push(['Speaking', refs.reduce((n, r) => n + r.n, 0), '—', refs.length ? 'tự chấm TB ' + U.avg(refs.map((r) => r.rating || 0)).toFixed(1) + '/5' : '—', '—']);
      }
      const cards = Object.values(A.store.get('srs'));
      root.append(
        h('div', { class: 'grid grid-2' },
          ui.Card({ title: 'Thời gian học theo mô-đun (phút)' }, ui.charts.bars({ data: timeBars, title: 'Phút học theo mô-đun', fmt: (v) => v })),
          ui.Card({ title: 'Từ vựng' }, ui.charts.bars({ data: [{ label: 'Mới', value: A.vocabdb.count() - cards.length, tone: 4 }, { label: 'Đang học', value: cards.filter((c) => c.iv < A.srs.MASTERED_DAYS).length, tone: 1 }, { label: 'Đã thuộc', value: cards.filter((c) => c.iv >= A.srs.MASTERED_DAYS).length, tone: 2 }], title: 'Trạng thái từ vựng', fmt: (v) => v }), h('p', { class: 'muted small' }, `Đến hạn ôn hôm nay: ${cards.filter((c) => A.srs.isDue(c)).length} thẻ.`)),
        ),
        writingCard(),
        ui.Card({ title: 'Độ chính xác theo mô-đun' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Mô-đun', 'Số phiên', 'Đúng/Tổng', 'Tỉ lệ', 'Thời gian'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, String(c)))))))),
      );
      return { title: 'Phân tích', module: 'analytics', node: root };
    },
    'analytics',
  );
})();
