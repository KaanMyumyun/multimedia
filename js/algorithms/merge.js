(function () {
  'use strict';
  const { register, unsorted, items, list } = BTA;

  register({
    id: 'merge',
    name: 'Merge Sort',
    group: 'Sorting',
    blurb: 'Split the array in halves, then merge the sorted halves back together.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Yes' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 6 },
    how: [
      'Split the array in half, and keep splitting until every piece has one element. One element is always sorted.',
      'Merge pairs of sorted pieces back together.',
      'To merge, compare only the front element of each piece and take the smaller one.',
      'When one piece runs out, copy the rest of the other piece.',
    ],
    code: [
      'mergeSort(lo, hi)',
      '  if lo ≥ hi: return',
      '  mid ← ⌊(lo + hi) / 2⌋',
      '  mergeSort(lo, mid)',
      '  mergeSort(mid + 1, hi)',
      '  while both halves have elements',
      '    move the smaller front to output',
      '  copy the leftovers to output',
    ],
    legend: [
      ['left', 'Left half'],
      ['right', 'Right half'],
      ['active', 'Front of a half'],
      ['part', 'Merged'],
    ],
    summary:
      'The array was split until every piece held one element. The pieces were then merged pairwise, always taking the smaller front element. ' +
      'There are about log₂ n levels of merging and each level touches all n elements, so Merge Sort is O(n log n) in every case. ' +
      'The price is O(n) extra memory for the merged output. It is stable and works well on linked lists and on data too large to fit in memory.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let comparisons = 0;
      let merges = 0;

      const span = (x, y) => (x === y ? String(x) : `${x}–${y}`);
      const cell = (it, state, key = null) => ({ flip: it.id, value: it.v, state, key });
      const ghost = { ghost: true };

      // The full array as a small context row: the range being merged is coloured.
      const contextRow = (arr, lo, mid, hi, merged, finished) => ({
        label: 'Array',
        mini: true,
        showIndex: true,
        ptrs: {},
        cells: arr.map((it, k) => ({
          flip: 'ctx-' + it.id,
          value: it.v,
          key: null,
          state: finished ? 'sorted' : k < lo || k > hi ? 'dim' : merged ? 'part' : k <= mid ? 'left' : 'right',
        })),
      });

      const halfRow = (label, half, taken, prefix, state) => ({
        label,
        half: true,
        showIndex: false,
        ptrs: taken < half.length ? { [taken]: ['front'] } : {},
        cells: half.map((it, k) => (k < taken ? ghost : cell(it, k === taken ? 'active' : state, prefix + k))),
      });

      const outRow = (out, size) => ({
        label: 'Merged',
        showIndex: false,
        ptrs: {},
        cells: Array.from({ length: size }, (_, k) => (k < out.length ? cell(out[k], 'part') : ghost)),
      });

      const mergeView = (ctx, lo, mid, hi, L, R, i, j, out, merged, finished) => ({
        kind: 'array',
        max,
        chips: [{ label: 'Merging positions', value: `${span(lo, mid)} with ${span(mid + 1, hi)}` }],
        rows: [
          contextRow(ctx, lo, mid, hi, merged, finished),
          halfRow('Left half', L, i, 'L', 'left'),
          halfRow('Right half', R, j, 'R', 'right'),
          outRow(out, hi - lo + 1),
        ],
      });

      const plain = (state) => ({
        kind: 'array',
        max,
        chips: [],
        rows: [{ label: null, showIndex: true, ptrs: {}, cells: a.map((it) => cell(it, state)) }],
      });

      steps.push({
        line: 1,
        view: plain('idle'),
        prompt:
          'Merge Sort first splits the array in half, then splits those halves, and so on until every piece holds a single element. ' +
          'A single element is already sorted. Your job is the second phase: <b>merging</b> the sorted pieces back together.',
        ask: { type: 'info' },
      });

      function merge(lo, mid, hi) {
        merges++;
        const L = a.slice(lo, mid + 1);
        const R = a.slice(mid + 1, hi + 1);
        const ctx = a.slice();
        const merged = ctx.slice();
        const out = [];
        let i = 0;
        let j = 0;
        const last = lo === 0 && hi === n - 1;

        while (i < L.length && j < R.length) {
          comparisons++;
          const lf = L[i].v;
          const rf = R[j].v;
          const takeLeft = lf < rf;
          const answer = takeLeft ? 'L' + i : 'R' + j;
          const small = Math.min(lf, rf);
          const big = Math.max(lf, rf);
          const Lv = L.map((x) => x.v);
          const Rv = R.map((x) => x.v);
          const fi = i;
          const fj = j;
          const first = out.length === 0;
          const before = mergeView(ctx, lo, mid, hi, L, R, i, j, out.slice(), false, false);

          if (takeLeft) out.push(L[i++]);
          else out.push(R[j++]);

          let note = '';
          let done = false;
          if (i === L.length || j === R.length) {
            const leftOver = i < L.length;
            const rest = leftOver ? L.slice(i) : R.slice(j);
            note =
              ` The ${leftOver ? 'right' : 'left'} half is now empty, so the rest of the ${leftOver ? 'left' : 'right'} half ` +
              `(${list(rest.map((x) => x.v))}) is copied straight over.`;
            out.push(...rest);
            i = L.length;
            j = R.length;
            done = true;
            out.forEach((it, k) => (merged[lo + k] = it));
            if (last) note += ' That was the final merge, so the array is sorted!';
          }

          steps.push({
            line: 6,
            view: before,
            prompt: first
              ? `Merge the sorted halves <b>[${Lv.join(', ')}]</b> and <b>[${Rv.join(', ')}]</b>. Which element goes into the merged list first?`
              : 'Which element goes into the merged list next?',
            ask: { type: 'pick', answer: [answer] },
            hint: 'Each half is already sorted, so only its front element can be the smallest. Take the smaller of the two fronts.',
            correct: `Yes. ${small} < ${big}, so <b>${small}</b> goes next.` + note,
            wrong: ([k]) => {
              const side = k[0];
              const idx = +k.slice(1);
              const isFront = (side === 'L' && idx === fi) || (side === 'R' && idx === fj);
              if (!isFront) {
                return `Each half is already sorted, so only its <b>front</b> element can be next. Compare ${lf} and ${rf}.`;
              }
              return `${big} is bigger than ${small}. Take the <b>smaller</b> front element.`;
            },
            after: done
              ? mergeView(merged, lo, mid, hi, L, R, i, j, out.slice(), true, last)
              : mergeView(ctx, lo, mid, hi, L, R, i, j, out.slice(), false, false),
          });
        }

        out.forEach((it, k) => (a[lo + k] = it));
      }

      function sort(lo, hi) {
        if (lo >= hi) return;
        const mid = Math.floor((lo + hi) / 2);
        sort(lo, mid);
        sort(mid + 1, hi);
        merge(lo, mid, hi);
      }

      sort(0, n - 1);

      return {
        steps,
        final: plain('sorted'),
        stats: [
          ['Comparisons', comparisons],
          ['Merges', merges],
        ],
      };
    },
    trace(values) {
      const a = values.slice();
      const ev = [];
      const sort = (lo, hi) => {
        if (lo >= hi) return;
        const mid = Math.floor((lo + hi) / 2);
        sort(lo, mid);
        sort(mid + 1, hi);
        const L = a.slice(lo, mid + 1);
        const R = a.slice(mid + 1, hi + 1);
        let i = 0;
        let j = 0;
        let k = lo;
        while (i < L.length && j < R.length) {
          ev.push(['c', lo + i, mid + 1 + j]);
          a[k] = L[i] < R[j] ? L[i++] : R[j++];
          ev.push(['w', k, a[k]]);
          k++;
        }
        while (i < L.length) ev.push(['w', k, (a[k++] = L[i++])]);
        while (j < R.length) ev.push(['w', k, (a[k++] = R[j++])]);
      };
      sort(0, a.length - 1);
      return ev;
    },
  });
})();
