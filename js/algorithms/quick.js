(function () {
  'use strict';
  const { register, unsorted, items, arrayView, list, plural } = BTA;

  register({
    id: 'quick',
    name: 'Quick Sort',
    group: 'Sorting',
    blurb: 'Pick a pivot, move smaller values before it, then sort each side.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: 'No' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 6 },
    how: [
      'Choose a pivot. This version (the Lomuto partition) always uses the last element of the range.',
      'Partition: move every element smaller than the pivot to the front of the range.',
      'Put the pivot right after them. It is now in its final sorted position.',
      'Repeat on the part left of the pivot and the part right of it. Ranges of 0 or 1 elements are already sorted.',
    ],
    code: [
      'quickSort(lo, hi)',
      '  if lo ≥ hi: return',
      '  pivot ← a[hi]; i ← lo',
      '  for j ← lo to hi − 1',
      '    if a[j] < pivot',
      '      swap a[i], a[j]; i ← i + 1',
      '  swap a[i], a[hi]',
      '  quickSort(lo, i − 1)',
      '  quickSort(i + 1, hi)',
    ],
    legend: [
      ['pivot', 'Pivot'],
      ['less', 'Smaller than the pivot'],
      ['dim', 'Outside the current range'],
      ['sorted', 'In its final place'],
    ],
    summary:
      'Each partition put one pivot in its final place, with smaller values on its left and bigger values on its right. Each side was then sorted on its own. ' +
      'With balanced splits there are about log₂ n levels of O(n) work, which gives O(n log n). ' +
      'A pivot that is always the smallest or largest value (for example, already-sorted input with a last-element pivot) degrades to O(n²). ' +
      'Real implementations pick pivots more cleverly. Quick Sort sorts in place and is very fast in practice.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      const final = new Set();
      let comparisons = 0;
      let swaps = 0;

      const view = (lo, hi, o = {}) =>
        arrayView(a, {
          max,
          chips: lo == null ? [] : [{ label: 'Range', value: `positions ${lo}–${hi}` }],
          ptrs: o.pivot != null ? { [o.pivot]: ['pivot'] } : {},
          state: (k) =>
            final.has(k)
              ? 'sorted'
              : lo == null || k < lo || k > hi
                ? 'dim'
                : k === o.pivot
                  ? 'pivot'
                  : o.less && k >= o.less[0] && k <= o.less[1]
                    ? 'less'
                    : 'idle',
        });

      function qs(lo, hi) {
        if (lo > hi) return;
        if (lo === hi) {
          final.add(lo);
          return;
        }

        const vals = a.map((x) => x.v);
        const pv = vals[hi];

        steps.push({
          line: 2,
          view: view(lo, hi),
          prompt: `Partition positions <b>${lo}–${hi}</b>. Click the pivot.`,
          ask: { type: 'pick', answer: [String(hi)] },
          hint: 'This version always uses the <b>last</b> element of the current range as the pivot.',
          correct: `Right. The pivot is <b>${pv}</b>, the last element of the range.`,
          wrong: ([k]) =>
            +k < lo || +k > hi
              ? 'That element is outside the range being partitioned. The dimmed ones are handled separately.'
              : 'In this version (Lomuto partition) the pivot is always the <b>last</b> element of the current range.',
          after: view(lo, hi, { pivot: hi }),
        });

        const less = [];
        for (let j = lo; j < hi; j++) if (vals[j] < pv) less.push(j);
        const lessVals = less.map((k) => vals[k]);
        comparisons += hi - lo;

        const beforeMulti = view(lo, hi, { pivot: hi });
        let i = lo;
        for (let j = lo; j < hi; j++) {
          if (a[j].v < pv) {
            if (i !== j) {
              [a[i], a[j]] = [a[j], a[i]];
              swaps++;
            }
            i++;
          }
        }
        const p = i;
        const lessRange = less.length ? [lo, p - 1] : null;

        steps.push({
          line: 4,
          view: beforeMulti,
          prompt: `Select every element in this range that is <b>smaller than ${pv}</b>, then press Check.`,
          ask: { type: 'multi', answer: less.map(String) },
          hint: 'Compare each non-dimmed element with the pivot. If none are smaller, press Check without selecting anything.',
          correct: less.length
            ? `Correct. ${list(lessVals)} ${plural(less.length, 'is', 'are')} smaller than ${pv}. Partitioning moves ${plural(less.length, 'it', 'them')} to the front of the range.`
            : `Correct. Nothing in the range is smaller than ${pv}, so nothing moves.`,
          wrong: (given) => {
            const g = given.map(Number);
            if (g.includes(hi)) return 'Don’t select the pivot itself. Compare the <b>other</b> elements against it.';
            const outside = g.find((k) => k < lo || k > hi);
            if (outside != null) return 'Only elements inside the current range (not dimmed) take part in this partition.';
            const extra = g.find((k) => !less.includes(k));
            if (extra != null) return `${vals[extra]} is not smaller than ${pv}.`;
            return less.length - g.length === 1
              ? `You missed one. Look again for a value below ${pv}.`
              : `You missed some. Look again for values below ${pv}.`;
          },
          after: view(lo, hi, { pivot: hi, less: lessRange }),
        });

        const beforePivot = view(lo, hi, { pivot: hi, less: lessRange });
        if (p !== hi) {
          [a[p], a[hi]] = [a[hi], a[p]];
          swaps++;
        }
        final.add(p);
        const leftSize = p - lo;
        const rightSize = hi - p;
        if (leftSize === 1) final.add(lo);
        if (rightSize === 1) final.add(hi);

        let note = '';
        if (leftSize <= 1 && rightSize <= 1) {
          note = ' Both sides now hold at most one element, so they are sorted too.';
        } else if (leftSize <= 1) {
          note = ` The left side ${leftSize ? 'has one element, so it is sorted' : 'is empty'}. Next, sort the right side.`;
        } else if (rightSize <= 1) {
          note = ` The right side ${rightSize ? 'has one element, so it is sorted' : 'is empty'}. Next, sort the left side.`;
        } else {
          note = ' Next, sort the left side, then the right side.';
        }

        steps.push({
          line: 6,
          view: beforePivot,
          prompt: `Where does the pivot <b>${pv}</b> go? Click its final position.`,
          ask: { type: 'pick', answer: [String(p)], position: true },
          hint: `It goes right after all the elements smaller than ${pv}. Count them, starting at position ${lo}.`,
          correct:
            `Exactly. ${less.length} ${plural(less.length, 'element is', 'elements are')} smaller, so ${pv} lands at position ${p}. ` +
            'That is its final sorted position: everything left of it is smaller and everything right of it is bigger.' +
            note,
          wrong: ([k]) =>
            +k < lo || +k > hi
              ? 'The pivot stays inside the current range.'
              : `Count the elements smaller than ${pv} in this range. The pivot goes right after them.`,
          after: view(lo, hi),
        });

        qs(lo, p - 1);
        qs(p + 1, hi);
      }

      qs(0, n - 1);
      for (let k = 0; k < n; k++) final.add(k);

      return {
        steps,
        final: view(null, null),
        stats: [
          ['Comparisons', comparisons],
          ['Swaps', swaps],
        ],
      };
    },
    trace(values) {
      const a = values.slice();
      const ev = [];
      const qs = (lo, hi) => {
        if (lo >= hi) return;
        const pivot = a[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
          ev.push(['c', j, hi]);
          if (a[j] < pivot) {
            if (i !== j) {
              [a[i], a[j]] = [a[j], a[i]];
              ev.push(['s', i, j]);
            }
            i++;
          }
        }
        if (i !== hi) {
          [a[i], a[hi]] = [a[hi], a[i]];
          ev.push(['s', i, hi]);
        }
        qs(lo, i - 1);
        qs(i + 1, hi);
      };
      qs(0, a.length - 1);
      return ev;
    },
  });
})();
