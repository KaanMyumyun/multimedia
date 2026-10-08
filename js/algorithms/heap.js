(function () {
  'use strict';
  const { register, unsorted, items, arrayView, list, plural } = BTA;

  register({
    id: 'heap',
    name: 'Heap Sort',
    group: 'Sorting',
    blurb: 'Build a max-heap, then repeatedly move its root (the maximum) to the end.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: 'No' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 6 },
    how: [
      'Read the array as a binary tree: position i has children 2i + 1 and 2i + 2.',
      'Build a max-heap, where every parent is at least as big as its children. Sift values down, starting from the last parent and working back to the root.',
      'The root is now the maximum. Swap it with the last heap element and shrink the heap by one.',
      'Sift the new root down to restore the heap, then repeat.',
    ],
    code: [
      'for i ← ⌊n/2⌋ − 1 down to 0',
      '  siftDown(i, n)',
      'for end ← n − 1 down to 1',
      '  swap a[0], a[end]',
      '  siftDown(0, end)',
      'siftDown(i, size):',
      '  big ← max of a[i], children',
      '  if big ≠ i',
      '    swap a[i], a[big]',
      '    siftDown(big, size)',
    ],
    legend: [
      ['key', 'Sifting down'],
      ['active', 'Its children'],
      ['sorted', 'In its final place'],
    ],
    summary:
      'First you turned the array into a max-heap by sifting parents down. Then you repeatedly swapped the root (the maximum) to the end and repaired the heap. ' +
      'The heap is about log₂ n levels tall, so each repair costs O(log n), which gives O(n log n) overall, even in the worst case. ' +
      'Heap Sort uses no extra memory. It is not stable, and it tends to be slower than Quick Sort in practice because it jumps around in memory.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let size = n; // heap occupies [0, size)
      let comparisons = 0;
      let swaps = 0;

      const view = (o = {}) =>
        arrayView(a, {
          max,
          tree: size,
          chips: [{ label: 'Heap size', value: size }],
          state: (k) =>
            k >= size ? 'sorted' : k === o.focus ? 'key' : o.hl && o.hl.includes(k) ? 'active' : 'idle',
        });

      function sift(i, phase) {
        for (;;) {
          const l = 2 * i + 1;
          const r = 2 * i + 2;
          if (l >= size) return;
          const kids = r < size ? [l, r] : [l];
          let big = i;
          for (const c of kids) if (a[c].v > a[big].v) big = c;
          comparisons += kids.length;

          const at = i; // i changes as the value sinks; the closures below need this step's value
          const vals = a.map((x) => x.v);
          const v = vals[at];
          const kidVals = kids.map((k) => vals[k]);
          const childWord = plural(kids.length, 'child', 'children');
          const before = view({ focus: i, hl: kids });
          const continues = big !== i && 2 * big + 1 < size;

          if (big !== i) {
            [a[i], a[big]] = [a[big], a[i]];
            swaps++;
          }

          steps.push({
            line: 6,
            view: before,
            prompt:
              `${phase === 'build' ? 'Build the heap. ' : ''}Sift <b>${v}</b> down: compare it with its ${childWord} ` +
              `(${list(kidVals)}). Click the value that belongs on top.`,
            ask: { type: 'pick', answer: [String(big)] },
            hint: 'In a max-heap every parent is at least as big as its children, so the largest of these goes on top.',
            correct:
              big === i
                ? `Right. ${v} is already bigger than its ${childWord}, so it stays. This part of the tree is a valid heap.`
                : `Right. ${vals[big]} is the largest, so it swaps with ${v}.` +
                  (continues ? ` ${v} keeps sinking: next it is compared with its new children.` : ` ${v} has reached the bottom.`),
            wrong: ([k]) => {
              const p = +k;
              if (p !== at && !kids.includes(p)) {
                return `Only ${v} and its ${childWord} (highlighted) are compared in this step.`;
              }
              return `${vals[p]} isn’t the largest of the ${kids.length + 1}. A parent must be at least as big as its children.`;
            },
            after: view({ focus: big !== i ? big : undefined, hl: big !== i ? [i] : [] }),
          });

          if (big === i) return;
          i = big;
        }
      }

      steps.push({
        line: 0,
        view: view(),
        prompt:
          'The tree is just another way of drawing the array: position <i>i</i> has children <i>2i + 1</i> and <i>2i + 2</i>. ' +
          '<b>Phase 1:</b> turn it into a <b>max-heap</b>, where every parent is at least as big as its children. ' +
          'Fix the parents one by one, from the last parent back to the root.',
        ask: { type: 'info' },
      });

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) sift(i, 'build');

      steps.push({
        line: 2,
        view: view(),
        prompt:
          `The array is now a max-heap, and the biggest value (${a[0].v}) sits at the root. ` +
          '<b>Phase 2:</b> repeatedly move the root to the end of the heap, shrink the heap, and repair it.',
        ask: { type: 'info' },
      });

      for (let end = n - 1; end >= 1; end--) {
        const vals = a.map((x) => x.v);
        const before = view();
        [a[0], a[end]] = [a[end], a[0]];
        swaps++;
        size = end === 1 ? 0 : end;

        steps.push({
          line: 3,
          view: before,
          prompt: `Which element moves to position ${end}, the end of the heap?`,
          ask: { type: 'pick', answer: ['0'] },
          hint: 'Heap Sort fills the array from the back with the largest remaining value. Where does a max-heap keep its largest value?',
          correct:
            `Right. The root <b>${vals[0]}</b> is the largest value in the heap. It swaps with ${vals[end]} and is now in its final place.` +
            (end === 1 ? ' Only one element is left, so it is in place too. Sorted!' : ''),
          wrong: ([k]) =>
            +k >= end + 1
              ? 'That element is already sorted and no longer part of the heap.'
              : 'In a max-heap the biggest value is always at the <b>root</b>: position 0, the top of the tree.',
          after: view(),
        });

        sift(0, 'extract');
      }

      size = 0;
      return {
        steps,
        final: view(),
        stats: [
          ['Comparisons', comparisons],
          ['Swaps', swaps],
        ],
      };
    },
    trace(values) {
      const a = values.slice();
      const n = a.length;
      const ev = [];
      const sift = (i, size) => {
        for (;;) {
          let big = i;
          for (const c of [2 * i + 1, 2 * i + 2]) {
            if (c >= size) continue;
            ev.push(['c', c, big]);
            if (a[c] > a[big]) big = c;
          }
          if (big === i) return;
          [a[i], a[big]] = [a[big], a[i]];
          ev.push(['s', i, big]);
          i = big;
        }
      };
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) sift(i, n);
      for (let end = n - 1; end >= 1; end--) {
        [a[0], a[end]] = [a[end], a[0]];
        ev.push(['s', 0, end]);
        sift(0, end);
      }
      return ev;
    },
  });
})();
