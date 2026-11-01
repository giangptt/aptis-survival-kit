/* Bộ chấm & nhận xét Writing OFFLINE (không gọi mạng, không AI).
 *
 * Cách làm: phát hiện lỗi người học Việt hay mắc bằng luật + đo các chỉ số ngôn ngữ (độ dài, từ nối, độ đa dạng từ vựng,
 * độ phức tạp cấu trúc, giọng văn) rồi quy ra 4 tiêu chí 0–5 và điểm 0–50, kèm nhận xét tiếng Việt.
 *
 * GIỚI HẠN (luôn hiển thị cho người học): đây là ƯỚC TÍNH TỰ ĐỘNG bằng luật. Nó không hiểu nghĩa, không đánh giá được
 * ý tưởng hay lập luận, và chỉ bắt được các lỗi nằm trong danh sách luật. Điểm không thay cho giám khảo/giáo viên thật.
 * Ngưỡng và trọng số được kiểm tra với 16 bài mẫu B2 và các bài người học giả lập trong tests/analyzer.js — chưa được
 * hiệu chỉnh bằng bài đã chấm bởi giáo viên thật.
 */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const U = A.util;

  const VERSION = 1;

  /* ====================== Danh sách từ ====================== */
  const STOP = new Set('a an the and or but so if of to in on at by for with from as is are was were be been being am do does did have has had will would can could should shall may might must i you he she it we they me him her us them my your his its our their this that these those there here what which who whom whose when where why how not no yes very too also just then than about into over after before up down out off again more most some any each every all both few many much other another such only own same so can will just don now one two three four five six seven eight nine ten please thanks thank'.split(/\s+/));

  /** Từ nối/diễn ngôn mức B2 (đếm số loại khác nhau) */
  const CONNECTORS = ['however', 'although', 'even though', 'though', 'despite', 'in spite of', 'whereas', 'while', 'therefore', 'as a result', 'consequently', 'moreover', 'furthermore', 'in addition', 'besides', 'what is more', 'on top of that', 'on the other hand', 'for example', 'for instance', 'such as', 'in conclusion', 'to sum up', 'firstly', 'secondly', 'finally', 'first of all', 'to begin with', 'unfortunately', 'fortunately', 'in fact', 'actually', 'apart from', 'as well as', 'otherwise', 'unless', 'so that', 'in order to', 'due to', 'owing to', 'that is why', "that's why", 'meanwhile', 'afterwards', 'eventually', 'as soon as', 'after that', 'that said', 'having said that', 'as far as i am concerned', 'in my opinion', 'to be honest', 'personally', 'because of', 'since', 'once', 'until'];
  const BASIC_CONN = new Set(['and', 'but', 'so', 'because', 'then', 'also', 'or']);
  const CONN_RE = CONNECTORS.map((c) => ({ c, re: new RegExp('\\b' + c.replace(/ /g, '\\s+').replace(/'/g, "['’]") + '\\b', 'i') }));

  /** Cụm tự nhiên mức B2 (điểm cộng + hiện ở "điểm mạnh") */
  const NICE_PHRASES = ['i would be grateful', 'i would appreciate', 'i was wondering if', 'would you mind', 'i look forward to', "i'm afraid", 'i am afraid', 'it turned out', "i can't wait", 'i cannot wait', "i'd love to", 'i would love to', 'hopefully', 'plenty of', 'by the way', 'it is worth', "it's worth", 'in my experience', 'as soon as possible', 'i would like to', 'i am writing to', "i'm writing to", 'for your reference', 'at your earliest convenience', 'i apologise', 'i am delighted', "i'm thrilled", 'it depends on', 'to be honest', 'speak soon', 'looking forward to', 'thank you for your', 'i completely agree', 'what is more', 'on the whole', 'all in all', 'sounds great', 'would it be possible'];

  const WEAK = /\b(very|really|good|nice|bad|thing|things|stuff|a lot of|lots of|big|get|got)\b/gi;

  /** Họ cấu trúc ngữ pháp: có mặt = bằng chứng về "độ phong phú" */
  const STRUCTURES = [
    { id: 'relative', w: 0.5, name: 'mệnh đề quan hệ', re: /\b(who|whom|whose|which)\b|\bthat\s+(is|was|are|were|has|have|had|will|can|could|makes?|helps?)\b|\bwhere\s+(i|we|you|they|he|she|it|there|the|a)\b/i },
    { id: 'conditional', w: 1, name: 'câu điều kiện', re: /\bif\b[^.!?]*\b(would|will|could|had|were|can|might)\b|\bunless\b|\bwould\b[^.!?]*\bif\b|\bas long as\b/i },
    { id: 'passive', w: 1, name: 'câu bị động', re: /\b(is|are|was|were|been|being|be|get|gets|got)\s+(\w+ed|\w+en|made|done|given|taken|seen|sent|built|held|told|paid|found|left|kept|brought|bought|known|shown|written)\b/i },
    { id: 'perfect', w: 0.5, name: 'thì hoàn thành', re: /\b(have|has|had)\s+(been|\w+ed|gone|done|made|taken|seen|got|known|found|said|told|thought|written|bought|met|come|given|left|kept|lost|paid|sent|heard|felt|read|run|become|begun|eaten|driven|spoken|chosen|wanted)\b/i },
    { id: 'modal-perfect', w: 1, name: 'modal nâng cao', re: /\b(would|could|should|might|may|must|can't|cannot)\s+(have|be)\b/i },
    { id: 'contrast', w: 1, name: 'diễn đạt tương phản', re: /\b(although|though|even though|despite|in spite of|whereas|while|however|on the other hand|that said)\b/i },
    { id: 'reason', w: 0.5, name: 'diễn đạt nguyên nhân/kết quả', re: /\b(because|since|as a result|therefore|consequently|so that|due to|owing to|that is why|that's why)\b/i },
    { id: 'purpose', w: 1, name: 'mục đích (in order to…)', re: /\b(in order to|so as to|so that)\b/i },
    { id: 'comparison', w: 0.5, name: 'so sánh', re: /\b(more|less)\s+\w+\s+than\b|\b\w+er\s+than\b|\bas\s+\w+\s+as\b|\bthe\s+(most|least|best|worst|\w+est)\b|\bthe\s+\w+er\s+the\b/i },
    { id: 'reported', w: 1, name: 'câu tường thuật', re: /\b(said|told|asked|mentioned|suggested|explained|promised|admitted|denied)\s+(that|me|us|him|her|them|if|whether|to)\b/i },
    { id: 'time-clause', w: 0.5, name: 'mệnh đề thời gian', re: /\b(when|while|as soon as|after|before|until|once|by the time)\s+(i|we|you|they|he|she|it|the|my|our|there)\b/i },
    { id: 'gerund', w: 1, name: 'danh động từ/phân từ', re: /\b(looking forward to|used to|instead of|by\s+\w+ing|without\s+\w+ing|after\s+\w+ing|before\s+\w+ing|having\s+\w+(ed|en)|being\s+\w+ed)\b/i },
    { id: 'emphasis', w: 1, name: 'nhấn mạnh/đảo cấu trúc', re: /\b(not only|never have|rarely|hardly|no sooner|what i|it is\s+\w+\s+that|it was\s+\w+\s+that)\b/i },
  ];

  /* ====================== Tiện ích văn bản ====================== */
  const TOKEN_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
  const tokens = (text) => {
    const out = [];
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(text))) out.push({ w: m[0], lw: m[0].toLowerCase().replace(/’/g, "'"), i: m.index });
    return out;
  };

  /** Tách câu (bỏ dòng chào/ký tên); trả về [{text, start}] */
  const GREET_RE = /^\s*(dear|hi|hello|hey|good (morning|afternoon|evening))\b[^.!?]{0,40}[,!:]?\s*$/i;
  const CLOSE_RE = /^\s*(best wishes|kind regards|best regards|regards|yours (sincerely|faithfully|truly)|sincerely|cheers|take care|speak soon|see you( soon)?|all the best|love|many thanks|thanks|thank you|talk soon|write soon|bye)[,!.]?\s*$/i;
  /** Phân loại từng dòng: greet | close | sign (chữ ký) | body */
  function lineKinds(text) {
    const out = [];
    let offset = 0;
    let prev = 'body';
    text.split('\n').forEach((line) => {
      const start = offset;
      offset += line.length + 1;
      const t = line.trim();
      if (!t) return;
      const toks = tokens(t);
      const noEnd = !/[.!?]$/.test(t);
      let kind = 'body';
      if (GREET_RE.test(t)) kind = 'greet';
      else if (CLOSE_RE.test(t)) kind = 'close';
      else if (noEnd && toks.length <= 5 && prev === 'close') kind = 'sign'; // dòng ngay sau lời kết = chữ ký
      else if (noEnd && toks.length <= 4 && toks.length > 0 && toks.every((x) => /^[A-Z]/.test(x.w))) kind = 'sign';
      out.push({ start, end: start + line.length, line, kind });
      prev = kind;
    });
    return out;
  }
  function bodySentences(text) {
    const out = [];
    lineKinds(text).forEach(({ start, line, kind }) => {
      if (kind !== 'body') return;
      const re = /[^.!?]+(?:[.!?]+|$)/g;
      let m;
      while ((m = re.exec(line))) {
        const sn = m[0];
        if (!sn.trim()) continue;
        out.push({ text: sn.trim(), start: start + m.index + (sn.length - sn.trimStart().length) });
      }
    });
    return out;
  }

  /** Khoảng [start,end) của các dòng chào / kết thư / chữ ký — không soát chính tả ở đó (có tên riêng) */
  function nonBodyRanges(text) {
    return lineKinds(text).filter((l) => l.kind !== 'body').map((l) => [l.start, l.end]);
  }

  /** Stemmer rất gọn, đủ để so khớp dạng chia của từ vựng */
  function stem(w) {
    w = w.toLowerCase();
    if (w.length <= 3) return w;
    const rules = [[/ies$/, 'y'], [/(ss|us|is)$/, '$1'], [/sses$/, 'ss'], [/(ch|sh|x|z)es$/, '$1'], [/ying$/, 'y'], [/ied$/, 'y'], [/([^aeiou])\1(ed|ing)$/, '$1'], [/(ing|ed)$/, ''], [/s$/, ''], [/ly$/, ''], [/(er|est)$/, '']];
    for (const [re, rep] of rules) {
      if (re.test(w)) {
        const r = w.replace(re, rep);
        if (r.length >= 3) return r;
      }
    }
    return w;
  }

  /* ====================== Dữ liệu từ vựng / từ điển nhỏ ====================== */
  /** Vốn từ cơ bản (A1–A2): dùng cho bắt gõ nhầm và đo mức "từ vượt ngoài vốn cơ bản" */
  const BASIC_WORDS = 'about above across actually afternoon again against age ago agree airport all almost alone already always among and angry animal another answer anyone anything apartment apple area arm around arrive art ask asleep aunt autumn away baby back bag ball bank bathroom beach beautiful because bed bedroom beer before behind believe below beside best better between bicycle birthday black blue boat body book border boring born both bottle box boy bread break breakfast bring brother brown build burn bus busy butter buy cake call camera camp car card carry cat catch centre chair change cheap check cheese chicken child chocolate choose church cinema city class clean clear clever close clothes cloud coat coffee cold colour come cook cool corner cost cough count country course cousin cow cross cry cup customer cut dad dance dark daughter day dead dear decide delicious desk dictionary die difficult dinner dirty doctor dog dollar door down draw dream dress drink drive dry during ear early east easy eat egg eight either elephant else empty end engine enjoy enough enter evening ever every everyone exam example excited excuse exercise expensive explain eye face fall family famous far farm fast fat father feel few field fight fill film find fine finger finish fire first fish five floor flower fly follow food foot football forget fork forward four free fresh friend front fruit full fun funny future game garden gentleman girl give glass go gold good grandfather grandmother grass great green grey ground group grow guess gun hair half hand happen happy hard hat hate head hear heart heavy hello help here high hill hobby holiday home hope horse hospital hot hotel hour house hundred hungry husband ice idea important interesting island jacket job join juice jump keep key kill kind king kitchen knee knife know lady lake land language large last late laugh lazy leaf learn leave left leg lesson letter library lie life light like line lion list listen little live long look lose lot loud love low lucky lunch machine magazine make man many map market marry match matter meal mean meat meet middle milk minute miss mistake modern money month moon morning mother mountain mouse mouth move movie much museum music name narrow near neck need neighbour never new news newspaper next nice night nine noise noon north nose note nothing notice now number nurse ocean offer office often oil old once only open orange order other outside page pain paint pair paper parent park part party pass past pay pen pencil people pepper person phone photo piano pick picture piece pig pilot pink place plane plant plate play please pocket police poor popular potato pound practice present pretty price prince problem question quick quiet rabbit rain read ready real reason red remember rent repeat restaurant rice rich ride right ring river road rock room round rule run sad safe sail salad salt same sand sea season seat second see sell send sentence seven shall shape share sheep shirt shoe shop short shoulder shout show shy sick side silver sing sister sit six size skin skirt sky sleep slow small smell smile smoke snow soap sock soft soldier some son song soon sorry sound soup south space speak special speed spell spend spoon sport spring square stair stamp stand star start station stay steal step stone stop store storm story street strong student study subject sugar summer sun supper sure surprise sweet swim table tail take talk tall taste tea teach teacher team tell ten tennis tent than thank theatre thick thin thing think third thirsty thousand three through throw ticket tie tiger time tired today toe together tomorrow tonight tooth top touch tour towel town toy train travel tree trip trousers truck true try turn twelve twenty two ugly umbrella uncle under understand university until use usual vegetable village visit voice wait wake walk wall want warm wash watch water way weak wear weather wedding week weekend welcome west wet whole wide wife win wind window wine winter wish woman wonder wood word work world worry write wrong year yellow yesterday young zero zoo usually always never sometimes really quite maybe probably together important different difficult dangerous comfortable careful carefully quickly slowly suddenly finally later still yet soon happy sad tired angry worried afraid excited surprised ready sure sorry sick healthy thirsty bored lonely proud lucky nervous polite kind friendly helpful useful popular modern traditional special perfect terrible wonderful amazing awful lovely horrible silly brave quiet noisy crowded empty clean dirty heavy light dark bright strong weak rich poor fresh dry wet sweet bitter spicy salty fast slow cheap expensive early late young old new tall short fat thin cheerful email internet website online computer laptop mobile phone message text video photo music film movie concert festival party wedding birthday holiday weekend trip journey flight airport station platform ticket passport luggage suitcase hotel reservation booking tour guide map beach mountain lake river forest countryside village city capital street road bridge shop supermarket market mall restaurant cafe menu dinner lunch breakfast snack drink coffee tea juice water beer wine fruit vegetable meat fish rice noodle soup salad sandwich cake bread cheese egg milk sugar salt pepper doctor nurse hospital medicine pill headache cold fever health exercise gym swimming running walking cycling football basketball tennis volleyball badminton yoga hobby reading cooking painting gardening shopping travelling camping fishing hiking dancing singing playing watching listening speaking writing studying learning teaching working living meeting'.split(/\s+/);
  let LEX = null;
  function lexicon() {
    if (LEX) return LEX;
    const bank = A.vocabdb ? A.vocabdb.all() : [];
    const adv = new Map(); // stem → headword (B2/C1)
    const colls = []; // [cụm, headword]
    bank.forEach((w) => {
      if (!/\s/.test(w.w) && (w.lv === 'B2' || w.lv === 'C1') && w.w.length > 4) adv.set(stem(w.w), w.w);
      w.col.split(';').forEach((c) => {
        c = c.trim().toLowerCase();
        if (c.split(/\s+/).length >= 2 && c.length >= 7) colls.push([c, w.w]);
      });
    });
    // Tập từ đã biết (để bắt lỗi gõ nhầm): lấy từ phần TIẾNG ANH của toàn bộ nội dung học
    const freq = new Map();
    const add = (s) => {
      if (typeof s !== 'string') return;
      tokens(s).forEach((t) => freq.set(t.lw, (freq.get(t.lw) || 0) + 1));
    };
    const D = globalThis.AptisData || {};
    bank.forEach((w) => [w.w, w.ex, w.col].forEach(add));
    (D.grammar || []).forEach((t) => {
      t.explain.forEach((b) => b.ex.forEach((p) => add(p[0])));
      [...t.b1, ...t.b2].forEach((q) => {
        add(q.q);
        q.o.forEach(add);
      });
    });
    const R = D.reading || {};
    (R.sentence || []).forEach((s) => s.items.forEach((q) => { add(q.q); q.o.forEach(add); }));
    (R.ordering || []).forEach((s) => { add(s.first); s.order.forEach(add); });
    (R.shortMatch || []).forEach((s) => { add(s.intro); s.people.forEach((p) => add(p.t)); s.qs.forEach((q) => add(q.q)); });
    (R.longMatch || []).forEach((s) => { s.paras.forEach((p) => add(p.t)); s.headings.forEach(add); });
    (D.listening || []).forEach((l) => { l.script.forEach((x) => add(x.t)); l.qs.forEach((q) => { add(q.q); q.o.forEach(add); }); });
    (D.writing || []).forEach((w) => { add(w.context); w.parts.forEach((p) => { add(p.prompt); add(p.sample); }); w.phrases.forEach(add); });
    const S = D.speaking || {};
    ['p1', 'p4'].forEach((k) => (S[k] || []).forEach((x) => { x.qs.forEach(add); x.sample.forEach(add); }));
    ['p2', 'p3', 'p5'].forEach((k) => (S[k] || []).forEach((x) => { add(x.scene); add(x.sceneA); add(x.sceneB); add(x.sample); (x.qs || []).forEach(add); (x.vocab || []).forEach(add); }));
    ['A', 'B'].forEach((f) => {
      const F = (D.diagnostic || {})[f];
      if (!F) return;
      [...F.vocab, ...F.grammar].forEach((q) => { add(q.q); q.o.forEach(add); });
      F.reading.forEach((p) => { add(p.passage); p.qs.forEach((q) => { add(q.q); q.o.forEach(add); }); });
      F.listening.forEach((p) => { p.script.forEach((x) => add(x.t)); p.qs.forEach((q) => { add(q.q); q.o.forEach(add); }); });
    });
    BASIC_WORDS.forEach((w) => freq.set(w, (freq.get(w) || 0) + 2));
    // thêm cả gốc từ của mọi dạng đã biết (số ít của số nhiều, nguyên thể của -ing/-ed…)
    [...freq.keys()].forEach((w) => {
      const f = freq.get(w);
      [stem(w), w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'), w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/ly$/, ''), w.replace(/ies$/, 'y'), w.replace(/ied$/, 'y')].forEach((b) => {
        if (b.length >= 3 && !freq.has(b)) freq.set(b, 1);
      });
    });
    const basic = new Set(BASIC_WORDS.map(stem));
    STOP.forEach((w) => basic.add(stem(w)));
    LEX = { adv, colls, freq, basic };
    return LEX;
  }
  const knownWord = (lw) => {
    const f = lexicon().freq;
    if (f.has(lw)) return true;
    const cands = [lw.replace(/'s$/, ''), lw.replace(/s$/, ''), lw.replace(/es$/, ''), lw.replace(/ed$/, ''), lw.replace(/ed$/, 'e'), lw.replace(/ing$/, ''), lw.replace(/ing$/, 'e'), lw.replace(/(\w)\1ing$/, '$1'), lw.replace(/(\w)\1ed$/, '$1'), lw.replace(/ly$/, ''), lw.replace(/ies$/, 'y'), lw.replace(/ied$/, 'y'), lw.replace(/er$/, ''), lw.replace(/est$/, ''), lw.replace(/ment$/, ''), lw.replace(/ness$/, '')];
    return cands.some((c) => c.length >= 3 && f.has(c));
  };

  /** Biến thể cách 1 ký tự theo các kiểu gõ nhầm thật: đảo hai chữ, thiếu chữ, thừa chữ, nhầm nguyên âm.
      (Không cho thay phụ âm bất kỳ: dễ biến từ đúng hiếm như “curl” thành “cure”.) */
  function edits1(w) {
    const L = 'abcdefghijklmnopqrstuvwxyz';
    const V = 'aeiou';
    const out = new Set();
    for (let i = 0; i <= w.length; i++) {
      const a = w.slice(0, i);
      const b = w.slice(i);
      if (b) out.add(a + b.slice(1)); // thừa một chữ → bỏ đi
      if (b.length > 1) out.add(a + b[1] + b[0] + b.slice(2)); // đảo chữ
      for (const c of L) out.add(a + c + b); // thiếu một chữ → chèn
      if (b && V.includes(b[0])) for (const c of V) out.add(a + c + b.slice(1)); // nhầm nguyên âm
    }
    out.delete(w);
    return out;
  }
  const INFL = ['s', 'es', 'ed', 'd', 'ing', 'er', 'est', 'ly', 'y', 'ies'];
  function spellSuggest(lw) {
    const f = lexicon().freq;
    let best = null;
    let bestF = 1; // gợi ý phải xuất hiện ≥ 2 lần trong kho nội dung
    edits1(lw).forEach((c) => {
      const n = f.get(c) || 0;
      if (n > bestF) {
        // bỏ qua nếu chỉ khác nhau do hậu tố biến cách (grandmother ↔ grandmothers)
        if (INFL.some((sfx) => c === lw + sfx || lw === c + sfx)) return;
        best = c;
        bestF = n;
      }
    });
    return best;
  }

  /** Lỗi chính tả hay gặp: sai → đúng */
  const MISSPELL = Object.assign(Object.create(null), { recieve: 'receive', recieved: 'received', definately: 'definitely', definatly: 'definitely', seperate: 'separate', occured: 'occurred', occuring: 'occurring', untill: 'until', wich: 'which', becuase: 'because', becouse: 'because', beacuse: 'because', thier: 'their', goverment: 'government', enviroment: 'environment', enviromental: 'environmental', beleive: 'believe', freind: 'friend', freinds: 'friends', wierd: 'weird', tommorow: 'tomorrow', tomorow: 'tomorrow', tonite: 'tonight', comming: 'coming', geting: 'getting', runing: 'running', stoping: 'stopping', swiming: 'swimming', alot: 'a lot', allways: 'always', alwys: 'always', adress: 'address', accomodation: 'accommodation', acommodation: 'accommodation', neccessary: 'necessary', necesary: 'necessary', sucessful: 'successful', succesful: 'successful', sucess: 'success', diffrent: 'different', diferent: 'different', intresting: 'interesting', interresting: 'interesting', comfortible: 'comfortable', comftable: 'comfortable', beutiful: 'beautiful', beautifull: 'beautiful', buisness: 'business', bussiness: 'business', calender: 'calendar', collegue: 'colleague', colleage: 'colleague', commited: 'committed', completly: 'completely', dissapoint: 'disappoint', dissapointed: 'disappointed', disapointed: 'disappointed', embarass: 'embarrass', embarassed: 'embarrassed', exellent: 'excellent', excelent: 'excellent', experiance: 'experience', familar: 'familiar', finaly: 'finally', foriegn: 'foreign', grammer: 'grammar', gratefull: 'grateful', happend: 'happened', hapenned: 'happened', immediatly: 'immediately', independant: 'independent', knowlege: 'knowledge', liason: 'liaison', lenght: 'length', libary: 'library', maintainance: 'maintenance', mispell: 'misspell', noticable: 'noticeable', occassion: 'occasion', occassionally: 'occasionally', parliment: 'parliament', persue: 'pursue', posible: 'possible', possable: 'possible', prefered: 'preferred', priviledge: 'privilege', probly: 'probably', probaly: 'probably', publically: 'publicly', realy: 'really', reccomend: 'recommend', recomend: 'recommend', refered: 'referred', relevent: 'relevant', religous: 'religious', remeber: 'remember', responsability: 'responsibility', resturant: 'restaurant', restaraunt: 'restaurant', rythm: 'rhythm', shedule: 'schedule', sincerly: 'sincerely', sincerely_: 'sincerely', speach: 'speech', strenght: 'strength', suprise: 'surprise', suprised: 'surprised', surprize: 'surprise', thankyou: 'thank you', tounge: 'tongue', truely: 'truly', unfortunatly: 'unfortunately', unfortunatley: 'unfortunately', usefull: 'useful', vaccum: 'vacuum', vegatable: 'vegetable', visable: 'visible', wether: 'whether', whitch: 'which', writting: 'writing', writen: 'written', yeild: 'yield', youre: "you're", doesnt: "doesn't", dont: "don't", cant: "can't", wont: "won't", didnt: "didn't", isnt: "isn't", wasnt: "wasn't", havent: "haven't", im: "I'm", ive: "I've", gonna_: 'going to', infomation: 'information', informations: 'information', improvment: 'improvement', managment: 'management', developement: 'development', enviroments: 'environments', transportion: 'transportation', convinient: 'convenient', conveniant: 'convenient', confortable: 'comfortable', langauge: 'language', laguage: 'language', pepole: 'people', peaple: 'people', becomming: 'becoming', begining: 'beginning', cheque_: 'cheque', diary_: 'diary', exiting: 'exciting', excitting: 'exciting', fourty: 'forty', gaurd: 'guard', gorgous: 'gorgeous', hieght: 'height', humourous: 'humorous', jewelery: 'jewellery', mannager: 'manager', moust: 'most', nessesary: 'necessary', ocasion: 'occasion', orginal: 'original', paitent: 'patient', plesant: 'pleasant', plesure: 'pleasure', profesional: 'professional', pronounciation: 'pronunciation', questionaire: 'questionnaire', recipt: 'receipt', refering: 'referring', relatives_: 'relatives', salery: 'salary', sentance: 'sentence', skillfull: 'skilful', studing: 'studying', sucessfully: 'successfully', temprature: 'temperature', tendancy: 'tendency', tradegy: 'tragedy', vacation_: 'holiday', weeked: 'weekend', wensday: 'Wednesday', wendsday: 'Wednesday', writter: 'writer' });
  Object.keys(MISSPELL).forEach((k) => k.endsWith('_') && delete MISSPELL[k]);

  /* ====================== Bộ luật phát hiện lỗi ====================== */
  // sev: 1 nhẹ · 2 vừa · 3 nặng. cat: gram | vocab | spell | punct | register
  const MODALS = 'can|could|will|would|shall|should|may|might|must|do|does|did|don\'t|doesn\'t|didn\'t|cannot|let|lets|let\'s';
  const IRREG_PAST = 'went|saw|came|took|made|got|ate|bought|said|told|gave|knew|thought|found|felt|left|met|ran|wrote|spoke|drove|flew|paid|sent|brought|began|had|was|were|did|stood|heard|kept|lost|won|taught|caught|sold|slept|spent|built|read';
  const VERB_BASE = 'go|have|do|want|like|need|live|work|make|take|come|know|think|love|play|study|get|say|see|use|try|help|start|enjoy|prefer|hope|feel|leave|give|find|tell|keep|begin|seem|talk|walk|travel|speak|write|run|eat|drink|buy|pay|meet|send|show|ask|call|move|turn|visit|stay|wait|bring|hold|learn|change|follow|stop|look|remember|wish|miss|offer|expect|include|continue|decide|require|watch|spend|cook|sleep|wear|sing|swim|drive|fly|teach|win|lose|open|close|answer|listen|arrive|happen|agree|believe|belong|depend|improve|invite|join|mean|suggest|understand|worry|apply|cost_';
  const PREV_SKIP_RE = new RegExp('^(' + MODALS + '|to|that|if|than|whether|suggest|insist|recommend|demand|request|wish|make|makes|made|help|helps|watch|see|saw|hear|heard)$', 'i');

  function prevWord(text, idx, n = 1) {
    const before = text.slice(0, idx);
    const m = before.match(/([A-Za-z']+)\W*$/);
    if (n === 1) return m ? m[1].toLowerCase().replace(/’/g, "'") : '';
    const ws = before.match(/[A-Za-z']+/g) || [];
    return ws.slice(-n).map((s) => s.toLowerCase());
  }
  const atSentenceStart = (text, idx) => /(^|[.!?]\s+|\n\s*)$/.test(text.slice(0, idx));

  const R = (id, cat, sev, re, msg, fix, extra = {}) => Object.assign({ id, cat, sev, re, msg, fix }, extra);

  const RULES = [
    /* ---- Chia động từ / hoà hợp chủ vị ---- */
    R('sv-3rd', 'gram', 2, new RegExp('\\b(he|she)\\s+(' + VERB_BASE.replace('|cost_', '') + ')\\b', 'gi'), (m) => `Chủ ngữ “${m[1]}” (ngôi thứ ba số ít) cần động từ thêm -s/-es: “${m[1]} ${thirdPerson(m[2])}”.`, (m) => `${m[1]} ${thirdPerson(m[2])}`, {
      topic: 'tenses',
      test: (m, t) => !PREV_SKIP_RE.test(prevWord(t, m.index)) && !/\b(suggest|insist|recommend|demand|request|wish|if)\b[^.!?]*$/i.test(t.slice(Math.max(0, m.index - 40), m.index)),
    }),
    R('sv-it', 'gram', 2, new RegExp('\\b(it)\\s+(' + VERB_BASE.replace('|cost_', '').replace('|have|', '|have|') + ')\\b', 'gi'), (m) => `“it” cần động từ thêm -s/-es: “it ${thirdPerson(m[2])}”.`, (m) => `it ${thirdPerson(m[2])}`, {
      topic: 'tenses',
      test: (m, t) => {
        const p = prevWord(t, m.index);
        return atSentenceStart(t, m.index) || /^(if|when|because|that|and|but|so|as|since|while|though|although|before|after|until|unless|whether|which|where|then)$/.test(p);
      },
    }),
    R('sv-neg', 'gram', 2, /\b(he|she|it)\s+(don't|do not)\b/gi, (m) => `Với “${m[1]}” dùng “doesn't”, không dùng “${m[2]}”.`, (m) => `${m[1]} doesn't`, { topic: 'tenses' }),
    R('sv-be', 'gram', 3, /\b(I|you|we|they)\s+(is|has|does)\b|\b(he|she)\s+(are|have)\b/gi, (m) => `Sai hoà hợp chủ ngữ – động từ: “${m[0]}”.`, () => '', {
      topic: 'tenses',
      test: (m, t) => !PREV_SKIP_RE.test(prevWord(t, m.index)),
    }),
    R('am-agree', 'gram', 3, /\b(am|is|are)\s+agree\b/gi, () => 'Sau “agree” không dùng “am/is/are”: nói “I agree”.', () => 'agree', { topic: 'tenses' }),
    R('past-marker', 'gram', 3, /\b(?:I|we|they|he|she)\s+(go|have|buy|meet|see|visit|do|make|get|eat|take|come|work|study|am|is|are|watch|play|stay|spend|call|send|write|find|give|decide|arrive|invite)\b/gi, (m) => `Câu có mốc thời gian quá khứ nên động từ “${m[1]}” phải ở thì quá khứ (ví dụ ${pastOf(m[1])}).`, (m) => pastOf(m[1]), {
      topic: 'tenses',
      sentence: true,
      test: (m, sentence) => {
        const mk = PAST_MARK.exec(sentence);
        if (!mk) return false;
        const a = Math.min(mk.index, m.index);
        const b = Math.max(mk.index + mk[0].length, m.index + m[0].length);
        const between = sentence.slice(a, b);
        if (/\b(which|that|who|whom|whose|because|when|if|while|although|though|since|as|after|before|until|unless|where|whenever|used to)\b/i.test(between.replace(mk[0], ' '))) return false; // khác mệnh đề
        if (/\b(will|would|going to|plan|planning|hope|next|tomorrow|usually|always|often|every|sometimes|can|could|should|might|may|didn't|did|don't|do not|never|want to|like to|decided to|to)\b/i.test(sentence.slice(0, m.index))) return false;
        if (/^(am|is|are)$/i.test(m[1]) && /^\s*(\w+ing|going|able|supposed|used)\b/i.test(sentence.slice(m.index + m[0].length))) return false; // hiện tại tiếp diễn
        if (/^have$/i.test(m[1]) && /^\s+(been|gone|done|made|taken|seen|got|known|found|said|told|thought|written|bought|met|come|given|left|\w+ed|\w+en)\b/i.test(sentence.slice(m.index + m[0].length))) return false; // thì hoàn thành → luật perfect-past
        return true;
      },
    }),
        R('perfect-past', 'gram', 3, /\b(?:I|we|they)\s+(have|has)\s+(?:been|\w+ed|gone|done|made|taken|seen|got|known|found|said|told|thought|written|bought|met|come|given|left)\b/gi, () => 'Thì hiện tại hoàn thành không đi với mốc thời gian quá khứ xác định (yesterday, last week, … ago). Dùng quá khứ đơn.', () => '', {
      topic: 'tenses',
      sentence: true,
      test: (m, s) => PAST_MARK.test(s),
    }),
    R('since-for', 'gram', 2, /\bsince\s+(?:\d+\s+(?:years?|months?|weeks?|days?|hours?)|a\s+(?:year|month|week|long time)|ages)\b/gi, () => 'Với khoảng thời gian dùng “for”, với mốc thời điểm dùng “since”.', (m) => m[0].replace(/^since/i, 'for'), { topic: 'tenses' }),
    R('for-since', 'gram', 2, /\bfor\s+(?:(?:19|20)\d{2})\b/gi, () => 'Với mốc thời điểm (năm…) dùng “since”.', (m) => m[0].replace(/^for/i, 'since'), { topic: 'tenses' }),
    R('didnt-past', 'gram', 3, new RegExp("\\b(didn't|did not|don't|doesn't|do not|does not)\\s+(" + IRREG_PAST + '|\\w{3,}ed)\\b', 'gi'), (m) => `Sau “${m[1]}” dùng động từ nguyên thể, không dùng “${m[2]}”.`, () => '', {
      topic: 'tenses',
      test: (m) => !/^(need|feed|speed|proceed|succeed|exceed|bleed|breed|seed|weed|heed|indeed|embed|read|hundred)$/i.test(m[2]),
    }),
    R('have-base', 'gram', 3, /\b(have|has|had|haven't|hasn't|hadn't|was|were|been)\s+(go|do|see|take|make|come|get|give|write|know|eat|buy|meet|find|tell|think|say|speak|drive|fly|choose|begin|swim|sing|forget)\b/gi, (m) => `Sau “${m[1]}” cần quá khứ phân từ (V3) hoặc V-ing, không dùng “${m[2]}”.`, () => '', { topic: 'tenses' }),
    R('modal-to', 'gram', 3, /\b(can|could|will|would|shall|should|may|might|must)\s+to\s+\w+/gi, (m) => `Sau động từ khuyết thiếu “${m[1]}” không dùng “to”.`, (m) => m[0].replace(/\s+to\b/i, ''), { topic: 'modals' }),
    R('modal-form', 'gram', 3, /\b(can|could|will|would|shall|should|may|might|must)\s+(goes|has|does|makes|takes|gives|comes|gets|says|needs|wants|likes|helps|works|went|saw|came|took|made|got|bought|said|told|gave|knew|thought|found|felt|left|met|ran|wrote|spoke|paid|sent|brought|going|doing|having|making|taking|coming|getting)\b/gi, (m) => `Sau “${m[1]}” dùng động từ nguyên thể không “to”, không dùng “${m[2]}”.`, () => '', { topic: 'modals' }),
    R('there-is-plural', 'gram', 2, /\bthere\s+is\s+(many|several|two|three|four|five|few|a\s+few|a\s+lot\s+of\s+\w+s|lots\s+of\s+\w+s|some\s+\w+s)\b/gi, () => 'Danh từ số nhiều đi với “there are”, không phải “there is”.', (m) => m[0].replace(/is/i, 'are'), { topic: 'tenses' }),
    R('verb-ing-after', 'gram', 2, /\b(enjoy|enjoyed|enjoys|avoid|avoided|finish|finished|suggest|suggested|mind|keep|kept|practise|practice|practised|consider|considered|miss|missed)\s+to\s+(go|do|see|meet|work|play|watch|read|visit|learn|travel|talk|speak|be|have|get|make|take|come)\b/gi, (m) => `Sau “${m[1]}” dùng V-ing, không dùng “to + V”.`, () => '', { topic: 'tenses' }),
    R('to-after', 'gram', 2, /\b(decide|decided|want|wanted|hope|hoped|plan|planned|agree|agreed|promise|promised|manage|managed|refuse|refused|learn|learned)\s+(going|doing|seeing|meeting|working|playing|visiting|learning|travelling|traveling|being|having|talking|speaking|coming|getting|making|taking)\b/gi, (m) => `Sau “${m[1]}” dùng “to + V”, không dùng V-ing.`, () => '', { topic: 'tenses' }),
    R('look-forward', 'gram', 2, /\blook(?:ing|ed|s)?\s+forward\s+to\s+(meet|see|hear|work|visit|have|get|go|be|speak|receive|discuss|read|talk|come)\b/gi, () => 'Sau “look forward to” dùng V-ing: “look forward to hearing/meeting…”.', (m) => m[0].replace(/to\s+(\w+)$/i, (x, v) => 'to ' + ing(v)), { topic: 'tenses' }),
    R('because-of-clause', 'gram', 2, /\bbecause\s+of\s+(I|he|she|we|they|it|there|you)\s+(am|is|are|was|were|have|has|had|will|can|do|did)\b/gi, () => '“because of” đi với danh từ/cụm danh từ; trước một mệnh đề (chủ ngữ + động từ) dùng “because”.', (m) => m[0].replace(/because of/i, 'because'), { topic: 'prepositions' }),
    R('although-but', 'gram', 2, /\b(although|though|even though)\b[^.!?]*,?\s+but\b/gi, () => 'Không dùng “although/though” cùng “but” trong một câu: bỏ một trong hai từ.', () => '', { topic: 'tenses' }),
    R('double-comparative', 'gram', 2, /\b(more\s+(?:better|cheaper|easier|bigger|faster|worse|harder|older|younger|taller|longer|bigger|smaller|nicer)|most\s+(?:best|biggest|worst|easiest))\b/gi, () => 'Không dùng “more/most” cùng dạng so sánh -er/-est (so sánh kép).', (m) => m[0].replace(/^(more|most)\s+/i, ''), { topic: 'tenses' }),
    R('want-that', 'gram', 2, /\b(want|wanted|would\s+like|expect|expected)\s+that\s+(you|he|she|they|we|I)\b/gi, () => 'Sau “want/would like/expect” dùng “someone to do”, không dùng “that + mệnh đề”.', () => '', { topic: 'reported' }),
    R('i-very-like', 'gram', 2, /\bI\s+very\s+(like|love|enjoy|want|appreciate)\b/gi, (m) => `Trạng từ “very” không đứng trước động từ: nói “I really ${m[1]}” hoặc “I ${m[1]} … very much”.`, (m) => `I really ${m[1]}`, { topic: 'tenses' }),
    R('adv-be', 'gram', 1, /\bI\s+(always|never|often|usually|sometimes)\s+am\b/gi, (m) => `Trạng từ tần suất đứng sau “be”: “I am ${m[1]}”.`, (m) => `I am ${m[1]}`, { topic: 'tenses' }),
    R('years-old', 'gram', 2, /\bI\s+have\s+\d+\s+years?\s+old\b/gi, () => 'Nói tuổi dùng “I am … years old”, không dùng “have”.', (m) => m[0].replace(/have/i, 'am'), { topic: 'tenses' }),
    R('a-an', 'gram', 1, /\ba\s+([aeiou][a-z]*)\b/gi, (m) => `Trước nguyên âm dùng “an”: “an ${m[1]}”.`, (m) => `an ${m[1]}`, { topic: 'articles', test: (m) => m[0][0] === 'a' && !/^(uni(?![mn])|us[eu]|uti|eu|ewe|one|once|unanim|ubiq)/i.test(m[1]) }),
    R('an-a', 'gram', 1, /\ban\s+([bcdfgjklmnpqrstvwxyz][a-z]*)\b/g, (m) => `Trước phụ âm dùng “a”: “a ${m[1]}”.`, (m) => `a ${m[1]}`, { topic: 'articles', test: (m) => !/^(hour|honest|honou?r|heir)/i.test(m[1]) }),
    R('a-hour', 'gram', 1, /\ba\s+(hour|honest\w*|honou?r\w*|heir\w*)\b/gi, (m) => `“${m[1]}” bắt đầu bằng âm nguyên âm: dùng “an ${m[1]}”.`, (m) => `an ${m[1]}`, { topic: 'articles' }),
    R('a-plural', 'gram', 2, /\ba\s+(friends|things|people|books|students|colleagues|problems|questions|days|years|minutes|hours|children|women|men|messages|emails|phones|cities|countries|reasons|ideas|jobs|tickets|plans|photos|pictures|holidays|weeks|months)\b/gi, (m) => `“a” chỉ đi với danh từ số ít, không dùng với “${m[1]}”.`, () => '', { topic: 'articles' }),
    R('wrong-noun-form', 'vocab', 2, /\b(informations|advices|furnitures|equipments|knowledges|homeworks|feedbacks|luggages|peoples|childs|mans|womans|foots|tooths|sheeps|stuffs|traffics|weathers|moneys|accommodations|vocabularys)\b/gi, (m) => `“${m[1]}” không đúng dạng: ${nounFix(m[1])}.`, (m) => nounFix(m[1], true), { topic: 'articles' }),
    R('much-many', 'gram', 2, /\bmuch\s+(people|friends|books|students|things|colleagues|questions|cars|problems|times|days|hours|places|countries)\b/gi, (m) => `“${m[1]}” là danh từ đếm được: dùng “many ${m[1]}”.`, (m) => m[0].replace(/much/i, 'many'), { topic: 'articles' }),
    R('many-much', 'gram', 2, /\bmany\s+(information|advice|time|money|traffic|homework|work|water|furniture|luggage|equipment|weather|news|knowledge)\b/gi, (m) => `“${m[1]}” là danh từ không đếm được: dùng “much ${m[1]}”.`, (m) => m[0].replace(/many/i, 'much'), { topic: 'articles' }),
    R('missing-to', 'gram', 2, /\b(want|wanted|wants|need|needed|needs|hope|hoped|hopes|plan|planned|try|tried|love|loved|decide|decided|would\s+like|['’]d\s+like)\s+(read|meet|go|learn|speak|see|visit|buy|study|watch|eat|do|make|take|come|get|be|improve|practise|practice|join|talk|travel|know|find|give|write|stay|live|become|swim|sing)\b/gi, (m) => `Thiếu “to”: sau “${m[1]}” dùng “to + động từ” (${m[1]} to ${m[2]}).`, (m) => `${m[1]} to ${m[2]}`, { topic: 'tenses' }),
    R('somebody-sv', 'gram', 2, /\b(everybody|everyone|nobody|somebody|someone|anybody|anyone)\s+(like|want|have|go|do|know|think|need|say|make|take|come|get|love|work|answer|speak|read|help|enjoy|understand|hear|see|are|were)\b/gi, (m) => `“${m[1]}” đi với động từ số ít: “${m[1]} ${/^(are|were)$/i.test(m[2]) ? (m[2] === 'are' ? 'is' : 'was') : thirdPerson(m[2])}”.`, (m) => `${m[1]} ${/^(are|were)$/i.test(m[2]) ? (m[2] === 'are' ? 'is' : 'was') : thirdPerson(m[2])}`, { topic: 'tenses', test: (m, t) => !PREV_SKIP_RE.test(prevWord(t, m.index)) && !(/^like$/i.test(m[2]) && /^(somebody|someone|anybody|anyone)$/i.test(m[1])) }),
    R('plural-sv', 'gram', 2, /\b(people|friends|parents|colleagues|children|students|customers)\s+(is|was|has|does)\b/gi, (m) => `“${m[1]}” là số nhiều: dùng “${m[2] === 'is' ? 'are' : m[2] === 'was' ? 'were' : m[2] === 'has' ? 'have' : 'do'}”.`, (m) => `${m[1]} ${m[2] === 'is' ? 'are' : m[2] === 'was' ? 'were' : m[2] === 'has' ? 'have' : 'do'}`, { topic: 'tenses' }),
    R('number-singular', 'gram', 2, /\b(two|three|four|five|six|seven|eight|nine|ten|twenty|several|many|few|[2-9]|\d{2,})\s+(year|month|week|day|hour|minute|book|friend|thing|person|student|colleague|problem|question|city|country|reason|idea|job|ticket|plan|photo|picture|holiday|meeting|email|message|call)\b(?!\s*(?:-|walk|drive|ride|break|delay|flight|trip|call|journey|session|test|talk|course|stay|wait|rest|nap|away|old|long|meeting|lesson|class|workshop|interview))/gi, (m) => `Sau “${m[1]}” danh từ phải ở số nhiều: “${m[1]} ${m[2]}s”.`, (m) => `${m[1]} ${m[2]}s`, { topic: 'articles' }),
    R('missing-be', 'gram', 3, /\b(I|you|we|they|he|she|it)\s+(?:very\s+|so\s+|too\s+|really\s+)?(happy|angry|sad|tired|hungry|busy|late|broken|interested|excited|worried|sorry|afraid|disappointed|upset|nervous|sick)\b/gi, (m) => `Thiếu động từ “be”: “${m[1]} ${/^I$/.test(m[1]) ? 'am' : /^(you|we|they)$/i.test(m[1]) ? 'are' : 'is'} ${m[2]}”.`, (m) => `${m[1]} ${/^I$/.test(m[1]) ? 'am' : /^(you|we|they)$/i.test(m[1]) ? 'are' : 'is'} ${m[2]}`, { topic: 'tenses', test: (m, t) => !/^(make|makes|made|keep|keeps|kept|find|finds|found|get|gets|got|consider|call|leave|left|let|want|wanted|like|see|saw|think|thought|help|and)$/i.test(prevWord(t, m.index)) || /^(and)$/i.test(prevWord(t, m.index)) }),
    R('missing-article-work', 'gram', 2, /\b(work|works|worked|working)\s+(in|for|at)\s+(company|bank|office|factory|shop|restaurant)\b/gi, (m) => `Thiếu mạo từ: “${m[1]} ${m[2]} a/the ${m[3]}”.`, (m) => `${m[1]} ${m[2]} a ${m[3]}`, { topic: 'articles' }),
    R('missing-article', 'gram', 2, /\b(buy|buys|bought|have|has|had|need|needs|needed|want|wants|wanted|take|took|saw|see|got|get|lost|found|find|bring|brought)\s+((?:very\s+)?(?:new\s+|old\s+|big\s+|small\s+|good\s+|nice\s+|beautiful\s+|expensive\s+|cheap\s+)?)(laptop|phone|car|computer|bicycle|ticket|house|flat|apartment|job|problem|idea|question|machine|camera|dictionary|meeting|room|key|bag|appointment|reservation|table|suggestion|answer|reply|refund|replacement)\b/gi, (m) => `Danh từ đếm được số ít cần mạo từ hoặc từ hạn định: “${m[1]} a ${m[2]}${m[3]}”.`, (m) => `${m[1]} a ${m[2]}${m[3]}`, { topic: 'articles' }),
    R('comparative-form', 'gram', 2, /\bmore\s+(happy|easy|busy|funny|lucky|angry|heavy|pretty|early|noisy|dirty|lazy|tasty|silly|ugly|sunny|windy|cloudy|rainy|hungry|thirsty|sleepy|tidy|crazy|tiny|nasty|shiny)\b/gi, (m) => `Tính từ ngắn kết thúc -y tạo so sánh hơn bằng -ier: “${m[1].replace(/y$/, 'ier')}”.`, (m) => m[1].replace(/y$/, 'ier'), { topic: 'tenses' }),
    /* ---- Giới từ / kết hợp từ ---- */
    R('extra-prep', 'gram', 2, /\b(discuss(?:ed|es|ing)?|mention(?:ed|s|ing)?|emphasi[sz]e(?:d|s)?)\s+(about|on)\b/gi, (m) => `Động từ “${m[1]}” đi thẳng với tân ngữ, không thêm “${m[2]}”.`, (m) => m[1], { topic: 'prepositions' }),
    R('explain-me', 'gram', 2, /\b(explain|suggest|describe|mention|reply)\s+(me|him|her|us|them)\b/gi, (m) => `Sau “${m[1]}” cần giới từ “to”: “${m[1]} to ${m[2]}” (hoặc đổi động từ, ví dụ “tell ${m[2]}”).`, (m) => `${m[1]} to ${m[2]}`, { topic: 'prepositions' }),
    R('listen-music', 'gram', 2, /\blisten(?:ed|s|ing)?\s+(music|radio|podcasts?|news|songs?|him|her|me|them|us)\b/gi, (m) => `Sau “listen” cần “to”: “listen to ${m[1]}”.`, (m) => m[0].replace(/listen(\w*)\s+/i, 'listen$1 to '), { topic: 'prepositions' }),
    R('wrong-prep', 'gram', 2, /\b(depend(?:s|ed|ing)?\s+of|interested\s+(?:on|at|for)|different\s+(?:with|of)|arriv(?:e|ed|es|ing)\s+to|angry\s+on|married\s+with|afraid\s+from|good\s+in\s+(?:english|math|maths|cooking|sports?)|enter(?:ed)?\s+to\s+the|reach(?:ed)?\s+to\b|discuss\s+on|explain\s+about)\b/gi, (m) => `Giới từ đi kèm chưa đúng: “${m[1]}”. ${prepFix(m[1])}`, () => '', { topic: 'prepositions' }),
    R('other-hand', 'gram', 1, /\b(in|at)\s+the\s+other\s+hand\b/gi, () => 'Cụm cố định là “on the other hand”.', () => 'on the other hand', { topic: 'prepositions' }),
    R('according-me', 'vocab', 1, /\baccording\s+to\s+me\b/gi, () => 'Người bản ngữ nói “in my opinion” thay vì “according to me”.', () => 'in my opinion', {}),
    R('collocation-make-do', 'vocab', 2, /\b(make|made|making)\s+(?:a\s+|my\s+|the\s+)?(photos?|pictures?|homework|exercises?)\b|\b(do|did|doing)\s+(?:a\s+|an\s+)?(mistakes?|decisions?|suggestions?|photo)\b/gi, (m) => `Kết hợp từ chưa tự nhiên: “${m[0]}” (dùng take a photo / do homework / make a mistake / make a decision).`, () => '', {}),
    R('say-borrow-learn', 'vocab', 2, /\b(say\s+me|borrow\s+(?:me|him|her|us|them)|learn\s+(?:me|him|her|us|them)|open\s+(?:the\s+)?(?:light|lights|tv)|close\s+(?:the\s+)?(?:light|lights|tv))\b/gi, (m) => `Dùng từ chưa đúng: “${m[1]}” (tell me / lend me / teach me / turn on-off the light).`, () => '', {}),
    R('thanks-you', 'vocab', 1, /\bthanks\s+you\b|\bthank\s+you\s+very\s+much\s+for\s+to\b/gi, () => 'Nói “thank you” hoặc “thanks”, không nói “thanks you”.', () => 'thank you', {}),
    R('sign-off', 'vocab', 1, /\b(best\s+regard|kind\s+regard|yours\s+(?:faithful|sincere)|look\s+forwards\s+to)\b/gi, (m) => `Lỗi cụm cố định: “${m[1]}” (best regards / kind regards / yours faithfully / sincerely / look forward to).`, () => '', {}),
    /* ---- Dấu câu & viết hoa ---- */
    R('lower-i', 'punct', 1, /(^|[^A-Za-z.'’])(i)(?=[\s,'’]|$)/g, () => 'Đại từ “I” luôn viết hoa.', () => 'I', { group: 2 }),
    R('lower-start', 'punct', 1, /(?:^|[.!?]\s+)([a-z][a-z']*)/g, (m) => `Đầu câu phải viết hoa: “${m[1]}”.`, (m) => cap(m[1]), { group: 1, test: (m, t) => !/^(e\.g|i\.e|etc|vs|a\.m|p\.m)/i.test(t.slice(m.index + m[0].length - m[1].length, m.index + m[0].length + 4)) && !/\b(\d|[a-z]\.)$/i.test(t.slice(Math.max(0, m.index - 3), m.index + 1)) }),
    R('space-before-punct', 'punct', 1, /\w\s+[,.!?;:](?=\s|$)/g, () => 'Không để khoảng trắng trước dấu câu.', (m) => m[0].replace(/\s+/, ''), {}),
    R('no-space-after', 'punct', 1, /[,;:](?=[A-Za-z])|[.!?](?=[A-Z][a-z])/g, () => 'Thêm một khoảng trắng sau dấu câu.', (m) => m[0] + ' ', { test: (m, t) => !/\d[,.]\d/.test(t.slice(Math.max(0, m.index - 1), m.index + 2)) && !/\.[a-z]{2,4}\b|www\.|@/.test(t.slice(Math.max(0, m.index - 8), m.index + 8)) }),
    R('repeat-word', 'punct', 1, /\b(\w+)\s+\1\b/gi, (m) => `Lặp từ: “${m[0]}”.`, (m) => m[1], { test: (m) => !/^(had|that|is|very|so|bye|no|ha|well)$/i.test(m[1]) && !/^\d+$/.test(m[1]) }),
    R('however-comma', 'punct', 1, /(?:^|[.!?]\s+)(However|Moreover|Furthermore|Therefore|Consequently|Additionally)\s+(?![,])(?=[A-Za-z])/g, (m) => `Sau “${m[1]}” ở đầu câu cần dấu phẩy: “${m[1]},”.`, (m) => m[1] + ',', { group: 1 }),
    R('comma-splice', 'punct', 2, /(?:^|[.!?]\s+)((?:I|He|She|We|They|It)\s+[^,.;!?\n]{2,40}),\s+(I|he|she|we|they|it|there)\s+(am|is|are|was|were|have|has|had|will|can|do|did|go|went|like|want|think|love|need|usually|always|often)\b/g, () => 'Hai mệnh đề độc lập không nối bằng dấu phẩy đơn: tách thành hai câu hoặc thêm từ nối (and, but, so, because…).', () => '', { group: 1, test: (m) => !/\b(when|if|because|although|while|after|before|since|as|that|which|who|and|but|so|or)\b/i.test(m[1]) && !/^(I|We)\s+(think|hope|believe|guess|mean|know|suppose|feel)\b/i.test(m[1]) }),
    /* ---- Giọng văn ---- */
    R('informal-in-formal', 'register', 2, /\b(gonna|wanna|gotta|kinda|sorta|lots\s+of|guys|hey|awesome|cool|stuff|okay|ok|thanks\s+a\s+lot|cheers|pls|plz|thx|btw|u|ur)\b|!{2,}/gi, (m) => `Giọng văn quá thân mật cho thư trang trọng: “${m[0]}”.`, () => '', { formalOnly: true }),
    R('contraction-in-formal', 'register', 1, /\b(?:I|you|he|she|we|they|it|that|there|what|who)['’](?:m|s|ll|ve|re|d)\b|\b(?:don|doesn|didn|can|couldn|won|wouldn|shouldn|isn|aren|wasn|weren|haven|hasn|hadn)['’]t\b/gi, (m) => `Thư trang trọng nên viết đầy đủ, không viết tắt: “${m[0]}”.`, () => '', { formalOnly: true }),
    R('formal-in-informal', 'register', 1, /\b(dear\s+sir\s+or\s+madam|yours\s+(?:faithfully|sincerely)|i\s+am\s+writing\s+to\s+(?:inform|enquire|complain)|i\s+would\s+be\s+grateful\s+if|please\s+find\s+attached)\b/gi, (m) => `Giọng văn hơi quá trang trọng khi viết cho bạn bè: “${m[0]}”.`, () => '', { informalOnly: true }),
  ];

  /* ---- hàm hỗ trợ cho luật ---- */
  const PAST_MARK = /\b(yesterday|last\s+(?:night|week|weekend|month|year|summer|winter|time|saturday|sunday|monday|tuesday|wednesday|thursday|friday)|\d+\s+(?:days?|weeks?|months?|years?|hours?|minutes?)\s+ago|a\s+(?:week|month|year|day)\s+ago|in\s+(?:19|20)\d\d|the\s+other\s+day)\b/i;
  const IRR3 = { go: 'goes', have: 'has', do: 'does', say: 'says' };
  const thirdPerson = (v) => {
    v = v.toLowerCase();
    if (IRR3[v]) return IRR3[v];
    if (/(s|x|z|ch|sh)$/.test(v)) return v + 'es';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  };
  const IRR_PAST = { go: 'went', have: 'had', buy: 'bought', meet: 'met', see: 'saw', do: 'did', make: 'made', get: 'got', eat: 'ate', take: 'took', come: 'came', think: 'thought', am: 'was', is: 'was', are: 'were', send: 'sent', write: 'wrote', find: 'found', give: 'gave', tell: 'told', say: 'said', know: 'knew', spend: 'spent', feel: 'felt' };
  const pastOf = (v) => {
    v = v.toLowerCase();
    if (IRR_PAST[v]) return IRR_PAST[v];
    if (/e$/.test(v)) return v + 'd';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
    return v + 'ed';
  };
  const ing = (v) => (/e$/.test(v) && !/ee$/.test(v) ? v.slice(0, -1) + 'ing' : /^(meet|see|get|run|swim)$/.test(v) ? (v === 'meet' || v === 'see' ? v + 'ing' : v + v.slice(-1) + 'ing') : v + 'ing');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const NOUN_FIX = { informations: 'information', advices: 'advice', furnitures: 'furniture', equipments: 'equipment', knowledges: 'knowledge', homeworks: 'homework', feedbacks: 'feedback', luggages: 'luggage', peoples: 'people', childs: 'children', mans: 'men', womans: 'women', foots: 'feet', tooths: 'teeth', sheeps: 'sheep', stuffs: 'stuff', traffics: 'traffic', weathers: 'weather', moneys: 'money', accommodations: 'accommodation', vocabularys: 'vocabulary' };
  const nounFix = (w, bare) => (bare ? NOUN_FIX[w.toLowerCase()] : `nói “${NOUN_FIX[w.toLowerCase()]}”`);
  const PREP_FIX = [[/^depend/i, 'Nói “depend on”.'], [/^interested/i, 'Nói “interested in”.'], [/^different/i, 'Nói “different from” (hoặc “different to” theo Anh-Anh).'], [/^arriv/i, 'Nói “arrive in” (thành phố/nước) hoặc “arrive at” (nơi cụ thể).'], [/^angry/i, 'Nói “angry with” (người) hoặc “angry about” (việc).'], [/^married/i, 'Nói “married to” hoặc “get married”.'], [/^afraid/i, 'Nói “afraid of”.'], [/^good/i, 'Nói “good at”.'], [/^enter/i, 'Nói “enter the room” (không có “to”).'], [/^reach/i, 'Nói “reach + nơi chốn” (không có “to”).'], [/^discuss/i, 'Nói “discuss + chủ đề” (không giới từ).'], [/^explain/i, 'Nói “explain (something) to someone”.'], [/^reach/i, 'Nói “reach + nơi chốn” (không có “to”).']];
  const prepFix = (s) => (PREP_FIX.find(([re]) => re.test(s)) || [0, ''])[1];

  /* ====================== Chạy luật trên một đoạn văn ====================== */
  function findIssues(text, opts) {
    const issues = [];
    const sents = bodySentences(text);
    RULES.forEach((rule) => {
      if (rule.formalOnly && !opts.formal) return;
      if (rule.informalOnly && !opts.informal) return;
      const run = (hayText, baseOffset) => {
        const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
        let m;
        while ((m = re.exec(hayText))) {
          if (m[0] === '') {
            re.lastIndex++;
            continue;
          }
          if (rule.test && !rule.test(m, rule.sentence ? hayText : hayText) && true) continue;
          const g = rule.group;
          let start = m.index + baseOffset;
          let len = m[0].length;
          if (g) {
            const gi = m[0].indexOf(m[g]);
            start += gi;
            len = m[g].length;
          }
          issues.push({ rule: rule.id, cat: rule.cat, sev: rule.sev, topic: rule.topic || null, start, end: start + len, quote: text.slice(start, start + len), message: typeof rule.msg === 'function' ? rule.msg(m, hayText) : rule.msg, fix: rule.fix ? rule.fix(m) : '' });
        }
      };
      if (rule.sentence) sents.forEach((s) => run(s.text, s.start));
      else run(text, 0);
    });

    // thiếu dấu câu cuối / không có dấu câu
    const body = sents[sents.length - 1];
    if (opts.max > 12 && body && !/[.!?"')]$/.test(body.text.trim())) {
      issues.push({ rule: 'no-final-punct', cat: 'punct', sev: 1, topic: null, start: body.start + body.text.length - 1, end: body.start + body.text.length, quote: body.text.slice(-12), message: 'Câu cuối chưa có dấu chấm câu.', fix: '' });
    }
    if (tokens(text).length > 15 && !/[.!?]/.test(text)) {
      issues.push({ rule: 'no-punct', cat: 'punct', sev: 2, topic: null, start: 0, end: Math.min(30, text.length), quote: text.slice(0, 30), message: 'Văn bản dài mà không có dấu chấm câu: hãy chia thành các câu rõ ràng.', fix: '' });
    }

    // chính tả: lỗi thường gặp + gõ nhầm so với kho từ
    const toks = tokens(text);
    const promptKnown = opts.promptTokens || new Set();
    const skip = nonBodyRanges(text);
    toks.forEach((t) => {
      if (skip.some(([a, b]) => t.i >= a && t.i < b)) return;
      if (opts.fieldMode && /^[A-Z]/.test(t.w)) return; // ô điền form: tên riêng, địa danh
      const lw = t.lw.replace(/'s$/, '');
      if (MISSPELL[lw] !== undefined && !/^(alot|informations)$/.test(lw)) {
        issues.push({ rule: 'misspell', cat: 'spell', sev: 1, topic: null, start: t.i, end: t.i + t.w.length, quote: t.w, message: `Sai chính tả: “${t.w}” → “${MISSPELL[lw]}”.`, fix: MISSPELL[lw] });
      } else if (lw === 'alot') {
        issues.push({ rule: 'misspell', cat: 'spell', sev: 1, topic: null, start: t.i, end: t.i + t.w.length, quote: t.w, message: 'Sai chính tả: “alot” → “a lot”.', fix: 'a lot' });
      } else if (lw.length >= 5 && !knownWord(lw) && !promptKnown.has(lw) && !/'/.test(lw)) {
        const mid = !atSentenceStart(text, t.i) && /^[A-Z]/.test(t.w);
        if (mid) return; // tên riêng
        const sug = spellSuggest(lw);
        if (sug) issues.push({ rule: 'typo', cat: 'spell', sev: 1, topic: null, start: t.i, end: t.i + t.w.length, quote: t.w, message: `Có thể sai chính tả: “${t.w}” → bạn muốn viết “${sug}”?`, fix: sug });
      }
    });

    // bỏ trùng lặp theo vùng chồng lấn (giữ lỗi nặng hơn)
    issues.sort((a, b) => a.start - b.start || b.sev - a.sev);
    const out = [];
    issues.forEach((it) => {
      const last = out[out.length - 1];
      if (last && it.start < last.end && it.rule !== last.rule) {
        if (it.sev > last.sev) out[out.length - 1] = it;
        return;
      }
      if (last && it.start === last.start && it.rule === last.rule) return;
      out.push(it);
    });
    return out;
  }

  /* ====================== Chỉ số ngôn ngữ ====================== */
  const lerp = (x, pts) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  };
  const clamp5 = (x) => Math.max(0, Math.min(5, x));
  const round1 = (x) => Math.round(x * 10) / 10;

  function connectorsIn(text) {
    const found = [];
    CONN_RE.forEach(({ c, re }) => re.test(text) && found.push(c));
    // "while/since/once/until/personally" rất hay dùng không phải để nối ý: chỉ tính khi đủ ngữ cảnh
    return found.filter((c) => !(c === 'as soon as' && !/\bas\s+soon\s+as\s+(?!possible)/i.test(text)) && !(c === 'since' && !/\bsince\s+(?:i|we|you|they|he|she|it|the|there)\b/i.test(text)) && !(c === 'once' && !/\bonce\s+(?:i|we|you|they|he|she|it|the)\b/i.test(text)));
  }

  function metrics(fullText, parts, promptSet = new Set()) {
    const toks = tokens(fullText);
    const N = toks.length;
    const lw = toks.map((t) => t.lw);
    const types = new Set(lw.map((w) => stem(w))).size;
    const guiraud = N ? types / Math.sqrt(N) : 0;
    const lex = lexicon();
    const advHits = new Map();
    toks.forEach((t) => {
      const s = stem(t.lw);
      if (t.lw.length > 4 && lex.adv.has(s)) advHits.set(s, t.lw);
    });
    const rich = [];
    const richSeen = new Set();
    toks.forEach((t) => {
      if (t.lw.length < 4 || /'/.test(t.lw)) return;
      if (/^[A-Z]/.test(t.w) && !atSentenceStart(fullText, t.i)) return; // tên riêng
      const st = stem(t.lw);
      if (lex.basic.has(st) || lex.basic.has(t.lw) || promptSet.has(t.lw) || richSeen.has(st)) return;
      richSeen.add(st);
      rich.push(t.lw);
    });
    const lower = fullText.toLowerCase();
    const collHits = lex.colls.filter(([c]) => new RegExp('\\b' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '\\b').test(lower)).map(([c]) => c);
    const nice = NICE_PHRASES.filter((p) => lower.includes(p));
    const weak = {};
    (fullText.match(WEAK) || []).forEach((w) => (weak[w.toLowerCase()] = (weak[w.toLowerCase()] || 0) + 1));
    const weakCount = Object.values(weak).reduce((a, b) => a + b, 0);
    const conns = connectorsIn(fullText);
    const advConns = conns.filter((c) => !BASIC_CONN.has(c));
    const structs = STRUCTURES.filter((s) => s.re.test(fullText));
    const structWeight = structs.reduce((a, x) => a + x.w, 0);
    const sents = [];
    parts.forEach((p) => bodySentences(p.text).forEach((s) => sents.push(s.text)));
    const lens = sents.map((s) => tokens(s).length);
    const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    const sd = lens.length > 1 ? Math.sqrt(lens.reduce((a, b) => a + (b - avgLen) ** 2, 0) / lens.length) : 0;
    const starts = sents.map((s) => (tokens(s)[0] || { lw: '' }).lw);
    const startVar = starts.length ? new Set(starts).size / starts.length : 1;
    const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim() && tokens(p).length > 3).length;
    const basicConnectors = ['and', 'but', 'so', 'because', 'then', 'also', 'or'].filter((c) => new RegExp('\\b' + c + '\\b', 'i').test(fullText));
    const basicOnly = basicConnectors.length > 0 && advConns.length === 0;
    return { rich, richRatio: N ? rich.length / N : 0, tokens: N, types, guiraud: round1(guiraud * 100) / 100, advWords: [...advHits.values()], collHits, nice, weak, weakCount, connectors: conns, advConnectors: advConns, structWeight, structures: structs.map((s) => s.name), structIds: structs.map((s) => s.id), basicConnectors, sentences: sents.length, avgSentenceLen: round1(avgLen), sentenceSD: round1(sd), startVariety: round1(startVar * 100) / 100, paragraphs, basicOnly };
  }

  const TOPIC_NAME = { tenses: 'Tenses (các thì)', conditionals: 'Conditionals', passive: 'Passive', relative: 'Relative clauses', reported: 'Reported speech', modals: 'Modals', articles: 'Articles', prepositions: 'Prepositions' };
  const CAT_NAME = { gram: 'Ngữ pháp', vocab: 'Dùng từ', spell: 'Chính tả', punct: 'Dấu câu & viết hoa', register: 'Giọng văn' };

  /* ====================== Chấm điểm ====================== */
  function lengthScore(n, min, max) {
    if (n === 0) return 0;
    if (n >= min && n <= max) return 5;
    if (n < min) return clamp5(5 * Math.pow(n / min, 2));
    return clamp5(5 - ((n - max) / max) * 10);
  }

  function structureScore(task, text, opts, notes) {
    const t = text;
    const hasGreet = /^\s*(dear|hi|hello|hey|good (morning|afternoon|evening))\b/i.test(t);
    const hasClose = /(best wishes|kind regards|best regards|regards|yours (sincerely|faithfully|truly)|sincerely|cheers|take care|speak soon|see you|all the best|love,|many thanks|talk soon|write soon|looking forward)/i.test(t);
    const hasPurpose = /\b(i am writing|i'm writing|i wanted to|i would like to|i'd like to|thank you for|thanks for|i hope you|hope you|i am contacting|i am writing in response|in response to|regarding|about your)\b/i.test(t);
    const hasRequest = /\b(could you|would you|i would appreciate|i would be grateful|please|i would like you to|i expect|i suggest|i recommend|shall we|why don't|let's|how about)\b/i.test(t);
    let s = 0;
    if (task >= 3) {
      s += hasGreet ? 1.2 : 0;
      s += hasClose ? 1.2 : 0;
      s += hasPurpose ? 1.2 : 0.2;
      s += hasRequest ? 0.8 : task === 4 ? 0 : 0.5;
      if (task === 4) {
        const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
        s += paras >= 3 ? 0.6 : paras === 2 ? 0.3 : 0;
        if (paras < 3) notes.push('Chia bài thành 3–4 đoạn ngắn (mở đầu – ý chính – đề nghị – kết).');
      } else s += 0.6;
      if (!hasGreet) notes.push('Thiếu lời chào đầu thư.');
      if (!hasClose) notes.push('Thiếu lời kết thư.');
      if (!hasPurpose) notes.push('Chưa nêu mục đích/đáp lại ngay đầu thư (ví dụ “Thanks for…”, “I am writing to…”).');
      return clamp5(s + (task === 4 ? 0 : 0.2));
    }
    // task 2 (chat): phản hồi trực tiếp, có lý do/ví dụ, có ý kiến, có nhiều hơn một câu
    const hasReason = /\b(because|since|that's why|for example|for instance|which is why)\b/i.test(t);
    const hasOpinion = /\b(i think|i believe|in my opinion|personally|i prefer|i'd love|i would love|i'd rather|i would rather|honestly|to be honest|i'd go for|i recommend|how about)\b/i.test(t);
    const nSent = (t.match(/[.!?](\s|$)/g) || []).length;
    const react = /^\s*(hi|hello|hey|thanks|thank you|great|good question|sure|well|actually|personally)\b/i.test(t);
    s = 1 + (hasReason ? 1.5 : 0) + (hasOpinion ? 0.8 : 0) + (nSent >= 2 ? 0.7 : 0) + (react ? 0.5 : 0) + (/[.!?]\s*$/.test(t.trim()) ? 0.5 : 0);
    if (!hasReason) notes.push('Nêu thêm lý do hoặc ví dụ (because…, for example…) để câu trả lời đầy đủ.');
    return clamp5(s);
  }

  /** Độ phủ ý của đề: tỉ lệ từ khoá nội dung trong đề xuất hiện trong bài (phản ánh việc trả lời đúng ý) */
  function coverage(promptText, text) {
    const kw = [...new Set(tokens(promptText).map((t) => t.lw).filter((w) => w.length >= 4 && !STOP.has(w) && !/^(write|words?|email|message|reply|tell|your|answer|question|about|formal|informal|explain|please|friend|whether|would|could|should|mention|describe)$/.test(w)).map(stem))];
    if (kw.length < 3) return { ratio: 1, missing: [] };
    const have = new Set(tokens(text).map((t) => stem(t.lw)));
    const hit = kw.filter((k) => have.has(k));
    return { ratio: hit.length / kw.length, missing: kw.filter((k) => !have.has(k)).slice(0, 5) };
  }

  function registerPenalty(issues) {
    const n = issues.filter((i) => i.cat === 'register').length;
    return Math.min(2, n * 0.5);
  }

  function criterionBand(score5) {
    return A.scoring ? A.scoring.cefr(score5 * 10) : 'B1';
  }

  /**
   * analyze({ task, parts:[{prompt,min,max,text}], context? })
   * Với task 1: các phần min≤5 được coi là ô điền form ngắn.
   */
  function analyze({ task, parts, context = '' }) {
    const formal = task === 4 || /\bformal\b/i.test(parts.map((p) => p.prompt).join(' ') + context);
    const informal = !formal && (task === 3 || task === 2 || /\b(friend|informal)\b/i.test(context));
    const promptTokens = new Set(tokens(context + ' ' + parts.map((p) => p.prompt).join(' ')).map((t) => t.lw));

    const analysed = parts.map((p, index) => {
      const text = (p.text || '').replace(/\r/g, '');
      const n = tokens(text).length;
      const isField = task === 1 && p.max <= 5;
      const issues = isField
        ? findIssues(text, { formal: false, informal: false, max: p.max, promptTokens, fieldMode: true }).filter((i) => i.cat !== 'register' && !(i.cat === 'punct' && n < 3))
        : findIssues(text, { formal, informal, max: p.max, promptTokens });
      const notes = [];
      let ta;
      if (isField) {
        ta = n === 0 ? 0 : n > p.max ? clamp5(5 - (n - p.max) * 1.2) : 5;
        if (n === 0) notes.push('Chưa điền.');
        else if (n > p.max) notes.push(`Dài hơn ${p.max} từ yêu cầu.`);
        ta = clamp5(ta - Math.min(3, issues.length * 1.0));
      } else {
        const L = lengthScore(n, p.min, p.max);
        if (n === 0) notes.push('Chưa viết gì.');
        else if (n < p.min) notes.push(`Thiếu ${p.min - n} từ (yêu cầu ${p.min}–${p.max}).`);
        else if (n > p.max) notes.push(`Thừa ${n - p.max} từ (yêu cầu ${p.min}–${p.max}).`);
        const S = n ? structureScore(task === 1 ? 2 : task, text, { formal, informal }, notes) : 0;
        const C = n ? coverage(task >= 3 ? p.prompt + ' ' + context : p.prompt, text) : { ratio: 0, missing: [] };
        const cov = clamp5(lerp(C.ratio, [[0, 1], [0.2, 2.5], [0.4, 4], [0.6, 5]]));
        if (n && C.ratio < 0.3 && C.missing.length) notes.push(`Có vẻ chưa đề cập đủ các ý của đề (ví dụ: ${C.missing.join(', ')}).`);
        const reg = clamp5(5 - registerPenalty(issues));
        ta = clamp5(0.35 * L + 0.3 * S + 0.2 * cov + 0.15 * reg);
        if (reg < 5) notes.push(formal ? 'Giữ giọng trang trọng: tránh viết tắt và từ thân mật.' : 'Giọng văn chưa phù hợp với người nhận.');
      }
      return { index, words: n, minWords: p.min, text, issues, isField, ta: round1(ta), notes };
    });

    // Thống kê ngôn ngữ trên phần "văn bản" (bỏ ô điền form ngắn)
    const textParts = analysed.filter((p) => !p.isField && p.words > 0);
    const fullText = textParts.map((p) => p.text).join('\n\n');
    const m = metrics(fullText, textParts, promptTokens);
    const N = m.tokens;
    const allIssues = analysed.flatMap((p) => p.issues);
    const textIssues = textParts.flatMap((p) => p.issues);

    const criteria = {};
    const empty = N === 0;

    // 1) Hoàn thành yêu cầu
    const taScore = analysed.length ? analysed.reduce((a, p) => a + p.ta, 0) / analysed.length : 0;
    criteria.ta = { id: 'ta', score: round1(taScore), notes: [...new Set(analysed.flatMap((p) => p.notes))].slice(0, 4) };

    // 2) Ngữ pháp = độ chính xác (lỗi/100 từ có trọng số) + độ phong phú cấu trúc
    const W = { 1: 0.6, 2: 1.0, 3: 1.5 };
    const gramIssues = textIssues.filter((i) => i.cat === 'gram' || i.cat === 'punct');
    const fieldGram = analysed.filter((p) => p.isField).flatMap((p) => p.issues).filter((i) => i.cat === 'gram' || i.cat === 'punct');
    const errUnits = gramIssues.concat(fieldGram).reduce((a, i) => a + W[i.sev], 0);
    const per100 = N ? (errUnits / Math.max(N, 25)) * 100 : 0;
    let accuracy = lerp(per100, [[0, 5], [1, 4.5], [2, 4], [3, 3.5], [5, 2.8], [8, 2], [12, 1.3], [20, 0.6], [30, 0.3]]);
    const evid = Math.max(0.7, Math.min(1, 0.55 + N / 200)); // bài ngắn: không đủ bằng chứng để khẳng định chính xác tuyệt đối
    accuracy = 2.5 + (accuracy - 2.5) * evid;
    const need = Math.max(1.5, Math.min(3.5, N / 40)); // tổng trọng số cấu trúc kỳ vọng theo độ dài bài
    const rangeRatio = m.structWeight / need;
    const range = lerp(rangeRatio, [[0, 1.2], [0.5, 2.2], [1, 3.4], [1.5, 4.1], [2, 4.7]]);
    let gr = 0.6 * accuracy + 0.4 * range;
    if (m.avgSentenceLen && m.avgSentenceLen < 7) gr -= 0.6;
    else if (m.avgSentenceLen && m.avgSentenceLen < 9) gr -= 0.3;
    gr = Math.min(gr, 4.7); // luật không bắt hết lỗi → không cho điểm tuyệt đối
    criteria.gr = { id: 'gr', score: empty ? 0 : round1(clamp5(gr)), notes: [] };

    // 3) Từ vựng = đa dạng + "từ vượt ngoài vốn cơ bản" (+ thưởng từ B2 trong kho, kết hợp từ) − lỗi chính tả/dùng từ
    const adv = Math.min(0.5, 0.12 * m.advWords.length + 0.15 * (m.collHits.length + Math.min(1, m.nice.length)));
    const divers = lerp(m.guiraud, [[3.2, 1], [4.2, 2.2], [5.2, 3.3], [6.2, 4.2], [7.5, 5]]);
    const richScore = lerp(m.richRatio, [[0, 1.2], [0.03, 1.8], [0.06, 2.6], [0.1, 3.6], [0.15, 4.3], [0.22, 4.8]]);
    const spellPen = Math.min(1.5, textIssues.concat(analysed.filter((p) => p.isField).flatMap((p) => p.issues)).filter((i) => i.cat === 'spell').length * 0.35);
    const vocabPen = Math.min(1.2, textIssues.filter((i) => i.cat === 'vocab').length * 0.45);
    const weakPen = N ? Math.min(0.8, Math.max(0, (m.weakCount / N) * 100 - 3) * 0.15) : 0;
    const vo = 0.4 * divers + 0.6 * richScore + adv - spellPen - vocabPen - weakPen;
    criteria.vo = { id: 'vo', score: empty ? 0 : round1(clamp5(Math.min(vo, 4.8))), notes: [] };

    // 4) Liên kết & bố cục
    const needConn = Math.max(1, Math.min(5, N / 32));
    const connRatio = (m.advConnectors.length + 0.3 * Math.min(3, m.basicConnectors.length)) / needConn;
    let co = lerp(connRatio, [[0, 1.4], [0.35, 2.5], [0.7, 3.4], [1, 4.2], [1.4, 4.8], [2, 5]]);
    if (m.startVariety < 0.55 && m.sentences >= 4) co -= 0.4;
    if (m.avgSentenceLen && m.avgSentenceLen < 8 && m.sentences >= 4) co -= 0.3;
    if (task === 4 && m.paragraphs < 2) co -= 0.7;
    if (m.sentenceSD >= 4) co += 0.15;
    co += Math.min(0.6, 0.3 * m.nice.length);
    criteria.co = { id: 'co', score: empty ? 0 : round1(clamp5(Math.min(co, 4.9))), notes: [] };

    // Nhận xét theo tiêu chí
    pushNotes(criteria, m, per100, textIssues, N, task, need);

    // Tổng
    const WT = { ta: 0.2, gr: 0.3, vo: 0.25, co: 0.25 };
    const avg5 = Object.keys(WT).reduce((a, k) => a + criteria[k].score * WT[k], 0);
    const raw50 = round1(clamp5(avg5) * 10);
    const gate = bandGate({ N, task, parts: analysed, criteria, m, per100 });
    // Luật không phân biệt được C1/C2 (sắc thái, phong cách): không bao giờ trả về mức C
    const CEILING = 43.9;
    const score50 = round1(Math.min(raw50, gate.cap, CEILING));
    if (raw50 > CEILING && gate.cap >= 50) gate.reasons.push('Bài đạt trần mà bộ chấm tự động đánh giá được (B2 cao). Muốn xác nhận mức C cần giáo viên.');
    const margin = N < 50 ? 5 : N < 100 ? 4 : N < 150 ? 3 : 2.5;
    const lo = Math.max(0, round1(score50 - margin));
    const hi = Math.min(50, round1(score50 + margin));
    const band = A.scoring.cefr(score50);
    const bandLo = A.scoring.cefr(lo);
    const bandHi = A.scoring.cefr(hi);
    Object.values(criteria).forEach((c) => (c.band = criterionBand(c.score)));
    const confidence = N < 50 ? 'low' : N < 110 ? 'medium' : 'high';

    // Ưu tiên sửa + điểm mạnh + tóm tắt
    const priorities = buildPriorities(allIssues, criteria, m, task);
    const strengths = buildStrengths(m, criteria, allIssues);
    const summary = buildSummary(band, score50, criteria, priorities, strengths, confidence);

    return {
      version: VERSION,
      task,
      words: analysed.reduce((a, p) => a + p.words, 0),
      parts: analysed,
      criteria,
      avg5: round1(avg5),
      score50,
      rating5: round1(score50 / 10),
      raw50,
      capped: score50 < raw50,
      bandNotes: gate.reasons,
      band,
      range: [lo, hi],
      bandRange: bandLo === bandHi ? band : `${bandLo}–${bandHi}`,
      confidence,
      metrics: m,
      issues: allIssues,
      priorities,
      strengths,
      summary,
    };
  }

  /**
   * Điều kiện để chạm B2 — giáo viên cũng không cho B2 nếu thiếu một mảng quan trọng.
   * Thiếu điều kiện nào thì điểm bị chặn ở trần B1 (37,4) và lý do được nêu ra để người học biết cần làm gì.
   */
  function bandGate({ N, task, parts, criteria, m, per100 }) {
    const reasons = [];
    let cap = 50;
    const short = N < 70;
    const mid = N < 110;
    // độ dài: viết quá ít thì không thể ở mức cao
    const totalMin = parts.filter((p) => !p.isField).reduce((a, p) => a + (p.words || 0), 0);
    const filled = parts.filter((p) => p.words > 0).length;
    if (!N && !parts.some((p) => p.words > 0)) cap = 0;
    if (task >= 2) {
      const ratios = parts.filter((p) => !p.isField && p.minWords).map((p) => p.words / p.minWords);
      const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1;
      if (avgRatio < 0.35) {
        cap = Math.min(cap, 20);
        reasons.push('Bài viết quá ngắn so với yêu cầu nên không thể xếp mức cao.');
      } else if (avgRatio < 0.6) {
        cap = Math.min(cap, 30);
        reasons.push('Bài viết ngắn hơn nhiều so với yêu cầu, điểm bị giới hạn.');
      }
    }
    const fail = [];
    if (criteria.ta.score < 3.8) fail.push('Hoàn thành yêu cầu chưa đủ: đúng độ dài, có chào/kết, nêu mục đích, trả lời đủ ý của đề.');
    // Từ vựng là điều kiện chính phân biệt B1/B2: tỉ lệ từ vượt ngoài vốn cơ bản
    if (m.richRatio < 0.1 && m.advWords.length + m.collHits.length < 3) fail.push(`Cần vốn từ rộng hơn: mới ${m.rich.length} từ vượt vốn cơ bản (${Math.round(m.richRatio * 100)}% bài), B2 cần khoảng 10% trở lên.`);
    if (task >= 2) {
      const connEv = m.advConnectors.length + Math.min(1, m.nice.length); // cụm thư mẫu (I look forward to…) chỉ tính tối đa 1
      const needConn = N < 130 ? 1 : 2;
      if (connEv < needConn) fail.push(`Cần thêm từ nối/cụm liên kết mức B2 (hiện ${connEv}/${needConn}): however, although, as a result, for example, nevertheless…`);
      const lexStrong = m.richRatio >= 0.18; // vốn từ rất phong phú bù cho cấu trúc ít ở bài ngắn
      const needStruct = short ? 1 : 1.5;
      if (m.structWeight < needStruct && !(lexStrong && short)) fail.push(`Cần đa dạng cấu trúc hơn (hiện ${m.structIds.length} loại): mệnh đề quan hệ, câu điều kiện, thì hoàn thành, bị động, nhượng bộ (although/despite)…`);
    }
    if (per100 > 5) fail.push(`Còn nhiều lỗi (≈ ${round1(per100)} đơn vị lỗi/100 từ): B2 cần chính xác hơn, ít hơn ~5.`);
    if (fail.length) {
      cap = Math.min(cap, 37.4);
      reasons.push(...fail.map((f) => 'Để lên B2: ' + f));
    }
    return { cap, reasons };
  }

  function pushNotes(criteria, m, per100, issues, N, task, need) {
    const gr = criteria.gr.notes;
    const vo = criteria.vo.notes;
    const co = criteria.co.notes;
    const gramIssues = issues.filter((i) => i.cat === 'gram');
    if (!N) return;
    if (gramIssues.length === 0) gr.push('Không phát hiện lỗi ngữ pháp thuộc các luật đang kiểm tra.');
    else gr.push(`Phát hiện ${gramIssues.length} lỗi ngữ pháp (khoảng ${round1(per100)} đơn vị lỗi/100 từ).`);
    if (m.structWeight < need) gr.push(`Mới dùng ${m.structIds.length} loại cấu trúc; thử thêm: mệnh đề quan hệ, câu điều kiện, thì hoàn thành, câu bị động, “although/despite”.`);
    else gr.push(`Có đa dạng cấu trúc: ${m.structures.slice(0, 4).join(', ')}.`);
    if (m.avgSentenceLen && m.avgSentenceLen < 8) gr.push('Câu còn ngắn và rời rạc (trung bình < 8 từ): hãy nối ý thành câu dài hơn.');
    if (m.advWords.length) vo.push(`Từ vựng mức B2+ đã dùng: ${m.advWords.slice(0, 6).join(', ')}.`);
    else vo.push('Chưa thấy từ vựng mức B2 trong kho từ của ứng dụng: thay từ chung chung bằng từ cụ thể hơn.');
    if (m.collHits.length) vo.push(`Kết hợp từ tự nhiên: ${m.collHits.slice(0, 3).join(', ')}.`);
    if (m.weakCount) vo.push(`Từ chung chung dùng ${m.weakCount} lần (${Object.keys(m.weak).slice(0, 4).join(', ')}): thử thay bằng từ cụ thể (extremely, excellent, convenient…).`);
    const sp = issues.filter((i) => i.cat === 'spell').length;
    if (sp) vo.push(`${sp} lỗi/nghi vấn chính tả.`);
    if (m.advConnectors.length) co.push(`Từ nối đã dùng: ${m.advConnectors.slice(0, 5).join(', ')}.`);
    else co.push('Chưa có từ nối mức B2 (however, although, as a result, for example…). Chỉ dùng and/but/so làm bài nghe còn đơn điệu.');
    if (m.startVariety < 0.55 && m.sentences >= 4) co.push('Nhiều câu bắt đầu giống nhau (ví dụ liên tục “I …”): đa dạng cách mở câu.');
    if (task === 4 && m.paragraphs < 2) co.push('Chưa chia đoạn: thư trang trọng cần 3–4 đoạn rõ ràng.');
  }

  function buildPriorities(issues, criteria, m, task) {
    const byRule = {};
    issues.forEach((i) => {
      const k = i.rule === 'typo' || i.rule === 'misspell' ? 'spelling' : i.rule;
      (byRule[k] = byRule[k] || []).push(i);
    });
    const list = Object.entries(byRule).map(([k, arr]) => ({ key: k, count: arr.length, weight: arr.reduce((a, i) => a + i.sev, 0), sample: arr[0], arr }));
    list.sort((a, b) => b.weight - a.weight);
    const out = list.slice(0, 3).map((x) => {
      const ex = x.arr.slice(0, 2).map((i) => `“${i.quote}”${i.fix && i.fix !== i.quote ? ' → “' + i.fix + '”' : ''}`).join('; ');
      return {
        title: x.key === 'spelling' ? 'Soát lại chính tả' : ruleInfo(x.key).label,
        detail: `${x.count} lần. Ví dụ: ${ex}.${x.key === 'spelling' ? '' : ' ' + x.sample.message}`,
        topic: x.sample.topic,
        cat: x.sample.cat,
      };
    });
    // thêm ưu tiên theo tiêu chí yếu nhất nếu chưa đủ 3
    const weakest = Object.values(criteria).sort((a, b) => a.score - b.score)[0];
    if (out.length < 3 && weakest && weakest.score < 4) {
      const adv = { ta: 'Hoàn thành đủ yêu cầu: đúng độ dài, có chào/kết, trả lời đủ ý của đề.', gr: 'Thêm cấu trúc đa dạng (mệnh đề quan hệ, điều kiện, hoàn thành) và kiểm tra lại chia động từ.', vo: 'Mở rộng vốn từ B2 và kết hợp từ tự nhiên; tránh lặp từ chung chung.', co: 'Dùng thêm từ nối B2 và chia đoạn rõ ràng.' }[weakest.id];
      out.push({ title: { ta: 'Hoàn thành yêu cầu đề bài', gr: 'Độ phong phú ngữ pháp', vo: 'Vốn từ vựng', co: 'Liên kết ý' }[weakest.id], detail: adv, topic: weakest.id === 'gr' ? 'tenses' : null, cat: weakest.id });
    }
    return out.slice(0, 3);
  }

  function buildStrengths(m, criteria, issues) {
    const s = [];
    if (criteria.ta.score >= 4.2) s.push('Đủ độ dài và đúng dạng bài (chào/kết/mục đích).');
    if (m.advConnectors.length >= 2) s.push(`Dùng nhiều từ nối: ${m.advConnectors.slice(0, 4).join(', ')}.`);
    if (m.structIds.length >= 3) s.push(`Cấu trúc đa dạng: ${m.structures.slice(0, 4).join(', ')}.`);
    if (m.advWords.length >= 2) s.push(`Từ vựng tốt: ${m.advWords.slice(0, 4).join(', ')}.`);
    if (m.nice.length) s.push(`Cụm tự nhiên: “${m.nice.slice(0, 3).join('”, “')}”.`);
    // “Không thấy lỗi” chỉ là điểm mạnh khi tiêu chí tương ứng cũng đủ tốt (luật chỉ bắt được một phần lỗi)
    if (!issues.some((i) => i.cat === 'gram') && m.tokens > 20 && criteria.gr.score >= 3.5) s.push('Các luật kiểm tra không tìm thấy lỗi ngữ pháp (không có nghĩa bài hoàn toàn đúng).');
    if (!issues.some((i) => i.cat === 'spell') && m.tokens > 20 && criteria.vo.score >= 3) s.push('Không phát hiện lỗi chính tả.');
    return s.slice(0, 5);
  }

  function buildSummary(band, score50, criteria, priorities, strengths, confidence) {
    const sorted = Object.values(criteria).sort((a, b) => b.score - a.score);
    const nm = { ta: 'hoàn thành yêu cầu', gr: 'ngữ pháp', vo: 'từ vựng', co: 'liên kết ý' };
    const best = nm[sorted[0].id];
    const worst = nm[sorted[sorted.length - 1].id];
    const conf = confidence === 'low' ? ' Bài khá ngắn nên ước tính chỉ mang tính tham khảo.' : '';
    return `Ước tính khoảng ${band} (${score50}/50). Phần làm tốt nhất: ${best}; cần cải thiện nhiều nhất: ${worst}.${priorities[0] ? ' Việc nên sửa trước: ' + priorities[0].title + '.' : ''}${conf}`;
  }

  /** Tên ngắn tiếng Việt của từng luật (dùng cho hồ sơ lỗi) */
  const RULE_LABEL = {
    'sv-3rd': 'Chia động từ ngôi thứ ba (he/she + V-s)', 'sv-it': 'Chia động từ với “it”', 'sv-neg': 'doesn’t / don’t', 'sv-be': 'Hoà hợp chủ ngữ – động từ', 'am-agree': '“am agree”', 'past-marker': 'Thì quá khứ với mốc quá khứ', 'perfect-past': 'Hiện tại hoàn thành + mốc quá khứ', 'since-for': 'since / for (khoảng thời gian)', 'for-since': 'since / for (mốc thời điểm)', 'didnt-past': 'didn’t + động từ nguyên thể', 'have-base': 'have/was + V3, V-ing', 'modal-to': 'Modal + to', 'modal-form': 'Dạng động từ sau modal', 'there-is-plural': 'there is / there are', 'verb-ing-after': 'enjoy/avoid + V-ing', 'to-after': 'decide/want + to V', 'look-forward': 'look forward to + V-ing', 'because-of-clause': 'because / because of', 'although-but': 'although … but', 'double-comparative': 'So sánh kép (more better)', 'want-that': 'want that + mệnh đề', 'i-very-like': 'Vị trí “very”', 'adv-be': 'Vị trí trạng từ tần suất', 'years-old': 'Nói tuổi (I am … years old)', 'a-an': 'a / an (trước nguyên âm)', 'an-a': 'a / an (trước phụ âm)', 'a-hour': 'an hour / an honest', 'a-plural': 'a + danh từ số nhiều', 'wrong-noun-form': 'Danh từ không đếm được / dạng số nhiều sai', 'much-many': 'much / many', 'many-much': 'much / many', 'missing-to': 'Thiếu “to” sau want/need/hope', 'somebody-sv': 'everybody/nobody + động từ số ít', 'plural-sv': 'people/friends + are', 'number-singular': 'Số đếm + danh từ số nhiều', 'missing-be': 'Thiếu động từ “be”', 'missing-article-work': 'Thiếu mạo từ (work in a company)', 'missing-article': 'Thiếu mạo từ (a/an/the)', 'comparative-form': 'So sánh hơn của tính từ -y', 'extra-prep': 'Thừa giới từ (discuss about)', 'explain-me': 'explain/reply + to me', 'listen-music': 'listen to', 'wrong-prep': 'Giới từ đi kèm sai', 'other-hand': 'on the other hand', 'according-me': 'according to me', 'collocation-make-do': 'make / do / take (kết hợp từ)', 'say-borrow-learn': 'say/tell, borrow/lend, learn/teach', 'thanks-you': 'thank you', 'sign-off': 'Lời kết thư (regards/faithfully)', 'lower-i': 'Viết hoa “I”', 'lower-start': 'Viết hoa đầu câu', 'space-before-punct': 'Khoảng trắng trước dấu câu', 'no-space-after': 'Thiếu khoảng trắng sau dấu câu', 'repeat-word': 'Lặp từ', 'however-comma': 'Dấu phẩy sau However/Moreover', 'comma-splice': 'Nối hai câu bằng dấu phẩy', 'no-final-punct': 'Thiếu dấu chấm cuối câu', 'no-punct': 'Không có dấu câu', 'informal-in-formal': 'Từ thân mật trong thư trang trọng', 'contraction-in-formal': 'Viết tắt trong thư trang trọng', 'formal-in-informal': 'Quá trang trọng khi viết cho bạn', 'misspell': 'Chính tả (lỗi hay gặp)', 'typo': 'Chính tả (gõ nhầm)',
  };
  const ruleInfo = (id) => {
    const r = RULES.find((x) => x.id === id);
    const cat = r ? r.cat : /spell|typo/.test(id) ? 'spell' : id.startsWith('no-') ? 'punct' : 'gram';
    return { id, label: RULE_LABEL[id] || id, cat: id === 'misspell' || id === 'typo' ? 'spell' : cat, topic: r ? r.topic || null : null };
  };

  A.writingAnalyzer = {
    VERSION,
    RULES,
    CRITERIA: [
      { id: 'ta', name: 'Hoàn thành yêu cầu', en: 'Task achievement', weight: 0.2, help: 'Đúng độ dài, đúng dạng bài (chào/kết/mục đích), trả lời đủ ý, đúng giọng văn.' },
      { id: 'gr', name: 'Ngữ pháp', en: 'Grammar', weight: 0.3, help: 'Độ chính xác (lỗi/100 từ) và độ phong phú cấu trúc.' },
      { id: 'vo', name: 'Từ vựng', en: 'Vocabulary', weight: 0.25, help: 'Độ đa dạng, từ mức B2+, kết hợp từ tự nhiên, chính tả.' },
      { id: 'co', name: 'Liên kết & bố cục', en: 'Cohesion', weight: 0.25, help: 'Từ nối, chia đoạn, đa dạng cách mở câu.' },
    ],
    CAT_NAME,
    TOPIC_NAME,
    analyze,
    ruleInfo,
    RULE_LABEL,
    // xuất để kiểm thử / tái sử dụng
    _tokens: tokens,
    _stem: stem,
    _findIssues: findIssues,
    _metrics: metrics,
  };
})();
