(function () {
  'use strict';
  const { register, unsorted, items, arrayView } = BTA;

  register({
    id: 'bubble',
    name: 'Bubble Sort',
    group: 'Sorting',
    blurb: 'Walk through the array, swapping neighbours that are out of order.',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 5 },
    how: [
      'Compare neighbouring elements, starting from the left.',
      'If the left one is bigger, swap them.',
      'After one pass the largest value has “bubbled” to the end. It is now in its final place.',
      'Repeat, stopping one element earlier each pass. If a pass makes no swaps, the array is sorted.',
    ],
    code: [
      'for pass ← 0 to n − 2',
      '  swapped ← false',
      '  for j ← 0 to n − 2 − pass',
      '    if a[j] > a[j + 1]',
      '      swap a[j], a[j + 1]',
      '      swapped ← true',
      '  if not swapped: stop',
    ],
    legend: [
      ['active', 'Being compared'],
      ['sorted', 'In its final place'],
    ],
    summary:
      'Every pass compared neighbours and carried the largest remaining value to the end, so after k passes the last k elements were final. ' +
      'In the worst case that is about n²/2 comparisons, which is why Bubble Sort is rarely used on large data. ' +
      'It is simple, sorts in place, is stable, and can stop early when a pass makes no swaps — so it is quick on nearly-sorted input.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let sortedFrom = n; // indices >= sortedFrom are in their final place
      let comparisons = 0;
      let swaps = 0;

      const view = (hl = []) =>
        arrayView(a, {
          max,
          state: (i) => (i >= sortedFrom ? 'sorted' : hl.includes(i) ? 'active' : 'idle'),
        });

      for (let pass = 0; pass < n - 1; pass++) {
        let swapped = false;
        const last = n - 2 - pass;

        for (let j = 0; j <= last; j++) {
          const x = a[j].v;
          const y = a[j + 1].v;

          if (j === 0) {
            const limit = sortedFrom;
            steps.push({
              line: 2,
              view: view(),
              prompt: `<b>Pass ${pass + 1}.</b> Click the first two elements Bubble Sort compares.`,
              ask: { type: 'pick', count: 2, answer: ['0', '1'] },
              hint: 'Every pass starts at the very beginning of the array and compares neighbours.',
              correct:
                pass === 0
                  ? `Right. Bubble Sort compares neighbours, starting with <b>${x}</b> and <b>${y}</b>.`
                  : `Right. Every pass starts again from the left: <b>${x}</b> and <b>${y}</b>.`,
              wrong: (given) => {
                const [p, q] = given.map(Number).sort((m, k) => m - k);
                if (q >= limit) return 'The green elements are already in their final place. A pass stops before them.';
                if (q - p !== 1) return 'Not quite. Bubble Sort only compares <b>adjacent</b> elements (neighbours).';
                return 'Those are neighbours, but every pass starts at the <b>beginning</b> of the array.';
              },
              after: view([0, 1]),
            });
          }

          comparisons++;
          const doSwap = x > y;
          const before = view([j, j + 1]);
          if (doSwap) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            swapped = true;
            swaps++;
          }

          let note = '';
          if (j === last) {
            if (pass === n - 2) {
              sortedFrom = 0;
              note = ' That was the last pass, so the whole array is sorted!';
            } else {
              sortedFrom = n - 1 - pass;
              note = ` Pass ${pass + 1} is done: <b>${a[sortedFrom].v}</b> has bubbled to the end and is locked in place.`;
            }
          }

          steps.push({
            line: 3,
            view: before,
            prompt: `Compare <b>${x}</b> and <b>${y}</b>. Swap them or keep them?`,
            ask: {
              type: 'choice',
              answer: doSwap ? 'swap' : 'keep',
              options: [
                { label: 'Swap', value: 'swap' },
                { label: 'Keep', value: 'keep' },
              ],
            },
            hint: 'Bubble Sort swaps only when the left element is bigger than the right one.',
            correct:
              (doSwap
                ? `Correct! <b>${y}</b> is smaller than <b>${x}</b>, so Bubble Sort swaps them.`
                : `Correct! <b>${x}</b> is smaller than <b>${y}</b>. They are already in order, so they stay.`) + note,
            wrong: doSwap
              ? `Not quite. ${x} > ${y}: the bigger value belongs on the right, so they must swap.`
              : `Not quite. ${x} < ${y} is already in order. Bubble Sort only swaps when the left one is bigger.`,
            after: view(j === last ? [] : [j, j + 1]),
          });
        }

        if (!swapped && pass < n - 2) {
          const before = view();
          sortedFrom = 0;
          steps.push({
            line: 6,
            view: before,
            prompt: `Pass ${pass + 1} finished without a single swap. What does that tell you?`,
            ask: {
              type: 'choice',
              answer: 'stop',
              options: [
                { label: 'The array is sorted, so stop', value: 'stop' },
                { label: 'Start another pass', value: 'more' },
              ],
            },
            hint: 'If no neighbours were out of order, could another pass find any?',
            correct:
              'Exactly. No pair of neighbours was out of order, so every element is already in place. ' +
              'This early exit is why Bubble Sort’s best case is O(n).',
            wrong: 'Think about it: no pair was out of order in this pass, so another pass would find exactly the same thing.',
            after: view(),
          });
          break;
        }
      }

      sortedFrom = 0;
      return {
        steps,
        final: view(),
        stats: [
          ['Comparisons', comparisons],
          ['Swaps', swaps],
        ],
      };
    },
  });
})();
