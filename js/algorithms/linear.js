(function () {
  'use strict';
  const { register, distinct, searchTarget, items, arrayView, plural } = BTA;

  register({
    id: 'linear',
    name: 'Linear Search',
    group: 'Searching',
    blurb: 'Check the elements one after another until you find the target.',
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)', stable: '—' },
    input: { label: 'Size', options: [6, 8, 10, 12], default: 8 },
    how: [
      'Start at the first element.',
      'Compare it with the target. If they match, you are done.',
      'If not, move on to the next element.',
      'If you run off the end, the target is not in the array. This works on any array, sorted or not.',
    ],
    code: [
      'for i ← 0 to n − 1',
      '  if a[i] = target',
      '    return i',
      'return "not found"',
    ],
    legend: [
      ['active', 'Being checked'],
      ['dim', 'Already checked'],
      ['found', 'Found'],
    ],
    summary:
      'Linear search checked the elements one by one. It needs no preparation and works on unsorted data, ' +
      'but in the worst case it looks at all n elements, so it is O(n). ' +
      'If the data is sorted, binary search does the same job in O(log n).',

    generate(n) {
      const values = distinct(n, 1, 99);
      return { values, target: searchTarget(values) };
    },

    build({ values, target: t }) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let comparisons = 0;

      const view = (o = {}) =>
        arrayView(a, {
          max,
          ptrs: o.at != null && o.at < n ? { [o.at]: ['i'] } : {},
          chips: [{ label: 'Target', value: t, tone: 'accent' }],
          state: (k) => (k === o.found ? 'found' : k === o.at ? 'active' : k < (o.checked ?? 0) ? 'dim' : 'idle'),
        });

      steps.push({
        line: 0,
        view: view(),
        prompt: `Find <b>${t}</b>. Click the element linear search checks first.`,
        ask: { type: 'pick', answer: ['0'] },
        hint: 'Linear search goes through the array in order, from the very beginning.',
        correct: `Right. Linear search starts at position 0, which holds <b>${a[0].v}</b>.`,
        wrong: 'Linear search knows nothing about where the target might be, so it starts at the very beginning.',
        after: view({ at: 0 }),
      });

      let foundAt = -1;
      for (let i = 0; i < n; i++) {
        const v = a[i].v;
        const hit = v === t;
        comparisons++;
        steps.push({
          line: 1,
          view: view({ at: i, checked: i }),
          prompt: `Position ${i} holds <b>${v}</b>. The target is <b>${t}</b>. What now?`,
          ask: {
            type: 'choice',
            answer: hit ? 'found' : 'next',
            options: [
              { label: 'Found it!', value: 'found' },
              { label: i === n - 1 ? 'Not it, and that was the last one' : 'Not it, check the next one', value: 'next' },
            ],
          },
          hint: `Is ${v} equal to ${t}?`,
          correct: hit
            ? `Found it! ${t} is at position ${i}, after ${comparisons} ${plural(comparisons, 'comparison', 'comparisons')}.`
            : `Right. ${v} ≠ ${t}, so linear search moves on${i === n - 1 ? ', but there is nothing left' : ''}.`,
          wrong: hit ? `Look again: ${v} <b>is</b> the target.` : `${v} is not ${t}.`,
          after: hit ? view({ found: i, checked: i }) : view({ at: i + 1, checked: i + 1 }),
        });
        if (hit) {
          foundAt = i;
          break;
        }
      }

      if (foundAt < 0) {
        steps.push({
          line: 3,
          view: view({ checked: n }),
          prompt: `Linear search has checked all ${n} elements. What does that mean?`,
          ask: {
            type: 'choice',
            answer: 'absent',
            options: [
              { label: `${t} is not in the array`, value: 'absent' },
              { label: 'Start again from the beginning', value: 'again' },
            ],
          },
          hint: 'Every element has been compared with the target exactly once.',
          correct: `Exactly. Every element was checked and none matched, so ${t} isn’t in the array. That is the worst case: ${n} comparisons.`,
          wrong: 'Every element has already been compared with the target. Going round again would find exactly the same thing.',
          after: view({ checked: n }),
        });
      }

      return {
        steps,
        final: foundAt >= 0 ? view({ found: foundAt, checked: foundAt }) : view({ checked: n }),
        stats: [
          ['Comparisons', comparisons],
          ['Array size', n],
        ],
      };
    },
  });
})();
