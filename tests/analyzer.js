#!/usr/bin/env node
/* Test bộ chấm Writing offline (js/core/writing-analyzer.js): node tests/analyzer.js
 *
 * Phạm vi và giới hạn của các test này:
 *  - Luật: mỗi luật có ca dương tính (phải bắt) và ca âm tính (không được báo nhầm).
 *  - Hiệu chuẩn: 16 bài mẫu B2 của ứng dụng + bài người học GIẢ LẬP (tests/fixtures/writing-learner.js, do người phát triển
 *    viết, nhãn trình độ là mong đợi chứ không phải kết quả chấm của giáo viên).
 *  => Các test chứng minh bộ chấm nhất quán, phân biệt được mức độ và không báo lỗi nhầm trên văn bản tự nhiên;
 *     KHÔNG chứng minh độ khớp với giám khảo Aptis thật. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const sandbox = { console, Date, Math, JSON, URLSearchParams };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
['js/core/util.js', 'js/core/store.js', 'js/core/labels.js'].forEach(load);
fs.readdirSync(path.join(root, 'js/data')).filter((f) => f.endsWith('.js')).forEach((f) => load('js/data/' + f));
['js/core/srs.js', 'js/core/vocabdb.js', 'js/core/scoring.js', 'js/core/writing-analyzer.js', 'js/core/writing-log.js'].forEach(load);
const A = sandbox.Aptis;
const WA = A.writingAnalyzer;
const W = sandbox.AptisData.writing;
const fixtures = require('./fixtures/writing-learner.js');

let pass = 0;
let fail = 0;
const t = (name, fn) => {
  try {
    fn();
    pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    fail++;
    console.log('  ✗ ' + name + '\n      ' + String(e.stack || e).split('\n').slice(0, 4).join('\n      '));
  }
};

const find = (text, opts = {}) => WA._findIssues(text, Object.assign({ formal: false, informal: false, max: 100, promptTokens: new Set() }, opts));
const rulesOf = (text, opts) => find(text, opts).map((i) => i.rule);
const run = (exId, texts) => {
  const ex = W.find((w) => w.id === exId);
  return WA.analyze({ task: ex.task, parts: ex.parts.map((p, i) => ({ prompt: p.prompt, min: p.min, max: p.max, text: texts[i] != null ? texts[i] : '' })), context: ex.context });
};
const sampleOf = (id) => run(id, W.find((w) => w.id === id).parts.map((p) => p.sample));

/* ====================== 1. Luật: ca dương tính ====================== */
console.log('Luật — phải bắt được lỗi');
const POS = [
  ['sv-3rd', 'She go to work every day.'],
  ['sv-neg', "He don't like coffee."],
  ['sv-it', 'It work well.'],
  ['sv-be', 'I is a student.'],
  ['am-agree', 'I am agree with you.'],
  ['past-marker', 'Yesterday I go to the cinema.'],
  ['past-marker', 'I go to the cinema yesterday.'],
  ['perfect-past', 'I have seen him yesterday.'],
  ['since-for', 'I have lived here since 3 years.'],
  ['for-since', 'I have worked here for 2019.'],
  ['didnt-past', "I didn't went to school."],
  ['have-base', 'She has go home.'],
  ['have-base', "I haven't go there."],
  ['modal-to', 'I can to swim.'],
  ['modal-form', 'He can goes there.'],
  ['there-is-plural', 'There is many people here.'],
  ['verb-ing-after', 'I enjoy to read books.'],
  ['to-after', 'I decided going home.'],
  ['look-forward', 'I look forward to meet you.'],
  ['because-of-clause', 'He stayed home because of he was ill.'],
  ['although-but', 'Although it rained, but we went out.'],
  ['double-comparative', 'This is more better.'],
  ['want-that', 'I want that you come.'],
  ['i-very-like', 'I very like this film.'],
  ['adv-be', 'I always am late.'],
  ['years-old', 'I have 25 years old.'],
  ['a-an', 'I bought a apple.'],
  ['an-a', 'I bought an book.'],
  ['a-hour', 'I waited a hour.'],
  ['a-plural', 'I have a friends.'],
  ['wrong-noun-form', 'I need some informations.'],
  ['much-many', 'There are much people.'],
  ['many-much', "I don't have many time."],
  ['missing-to', 'I want read books.'],
  ['somebody-sv', 'Everybody like him.'],
  ['plural-sv', 'People is happy.'],
  ['number-singular', 'I lived there two year.'],
  ['missing-be', 'The machine is old and it broken.'],
  ['missing-article-work', 'I work in company.'],
  ['missing-article', 'I need laptop for work.'],
  ['comparative-form', 'It is more happy than before.'],
  ['extra-prep', 'We discussed about the plan.'],
  ['explain-me', 'Please explain me the rules.'],
  ['explain-me', 'Please reply me soon.'],
  ['listen-music', 'I listen music every day.'],
  ['wrong-prep', 'It depends of the weather.'],
  ['other-hand', 'In the other hand, it is cheap.'],
  ['according-me', 'According to me, it is good.'],
  ['collocation-make-do', 'I made a photo of the lake.'],
  ['say-borrow-learn', 'Can you say me the time?'],
  ['thanks-you', 'Thanks you for your help.'],
  ['sign-off', 'Best regard, Anna'],
  ['lower-i', 'Today i like tea.'],
  ['lower-start', 'It was nice. we went home.'],
  ['space-before-punct', 'Hello , how are you?'],
  ['no-space-after', 'Hello,how are you?'],
  ['repeat-word', 'I went to the the shop.'],
  ['however-comma', 'I like it. However I am busy.'],
  ['comma-splice', 'I like the city, I go there every year.'],
  ['misspell', 'I recieve a letter every week.'],
  ['typo', 'I went to the restarant yesterday.'],
];
POS.forEach(([rule, text]) => t(`${rule}: “${text}”`, () => assert.ok(rulesOf(text).includes(rule), 'bắt được: ' + JSON.stringify(rulesOf(text)))));
t('informal-in-formal (thư trang trọng)', () => assert.ok(rulesOf("Hey guys, I'm gonna complain!!", { formal: true }).includes('informal-in-formal')));
t('contraction-in-formal (thư trang trọng)', () => assert.ok(rulesOf("I can't accept this delay.", { formal: true }).includes('contraction-in-formal')));
t('formal-in-informal (thư cho bạn)', () => assert.ok(rulesOf('Dear Sir or Madam, I am writing to inform you that I am free.', { informal: true }).includes('formal-in-informal')));
t('no-punct: đoạn dài không dấu câu', () => assert.ok(rulesOf('I went to the park and played football with my friends and then we went home and ate dinner').includes('no-punct')));
t('no-final-punct: câu cuối thiếu dấu', () => assert.ok(rulesOf('I like it. We went home with my brother and sister', { max: 40 }).includes('no-final-punct')));

/* ====================== 2. Luật: ca âm tính (không báo nhầm) ====================== */
console.log('Luật — KHÔNG báo nhầm trên câu đúng');
const NEG = [
  ['sv-3rd', 'Does she go to work?'],
  ['sv-3rd', 'She goes to work.'],
  ['sv-3rd', 'Will he go there tomorrow?'],
  ['sv-3rd', 'They let her go.'],
  ['sv-it', 'I made it work.'],
  ['sv-be', 'Did she have a car?'],
  ['sv-be', 'You are right and they have time.'],
  ['sv-be', 'If she were here, we could talk.'],
  ['am-agree', 'I agree with you.'],
  ['past-marker', 'I am writing to complain about the machine which I bought last week.'],
  ['past-marker', 'Last week I went to Hue.'],
  ['past-marker', 'I go to school every day.'],
  ['past-marker', 'Yesterday I was ill.'],
  ['past-marker', 'I think the meeting yesterday was useful.'],
  ['past-marker', 'I am working on it, and last week I finished the plan.'],
  ['perfect-past', 'I have lived here since 2019.'],
  ['since-for', 'I have lived here for 3 years.'],
  ['for-since', 'I have lived here since 2019.'],
  ['didnt-past', "I didn't need any help."],
  ['didnt-past', "She didn't read it."],
  ['modal-to', 'I have to go and I would like to stay.'],
  ['a-an', 'Plan A is better than plan B.'],
  ['a-an', 'She is a university student and a user of a European brand.'],
  ['a-an', 'It was a unique idea and a one-hour trip.'],
  ['an-a', 'It took an hour with an MBA and an honest man under an umbrella.'],
  ['missing-to', 'I need help with it.'],
  ['missing-to', 'I want to read and I hope to see you.'],
  ['somebody-sv', 'Does everybody like it?'],
  ['somebody-sv', 'Someone like you should come.'],
  ['somebody-sv', 'Everyone likes tea.'],
  ['number-singular', 'I waited two years and had a 5 minute walk and a ten minute break.'],
  ['missing-be', 'I made it better and I found it broken.'],
  ['missing-be', 'I am happy and you are busy.'],
  ['missing-article', 'I need a laptop for work and I have my phone.'],
  ['missing-article', 'We have problems and need answers.'],
  ['a-plural', 'I have a lot of friends and a few books.'],
  ['much-many', 'How many people came? I do not have much time.'],
  ['extra-prep', 'We discussed the plan and mentioned the risks.'],
  ['lower-i', 'The word i.e. means that is.'],
  ['lower-start', 'We meet at 5 p.m. tomorrow.'],
  ['lower-start', 'Bring fruit, e.g. apples.'],
  ['space-before-punct', 'Hello, how are you?'],
  ['no-space-after', 'It costs 3.5 euros; see www.example.com or anna@mail.com.'],
  ['repeat-word', 'I had had enough of that.'],
  ['however-comma', 'However, I am busy. I am busy, however I will come.'],
  ['comma-splice', 'When I arrived, I saw him.'],
  ['comma-splice', 'I think, I will go.'],
  ['comma-splice', 'If you want, I can help.'],
  ['typo', 'We saw a lighthouse, a waterfall and a volcano near the suburb.'],
];
NEG.forEach(([rule, text]) => t(`${rule}: không báo nhầm “${text}”`, () => assert.ok(!rulesOf(text).includes(rule), 'báo nhầm: ' + JSON.stringify(find(text).filter((i) => i.rule === rule).map((i) => i.quote)))));
t('formal-only: không báo giọng văn khi không phải thư trang trọng', () => assert.ok(!rulesOf("Hey guys, I'm gonna go!!").some((r) => /formal/.test(r))));
t('a-an: không bắt “A” viết hoa (Option A and B)', () => assert.ok(!rulesOf('Option A and option B are fine. Vitamin A is useful.').includes('a-an')));

/* ====================== 3. Độ chính xác trên văn bản tự nhiên ====================== */
console.log('Báo nhầm trên văn bản tiếng Anh tự nhiên');
const natural = [];
const D = sandbox.AptisData;
D.reading.longMatch.forEach((s) => s.paras.forEach((p) => natural.push(p.t)));
D.reading.shortMatch.forEach((s) => s.people.forEach((p) => natural.push(p.t)));
D.reading.ordering.forEach((s) => natural.push([s.first, ...s.order].join(' ')));
D.listening.forEach((l) => l.script.forEach((x) => natural.push(x.t)));
D.speaking.p2.forEach((x) => natural.push(x.sample));
D.speaking.p5.forEach((x) => natural.push(x.sample));
t('0 cảnh báo ngữ pháp/chính tả trên ~200 đoạn văn tự nhiên của ứng dụng', () => {
  const bad = [];
  natural.forEach((tx) => find(tx).forEach((i) => bad.push(i.rule + ':' + i.quote)));
  assert.strictEqual(bad.length, 0, 'báo nhầm: ' + bad.slice(0, 8).join(' | '));
});
t('chính tả: 0 báo nhầm trên 120 từ đúng ít gặp', () => {
  const words = 'backpack lighthouse waterfall sunset knitting gardening marathon vegetarian spaghetti cinema theatre bakery pharmacy library museum gallery stadium harbour suburb skyscraper pavement roundabout motorway carriage departure passport customs souvenir itinerary hostel campsite cottage balcony wardrobe cupboard curtain carpet fridge freezer microwave dishwasher laundry shampoo toothpaste towel pillow blanket mattress neighbour landlord tenant mortgage salary pension promotion supervisor agenda spreadsheet invoice receipt refund warranty compensation parcel courier envelope postcode charger headphones keyboard monitor printer scanner download password username wireless bluetooth tripod projector microphone subtitles episode documentary thriller romance novelist poetry biography magazine journalist copyright brochure leaflet poster slogan commercial retailer wholesale voucher coupon bargain shareholder inflation recession tariff warehouse machinery technician plumber electrician carpenter architect surgeon dentist pharmacist'.split(' ');
  const bad = find(words.join(' ')).filter((i) => i.cat === 'spell').map((i) => i.quote);
  assert.strictEqual(bad.length, 0, 'báo nhầm: ' + bad.join(', '));
});
t('chính tả (bảng lỗi hay gặp + bắt gõ nhầm): bắt ≥ 90% lỗi thật', () => {
  const typos = 'recieve freind beautifull comming begining intresting tomorow definately wich becuase writting occured acommodation enviroment goverment diffrent necesary sucess embarass seperate restaraunt untill adress wierd calender collegue exellent experiance finaly foriegn happend knowlege libary occassion posible realy recomend sentance suprise truely usefull weeked'.split(' ');
  const miss = typos.filter((w) => !find('I think that ' + w + ' is important.').some((i) => i.cat === 'spell'));
  assert.ok(miss.length <= Math.floor(typos.length * 0.1), 'trượt: ' + miss.join(', '));
});
t('bộ bắt gõ nhầm ĐỘC LẬP (ngoài bảng lỗi hay gặp): ≥ 25/39 bắt được và mọi gợi ý đều đúng', () => {
  const pairs = { hopsital: 'hospital', importnat: 'important', conversaton: 'conversation', restuarant: 'restaurant', schedual: 'schedule', tecnology: 'technology', relatioship: 'relationship', comunity: 'community', approch: 'approach', challange: 'challenge', diffcult: 'difficult', excersise: 'exercise', reponsible: 'responsible', oppurtunity: 'opportunity', knowlegde: 'knowledge', customr: 'customer', custmer: 'customer', delivary: 'delivery', informtion: 'information', enviromental: 'environmental', develope: 'develop', inportant: 'important', problme: 'problem', quetion: 'question', holidya: 'holiday', prefering: 'preferring', travell: 'travel', avalable: 'available', acount: 'account', finnish: 'finish', beacause: 'because', tomorrw: 'tomorrow', intersting: 'interesting', langage: 'language', studens: 'students', exampel: 'example', peopel: 'people', diffrence: 'difference', sugestion: 'suggestion', discusion: 'discussion' };
  let hit = 0;
  const wrong = [];
  Object.entries(pairs).forEach(([typo, right]) => {
    const is = find('I think that ' + typo + ' is important for us.').filter((i) => i.rule === 'typo');
    if (is.length) {
      hit++;
      if (is[0].fix !== right) wrong.push(typo + '→' + is[0].fix);
    }
  });
  assert.ok(hit >= 25, `chỉ bắt ${hit}/39`);
  assert.strictEqual(wrong.length, 0, 'gợi ý sai: ' + wrong.join(', '));
});
t('bài mẫu B2 của ứng dụng: không có cảnh báo nào (16/16)', () => {
  const bad = [];
  W.forEach((ex) => sampleOf(ex.id).issues.forEach((i) => bad.push(ex.id + ':' + i.rule + ':' + i.quote)));
  assert.deepStrictEqual(bad, []);
});

/* ====================== 4. Chấm điểm: bài mẫu B2 ====================== */
console.log('Chấm điểm — bài mẫu B2 (16 bài)');
const sampleScores = W.map((ex) => sampleOf(ex.id).score50);
t('≥ 13/16 bài mẫu đạt ≥ 38 (B2), không bài nào < 34', () => {
  const ok = sampleScores.filter((x) => x >= 38).length;
  assert.ok(ok >= 13, `chỉ ${ok}/16 bài đạt ≥ 38: ${sampleScores.join(', ')}`);
  assert.ok(Math.min(...sampleScores) >= 34, 'thấp nhất ' + Math.min(...sampleScores));
});
t('trung vị bài mẫu ≥ 41', () => {
  const s = sampleScores.slice().sort((a, b) => a - b);
  assert.ok((s[7] + s[8]) / 2 >= 41, 'trung vị ' + (s[7] + s[8]) / 2);
});
t('không bao giờ trả về mức “C” (luật không phân biệt được C1/C2)', () => {
  const all = [...W.map((ex) => sampleOf(ex.id)), ...fixtures.map((f) => run(f.ex, f.parts))];
  all.forEach((r) => {
    assert.ok(r.score50 <= 43.9 && r.band !== 'C', `${r.score50} ${r.band}`);
  });
});

/* ====================== 5. Chấm điểm: bài người học giả lập ====================== */
console.log('Chấm điểm — bài người học giả lập (mức mong đợi do người viết gán)');
const byLevel = (lv) => fixtures.filter((f) => f.level === lv).map((f) => ({ id: f.id, ex: f.ex, r: run(f.ex, f.parts) }));
t('A2: mọi bài < 26 (band A2 hoặc thấp hơn)', () => byLevel('A2').forEach(({ id, r }) => assert.ok(r.score50 < 26, `${id}: ${r.score50}`)));
t('B1: mọi bài trong [26, 37.4] — không bài nào lên B2', () => byLevel('B1').forEach(({ id, r }) => assert.ok(r.score50 >= 26 && r.score50 <= 37.4, `${id}: ${r.score50}`)));
t('B2 tự viết: mọi bài ≥ 38', () => byLevel('B2').forEach(({ id, r }) => assert.ok(r.score50 >= 38, `${id}: ${r.score50}`)));
t('thứ tự A2 < B1 < B2 trong từng nhiệm vụ, cách nhau ≥ 5 điểm', () => {
  ['w1-1', 'w2-1', 'w3-1', 'w4-1'].forEach((ex) => {
    const g = (lv) => byLevel(lv).filter((x) => x.ex === ex).map((x) => x.r.score50);
    const [a, b, c] = ['A2', 'B1', 'B2'].map((lv) => g(lv));
    if (a.length && b.length) assert.ok(Math.min(...b) - Math.max(...a) >= 5, `${ex}: A2 ${a} / B1 ${b}`);
    if (b.length && c.length) assert.ok(Math.min(...c) - Math.max(...b) >= 5, `${ex}: B1 ${b} / B2 ${c}`);
  });
});
t('điều kiện B2: bài B1 có raw ≥ 38 bị chặn ở 37.4 kèm lý do cụ thể', () => {
  const capped = byLevel('B1').filter(({ r }) => r.capped);
  assert.ok(capped.length >= 1, 'cần ít nhất một bài B1 bị chặn để kiểm chứng cơ chế');
  capped.forEach(({ r }) => {
    assert.strictEqual(r.score50, 37.4);
    assert.ok(r.bandNotes.some((n) => /^Để lên B2/.test(n)), 'phải có lý do “Để lên B2”');
  });
});

/* ====================== 6. Thử biến đổi bài (độ nhạy) ====================== */
console.log('Độ nhạy khi biến đổi bài');
const base4 = sampleOf('w4-1');
const text4 = W.find((w) => w.id === 'w4-1').parts[0].sample;
t('bỏ hết từ nối → tiêu chí Liên kết giảm ≥ 1 và điểm giảm', () => {
  const stripped = text4.replace(/\b(Firstly|Moreover|What is more|Finally|However|Therefore|Furthermore|In addition|Secondly|Unfortunately|although|even though|so that|Besides|as a result)\b,?\s*/gi, '');
  const r = run('w4-1', [stripped]);
  assert.ok(base4.criteria.co.score - r.criteria.co.score >= 1, `${base4.criteria.co.score} → ${r.criteria.co.score}`);
  assert.ok(r.score50 < base4.score50);
});
t('cắt còn 40% độ dài → Hoàn thành yêu cầu giảm ≥ 1.5 và điểm ≤ 30', () => {
  const words = text4.split(/\s+/);
  const r = run('w4-1', [words.slice(0, Math.floor(words.length * 0.4)).join(' ')]);
  assert.ok(base4.criteria.ta.score - r.criteria.ta.score >= 1.5, `${base4.criteria.ta.score} → ${r.criteria.ta.score}`);
  assert.ok(r.score50 <= 30, 'điểm ' + r.score50);
});
t('thêm 4 lỗi ngữ pháp điển hình → Ngữ pháp giảm ≥ 0.6, bắt ≥ 4 lỗi', () => {
  const r = run('w4-1', [text4.replace(/Yours (sincerely|faithfully)/, 'Yesterday I go to the shop. She don\'t like it. I am agree. Everybody like it.\n\nYours faithfully')]);
  assert.ok(r.issues.filter((i) => i.cat === 'gram').length >= 4, JSON.stringify(r.issues.map((i) => i.rule)));
  assert.ok(base4.criteria.gr.score - r.criteria.gr.score >= 0.6, `${base4.criteria.gr.score} → ${r.criteria.gr.score}`);
});
t('giọng thân mật trong thư trang trọng → ≥ 3 cảnh báo giọng văn và điểm giảm', () => {
  const r = run('w4-1', ["Hey guys,\n\nI'm gonna complain about the coffee machine I bought from your website!! It's awesome that you sell stuff but it arrived late and it's broken. Cheers!!\n\nBye"]);
  assert.ok(r.issues.filter((i) => i.cat === 'register').length >= 3, JSON.stringify(r.issues.map((i) => i.rule)));
  assert.ok(r.score50 < base4.score50 - 10);
});
t('bỏ lời chào/kết khỏi thư → Hoàn thành yêu cầu giảm', () => {
  const body = text4.split('\n').slice(2, -3).join('\n');
  const r = run('w4-1', [body]);
  assert.ok(r.criteria.ta.score < base4.criteria.ta.score - 0.5, `${base4.criteria.ta.score} → ${r.criteria.ta.score}`);
  assert.ok(r.parts[0].notes.some((n) => /lời chào/i.test(n)));
});

/* ====================== 7. Báo cáo & độ bền ====================== */
console.log('Báo cáo, độ bền, hiệu năng');
t('báo cáo đầy đủ trường, số trong miền hợp lệ, offset khớp văn bản', () => {
  const f = fixtures.find((x) => x.id === 'b1-task4');
  const r = run(f.ex, f.parts);
  ['ta', 'gr', 'vo', 'co'].forEach((k) => {
    assert.ok(r.criteria[k].score >= 0 && r.criteria[k].score <= 5 && Number.isFinite(r.criteria[k].score), k);
    assert.ok(typeof r.criteria[k].band === 'string' && Array.isArray(r.criteria[k].notes));
  });
  assert.ok(r.score50 >= 0 && r.score50 <= 50 && r.range[0] <= r.score50 && r.score50 <= r.range[1]);
  assert.ok(Math.abs(r.rating5 - r.score50 / 10) <= 0.051);
  assert.ok(['low', 'medium', 'high'].includes(r.confidence));
  assert.ok(typeof r.summary === 'string' && r.summary.length > 20 && /Ước tính/.test(r.summary));
  assert.ok(r.priorities.length <= 3 && Array.isArray(r.strengths));
  r.parts.forEach((p) => p.issues.forEach((i) => {
    assert.ok(i.start >= 0 && i.end <= p.text.length && i.end > i.start, `offset ${i.rule} ${i.start}-${i.end}`);
    assert.strictEqual(p.text.slice(i.start, i.end), i.quote);
    assert.ok(typeof i.message === 'string' && i.message.length > 5);
  }));
});
t('giữ nguyên đầu vào và cho cùng kết quả khi chạy lại (xác định)', () => {
  const ex = W.find((w) => w.id === 'w3-1');
  const input = { task: 3, parts: [{ prompt: ex.parts[0].prompt, min: 40, max: 50, text: 'Hi Jack,\n\nThanks!' }], context: ex.context };
  const snapshot = JSON.stringify(input);
  const a = JSON.stringify(WA.analyze(input));
  const b = JSON.stringify(WA.analyze(input));
  assert.strictEqual(a, b);
  assert.strictEqual(JSON.stringify(input), snapshot);
});
t('đầu vào rỗng/lạ không làm sập và cho điểm 0 hoặc hợp lệ', () => {
  const r0 = run('w3-1', ['']);
  assert.strictEqual(r0.score50, 0);
  assert.strictEqual(r0.words, 0);
  const rr = run('w1-1', ['', '', '', '', '', '']);
  assert.strictEqual(rr.score50, 0);
  ['<script>alert(1)</script>', '😀😀😀 !!! ???', '12345 67890', 'a'.repeat(3000), '\n\n\n', 'Hi, ' + 'word '.repeat(400)].forEach((x) => {
    const r = run('w3-1', [x]);
    assert.ok(Number.isFinite(r.score50) && r.score50 >= 0 && r.score50 <= 50, JSON.stringify(x.slice(0, 20)));
  });
});
t('HTML/script trong bài viết không bị diễn giải: quote giữ nguyên là văn bản thuần', () => {
  const r = run('w3-1', ['<img src=x onerror=alert(1)> i like it']);
  r.parts[0].issues.forEach((i) => assert.strictEqual(typeof i.quote, 'string'));
});
t('hiệu năng: bài 150 từ phân tích < 120 ms sau khi khởi động', () => {
  sampleOf('w4-1'); // khởi động từ điển
  const t0 = Date.now();
  for (let i = 0; i < 10; i++) sampleOf('w4-2');
  const per = (Date.now() - t0) / 10;
  assert.ok(per < 120, per + ' ms/bài');
});
t('bài rất dài (5.000 từ) < 3 giây', () => {
  const long = Array(500).fill('I am writing to complain about the delivery because it was late and the box was damaged. ').join(' ');
  const t0 = Date.now();
  const r = run('w4-1', [long]);
  assert.ok(Date.now() - t0 < 3000 && Number.isFinite(r.score50), Date.now() - t0 + ' ms');
});
t('Task 1: ô điền form ngắn — tên riêng không bị báo chính tả', () => {
  const r = run('w1-1', ['Nguyen Thi Linh', 'accounts assistant', 'My speaking', 'To meet new people', 'Every Thursday', 'I have studied English for two years, mostly online, so I hope to practise with other members.']);
  assert.strictEqual(r.parts[0].issues.length, 0);
  assert.ok(r.parts[0].ta >= 4.5);
});
t('Task 1: ô điền quá dài hoặc để trống bị trừ điểm', () => {
  const r = run('w1-1', ['', 'I am working as an accounts assistant at a company in the city', 'My speaking', 'To meet new people', 'Every Thursday', '']);
  assert.ok(r.parts[0].ta === 0 && r.parts[1].ta < 5);
});

/* ====================== 8. Nhật ký Writing (wlog) ====================== */
console.log('Nhật ký Writing, điểm giáo viên, hồ sơ lỗi');
const logEntry = (exId, texts) => {
  const ex = W.find((w) => w.id === exId);
  const report = run(exId, texts);
  return A.wlog.add({ ex: exId, task: ex.task, title: ex.title, texts, report, seconds: 60 });
};
const b1t4 = fixtures.find((f) => f.id === 'b1-task4');
const a2t3 = fixtures.find((f) => f.id === 'a2-task3');
t('add → list, get, forEx, điểm hiệu lực = điểm tự động', () => {
  A.store.resetAll();
  const e = logEntry(b1t4.ex, b1t4.parts);
  assert.strictEqual(A.wlog.list().length, 1);
  assert.strictEqual(A.wlog.get(e.id).score50, e.score50);
  assert.strictEqual(A.wlog.forEx(b1t4.ex)[0].id, e.id);
  assert.strictEqual(A.wlog.effectiveScore(e), e.score50);
  assert.ok(e.issues['look-forward'] >= 1 && e.criteria.gr > 0);
});
t('revise: giữ điểm lần đầu, ghi điểm trước, đếm số lần sửa, xoá điểm giáo viên cũ', () => {
  A.store.resetAll();
  const e = logEntry(b1t4.ex, b1t4.parts);
  const before = { score50: e.score50, first50: e.first50 }; // revise sửa tại chỗ, nên chụp giá trị trước
  A.wlog.setTeacher(e.id, { scores: { ta: 4, gr: 3.5, vo: 3.5, co: 3 }, comment: 'ok' });
  const fixed = b1t4.parts[0].replace('look forward to hear', 'look forward to hearing').replace('nobody answer', 'nobody answered').replace('reply me', 'reply to me');
  const ex = W.find((w) => w.id === b1t4.ex);
  const r2 = run(b1t4.ex, [fixed]);
  const e2 = A.wlog.revise(e.id, { ex: ex.id, task: ex.task, title: ex.title, texts: [fixed], report: r2, seconds: 30 });
  assert.strictEqual(e2.revisions, 1);
  assert.strictEqual(e2.first50, before.first50);
  assert.strictEqual(e2.prev50, before.score50);
  assert.ok(e2.score50 > before.score50, `${before.score50} → ${e2.score50}`);
  assert.strictEqual(e2.teacher, null);
  assert.strictEqual(e2.seconds, 90);
  assert.strictEqual(A.wlog.list().length, 1);
});
t('điểm giáo viên: tính theo trọng số, ưu tiên hơn điểm tự động, kiểm tra đầu vào', () => {
  A.store.resetAll();
  const e = logEntry(a2t3.ex, a2t3.parts);
  const upd = A.wlog.setTeacher(e.id, { scores: { ta: 3, gr: 2.5, vo: 2, co: 2 }, comment: 'Cần luyện thêm' });
  // 0.2*3 + 0.3*2.5 + 0.25*2 + 0.25*2 = 2.35 → 23.5
  assert.ok(Math.abs(upd.teacher.score50 - 23.5) < 0.051, 'teacher ' + upd.teacher.score50);
  assert.strictEqual(A.wlog.effectiveScore(A.wlog.get(e.id)), upd.teacher.score50);
  assert.throws(() => A.wlog.setTeacher(e.id, { scores: { ta: 3, gr: 'x', vo: 2, co: 2 } }));
  A.wlog.setTeacher(e.id, { scores: { ta: 9, gr: -3, vo: 2, co: 2 } }); // kẹp vào 0..5
  assert.deepStrictEqual(JSON.parse(JSON.stringify(A.wlog.get(e.id).teacher.scores)), { ta: 5, gr: 0, vo: 2, co: 2 });
  A.wlog.clearTeacher(e.id);
  assert.strictEqual(A.wlog.get(e.id).teacher, null);
});
t('calibration: độ lệch tuyệt đối và thiên lệch so với giáo viên', () => {
  A.store.resetAll();
  assert.strictEqual(A.wlog.calibration().n, 0);
  const e1 = logEntry(a2t3.ex, a2t3.parts);
  const e2 = logEntry(b1t4.ex, b1t4.parts);
  A.wlog.setTeacher(e1.id, { scores: { ta: 4, gr: 4, vo: 4, co: 4 } }); // 40
  A.wlog.setTeacher(e2.id, { scores: { ta: 3, gr: 3, vo: 3, co: 3 } }); // 30
  const c = A.wlog.calibration();
  const d1 = A.wlog.get(e1.id).score50 - 40;
  const d2 = A.wlog.get(e2.id).score50 - 30;
  assert.strictEqual(c.n, 2);
  assert.ok(Math.abs(c.mae - (Math.abs(d1) + Math.abs(d2)) / 2) < 0.06, `mae ${c.mae}`);
  assert.ok(Math.abs(c.bias - (d1 + d2) / 2) < 0.06, `bias ${c.bias}`);
});
t('errorProfile: gộp lỗi nhiều bài, có nhãn tiếng Việt, kèm chủ điểm ngữ pháp', () => {
  A.store.resetAll();
  logEntry(b1t4.ex, b1t4.parts);
  logEntry(b1t4.ex, b1t4.parts);
  const prof = A.wlog.errorProfile(5);
  const lf = prof.find((r) => r.rule === 'look-forward');
  assert.ok(lf && lf.count === 2 && lf.attempts === 2 && /look forward/.test(lf.label) && lf.topic === 'tenses', JSON.stringify(prof.slice(0, 2)));
  assert.ok(prof.every((r, i) => i === 0 || prof[i - 1].count >= r.count), 'sắp giảm dần');
});
t('trend + criteriaAvg', () => {
  A.store.resetAll();
  assert.strictEqual(A.wlog.criteriaAvg(), null);
  logEntry(a2t3.ex, a2t3.parts);
  logEntry(b1t4.ex, b1t4.parts);
  assert.strictEqual(A.wlog.trend(5).length, 2);
  const avg = A.wlog.criteriaAvg(5);
  ['ta', 'gr', 'vo', 'co'].forEach((k) => assert.ok(avg[k] >= 0 && avg[k] <= 5));
});
t('giới hạn: tối đa 80 bài; chỉ 40 bài gần nhất giữ nội dung', () => {
  A.store.resetAll();
  for (let i = 0; i < 85; i++) logEntry(a2t3.ex, a2t3.parts);
  const list = A.wlog.list();
  assert.strictEqual(list.length, 80);
  assert.ok(list.slice(0, 40).every((e) => e.texts.length === 0));
  assert.ok(list.slice(40).every((e) => e.texts.length === 1));
});
t('exportMarkdown: có đề, bài làm, ước tính, phiếu chấm; exportCalibration KHÔNG chứa bài viết', () => {
  A.store.resetAll();
  const e = logEntry(b1t4.ex, b1t4.parts);
  A.wlog.setTeacher(e.id, { scores: { ta: 4, gr: 3, vo: 3, co: 3 }, comment: 'Khá' });
  const md = A.wlog.exportMarkdown(e.id);
  assert.ok(/Phiếu chấm của giáo viên/.test(md) && /\| Tiêu chí \| Điểm 0–5/.test(md) && /Dear Sir or Madam/.test(md) && /Ước tính tự động/.test(md));
  const cal = JSON.stringify(A.wlog.exportCalibration());
  assert.ok(!/Dear Sir|coffee machine|Nam Tran/.test(cal), 'dữ liệu hiệu chỉnh không được chứa bài viết');
  assert.strictEqual(JSON.parse(cal).rows.length, 1);
});
t('estimates: Writing lấy từ nhật ký (ưu tiên điểm giáo viên)', () => {
  A.store.resetAll();
  const e = logEntry(a2t3.ex, a2t3.parts);
  let est = A.scoring.estimates().writing;
  assert.strictEqual(est.score, Math.round(e.score50));
  A.wlog.setTeacher(e.id, { scores: { ta: 4, gr: 4, vo: 4, co: 4 } });
  est = A.scoring.estimates().writing;
  assert.strictEqual(est.score, 40);
});

console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
