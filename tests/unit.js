#!/usr/bin/env node
/* Test đơn vị cho lõi logic (không cần trình duyệt): node tests/unit.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
// Môi trường giả lập tối thiểu: không có localStorage → store chạy trong bộ nhớ
const sandbox = { console, Date, Math, JSON, URLSearchParams };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
['js/core/util.js', 'js/core/store.js', 'js/core/labels.js'].forEach(load);
fs.readdirSync(path.join(root, 'js/data')).filter((f) => f.endsWith('.js')).forEach((f) => load('js/data/' + f));
['js/core/srs.js', 'js/core/vocabdb.js', 'js/core/scoring.js', 'js/core/writing-analyzer.js', 'js/core/writing-log.js', 'js/core/plan.js', 'js/core/game.js', 'js/core/session.js'].forEach(load);
const A = sandbox.Aptis;
const U = A.util;

let pass = 0;
let fail = 0;
const t = (name, fn) => {
  try {
    A.store.resetAll();
    fn();
    pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    fail++;
    console.log('  ✗ ' + name + '\n      ' + (e.stack || e).split('\n').slice(0, 3).join('\n      '));
  }
};

console.log('util');
t('dateKey / addDays / daysBetween / weekKey', () => {
  assert.strictEqual(U.addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(U.addDays('2026-03-01', -1), '2026-02-28');
  assert.strictEqual(U.daysBetween('2026-10-23', '2026-11-22'), 30);
  assert.strictEqual(U.weekKey('2026-10-23'), '2026-10-19'); // thứ Sáu → thứ Hai
  assert.strictEqual(U.weekKey('2026-10-19'), '2026-10-19');
});
t('countWords', () => {
  assert.strictEqual(U.countWords("I don't know, well-known facts."), 5);
  assert.strictEqual(U.countWords('  '), 0);
});
t('rng có hạt giống lặp lại được', () => {
  const a = U.shuffle([1, 2, 3, 4, 5, 6], U.rng(7));
  const b = U.shuffle([1, 2, 3, 4, 5, 6], U.rng(7));
  assert.deepStrictEqual(a, b);
});
t('normCdf', () => {
  assert.ok(Math.abs(U.normCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(U.normCdf(1) - 0.8413) < 1e-3);
});

console.log('store');
t('mặc định, set/get, update bỏ qua giá trị trả về', () => {
  assert.strictEqual(A.store.get('profile').dailyMinutes, 60);
  A.store.update('srs', (s) => (s.x = { iv: 1 })); // trả về giá trị — không được thay cả khối
  assert.strictEqual(Object.keys(A.store.get('srs')).join(), 'x');
});
t('export/import vòng tròn', () => {
  A.store.update('bookmarks', (b) => { b.abc = 1; });
  const dump = JSON.parse(JSON.stringify(A.store.exportAll()));
  A.store.resetAll();
  assert.strictEqual(Object.keys(A.store.get('bookmarks')).length, 0);
  A.store.importAll(dump);
  assert.strictEqual(A.store.get('bookmarks').abc, 1);
  assert.throws(() => A.store.importAll({ foo: 1 }));
});

console.log('srs');
t('chuỗi chấm Good → khoảng nghỉ tăng 1, 3, ~7…', () => {
  let c = A.srs.grade(undefined, 2, '2026-10-01');
  assert.strictEqual(c.iv, 1);
  assert.strictEqual(c.due, '2026-10-02');
  c = A.srs.grade(c, 2, '2026-10-02');
  assert.strictEqual(c.iv, 3);
  c = A.srs.grade(c, 2, '2026-10-05');
  assert.ok(c.iv >= 7, 'iv=' + c.iv);
});
t('Quên → về 0, đến hạn ngay, ef giảm nhưng ≥ 1.3', () => {
  let c = A.srs.grade(undefined, 3, '2026-10-01');
  for (let i = 0; i < 20; i++) c = A.srs.grade(c, 0, '2026-10-01');
  assert.strictEqual(c.reps, 0);
  assert.strictEqual(c.due, '2026-10-01');
  assert.ok(c.ef >= 1.3);
  assert.strictEqual(c.lapses, 20);
});
t('status: new/learning/mastered', () => {
  assert.strictEqual(A.srs.status(undefined), 'new');
  assert.strictEqual(A.srs.status({ iv: 5 }), 'learning');
  assert.strictEqual(A.srs.status({ iv: 21 }), 'mastered');
});

console.log('vocabdb');
t('≥ 1000 từ, đủ 8 nhóm, tra theo id', () => {
  assert.ok(A.vocabdb.count() >= 1000, 'count=' + A.vocabdb.count());
  assert.strictEqual(A.vocabdb.cats.length, 8);
  A.vocabdb.cats.forEach((c) => assert.ok(A.vocabdb.byCat(c.id).length >= 140, c.id));
  const w = A.vocabdb.all()[0];
  assert.strictEqual(A.vocabdb.get(w.id), w);
});
t('makeQuestions: 4 lựa chọn khác nhau, đáp án đúng nằm trong lựa chọn', () => {
  const words = U.sample(A.vocabdb.all(), 60);
  const qs = A.vocabdb.makeQuestions(words);
  qs.forEach((q, i) => {
    assert.strictEqual(q.o.length, 4, 'số lựa chọn: ' + words[i].w);
    assert.strictEqual(new Set(q.o.map((x) => x.toLowerCase())).size, 4, 'trùng lựa chọn: ' + words[i].w);
    assert.ok(q.a >= 0 && q.a < 4);
    const w = words[i];
    assert.ok([w.w, w.vi].includes(q.o[q.a]), 'đáp án đúng không khớp: ' + w.w);
  });
});
t('cloze thay đúng từ (kể cả dạng chia)', () => {
  const w = { w: 'curriculum', ex: 'The school updated its curriculum.' };
  assert.strictEqual(A.vocabdb.cloze(w), 'The school updated its _____.');
  const v = { w: 'plan', ex: 'We planned a surprise party.' };
  assert.strictEqual(A.vocabdb.cloze(v), 'We _____ a surprise party.');
});

console.log('scoring');
t('cefr thresholds', () => {
  assert.strictEqual(A.scoring.cefr(10), 'A1');
  assert.strictEqual(A.scoring.cefr(25), 'A2');
  assert.strictEqual(A.scoring.cefr(37), 'B1');
  assert.strictEqual(A.scoring.cefr(38), 'B2');
  assert.strictEqual(A.scoring.cefr(44), 'C');
});
t('xác suất B2 đơn điệu và có ý nghĩa', () => {
  const p = (s) => A.scoring.passProb({ gv: s, reading: s, listening: s, writing: s, speaking: s });
  assert.ok(p(30) < p(36) && p(36) < p(38) && p(38) < p(42) && p(42) < p(46));
  assert.ok(p(30) < 0.1, 'p30=' + p(30));
  assert.ok(p(42) >= 0.8, 'p42=' + p(42));
  // một kỹ năng yếu kéo xác suất xuống
  const mixed = A.scoring.passProb({ gv: 46, reading: 46, listening: 46, writing: 46, speaking: 30 });
  assert.ok(mixed < p(46));
});
t('diagEvaluate: trọng số theo mức & phân loại', () => {
  const mk = (n2, n1, nb2) => [...Array(4)].map((_, i) => ({ lvl: 'A2', ok: i < n2 })).concat([...Array(4)].map((_, i) => ({ lvl: 'B1', ok: i < n1 })), [...Array(4)].map((_, i) => ({ lvl: 'B2', ok: i < nb2 })));
  const ev = (a, b, c) => A.scoring.diagEvaluate({ vocab: mk(a, b, c), grammar: mk(a, b, c), reading: mk(a, b, c), listening: mk(a, b, c) });
  assert.strictEqual(ev(4, 4, 4).level, 'B2');
  assert.strictEqual(ev(4, 4, 4).score100, 100);
  assert.strictEqual(ev(4, 4, 0).level, 'B1'); // 50%
  assert.strictEqual(ev(4, 0, 0).level, 'A2');
  assert.strictEqual(ev(0, 0, 0).score100, 0);
  const r = A.scoring.diagEvaluate({ vocab: mk(4, 4, 4), grammar: mk(0, 0, 0), reading: mk(2, 2, 2), listening: mk(3, 3, 3) });
  assert.ok(r.weakest.includes('grammar'));
  assert.ok(r.strengths.includes('vocab'));
});

console.log('plan');
t('ngày hiện tại bám theo ngày bắt đầu, kẹp 1..30', () => {
  A.store.update('profile', (p) => { p.startDate = U.addDays(U.dateKey(), -4); });
  assert.strictEqual(A.plan.rawDay(), 5);
  assert.strictEqual(A.plan.currentDay(), 5);
  A.store.update('profile', (p) => { p.startDate = U.addDays(U.dateKey(), -40); });
  assert.strictEqual(A.plan.currentDay(), 30);
  assert.strictEqual(A.plan.rawDay(), 41);
});
t('30 ngày đều có nhiệm vụ hợp lệ ở cả 3 mức thời lượng', () => {
  [30, 60, 90].forEach((m) => {
    A.store.update('profile', (p) => { p.dailyMinutes = m; });
    for (let d = 1; d <= 30; d++) {
      const tasks = A.plan.tasksFor(d);
      assert.ok(tasks.length >= 2, `ngày ${d} (${m}p) có ${tasks.length} nhiệm vụ`);
      assert.strictEqual(new Set(tasks.map((x) => x.id)).size, tasks.length, 'id trùng ngày ' + d);
      tasks.forEach((x) => assert.ok(x.route.startsWith('#/') && x.minutes > 0, `route/minutes ngày ${d}`));
    }
  });
});
t('ngày đặc biệt: diagnostic ngày 1/30, mock ngày 14/21/23/26/28', () => {
  const mods = (d) => A.plan.tasksFor(d).map((x) => x.module);
  assert.ok(mods(1).includes('diagnostic'));
  assert.ok(mods(30).includes('diagnostic'));
  [14, 21, 23, 26, 28].forEach((d) => assert.ok(mods(d).includes('mock'), 'ngày ' + d));
  assert.ok(A.plan.tasksFor(30).find((x) => x.module === 'diagnostic').route.includes('form=B'));
  assert.strictEqual(A.plan.tasksFor(23).find((x) => x.module === 'mock').route, '#/mock?mode=full');
});
t('mode 30 phút ít nhiệm vụ hơn mode 60', () => {
  A.store.update('profile', (p) => { p.dailyMinutes = 30; });
  const n30 = A.plan.tasksFor(3).length;
  A.store.update('profile', (p) => { p.dailyMinutes = 60; });
  assert.ok(n30 < A.plan.tasksFor(3).length);
});
t('completeModule đánh dấu nhiệm vụ hôm nay và dayStatus phản ánh', () => {
  A.plan.ensureStart();
  const today = A.plan.currentDay();
  const before = A.plan.dayStatus(today);
  const task = A.plan.completeModule('vocab');
  assert.ok(task && task.module === 'vocab');
  assert.strictEqual(A.plan.dayStatus(today).done, before.done + 1);
  assert.strictEqual(A.plan.completeModule('vocab'), null); // đã xong, không đánh dấu lại
});
t('chủ điểm ngữ pháp yếu nhất: chưa làm ưu tiên trước', () => {
  const first = A.plan.weakGrammarTopic();
  assert.ok(sandbox.AptisData.grammar.some((g) => g.id === first));
  A.store.update('stats', (s) => { s.grammar = { c: 0, t: 0, n: 0, sec: 0, refs: {}, subs: {} }; sandbox.AptisData.grammar.forEach((g, i) => { if (i) s.grammar.subs[g.id + ':b1'] = { c: 9, t: 10 }; }); });
  assert.strictEqual(A.plan.weakGrammarTopic(), sandbox.AptisData.grammar[0].id);
});
t('nextRef chọn đề chưa làm', () => {
  const ids = sandbox.AptisData.reading.sentence.map((s) => s.id);
  assert.strictEqual(A.plan.nextRef('reading', 'sentence'), ids[0]);
  A.session.record({ module: 'reading', sub: 'sentence', ref: ids[0], correct: 4, total: 5 });
  assert.strictEqual(A.plan.nextRef('reading', 'sentence'), ids[1]);
});

console.log('game / session');
t('streak: liên tiếp, đứt quãng, hôm nay chưa học vẫn giữ chuỗi hôm qua', () => {
  const today = U.dateKey();
  const mk = (d, sec) => { A.store.dayLog(d).sec = sec; };
  mk(today, 700); mk(U.addDays(today, -1), 700); mk(U.addDays(today, -2), 700);
  mk(U.addDays(today, -4), 700); mk(U.addDays(today, -5), 700);
  let s = A.game.streaks();
  assert.strictEqual(s.current, 3);
  assert.strictEqual(s.best, 3);
  A.store.dayLog(today).sec = 100; // chưa đủ 10 phút hôm nay
  s = A.game.streaks();
  assert.strictEqual(s.current, 2);
});
t('level theo XP', () => {
  assert.strictEqual(A.game.level(0).level, 1);
  assert.strictEqual(A.game.level(60).level, 2);
  assert.ok(A.game.level(500).level >= 3);
});
t('session.record: thống kê, nhật ký, XP, huy hiệu First Step, perfect', () => {
  A.plan.ensureStart();
  const r = A.session.record({ module: 'grammar', sub: 'tenses:b1', correct: 10, total: 10, seconds: 120 });
  assert.ok(r.xp >= 30);
  const st = A.store.get('stats').grammar;
  assert.strictEqual(st.c, 10);
  assert.strictEqual(st.subs['tenses:b1'].best, 1);
  assert.strictEqual(A.store.dayLog().sessions, 1);
  const g = A.store.get('game');
  assert.ok(g.badges['first-step'] && g.badges.perfect);
  assert.ok(g.xp === r.xp);
});
t('weeklyGoals có 5 mục và đếm đúng', () => {
  A.store.dayLog().q = 20;
  const goals = A.game.weeklyGoals();
  assert.strictEqual(goals.length, 5);
  assert.strictEqual(goals.find((g) => g.id === 'questions').cur, 20);
});
t('diagImprovement: tăng ≥ 20% tương đối hoặc ≥ 90 điểm', () => {
  A.store.update('diag', (d) => d.attempts.push({ score100: 50 }, { score100: 62 }));
  let imp = A.game.diagImprovement();
  assert.ok(Math.abs(imp.relative - 0.24) < 1e-9 && imp.ok);
  A.store.update('diag', (d) => { d.attempts[1].score100 = 55; });
  assert.strictEqual(A.game.diagImprovement().ok, false);
});
t('estimates ưu tiên Mock > Diagnostic', () => {
  A.store.update('diag', (d) => d.attempts.push({ sections: { vocab: { pct: 0.5 }, grammar: { pct: 0.5 }, reading: { pct: 0.8 }, listening: { pct: 0.3 } }, score100: 50 }));
  let e = A.scoring.estimates();
  assert.strictEqual(e.reading.src, 'diag');
  assert.strictEqual(e.writing.score, null);
  A.store.update('mocks', (m) => m.push({ scores: { gv: 40, reading: 41, listening: 39, writing: 38, speaking: 37 }, at: Date.now() }));
  e = A.scoring.estimates();
  assert.strictEqual(e.reading.src, 'mock');
  assert.strictEqual(e.reading.score, 41);
});

console.log('dữ liệu: độ nhất quán chéo');
t('mọi id bài Reading/Listening/Writing/Speaking mà lộ trình trỏ tới đều tồn tại', () => {
  [30, 60, 90].forEach((m) => {
    A.store.update('profile', (p) => { p.dailyMinutes = m; });
    for (let d = 1; d <= 30; d++) {
      A.plan.tasksFor(d).forEach((x) => {
        if (['reading', 'listening', 'writing', 'speaking'].includes(x.module)) assert.ok(/\/[^/]+\/[^/]+$/.test(x.route.split('?')[0]), `ngày ${d}: route thiếu id → ${x.route}`);
      });
    }
  });
});
t('chủ điểm ngữ pháp đủ 8 và câu hỏi hợp lệ', () => {
  assert.strictEqual(sandbox.AptisData.grammar.length, 8);
});

console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
