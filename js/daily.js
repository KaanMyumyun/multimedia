/*
 * Daily challenge: one exercise a day, the same for everyone, taken under test rules.
 * The date picks the algorithm and seeds the random input, so no server is needed.
 * Results are kept in this browser, for the streak and to stop a second go.
 */
(function () {
  'use strict';

  const KEY = 'bta-daily-v1';
  const pad = (n) => String(n).padStart(2, '0');

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  };
  const write = (all) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* not remembered */
    }
  };

  BTA.daily = {
    // A day as "2026-10-08", in the visitor's own time zone.
    key(d = new Date()) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },

    label(key) {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    },

    // The algorithm and input for a day. Every algorithm in `pool` comes round once before any repeats.
    pick(key, pool) {
      const order = BTA.withRandom(BTA.seeded('bta-daily-order'), () => BTA.shuffle(pool.slice()));
      const [y, m, d] = key.split('-').map(Number);
      const day = Math.round(Date.UTC(y, m - 1, d) / 86400000);
      const algo = order[day % order.length];
      const input = BTA.withRandom(BTA.seeded(`bta-daily-${key}`), () => algo.generate(algo.input ? algo.input.default : null));
      return { algo, input };
    },

    get(key) {
      return load()[key] || null;
    },

    save(key, result) {
      const all = load();
      all[key] = result;
      write(all);
    },

    reset() {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* nothing to reset */
      }
    },

    // Days in a row with a finished challenge, counting back from today (or from yesterday,
    // if today's isn't done yet, so the streak doesn't look lost in the morning).
    streak() {
      const all = load();
      const d = new Date();
      if (!all[this.key(d)]) d.setDate(d.getDate() - 1);
      let n = 0;
      while (all[this.key(d)]) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    },

    msToNext(now = new Date()) {
      const t = new Date(now);
      t.setHours(24, 0, 0, 0);
      return t - now;
    },

    // The text people paste to share a result: a green or red square per question.
    share(key, r, url) {
      const squares = r.marks.map((ok) => (ok ? '🟩' : '🟥'));
      const rows = [];
      for (let i = 0; i < squares.length; i += 10) rows.push(squares.slice(i, i + 10).join(''));
      return [`Be the Algorithm · Daily · ${key}`, `${r.name} · ${r.grade} · ${r.right}/${r.total}`, ...rows, url].join('\n');
    },
  };
})();
