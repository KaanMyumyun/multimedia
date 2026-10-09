(function () {
  'use strict';
  const { register, distinct, randInt, items, arrayView, plural } = BTA;

  register({
    id: 'binary',
    name: 'Binary Search',
    group: 'Searching',
    blurb: 'Find a value in a sorted array by halving the search range each step.',
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)', stable: '—' },
    input: { label: 'Size', options: [7, 9, 11, 13, 15], default: 11, target: true, sorted: true },
    how: [
      'This only works on a <b>sorted</b> array.',
      'Look at the middle element of the current range.',
      'If it is the target, you are done. If the target is smaller, it can only be in the left half. If it is bigger, only the right half.',
      'Throw away the other half and repeat. If the range becomes empty, the target is not in the array.',
    ],
    code: [
      'lo ← 0; hi ← n − 1',
      'while lo ≤ hi',
      '  mid ← ⌊(lo + hi) / 2⌋',
      '  if a[mid] = target',
      '    return mid',
      '  else if a[mid] < target',
      '    lo ← mid + 1',
      '  else',
      '    hi ← mid − 1',
      'return "not found"',
    ],
    legend: [
      ['active', 'Middle element'],
      ['dim', 'Ruled out'],
      ['found', 'Found'],
    ],
    kinds: {
      middle: 'Finding the middle',
      direction: 'Left, right or found',
      absent: 'When to give up',
    },
    summary:
      'Every comparison halved the range that could still contain the target. ' +
      'An array of n elements can only be halved about log₂ n times, so even a million sorted values need at most 20 comparisons. ' +
      'The catch is that the data must be sorted, and you need fast access to any position (an array, not a linked list).',

    generate(n) {
      const values = distinct(n, 1, 99).sort((x, y) => x - y);
      let target;
      if (Math.random() < 0.75) {
        target = values[randInt(0, n - 1)];
      } else {
        do target = randInt(1, 99);
        while (values.includes(target));
      }
      return { values, target };
    },

    build({ values, target: t }) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let lo = 0;
      let hi = n - 1;
      let comparisons = 0;

      const view = (o = {}) => {
        const ptrs = {};
        const tag = (k, label) => {
          if (k >= 0 && k < n) (ptrs[k] = ptrs[k] || []).push(label);
        };
        if (lo <= hi) {
          tag(lo, 'lo');
          if (o.mid != null) tag(o.mid, 'mid');
          tag(hi, 'hi');
        }
        return arrayView(a, {
          max,
          ptrs,
          chips: [
            { label: 'Target', value: t, tone: 'accent' },
            { label: 'Range', value: lo <= hi ? `positions ${lo}–${hi}` : 'empty' },
          ],
          state: (k) =>
            k === o.found ? 'found' : k === o.mid ? 'active' : k < lo || k > hi ? 'dim' : 'idle',
        });
      };

      let foundAt = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const mv = a[mid].v;
        const L = lo;
        const H = hi;

        steps.push({
          line: 2,
          kind: 'middle',
          view: view(),
          prompt: `Search range: positions <b>${lo}</b> to <b>${hi}</b>. Click the <b>middle</b> element.`,
          ask: { type: 'pick', answer: [String(mid)] },
          hint: `mid = ⌊(lo + hi) / 2⌋, rounded down. Here that is ⌊(${lo} + ${hi}) / 2⌋.`,
          correct: `Right. mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}, which holds <b>${mv}</b>.`,
          wrong: ([k]) =>
            +k < L || +k > H
              ? 'That position is outside the search range. The dimmed part has already been ruled out.'
              : `Not the middle. Use mid = ⌊(lo + hi) / 2⌋ with lo = ${L} and hi = ${H}, rounding down.`,
          after: view({ mid }),
        });

        comparisons++;
        const before = view({ mid });
        let answer;
        let correct;
        if (mv === t) {
          answer = 'found';
          foundAt = mid;
          correct =
            `Found it! ${t} is at position ${mid}, after ${comparisons} ${plural(comparisons, 'comparison', 'comparisons')}. ` +
            `Checking every element one by one could have taken up to ${n}.`;
        } else if (t < mv) {
          answer = 'left';
          hi = mid - 1;
          correct = `Right. ${t} < ${mv}, and the array is sorted, so ${t} can only be to the <b>left</b>. Positions ${mid}–${H} are ruled out.`;
        } else {
          answer = 'right';
          lo = mid + 1;
          correct = `Right. ${t} > ${mv}, and the array is sorted, so ${t} can only be to the <b>right</b>. Positions ${L}–${mid} are ruled out.`;
        }

        steps.push({
          line: mv === t ? 3 : t > mv ? 5 : 7,
          kind: 'direction',
          view: before,
          prompt: `The middle value is <b>${mv}</b> and the target is <b>${t}</b>. What now?`,
          ask: {
            type: 'choice',
            answer,
            options: [
              { label: '← Search the left half', value: 'left' },
              { label: 'Found it!', value: 'found' },
              { label: 'Search the right half →', value: 'right' },
            ],
          },
          hint: `Is ${t} smaller than, equal to, or bigger than ${mv}?`,
          correct,
          wrong: (given) => {
            if (given === 'found') return `${mv} is not ${t}. Keep searching.`;
            if (mv === t) return `Look again: the middle value <b>is</b> ${t}.`;
            return t < mv
              ? `${t} < ${mv}. In a sorted array everything to the right of ${mv} is even bigger, so ${t} can’t be there.`
              : `${t} > ${mv}. In a sorted array everything to the left of ${mv} is even smaller, so ${t} can’t be there.`;
          },
          after: mv === t ? view({ found: mid }) : view(),
        });

        if (mv === t) break;
      }

      if (foundAt < 0) {
        steps.push({
          line: 9,
          kind: 'absent',
          view: view(),
          prompt: `Now lo = ${lo} and hi = ${hi}, so lo > hi and the search range is <b>empty</b>. What does that mean?`,
          ask: {
            type: 'choice',
            answer: 'absent',
            options: [
              { label: `${t} is not in the array`, value: 'absent' },
              { label: 'Start again from the beginning', value: 'again' },
            ],
          },
          hint: 'Every step only threw away positions that could not hold the target.',
          correct: `Exactly. Every position has been ruled out, so ${t} isn’t in the array. Proving that took only ${comparisons} comparisons.`,
          wrong: 'Every half that was thrown away could not contain the target. Searching again would rule out exactly the same positions.',
          after: view(),
        });
      }

      return {
        steps,
        final: foundAt >= 0 ? view({ found: foundAt }) : view(),
        stats: [
          ['Comparisons', comparisons],
          ['Array size', n],
        ],
      };
    },
  });
})();
