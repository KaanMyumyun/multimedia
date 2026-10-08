(function () {
  'use strict';
  const { register, unsorted, items, arrayView, list, plural } = BTA;

  register({
    id: 'insertion',
    name: 'Insertion Sort',
    group: 'Sorting',
    blurb: 'Take the next element and slide it into place in the sorted part.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 6 },
    how: [
      'The left part of the array is kept sorted. It starts as just the first element.',
      'Pick up the next element (the “key”).',
      'Shift every bigger element in the sorted part one step right.',
      'Drop the key into the gap. Repeat until no elements are left.',
    ],
    code: [
      'for i ← 1 to n − 1',
      '  key ← a[i]',
      '  j ← i − 1',
      '  while j ≥ 0 and a[j] > key',
      '    a[j + 1] ← a[j]; j ← j − 1',
      '  a[j + 1] ← key',
    ],
    legend: [
      ['part', 'Sorted so far'],
      ['key', 'Key being inserted'],
      ['sorted', 'Finished'],
    ],
    summary:
      'The left part was always sorted, and each round inserted one more element into it. Bigger elements shifted right to make room. ' +
      'A nearly-sorted array needs very few shifts, so Insertion Sort runs close to O(n) there. ' +
      'A reversed array is its worst case. Many fast library sorts switch to Insertion Sort for small pieces because it is so cheap on short inputs.',

    generate: (n) => unsorted(n),

    build(values) {
      let a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let comparisons = 0;
      let shifts = 0;

      const view = (sortedUpTo, o = {}) =>
        arrayView(a, {
          max,
          lifted: o.lifted,
          state: (k) =>
            k === o.lifted ? 'key' : sortedUpTo >= n - 1 ? 'sorted' : k <= sortedUpTo ? 'part' : 'idle',
        });

      for (let i = 1; i < n; i++) {
        const vals = a.map((x) => x.v);
        const key = vals[i];
        const prefix = vals.slice(0, i);
        let pos = i;
        while (pos > 0 && prefix[pos - 1] > key) pos--;
        comparisons += i - pos + (pos > 0 ? 1 : 0);
        shifts += i - pos;
        const shifted = prefix.slice(pos);

        steps.push({
          line: 1,
          view: view(i - 1),
          prompt:
            i === 1
              ? 'A single element is always sorted, so the green part starts with just the first one. Which element does Insertion Sort pick up next?'
              : 'Which element does Insertion Sort pick up next?',
          ask: { type: 'pick', answer: [String(i)] },
          hint: 'It takes the elements in order: the first one right after the sorted (green) part.',
          correct: `Right. <b>${key}</b> is the next element after the sorted part. Pick it up.`,
          wrong: ([k]) =>
            +k < i
              ? 'That one is already in the sorted part on the left.'
              : 'Insertion Sort works left to right. Take the element <b>directly after</b> the sorted part.',
          after: view(i - 1, { lifted: i }),
        });

        const before = view(i - 1, { lifted: i });
        a = [...a.slice(0, pos), a[i], ...a.slice(pos, i), ...a.slice(i + 1)];
        const done = i === n - 1;

        steps.push({
          line: 3,
          view: before,
          prompt: `Where does <b>${key}</b> belong in the sorted part? Click the position it will end up in.`,
          ask: { type: 'pick', answer: [String(pos)], position: true },
          hint: `Move left past every value bigger than ${key}. Stop at the first value smaller than ${key}, or at the start.`,
          correct:
            (pos === i
              ? `Correct! ${key} is bigger than ${prefix[i - 1]}, so it stays where it is.`
              : `Correct! ${list(shifted)} ${plural(shifted.length, 'is', 'are')} bigger than ${key}, so ` +
                `${plural(shifted.length, 'it shifts', 'they each shift')} one place right and ${key} drops into position ${pos}.`) +
            (done ? ' That was the last element, so the array is sorted!' : ''),
          wrong: ([k]) => {
            const p = +k;
            if (p > i) return `Insertion only moves ${key} <b>left</b>, into the sorted part.`;
            if (p < pos) return `${prefix[p]} is smaller than ${key}, so it stays in front of it. ${key} goes further right.`;
            return `${prefix[p - 1]} is bigger than ${key}, so ${key} has to go to its left.`;
          },
          after: view(i),
        });
      }

      return {
        steps,
        final: view(n - 1),
        stats: [
          ['Comparisons', comparisons],
          ['Shifts', shifts],
        ],
      };
    },
    trace(values) {
      const a = values.slice();
      const ev = [];
      for (let i = 1; i < a.length; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= 0) {
          ev.push(['c', j, j + 1]);
          if (a[j] <= key) break;
          a[j + 1] = a[j];
          ev.push(['w', j + 1, a[j]]);
          j--;
        }
        a[j + 1] = key;
        ev.push(['w', j + 1, key]);
      }
      return ev;
    },
  });
})();
