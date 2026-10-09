(function () {
  'use strict';
  const { register, unsorted, items, arrayView } = BTA;

  register({
    id: 'selection',
    name: 'Selection Sort',
    group: 'Sorting',
    blurb: 'Find the smallest remaining value and move it to the front.',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'No' },
    input: { label: 'Size', options: [4, 5, 6, 7, 8], default: 6 },
    how: [
      'The array has a sorted part (left) and an unsorted part (right). At first everything is unsorted.',
      'Scan the unsorted part for its smallest value.',
      'Swap it into the first unsorted position. The sorted part grows by one.',
      'Repeat until one element is left. It must be the largest, so it is already in place.',
    ],
    code: [
      'for i ← 0 to n − 2',
      '  min ← i',
      '  for j ← i + 1 to n − 1',
      '    if a[j] < a[min]: min ← j',
      '  swap a[i], a[min]',
    ],
    legend: [
      ['min', 'Smallest found'],
      ['active', 'Target position'],
      ['sorted', 'In its final place'],
    ],
    kinds: {
      min: 'Finding the smallest',
      place: 'Where the smallest goes',
    },
    summary:
      'Each round scanned the whole unsorted part to find its minimum, then made a single swap. ' +
      'That always costs about n²/2 comparisons, even on sorted input, but at most n − 1 swaps. ' +
      'Selection Sort is handy when writing to memory is expensive. It is not stable: a long-distance swap can reorder equal values.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let sortedTo = 0; // indices < sortedTo are final
      let comparisons = 0;
      let swaps = 0;

      const view = (o = {}) =>
        arrayView(a, {
          max,
          state: (k) => (k < sortedTo ? 'sorted' : k === o.min ? 'min' : k === o.target ? 'active' : 'idle'),
        });

      for (let i = 0; i < n - 1; i++) {
        let m = i;
        for (let j = i + 1; j < n; j++) {
          comparisons++;
          if (a[j].v < a[m].v) m = j;
        }
        const vals = a.map((x) => x.v);
        const mv = vals[m];

        steps.push({
          line: 3,
          kind: 'min',
          view: view(),
          prompt: `Find the <b>smallest</b> value in the unsorted part (positions ${i}–${n - 1}) and click it.`,
          ask: { type: 'pick', answer: [String(m)] },
          hint: 'Only look at the elements that are not green yet. Which one is the smallest?',
          correct: `Yes. <b>${mv}</b> is the smallest of the unsorted values.`,
          wrong: ([k]) =>
            +k < i
              ? 'That one is already sorted. Look only at the unsorted part (not green).'
              : `${vals[+k]} isn’t the smallest. There is a smaller value in the unsorted part.`,
          after: view({ min: m }),
        });

        const displaced = vals[i];
        const before = view({ min: m });
        if (m !== i) {
          [a[i], a[m]] = [a[m], a[i]];
          swaps++;
        }
        sortedTo = i === n - 2 ? n : i + 1;

        steps.push({
          line: 4,
          kind: 'place',
          view: before,
          prompt: `Where does <b>${mv}</b> go? Click its new position.`,
          ask: { type: 'pick', answer: [String(i)], position: true },
          hint: 'Selection Sort grows the sorted part from the left, one position at a time.',
          correct:
            (m === i
              ? `Right. ${mv} is already at the front of the unsorted part (position ${i}), so no swap is needed.`
              : `Right. ${mv} swaps with ${displaced}, and position ${i} is now final.`) +
            (i === n - 2 ? ` Only ${a[n - 1].v} is left, so it must be the largest. The array is sorted!` : ''),
          wrong: ([k]) =>
            +k < i
              ? 'That position is already taken by a sorted element.'
              : `Selection Sort puts the minimum at the <b>front of the unsorted part</b>. Which position is that?`,
          after: view(),
        });
      }

      sortedTo = n;
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
      for (let i = 0; i < n - 1; i++) {
        let m = i;
        for (let j = i + 1; j < n; j++) {
          ev.push(['c', j, m]);
          if (a[j] < a[m]) m = j;
        }
        if (m !== i) {
          [a[i], a[m]] = [a[m], a[i]];
          ev.push(['s', i, m]);
        }
      }
      return ev;
    },
  });
})();
