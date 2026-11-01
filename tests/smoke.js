#!/usr/bin/env node
/* Kiểm thử đầu-cuối bằng Chromium thật (playwright-core). Không phải phụ thuộc của dự án.
 *   PLAYWRIGHT_CORE=/đường/dẫn/tới/playwright-core  [CHROME_PATH=/đường/dẫn/chrome]  [SHOTS=/thư/mục/ảnh]  node tests/smoke.js
 * Đi qua: onboarding → Diagnostic → mọi màn hình → các luồng luyện tập → Mini Mock → báo cáo; bắt mọi lỗi JS/console. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const URL = 'file://' + path.resolve(__dirname, '../index.html');
const SHOTS = process.env.SHOTS || '';
const errors = [];
let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  page.setDefaultTimeout(8000);

  const go = async (hash) => { await page.evaluate((h) => (location.hash = h), hash); await page.waitForTimeout(120); };
  const hash = () => page.evaluate(() => location.hash);
  const has = async (sel) => (await page.locator(sel).count()) > 0;
  const shot = async (name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); };
  const clickBtn = async (re) => { const b = page.getByRole('button', { name: re }).first(); await b.click(); };

  /** Làm hết một Quiz (practice hoặc exam) bằng cách chọn đáp án đầu */
  async function driveQuiz(maxSteps = 120) {
    const T = { timeout: 1500 };
    for (let i = 0; i < maxSteps; i++) {
      if (await has('.quiz-summary')) return true;
      if (!(await has('.quiz'))) return true; // bài kết thúc / chuyển sang bài khác
      const opts = page.locator('.quiz .opt:not([disabled])');
      if ((await opts.count()) === 0) {
        // đã kiểm tra → bấm tiếp
        const nx = page.getByRole('button', { name: /Câu tiếp|Xem kết quả|Hoàn thành|Nộp bài/ }).first();
        if (await nx.count()) await nx.click(T).catch(() => {}); else return false;
        continue;
      }
      await opts.nth(i % 3 === 0 && (await opts.count()) > 1 ? 1 : 0).click(T).catch(() => {});
      const chk = page.getByRole('button', { name: /^Kiểm tra$/ });
      if (await chk.count()) { await chk.click(T).catch(() => {}); continue; }
      const nx = page.getByRole('button', { name: /Câu tiếp|Nộp bài/ }).first();
      if (await nx.count()) await nx.click(T).catch(() => {});
    }
    return false;
  }
  async function driveOrder() {
    const pool = page.locator('.pool-item');
    while ((await pool.count()) > 0) await pool.first().click();
    await clickBtn(/Kiểm tra|Nộp bài/);
  }
  async function driveMatch() {
    const n = await page.locator('.match-q').count();
    for (let i = 0; i < n; i++) await page.locator('.match-q').nth(i).locator('label.pill').nth(i % 4).click();
    await clickBtn(/Kiểm tra|Nộp bài/);
  }
  async function driveHeading() {
    const sels = page.locator('.para select');
    const n = await sels.count();
    for (let i = 0; i < n; i++) await sels.nth(i).selectOption({ index: i + 1 });
    await clickBtn(/Kiểm tra|Nộp bài/);
  }
  async function driveRating(btnRe) {
    const groups = page.locator('fieldset.rating-row');
    const n = await groups.count();
    for (let i = 0; i < n; i++) await groups.nth(i).locator('label').nth(3).click();
    await clickBtn(btnRe || /Lưu điểm tự chấm/);
  }
  async function driveWriting() {
    const ta = page.locator('textarea.writing-box');
    const n = await ta.count();
    for (let i = 0; i < n; i++) await ta.nth(i).fill('Hi Sam, thanks for your message. I would love to join you because I really enjoy learning new things. However, I am busy on Friday. See you soon, Anna');
    await clickBtn(/Nộp & xem nhận xét/);
    const next = page.getByRole('button', { name: /^Tiếp tục/ });
    if (await next.count()) await next.first().click(); // chế độ thi: báo cáo rồi bấm Tiếp tục
  }
  async function driveSpeaking() {
    for (let i = 0; i < 8; i++) {
      if (await has('fieldset.rating-row')) break;
      const nx = page.getByRole('button', { name: /Tiếp theo|Xong — xem bài mẫu/ }).first();
      if (await nx.count()) await nx.click();
    }
    await driveRating();
  }
  /** Phát hiện UI hiện tại và làm một bước (dùng cho Mock) */
  async function driveAny() {
    if (await has('.task-write')) return driveWriting();
    if (await has('.task-speak')) return driveSpeaking();
    if (await has('.task-order')) return driveOrder();
    if (await has('.task-match')) return driveMatch();
    if (await has('.task-heading')) return driveHeading();
    if (await has('.quiz')) return driveQuiz();
    return false;
  }

  console.log('Tải & onboarding');
  await page.goto(URL);
  await page.waitForSelector('main h1');
  ok('lần đầu chuyển sang #/welcome', (await hash()) === '#/welcome', await hash());
  ok('nhiều file dữ liệu đã nạp (AptisData)', await page.evaluate(() => Object.keys(AptisData).length >= 8));
  await shot('01-welcome');
  await page.getByRole('button', { name: /Bắt đầu Diagnostic/ }).click();
  await page.waitForSelector('text=Diagnostic Test — đề A');
  ok('welcome → intro Diagnostic đề A', (await hash()).startsWith('#/diagnostic?form=A'));
  await page.getByRole('link', { name: /Bắt đầu làm bài/ }).click();
  await page.waitForSelector('.quiz');

  console.log('Diagnostic (36 câu)');
  await driveQuiz(200); // chạy một mạch qua cả 4 phần
  await page.waitForFunction(() => location.hash.startsWith('#/diagnostic/result/'));
  ok('có báo cáo kết quả Diagnostic', await has('.level-big'));
  const level = await page.locator('.level-big').innerText();
  ok('trình độ hiện tại là A2/B1/B2: ' + level, ['A2', 'B1', 'B2'].includes(level));
  ok('hiển thị Weakest/Strengths và Suggested Plan', (await page.locator('text=Weakest skills').count()) > 0 && (await page.locator('text=Suggested Plan').count()) > 0);
  await shot('02-diagnostic-result');
  const attempts = await page.evaluate(() => Aptis.store.get('diag').attempts.length);
  ok('lưu 1 lần Diagnostic vào LocalStorage', attempts === 1);

  console.log('Mọi màn hình tải được, không lỗi JS');
  const routes = ['/', '/roadmap', '/roadmap/day/1', '/roadmap/day/14', '/roadmap/day/23', '/practice', '/vocab', '/vocab/list', '/vocab/list?cat=travel', '/grammar', '/grammar/tenses', '/grammar/all/quiz/review', '/reading', '/reading/sentence', '/reading/ordering', '/reading/shortMatch', '/reading/longMatch', '/listening', '/listening?type=interview', '/writing', '/writing/1', '/writing/2', '/writing/3', '/writing/4', '/speaking', '/speaking/p1', '/speaking/p2', '/speaking/p3', '/speaking/p4', '/speaking/p5', '/mock', '/mock?mode=full', '/analytics', '/achievements', '/aptis', '/settings', '/diagnostic', '/diagnostic?form=B', '/khong-co-trang-nay'];
  for (const r of routes) {
    const before = errors.length;
    await go('#' + r);
    const h1 = await page.locator('main h1').count();
    ok(`route ${r}`, h1 > 0 && errors.length === before, errors.slice(before).join(' | '));
  }
  const day = await page.evaluate(() => Aptis.plan.data().days.length);
  ok('lộ trình có 30 ngày', day === 30);
  // mọi ngày render được
  let badDay = [];
  for (let d = 1; d <= 30; d++) { const b = errors.length; await go('#/roadmap/day/' + d); if (!(await has('main .task-row')) || errors.length > b) badDay.push(d); }
  ok('30 trang ngày đều có nhiệm vụ', badDay.length === 0, badDay.join(','));

  console.log('Dashboard');
  await go('#/');
  ok('hiển thị Day X/30', (await page.locator('.topbar').innerText()).includes('Ngày 1/30'));
  ok('có lịch 30 ngày', (await page.locator('.cal-day').count()) === 30);
  ok('có nhiệm vụ hôm nay + điểm B2 + streak', (await page.locator('.task-row').count()) >= 3 && (await page.locator('text=Sẵn sàng B2').count()) > 0 && (await page.locator('text=Streak').count()) > 0);
  await shot('03-dashboard');

  console.log('Từ vựng');
  await go('#/vocab/daily');
  await page.waitForSelector('.flashcard');
  let flips = 0;
  for (let i = 0; i < 80 && !(await has('.quiz-summary')); i++) {
    if (await has('.grades')) { await page.locator('.grade-good').click(); flips++; } else { await page.locator('.flashcard').click(); }
    if (i === 3) await shot('04-flashcard');
  }
  ok('hoàn thành phiên flashcard (' + flips + ' lượt)', await has('.quiz-summary'));
  const srsN = await page.evaluate(() => Object.keys(Aptis.store.get('srs')).length);
  ok('SRS đã lưu thẻ (' + srsN + ')', srsN > 10);
  await go('#/vocab/quiz?cat=education');
  await page.waitForSelector('.quiz');
  ok('quiz từ vựng chạy xong', await driveQuiz());
  await go('#/vocab/cards?mode=bookmarks');
  ok('bookmarks rỗng hiển thị trạng thái trống', await has('.empty'));

  console.log('Ngữ pháp');
  await go('#/grammar/tenses/quiz/b2');
  await page.waitForSelector('.quiz');
  ok('quiz ngữ pháp chạy xong', await driveQuiz());
  const gstat = await page.evaluate(() => Aptis.store.get('stats').grammar.subs['tenses:b2']);
  ok('lưu kết quả theo chủ điểm:mức', !!gstat && gstat.t >= 8);

  console.log('Reading (4 dạng)');
  await go('#/reading/sentence/rs1'); await page.waitForSelector('.quiz');
  ok('sentence completion', await driveQuiz());
  await go('#/reading/ordering/ro1'); await page.waitForSelector('.task-order');
  await driveOrder();
  ok('paragraph ordering có phản hồi', await has('.feedback'));
  await shot('05-reading-ordering');
  await go('#/reading/shortMatch/rm1'); await page.waitForSelector('.task-match');
  await driveMatch();
  ok('short text match có phản hồi', await has('.feedback'));
  await go('#/reading/longMatch/rl1'); await page.waitForSelector('.task-heading');
  await driveHeading();
  ok('long text match có phản hồi', await has('.feedback'));
  const rstat = await page.evaluate(() => Object.keys(Aptis.store.get('stats').reading.subs).sort().join());
  ok('thống kê Reading theo 4 dạng', rstat === 'longMatch,ordering,sentence,shortMatch', rstat);

  console.log('Listening');
  await go('#/listening/l-conv-1'); await page.waitForSelector('.player');
  ok('có trình phát + giới hạn lượt', (await page.locator('.player .chip').innerText()).includes('Đã nghe'));
  ok('quiz nghe chạy xong, hiện transcript + traps', (await driveQuiz()) && (await page.locator('text=Common traps').count()) > 0);

  console.log('Writing (bộ chấm offline)');
  await go('#/writing/3/w3-1'); await page.waitForSelector('.task-write');
  const bad = "hi jack\nthank you for your email. I can come saturday. I bring food and water. i like hiking very much. see you.\nLan";
  await page.locator('textarea.writing-box').fill(bad);
  ok('đếm từ hiển thị', (await page.locator('.wc').first().innerText()).includes('từ'));
  await clickBtn(/Nộp & xem nhận xét/);
  await page.waitForSelector('.wscore');
  const first = await page.evaluate(() => Aptis.store.get('wlog').slice(-1)[0]);
  ok('có điểm ước tính /50 + khoảng + độ tin cậy', (await page.locator('.wscore-num').innerText()).includes('/50') && (await page.locator('.wscore').innerText()).includes('khoảng') && (await page.locator('.wscore').innerText()).includes('độ tin cậy'));
  ok('hiển thị 4 tiêu chí kèm thang 0–5', (await page.locator('.wcrit').count()) === 4);
  ok('lỗi được đánh số trong bài (mark) và có danh sách giải thích', (await page.locator('.annotated mark.iss').count()) >= 2 && (await page.locator('.issue-list li').count()) >= 2);
  ok('mục “Nên sửa trước” và “Điểm mạnh”', (await page.locator('text=Nên sửa trước').count()) > 0 && (await page.locator('text=Điểm mạnh').count()) > 0);
  ok('có lời nhắc đây là ước tính tự động, không thay giáo viên', (await page.locator('text=không hiểu nội dung').count()) > 0 && (await page.locator('text=không thay giáo viên').count()) > 0);
  ok('bài mẫu B2 nằm trong mục mở rộng', (await page.locator('.accordion .textbox.sample').count()) >= 1);
  ok('đã ghi nhật ký chấm (wlog) với điểm và lỗi', !!first && first.score50 > 0 && Object.keys(first.issues).length >= 2 && first.texts[0].includes('thank you for your email'));
  ok('không còn bước tự chấm trong Writing', !(await has('fieldset.rating-row')));
  ok('A2 bị chấm thấp (< 26)', first.score50 < 26, String(first.score50));
  await shot('06-writing-report');
  // sửa lại & chấm lại → điểm tăng, hiển thị chênh lệch
  await clickBtn(/Sửa lại bài/);
  await page.waitForSelector('textarea.writing-box');
  await page.locator('textarea.writing-box').fill("Hi Jack,\n\nThanks for the invitation! I'd love to come, although I haven't been hiking since last spring, so please pick a gentle route. I'll bring sandwiches, fruit and plenty of water. Shall we meet at the station at seven?\n\nSpeak soon,\nLinh");
  await clickBtn(/Chấm lại bài đã sửa/);
  await page.waitForSelector('.wscore');
  const second = await page.evaluate(() => Aptis.store.get('wlog').slice(-1)[0]);
  ok('sửa lại: cùng một bản ghi, đếm số lần sửa, điểm tăng', (await page.evaluate(() => Aptis.store.get('wlog').length)) === 1 && second.revisions === 1 && second.score50 > first.score50 + 10, `${first.score50} → ${second.score50}`);
  ok('hiển thị chênh lệch so với lần trước', (await page.locator('.wscore').innerText()).includes('so với lần trước'));
  // giáo viên: xuất bài + nhập điểm
  const [dl] = await Promise.all([page.waitForEvent('download'), clickBtn(/Xuất bài cho giáo viên/)]);
  ok('xuất bài cho giáo viên (.md)', dl.suggestedFilename().endsWith('.md'));
  await page.locator('.teacher summary').click();
  const nums = page.locator('.teacher-form input');
  for (let i = 0; i < 4; i++) await nums.nth(i).fill(['4', '3.5', '4', '3.5'][i]);
  await page.locator('.teacher textarea').fill('Bài khá tốt, cần thêm từ nối.');
  await clickBtn(/Lưu điểm giáo viên/);
  await page.waitForSelector('text=Điểm giáo viên');
  const teach = await page.evaluate(() => Aptis.store.get('wlog')[0].teacher);
  ok('lưu điểm giáo viên (0,2·4 + 0,3·3,5 + 0,25·4 + 0,25·3,5 = 3,725 → 37,3)', teach && Math.abs(teach.score50 - 37.3) < 0.2, JSON.stringify(teach && teach.score50));
  ok('hiển thị độ lệch giữa bộ chấm và giáo viên', (await page.locator('.teacher').innerText()).includes('Bộ chấm tự động'));
  const sess = await page.evaluate(() => Aptis.store.get('stats').writing);
  ok('phiên Writing được ghi nhận một lần (không tính lại khi sửa)', sess && sess.n === 1, JSON.stringify(sess && sess.n));
  await go('#/writing');
  ok('trang Writing có hồ sơ lỗi và đối chiếu giáo viên', (await page.locator('text=Đối chiếu với giáo viên').count()) > 0 && (await page.locator('text=Điểm các lần gần đây').count()) > 0);
  await go('#/writing/3');
  ok('danh sách đề hiển thị điểm bài đã làm', (await page.locator('.card-link .chip', { hasText: '/50' }).count()) >= 1);
  await go('#/writing/1/w1-1'); await page.waitForSelector('.task-write');
  await page.locator('textarea.writing-box').first().fill('Anna');
  await page.waitForTimeout(800);
  const draft = await page.evaluate(() => Object.keys(Aptis.store.get('drafts')));
  ok('bản nháp Writing tự lưu', draft.includes('w1-1'));

  console.log('Speaking');
  await go('#/speaking/p2/s2-1'); await page.waitForSelector('.task-speak');
  ok('hiện mô tả cảnh', await has('.scene'));
  await page.getByRole('button', { name: /Bắt đầu nói/ }).click();
  ok('đồng hồ đếm lùi chạy', await has('.countdown .clock'));
  await shot('07-speaking');
  await driveSpeaking();
  ok('tự chấm Speaking xong', await has('.quiz-summary'));
  await go('#/speaking/p5/s5-1'); await page.waitForSelector('.task-speak');
  await page.getByRole('button', { name: /Bắt đầu \(chuẩn bị/ }).click();
  ok('Part 5 có giai đoạn chuẩn bị', (await page.locator('.countdown').innerText()).includes('Chuẩn bị'));

  console.log('Mini Mock Test');
  await go('#/mock');
  await page.getByRole('button', { name: /Bắt đầu Mini Mock/ }).click();
  await page.waitForSelector('text=Bắt đầu phần này');
  for (let stage = 0; stage < 5; stage++) {
    await page.getByRole('button', { name: /Bắt đầu phần này/ }).click();
    await page.waitForSelector('.sticky-timer');
    if (stage === 0) await shot('08-mock-gv');
    for (let k = 0; k < 8; k++) {
      const h0 = await hash();
      await driveAny();
      await page.waitForTimeout(150);
      if ((await hash()) !== h0 || (await has('text=Bắt đầu phần này')) || (await hash()).startsWith('#/mock/result')) break;
    }
    if ((await hash()).startsWith('#/mock/result')) break;
    await page.waitForSelector('text=Bắt đầu phần này, .level-big', { timeout: 8000 }).catch(() => {});
  }
  await page.waitForFunction(() => location.hash.startsWith('#/mock/result/'), null, { timeout: 15000 }).catch(() => {});
  ok('Mock kết thúc → trang kết quả', (await hash()).startsWith('#/mock/result/'), await hash());
  if ((await hash()).startsWith('#/mock/result/')) {
    ok('có Estimated CEFR + xác suất + weakest skills', (await has('.level-big')) && (await page.locator('text=xác suất đạt B2').count()) > 0 && (await page.locator('text=Weakest skills').count()) > 0);
    const m = await page.evaluate(() => Aptis.store.get('mocks')[0]);
    ok('Mock lưu đủ 5 điểm kỹ năng trong [0,50]', m && ['gv', 'reading', 'listening', 'writing', 'speaking'].every((k) => m.scores[k] >= 0 && m.scores[k] <= 50), JSON.stringify(m && m.scores));
    ok('xác suất ∈ [0,1], CEFR hợp lệ', m && m.prob >= 0 && m.prob <= 1 && ['A0', 'A1', 'A2', 'B1', 'B2', 'C'].includes(m.overallCefr));
    ok('mockRun được dọn sau khi xong', (await page.evaluate(() => Aptis.store.get('mockRun'))) === null);
    await shot('09-mock-result');
  }

  console.log('Phân tích, thành tích, cài đặt');
  await go('#/analytics');
  ok('analytics có biểu đồ SVG + tiêu chí thành công', (await page.locator('svg.chart-svg').count()) >= 3 && (await page.locator('text=Tiêu chí thành công').count()) > 0);
  ok('analytics có thẻ Writing (tiêu chí + lỗi hay mắc)', (await page.locator('text=Writing: bốn tiêu chí').count()) > 0 && (await page.locator('text=Writing: lỗi hay mắc nhất').count()) > 0);
  await shot('10-analytics');
  await go('#/achievements');
  ok('có huy hiệu đã đạt (First Step)', (await page.locator('.badge.earned').count()) >= 1);
  await shot('11-achievements');
  await go('#/settings');
  await page.getByLabel(/Tối/).check({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  ok('chọn Tối → data-theme=dark', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
  await go('#/');
  await shot('12-dashboard-dark');
  const exported = await page.evaluate(() => { const e = Aptis.store.exportAll(); return Object.keys(e.data).length; });
  ok('xuất dữ liệu đủ khoá', exported >= 10);

  console.log('Lưu trữ & tải lại');
  await page.reload();
  await page.waitForSelector('main h1');
  ok('tải lại: không bị đưa về welcome, dữ liệu còn', (await hash()) !== '#/welcome' && (await page.evaluate(() => Aptis.store.get('diag').attempts.length)) === 1);
  const used = await page.evaluate(() => Aptis.store.sizeKB());
  ok('dung lượng LocalStorage hợp lý (' + used + ' KB)', used < 500);

  console.log('Responsive & trợ năng');
  await page.setViewportSize({ width: 390, height: 800 });
  await go('#/');
  ok('mobile: có bottom nav, sidebar ẩn', (await page.locator('.bottomnav').isVisible()) && !(await page.locator('.sidebar').isVisible()));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('mobile: không cuộn ngang trang chủ (' + overflow + 'px)', overflow <= 1);
  await shot('13-mobile-dashboard');
  let mobileOverflow = [];
  for (const r of ['/vocab/daily', '/grammar/tenses', '/reading/ordering/ro1', '/reading/longMatch/rl1', '/writing/4/w4-1', '/speaking/p3/s3-1', '/analytics', '/roadmap', '/mock']) {
    await go('#' + r);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 1) mobileOverflow.push(r + ':' + o);
  }
  ok('mobile: không cuộn ngang ở các màn chính', mobileOverflow.length === 0, mobileOverflow.join(' '));
  await page.setViewportSize({ width: 1280, height: 900 });
  await go('#/grammar/tenses/quiz/b1');
  await page.waitForSelector('.quiz');
  const noName = await page.evaluate(() => [...document.querySelectorAll('button, a, input, select, textarea')].filter((el) => { const t = (el.innerText || '').trim(); const l = el.getAttribute('aria-label') || (el.labels && el.labels.length) || el.getAttribute('title') || el.getAttribute('placeholder'); return !t && !l && el.type !== 'hidden'; }).map((el) => el.outerHTML.slice(0, 80)));
  ok('mọi điều khiển đều có tên truy cập', noName.length === 0, noName.slice(0, 3).join(' | '));
  const lang = await page.evaluate(() => document.documentElement.lang);
  ok('html lang=vi, có skip link & landmark main', lang === 'vi' && (await has('.skip-link')) && (await has('main#main')));
  await page.keyboard.press('1');
  ok('phím số chọn đáp án', await has('.opt.picked'));

  console.log('Người dùng mới bỏ qua Diagnostic + chế độ tập trung');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errors.push('pageerror(p2): ' + e.message));
  p2.on('console', (m) => m.type() === 'error' && errors.push('console(p2): ' + m.text()));
  await p2.goto(URL);
  await p2.waitForSelector('main h1');
  await p2.getByLabel(/30 phút/).check({ force: true });
  await p2.getByRole('button', { name: /Bỏ qua, vào Dashboard/ }).click();
  await p2.waitForSelector('.hero-dash');
  ok('bỏ qua → Dashboard, vào #/', (await p2.evaluate(() => location.hash)) === '#/');
  ok('chế độ 30 phút → ít nhiệm vụ (≤ 3)', (await p2.locator('.task-row').count()) <= 3, String(await p2.locator('.task-row').count()));
  ok('Dashboard gợi ý làm Diagnostic khi chưa làm', (await p2.locator('text=Làm Diagnostic Test').count()) > 0);
  ok('nút thoát tập trung ẩn mặc định', !(await p2.locator('.exit-focus').isVisible()));
  await p2.locator('#btn-focus').click();
  ok('bật tập trung: ẩn sidebar, hiện nút thoát', !(await p2.locator('.sidebar').isVisible()) && (await p2.locator('.exit-focus').isVisible()));
  await p2.locator('.exit-focus').click();
  ok('thoát tập trung: sidebar quay lại', await p2.locator('.sidebar').isVisible());
  await p2.evaluate(() => Aptis.store.update('profile', (p) => { p.startDate = Aptis.util.addDays(Aptis.util.dateKey(), -40); }));
  await p2.evaluate(() => location.reload());
  await p2.waitForSelector('.hero-dash');
  ok('quá 30 ngày vẫn hiển thị (Ngày 30, không lỗi)', (await p2.locator('.topbar').innerText()).includes('đã qua 30'));
  await ctx2.close();

  console.log('Kiểm tra các lỗi còn lại');
  ok('không có lỗi JS/console trong cả phiên', errors.length === 0, errors.slice(0, 5).join('\n    '));

  await browser.close();
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('LỖI KHÔNG MONG ĐỢI:', e.message);
  console.error(errors.slice(0, 8).join('\n'));
  process.exit(2);
});
