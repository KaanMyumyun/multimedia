(function () {
  'use strict';
  const { register, randInt, shuffle, items, list } = BTA;

  const PLACE_NAMES = { 1: 'ones', 10: 'tens', 100: 'hundreds' };
  const digitOf = (x, place) => Math.floor(x / place) % 10;

  register({
    id: 'radix',
    name: 'Radix Sort',
    group: 'Sorting',
    blurb: 'Sort by the last digit, then the one before it, using ten buckets each time.',
    complexity: { best: 'O(d·(n + 10))', average: 'O(d·(n + 10))', worst: 'O(d·(n + 10))', space: 'O(n + 10)', stable: 'Yes' },
    input: {
      label: 'Size',
      options: [5, 6, 7, 8, 9],
      default: 7,
      range: [0, 99],
      rangeWhy: 'Radix sort here goes digit by digit through the ones and the tens, so it needs whole numbers from 0 to 99. Negative numbers would need a pass of their own.',
      distinct: false,
    },
    how: [
      'Radix sort never compares two elements. It drops each one into one of ten buckets, 0 to 9, by a single digit.',
      'First pass: go through the array in order and drop each element into the bucket for its ones digit. Then collect the buckets from 0 to 9, keeping the order inside each bucket.',
      'Second pass: the same with the tens digit (0 for numbers below 10).',
      'Each pass keeps elements with the same digit in their current order (it is stable), so the ones pass breaks ties in the tens pass. After the last digit, the array is sorted.',
    ],
    code: [
      'for each digit place: ones, then tens, …',
      '  buckets ← ten empty lists, 0 to 9',
      '  for each x in a, in order',
      '    add x to the end of buckets[that digit of x]',
      '  a ← buckets 0 to 9, one after another',
    ],
    legend: [
      ['active', 'Being placed'],
      ['key', 'The bucket it goes in'],
      ['part', 'Just placed'],
      ['sorted', 'Sorted'],
    ],
    kinds: {
      bucket: 'Which bucket it goes in',
    },
    summary:
      'Radix sort made one pass per digit, and each pass just read every element once and wrote it back once: O(d·(n + 10)) for d digits, with no comparisons at all. ' +
      'It works because every pass is stable: after the ones pass, numbers with the same tens digit are already in the right order, and the tens pass keeps them that way. ' +
      'It is Counting Sort’s idea applied one digit at a time, so it handles much bigger numbers than Counting Sort without needing a counter for every possible value.',

    generate(n) {
      let v;
      do {
        v = Array.from({ length: n }, () => randInt(0, 99));
        if (v.every((x) => x < 10)) v[0] = randInt(10, 99);
        shuffle(v);
      } while (v.every((x, i) => i === 0 || v[i - 1] <= x));
      return v;
    },

    build(values) {
      const n = values.length;
      const max = Math.max(...values, 1);
      const places = [1];
      while (Math.floor(Math.max(...values) / (places[places.length - 1] * 10)) > 0) places.push(places[places.length - 1] * 10);
      let arr = items(values);
      let buckets = Array.from({ length: 10 }, () => []);
      let finished = false;
      let reads = 0;
      const steps = [];

      const view = (place, o = {}) => ({
        kind: 'array',
        max,
        chips: [{ label: 'Pass', value: `${PLACE_NAMES[place]} digit` }],
        rows: [
          {
            label: 'Array',
            showIndex: true,
            ptrs: {},
            cells: arr.map((it, i) =>
              it ? { flip: it.id, value: it.v, key: null, state: finished ? 'sorted' : i === o.at ? 'active' : 'idle' } : { ghost: true },
            ),
          },
        ],
        buckets: {
          label: `Buckets, by the ${PLACE_NAMES[place]} digit`,
          cols: buckets.map((b, d) => ({
            key: 'b' + d,
            title: String(d),
            state: d === o.bucket ? 'key' : 'idle',
            cells: b.map((it) => ({ flip: it.id, value: it.v, state: it === o.newest ? 'part' : 'idle' })),
          })),
        },
      });

      places.forEach((place, pi) => {
        const name = PLACE_NAMES[place];
        const last = pi === places.length - 1;
        for (let i = 0; i < n; i++) {
          const it = arr[i];
          const x = it.v;
          const d = digitOf(x, place);
          reads++;
          const before = view(place, { at: i });
          arr[i] = null;
          buckets[d].push(it);

          steps.push({
            line: 3,
            kind: 'bucket',
            view: before,
            prompt:
              i === 0
                ? `${pi === 0 ? 'First' : 'Next'}, the <b>${name} digit</b>. Going through the array in order, which bucket does <b>${x}</b> go into?`
                : `Which bucket does <b>${x}</b> go into?`,
            ask: { type: 'pick', answer: ['b' + d] },
            hint:
              place === 1
                ? 'Use the last digit of the number.'
                : `Use the ${name} digit. A number below ${place} has a ${name} digit of 0.`,
            correct: `Right. The ${name} digit of ${x} is ${d}, so it goes to the end of bucket ${d}.`,
            wrong: ([k]) =>
              place === 1
                ? `${x} doesn’t end in ${k.slice(1)}. The ones digit is the last digit.`
                : `The ${name} digit of ${x} isn’t ${k.slice(1)}. It is the digit just before the ones${x < place ? ', and 0 for a number this small' : ''}.`,
            after: view(place, { bucket: d, newest: it }),
          });
        }

        const full = view(place);
        arr = buckets.flat();
        buckets = Array.from({ length: 10 }, () => []);
        if (last) finished = true;
        steps.push({
          line: 4,
          view: full,
          prompt:
            `Every element is in a bucket. Collect them: bucket 0 first, then 1, and so on, keeping the order inside each bucket. ` +
            `The array becomes ${list(arr.map((it) => it.v))}.` +
            (last ? ' That was the last digit, so the array is sorted!' : ` Next comes the ${PLACE_NAMES[places[pi + 1]]} digit.`),
          ask: { type: 'info' },
          after: view(place),
        });
      });

      return {
        steps,
        final: view(places[places.length - 1]),
        stats: [
          ['Comparisons', 0],
          ['Passes', places.length],
          ['Elements placed', reads],
        ],
      };
    },

    // For the race, which may have negative values: shift everything up by the smallest one first.
    trace(values) {
      const lo = Math.min(0, ...values);
      const a = values.map((x) => x - lo);
      const max = Math.max(...a);
      const ev = [];
      for (let place = 1; ; place *= 10) {
        const buckets = Array.from({ length: 10 }, () => []);
        a.forEach((x, i) => {
          buckets[digitOf(x, place)].push(x);
          ev.push(['r', i]);
        });
        let k = 0;
        for (const b of buckets) {
          ev.push(['k']);
          for (const x of b) {
            a[k] = x;
            ev.push(['w', k++, x + lo]);
          }
        }
        if (Math.floor(max / (place * 10)) === 0) break;
      }
      return ev;
    },
  });
})();
