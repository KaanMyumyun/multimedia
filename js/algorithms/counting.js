(function () {
  'use strict';
  const { register, randInt, shuffle, list, plural } = BTA;

  const K = 10; // values 0 to 9
  const COUNTED_BY_HAND = 4; // after this many, the rest are counted for you

  register({
    id: 'counting',
    name: 'Counting Sort',
    group: 'Sorting',
    blurb: 'Count how many times each value appears, then write the values out in order.',
    complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)', stable: '—' },
    input: {
      label: 'Size',
      options: [6, 7, 8, 9, 10],
      default: 8,
      range: [0, K - 1],
      rangeWhy: `Counting sort uses each value as the number of its counter, so values must be whole numbers from 0 to ${K - 1}: there is no counter number −1.`,
      distinct: false,
    },
    how: [
      `Counting sort never compares two elements. It only works on whole numbers in a small range: here 0 to ${K - 1}, so there are k = ${K} possible values.`,
      'Make a counter for every possible value, all starting at 0.',
      'Go through the array once. For each element, add 1 to its counter.',
      'Then go through the counters from smallest to largest and write each value out as many times as it was counted.',
    ],
    code: [
      'count ← array of k zeros',
      'for each x in a',
      '  count[x] ← count[x] + 1',
      'i ← 0',
      'for v ← 0 to k − 1',
      '  repeat count[v] times',
      '    a[i] ← v; i ← i + 1',
    ],
    legend: [
      ['active', 'Being counted'],
      ['key', 'Counter that changes'],
      ['part', 'Written out'],
      ['dim', 'Counter used up'],
    ],
    kinds: {
      count: 'Which counter goes up',
      write: 'Which value is written next',
    },
    summary:
      'Counting sort read every element once and then walked through the k counters once, so it is O(n + k), with no comparisons at all. ' +
      'That beats the O(n log n) limit for comparison sorts, but only because the values are small whole numbers. ' +
      'With values up to a million it would need a million counters. Radix sort builds on the same idea to handle bigger numbers, digit by digit.',

    generate(n) {
      // Some repeats (that's what counting is for), and not already sorted.
      let v;
      do {
        v = Array.from({ length: n }, () => randInt(0, K - 1));
        if (new Set(v).size === n) v[randInt(1, n - 1)] = v[0];
        shuffle(v);
      } while (v.every((x, i) => i === 0 || v[i - 1] <= x));
      return v;
    },

    build(values) {
      const n = values.length;
      const count = new Array(K).fill(0);
      const out = [];
      const used = new Set();
      const max = Math.max(K - 1, ...values);
      const steps = [];

      const view = (o = {}) => ({
        kind: 'array',
        max,
        chips: [],
        rows: [
          {
            label: 'Array',
            showIndex: true,
            ptrs: o.at != null ? { [o.at]: ['x'] } : {},
            cells: values.map((v, i) => ({ flip: 'e' + i, value: v, key: null, state: i === o.at ? 'active' : 'idle' })),
          },
          {
            label: 'Counters (one per value)',
            showIndex: true,
            ptrs: {},
            cells: count.map((c, v) => ({
              flip: 'c' + v,
              value: c,
              key: 'c' + v,
              state: v === o.counter ? 'key' : used.has(v) ? 'dim' : 'idle',
            })),
          },
          {
            label: 'Output',
            showIndex: false,
            ptrs: {},
            cells: Array.from({ length: n }, (_, i) =>
              i < out.length ? { flip: 'o' + i, value: out[i], key: null, state: 'part' } : { ghost: true },
            ),
          },
        ],
      });

      // Phase 1: count
      const byHand = Math.min(n, COUNTED_BY_HAND);
      for (let i = 0; i < byHand; i++) {
        const x = values[i];
        const c = count[x];
        const before = view({ at: i });
        count[x]++;
        steps.push({
          line: 2,
          kind: 'count',
          view: before,
          prompt:
            i === 0
              ? `Count the elements. a[0] is <b>${x}</b>. Click the counter that goes up.`
              : `a[${i}] is <b>${x}</b>. Click its counter.`,
          ask: { type: 'pick', answer: ['c' + x] },
          hint: `Every value has its own counter. The counters are numbered 0 to ${K - 1} underneath.`,
          correct: `Right. count[${x}] goes from ${c} to ${c + 1}.`,
          wrong: ([k]) => `That is the counter for ${k.slice(1)}s. ${x} has its own counter, number ${x}.`,
          after: view({ counter: x }),
        });
      }
      if (n > byHand) {
        const rest = values.slice(byHand);
        const before = view();
        rest.forEach((x) => count[x]++);
        steps.push({
          line: 2,
          view: before,
          prompt: `The other ${n - byHand} ${plural(n - byHand, 'element is', 'elements are')} (${list(rest)}) counted the same way.`,
          ask: { type: 'info' },
          after: view(),
        });
      }

      // Phase 2: write the values out in order
      const present = count.map((c, v) => (c > 0 ? v : -1)).filter((v) => v >= 0);
      present.forEach((v, idx) => {
        const c = count[v];
        const done = present.slice(0, idx);
        const snapshot = count.slice();
        const before = view();
        for (let r = 0; r < c; r++) out.push(v);
        used.add(v);
        const last = idx === present.length - 1;

        steps.push({
          line: 4,
          kind: 'write',
          view: before,
          prompt:
            idx === 0
              ? 'Everything is counted. Go through the counters in order. Which value is written out first?'
              : 'Which value is written out next?',
          ask: { type: 'pick', answer: ['c' + v] },
          hint: 'Go through the counters from 0 upward, and skip any counter that is 0.',
          correct:
            `Right. count[${v}] = ${c}, so ${v} is written ${c === 1 ? 'once' : c === 2 ? 'twice' : c + ' times'}.` +
            (last ? ' That was the last value, so the array is sorted.' : ''),
          wrong: ([k]) => {
            const kv = Number(k.slice(1));
            if (done.includes(kv)) return `The ${kv}s have already been written out.`;
            if (snapshot[kv] === 0) return `count[${kv}] is 0: there are no ${kv}s, so nothing is written for it.`;
            return `There are ${kv}s to write, but a smaller value comes first.`;
          },
          after: view({ counter: v }),
        });
      });

      return {
        steps,
        final: view(),
        stats: [
          ['Comparisons', 0],
          ['Counters', K],
          ['Elements written', n],
        ],
      };
    },

    // The race allows any values, so the counters run from the smallest value to the largest.
    trace(values) {
      const lo = Math.min(...values);
      const k = Math.max(...values) - lo + 1;
      const count = new Array(k).fill(0);
      const ev = [];
      values.forEach((x, i) => {
        count[x - lo]++;
        ev.push(['r', i]);
      });
      let i = 0;
      for (let v = 0; v < k; v++) {
        ev.push(['k']);
        for (let r = 0; r < count[v]; r++) ev.push(['w', i++, v + lo]);
      }
      return ev;
    },
  });
})();
