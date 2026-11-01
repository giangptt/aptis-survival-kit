/* Lưu trữ LocalStorage có bộ nhớ đệm, giá trị mặc định, xuất/nhập JSON.
   Mọi khoá có tiền tố "aptis.v1." — xem docs/04-database-schema.md */
(function () {
  const A = (globalThis.Aptis = globalThis.Aptis || {});
  const U = A.util;
  const PREFIX = 'aptis.v1.';
  const VERSION = 1;

  /** Giá trị mặc định cho từng khoá (hàm để mỗi lần là bản mới) */
  const defaults = {
    profile: () => ({
      onboarded: false,
      createdAt: null,
      startDate: null, // "YYYY-MM-DD" — ngày 1 của lộ trình
      name: '',
      dailyMinutes: 60, // 30 | 60 | 90
      examDate: '',
      theme: 'auto', // auto | light | dark
      fontScale: 100, // % cỡ chữ
      reduceMotion: false,
      focusMode: false,
      sound: true,
      ttsVoice: '',
      ttsRate: 0.95,
    }),
    diag: () => ({ attempts: [] }),
    plan: () => ({ done: {}, notes: {} }), // done: { "d3.vocab": "2026-10-25" }
    log: () => ({}), // { "2026-10-23": { sec, by:{module:sec}, q, c, words, sessions, xp } }
    srs: () => ({}), // { wordId: { ef, iv, reps, due, lapses, last } }
    bookmarks: () => ({}),
    stats: () => ({}), // { module: { c,t,n,sec, subs:{}, refs:{} } }
    mocks: () => [],
    mockRun: () => null,
    game: () => ({ xp: 0, badges: {}, flags: {} }),
    drafts: () => ({}), // bản nháp Writing
    wlog: () => [], // nhật ký các lần chấm Writing (điểm, lỗi, điểm giáo viên)
  };

  let available = false;
  try {
    const k = PREFIX + '__t';
    globalThis.localStorage.setItem(k, '1');
    globalThis.localStorage.removeItem(k);
    available = true;
  } catch (e) {
    available = false;
  }

  const mem = {}; // bộ nhớ đệm + nơi lưu khi không có localStorage
  const listeners = new Set();

  function read(key) {
    if (key in mem) return mem[key];
    let v;
    if (available) {
      try {
        const raw = globalThis.localStorage.getItem(PREFIX + key);
        if (raw != null) v = JSON.parse(raw);
      } catch (e) {
        v = undefined; // dữ liệu hỏng → dùng mặc định
      }
    }
    if (v === undefined) v = defaults[key] ? defaults[key]() : null;
    else if (defaults[key] && v && typeof v === 'object' && !Array.isArray(v)) v = Object.assign(defaults[key](), v);
    mem[key] = v;
    return v;
  }

  function write(key) {
    if (!available) return;
    try {
      globalThis.localStorage.setItem(PREFIX + key, JSON.stringify(mem[key]));
    } catch (e) {
      // đầy bộ nhớ: bỏ qua, dữ liệu vẫn nằm trong bộ nhớ đệm của phiên này
    }
  }

  const Store = (A.store = {
    available,
    VERSION,
    keys: Object.keys(defaults),
    /** Lấy giá trị (đối tượng thật, sửa xong gọi Store.save(key)). */
    get: read,
    set(key, value) {
      mem[key] = value;
      write(key);
      listeners.forEach((fn) => fn(key));
    },
    save(key) {
      write(key);
      listeners.forEach((fn) => fn(key));
    },
    /** update('plan', d => { d.done.x = 1 }) — chỉ sửa tại chỗ, giá trị trả về của fn bị bỏ qua (dùng set() để thay cả khối) */
    update(key, fn) {
      fn(read(key));
      write(key);
      listeners.forEach((l) => l(key));
      return mem[key];
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    exportAll() {
      const out = { app: 'aptis-b2-survival-kit', version: VERSION, exportedAt: new Date().toISOString(), data: {} };
      Store.keys.forEach((k) => (out.data[k] = read(k)));
      return out;
    },
    importAll(obj) {
      if (!obj || obj.app !== 'aptis-b2-survival-kit' || !obj.data || typeof obj.data !== 'object') throw new Error('File không đúng định dạng sao lưu của ứng dụng.');
      Store.keys.forEach((k) => {
        if (k in obj.data) mem[k] = obj.data[k];
        else mem[k] = defaults[k]();
        write(k);
      });
      listeners.forEach((l) => l('*'));
    },
    resetAll() {
      Store.keys.forEach((k) => {
        delete mem[k];
        if (available) {
          try {
            globalThis.localStorage.removeItem(PREFIX + k);
          } catch (e) {
            /* bỏ qua */
          }
        }
      });
      listeners.forEach((l) => l('*'));
    },
    /** Dung lượng ước tính (KB) */
    sizeKB() {
      let n = 0;
      Store.keys.forEach((k) => (n += JSON.stringify(read(k)).length));
      return Math.round(n / 102.4) / 10;
    },
  });

  // Tiện ích truy cập nhanh
  Store.profile = () => read('profile');
  Store.today = () => U.dateKey();
  /** Bản ghi nhật ký của một ngày (tạo nếu chưa có) */
  Store.dayLog = (key = U.dateKey(), create = true) => {
    const log = read('log');
    if (!log[key] && create) log[key] = { sec: 0, by: {}, q: 0, c: 0, words: 0, sessions: 0, xp: 0 };
    return log[key];
  };
})();
