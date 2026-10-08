(function () {
  'use strict';
  const { register, distinct, searchTarget, items, arrayView, plural } = BTA;

  register({
    id: 'exponential',
    name: 'Exponential Search',
    group: 'Searching',
    blurb: 'Double the step until you pass the target, then binary search that stretch.',
    complexity: { best: 'O(1)', average: 'O(log i)', worst: 'O(log n)', space: 'O(1)', stable: '—' },
    input: { label: 'Size', options: [9, 12, 16, 20], default: 16, target: true, sorted: true },
    how: [
      'This only works on a <b>sorted</b> array.',
      'Check position 0, then positions 1, 2, 4, 8, … doubling each time, until the value there is at least the target.',
      'The target is now trapped between the last two positions checked.',
      'Binary search that stretch. If the target is near the start, the stretch is short, so this beats plain binary search there.',
    ],
    code: [
      'if a[0] = target: return 0',
      'i ← 1',
      'while i < n and a[i] < target',
      '  i ← i × 2',
      'lo ← ⌊i / 2⌋; hi ← min(i, n − 1)',
      'binary search a[lo..hi]',
    ],
    legend: [
      ['active', 'Being checked'],
      ['dim', 'Ruled out'],
      ['found', 'Found'],
    ],
    summary:
      'Exponential search first found a stretch that must contain the target by doubling its step: 1, 2, 4, 8, … ' +
      'If the target sits at position i, that takes about log₂ i checks, and the binary search afterwards takes about log₂ i more. ' +
      'So it is O(log i), which beats binary search when the target is near the front. ' +
      'It also works on lists with no known end, where you can’t pick a middle.',

    generate(n) {
      const values = distinct(n, 1, 99).sort((x, y) => x - y);
      return { values, target: searchTarget(values) };
    },

    build({ values, target: t }) {
      const a = items(values);
      const v = values;
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let lo = 0;
      let hi = n - 1;
      let comparisons = 0;

      const view = (o = {}) => {
        const ptrs = {};
        const tag = (k, label) => k >= 0 && k < n && (ptrs[k] = ptrs[k] || []).push(label);
        if (o.at != null) tag(o.at, o.tag || 'i');
        if (o.range && lo <= hi) {
          tag(lo, 'lo');
          tag(hi, 'hi');
        }
        return arrayView(a, {
          max,
          ptrs,
          chips: [
            { label: 'Target', value: t, tone: 'accent' },
            ...(o.range ? [{ label: 'Range', value: lo <= hi ? `positions ${lo}–${hi}` : 'empty' }] : []),
          ],
          state: (k) => (k === o.found ? 'found' : k === o.at ? 'active' : k < lo || k > hi ? 'dim' : 'idle'),
        });
      };

      const absent = (prompt, correct) => ({
        line: 5,
        view: view({ range: true }),
        prompt,
        ask: {
          type: 'choice',
          answer: 'absent',
          options: [
            { label: `${t} is not in the array`, value: 'absent' },
            { label: 'Start again from the beginning', value: 'again' },
          ],
        },
        hint: 'Every position that was ruled out could not hold the target.',
        correct,
        wrong: 'Each step only ruled out positions that could not hold the target. Starting again would rule out the same ones.',
        after: view({ range: true }),
      });

      // 1. Position 0
      comparisons++;
      const hit0 = v[0] === t;
      steps.push({
        line: 0,
        view: view({ at: 0 }),
        prompt: `Find <b>${t}</b>. Exponential search first checks position 0, which holds <b>${v[0]}</b>. What now?`,
        ask: {
          type: 'choice',
          answer: hit0 ? 'found' : 'double',
          options: [
            { label: 'Found it!', value: 'found' },
            { label: 'Not it, start doubling', value: 'double' },
          ],
        },
        hint: `Is ${v[0]} equal to ${t}?`,
        correct: hit0 ? `Found it, first time! ${t} is at position 0.` : `Right. ${v[0]} ≠ ${t}, so start checking positions 1, 2, 4, 8, …`,
        wrong: hit0 ? `Look again: ${v[0]} <b>is</b> the target.` : `${v[0]} is not ${t}.`,
        after: hit0 ? view({ found: 0 }) : view(),
      });
      if (hit0) {
        return { steps, final: view({ found: 0 }), stats: [['Comparisons', 1], ['Array size', n]] };
      }

      // 2. Doubling
      let i = 1;
      let prev = 0;
      for (;;) {
        const x = v[i];
        const P = prev;
        steps.push({
          line: 2,
          view: view(),
          prompt: 'Click the next position exponential search checks.',
          ask: { type: 'pick', answer: [String(i)], position: true },
          hint: 'The position doubles every time: 1, 2, 4, 8, 16, …',
          correct: `Right. Position ${i} holds <b>${x}</b>.`,
          wrong: ([k]) =>
            P === 0
              ? 'After position 0, exponential search checks position 1, then 2, 4, 8, … doubling each time.'
              : `It doubles the last position it checked, which was ${P}.`,
          after: view({ at: i }),
        });

        comparisons++;
        const before = view({ at: i });
        const again = x < t;
        const next = i * 2;
        if (again) lo = i;
        steps.push({
          line: again ? 3 : 4,
          view: before,
          prompt: `Position ${i} holds <b>${x}</b>, and the target is <b>${t}</b>. What now?`,
          ask: {
            type: 'choice',
            answer: again ? 'double' : 'stop',
            options: [
              { label: 'Smaller, so double and look further', value: 'double' },
              { label: 'At least the target, so stop doubling', value: 'stop' },
            ],
          },
          hint: `Is ${x} smaller than ${t}?`,
          correct: again
            ? `Right. ${x} < ${t}, so the target is further along. ` +
              (next < n ? `Next, position ${next}.` : `Doubling gives ${next}, which is past the end (n = ${n}), so stop and use the last position, ${n - 1}.`)
            : `Right. ${x} ≥ ${t}, so the target can’t be past position ${i}.`,
          wrong: again
            ? `${x} < ${t}. Everything up to position ${i} is too small, so keep going.`
            : `${x} ≥ ${t}. Everything after position ${i} is even bigger, so the target can’t be further on.`,
          after: view(),
        });

        if (!again) break;
        prev = i;
        i = next;
        if (i >= n) break;
      }

      // 3. The range to binary search
      lo = i >> 1;
      hi = Math.min(i, n - 1);
      const range = `${lo}–${hi}`;
      const opts = [];
      [`${lo}–${hi}`, `0–${hi}`, `${hi}–${n - 1}`, `${lo}–${n - 1}`].forEach((r) => {
        const [x, y] = r.split('–').map(Number);
        if (x < y && !opts.includes(r)) opts.push(r);
      });
      if (!opts.includes(range)) opts.unshift(range);
      opts.sort((p, q) => parseInt(p, 10) - parseInt(q, 10) || parseInt(p.split('–')[1], 10) - parseInt(q.split('–')[1], 10));

      steps.push({
        line: 4,
        view: view(),
        prompt: `Which positions does the binary search cover now? (The last position checked was ${i < n ? i : `${i}, past the end`}.)`,
        ask: {
          type: 'choice',
          answer: range,
          options: opts.map((r) => {
            const [x, y] = r.split('–');
            return { label: x === y ? `Position ${x}` : `Positions ${r}`, value: r };
          }),
        },
        hint: 'lo = ⌊i / 2⌋, the previous position checked, and hi = i, or the last position if i ran past the end.',
        correct:
          `Right. lo = ⌊${i} / 2⌋ = ${lo} and hi = ${i < n ? i : `min(${i}, ${n - 1}) = ${n - 1}`}. ` +
          (lo > 0 ? `Everything up to position ${lo} was smaller than ${t}` : 'Position 0 wasn’t it') +
          (i < n ? ` and a[${i}] = ${v[i]} is already at least ${t}` : '') +
          `, so ${t} can only be in positions ${range}.`,
        wrong: 'The target is trapped between the last two positions checked: the one that was too small and the one that wasn’t.',
        after: view({ range: true }),
      });

      // 4. Binary search
      let foundAt = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const mv = v[mid];
        const L = lo;
        const H = hi;

        steps.push({
          line: 5,
          view: view({ range: true }),
          prompt: `Binary search, positions <b>${lo}</b> to <b>${hi}</b>. Click the middle element.`,
          ask: { type: 'pick', answer: [String(mid)] },
          hint: `mid = ⌊(lo + hi) / 2⌋ = ⌊(${lo} + ${hi}) / 2⌋.`,
          correct: `Right. mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}, which holds <b>${mv}</b>.`,
          wrong: ([k]) =>
            +k < L || +k > H
              ? 'That position is outside the range. The dimmed part has already been ruled out.'
              : `Not the middle. Use ⌊(lo + hi) / 2⌋ with lo = ${L} and hi = ${H}.`,
          after: view({ range: true, at: mid, tag: 'mid' }),
        });

        comparisons++;
        const before = view({ range: true, at: mid, tag: 'mid' });
        let answer;
        let correct;
        if (mv === t) {
          answer = 'found';
          foundAt = mid;
          correct = `Found it! ${t} is at position ${mid}, after ${comparisons} ${plural(comparisons, 'comparison', 'comparisons')} in total.`;
        } else if (t < mv) {
          answer = 'left';
          hi = mid - 1;
          correct = `Right. ${t} < ${mv}, so ${t} can only be to the <b>left</b>.`;
        } else {
          answer = 'right';
          lo = mid + 1;
          correct = `Right. ${t} > ${mv}, so ${t} can only be to the <b>right</b>.`;
        }

        steps.push({
          line: 5,
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
            return t < mv ? `${t} < ${mv}, so it can’t be to the right of ${mv}.` : `${t} > ${mv}, so it can’t be to the left of ${mv}.`;
          },
          after: mv === t ? view({ range: true, found: mid }) : view({ range: true }),
        });
        if (mv === t) break;
      }

      if (foundAt < 0) {
        steps.push(
          absent(
            `Now lo = ${lo} and hi = ${hi}, so the range is <b>empty</b>. What does that mean?`,
            `Exactly. Every position that could hold ${t} has been ruled out, so it isn’t in the array.`,
          ),
        );
      }

      return {
        steps,
        final: foundAt >= 0 ? view({ found: foundAt, range: true }) : view({ range: true }),
        stats: [
          ['Comparisons', comparisons],
          ['Array size', n],
        ],
      };
    },
  });
})();
