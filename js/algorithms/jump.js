(function () {
  'use strict';
  const { register, distinct, searchTarget, items, arrayView, plural } = BTA;

  const absentStep = (line, view, prompt, correct, t) => ({
    line,
    view,
    prompt,
    ask: {
      type: 'choice',
      answer: 'absent',
      options: [
        { label: `${t} is not in the array`, value: 'absent' },
        { label: 'Start again from the beginning', value: 'again' },
      ],
    },
    hint: 'Everything that was skipped or scanned could not hold the target.',
    correct,
    wrong: 'Each step only ruled out positions that could not hold the target. Starting again would rule out the same ones.',
    after: view,
  });

  register({
    id: 'jump',
    name: 'Jump Search',
    group: 'Searching',
    blurb: 'Jump ahead a block at a time, then scan back through one block.',
    complexity: { best: 'O(1)', average: 'O(√n)', worst: 'O(√n)', space: 'O(1)', stable: '—' },
    input: { label: 'Size', options: [9, 16, 25], default: 16, target: true, sorted: true },
    how: [
      'This only works on a <b>sorted</b> array.',
      'Split the array into blocks of ⌊√n⌋ elements.',
      'Jump from block to block, checking only the last element of each, until one is at least the target.',
      'The target can only be in that block, so scan it from the start. √n jumps plus a √n scan gives O(√n).',
    ],
    code: [
      'm ← ⌊√n⌋; start ← 0',
      'while a[min(start + m, n) − 1] < target',
      '  start ← start + m',
      '  if start ≥ n: return "not found"',
      'for i ← start to min(start + m, n) − 1',
      '  if a[i] = target: return i',
      '  if a[i] > target: return "not found"',
    ],
    legend: [
      ['active', 'Being checked'],
      ['left', 'Block being scanned'],
      ['dim', 'Ruled out'],
      ['found', 'Found'],
    ],
    summary:
      'Jump search skipped through the sorted array a block at a time, so it only checked one element per block. ' +
      'Once a block’s last element was at least the target, it scanned just that block. ' +
      'With blocks of √n that is at most about 2√n comparisons: better than linear search’s n, worse than binary search’s log₂ n. ' +
      'It is useful when jumping backwards is expensive, because it only ever steps back once.',

    generate(n) {
      const values = distinct(n, 1, 99).sort((x, y) => x - y);
      return { values, target: searchTarget(values) };
    },

    build({ values, target: t }) {
      const a = items(values);
      const n = a.length;
      const m = Math.floor(Math.sqrt(n));
      const max = Math.max(...values);
      const steps = [];
      let lo = 0; // positions before lo are ruled out
      let hi = n - 1; // positions after hi are ruled out
      let comparisons = 0;

      const view = (o = {}) =>
        arrayView(a, {
          max,
          ptrs: o.at != null ? { [o.at]: [o.tag || 'i'] } : {},
          chips: [
            { label: 'Target', value: t, tone: 'accent' },
            { label: 'Block size', value: m },
          ],
          state: (k) =>
            k === o.found
              ? 'found'
              : k === o.at
                ? 'active'
                : k < lo || k > hi
                  ? 'dim'
                  : o.block && k >= o.block[0] && k <= o.block[1]
                    ? 'left'
                    : 'idle',
        });

      // The block size
      const opts = [];
      const add = (x) => x >= 1 && !opts.includes(x) && opts.push(x);
      [m, 2 * m, Math.ceil(n / 2), Math.floor(Math.log2(n))].forEach(add);
      if (opts.length < 3) add(n);
      opts.sort((x, y) => x - y);

      steps.push({
        line: 0,
        view: view(),
        prompt: `Jump search moves in blocks of ⌊√n⌋ elements. This array has n = ${n}. How big is each block?`,
        ask: { type: 'choice', answer: String(m), options: opts.map((x) => ({ label: String(x), value: String(x) })) },
        hint: `What is √${n}?`,
        correct: `Right: √${n} = ${m}. Jump search looks at one element per block of ${m} until it gets close.`,
        wrong: `Not quite. The block size is ⌊√n⌋, and n = ${n}.`,
        after: view(),
      });

      let start = 0;
      let foundAt = -1;
      for (;;) {
        const end = Math.min(start + m, n) - 1;
        const v = a[end].v;
        const S = start;

        steps.push({
          line: 1,
          view: view(),
          prompt:
            S === 0
              ? `Find <b>${t}</b>. Click the first element jump search checks.`
              : 'Click the element jump search checks next.',
          ask: { type: 'pick', answer: [String(end)] },
          hint: `It checks the <b>last</b> element of the block of ${m} that starts at position ${S}.`,
          correct: `Right. Position ${end} is the end of the block ${S}–${end}, and it holds <b>${v}</b>.`,
          wrong: ([k]) =>
            +k < S
              ? 'That part of the array has already been ruled out.'
              : `Jump search checks the <b>last</b> element of the block of ${m} that starts at position ${S}.`,
          after: view({ at: end, tag: 'jump' }),
        });

        comparisons++;
        const before = view({ at: end, tag: 'jump' });
        const prompt = `The end of this block holds <b>${v}</b>, and the target is <b>${t}</b>. What now?`;
        const ask = (answer) => ({
          type: 'choice',
          answer,
          options: [
            { label: 'Jump to the next block', value: 'jump' },
            { label: 'Scan this block', value: 'scan' },
          ],
        });
        const hint = `If ${v} is smaller than ${t}, could ${t} be anywhere in this block?`;

        if (v < t) {
          start += m;
          lo = start;
          const last = start >= n;
          steps.push({
            line: 2,
            view: before,
            prompt,
            ask: ask('jump'),
            hint,
            correct:
              `Right. ${v} < ${t}, and nothing in this block is bigger than ${v}, so ${t} can’t be here.` +
              (last ? ' But that was the last block.' : ' Jump to the next block.'),
            wrong: `${v} < ${t}. Every element in this block is at most ${v}, so ${t} can’t be in it.`,
            after: view(),
          });
          if (last) {
            steps.push(
              absentStep(
                3,
                view(),
                'There are no blocks left. What does that mean?',
                `Exactly. Even the last element, ${v}, is smaller than ${t}, so ${t} isn’t in the array.`,
                t,
              ),
            );
            break;
          }
          continue;
        }

        hi = end;
        steps.push({
          line: 4,
          view: before,
          prompt,
          ask: ask('scan'),
          hint,
          correct: `Right. ${v} ≥ ${t}, so ${t} can’t be any further on. If it is in the array, it is in this block (positions ${S}–${end}). Scan it from the start.`,
          wrong: `${v} ≥ ${t}, and the array is sorted, so everything after this block is even bigger. ${t} is in this block or nowhere.`,
          after: view({ block: [S, end] }),
        });

        for (let i = S; i <= end; i++) {
          const x = a[i].v;
          comparisons++;
          const answer = x === t ? 'found' : x < t ? 'next' : 'absent';
          const before = view({ at: i, block: [i, end] });
          let after;
          if (answer === 'found') {
            foundAt = i;
            after = view({ found: i });
          } else if (answer === 'next') {
            lo = i + 1;
            after = view({ at: i + 1, block: [i + 1, end] });
          } else {
            lo = n;
            after = view();
          }

          steps.push({
            line: answer === 'found' ? 5 : answer === 'absent' ? 6 : 4,
            view: before,
            prompt: `Scanning: position ${i} holds <b>${x}</b>. The target is <b>${t}</b>. What now?`,
            ask: {
              type: 'choice',
              answer,
              options: [
                { label: 'Found it!', value: 'found' },
                { label: 'Smaller, check the next one', value: 'next' },
                { label: 'Bigger, so the target isn’t here', value: 'absent' },
              ],
            },
            hint: `Compare ${x} with ${t}. The array is sorted, so once you pass ${t} it can’t turn up later.`,
            correct:
              answer === 'found'
                ? `Found it! ${t} is at position ${i}, after ${comparisons} ${plural(comparisons, 'comparison', 'comparisons')}.`
                : answer === 'next'
                  ? `Right. ${x} < ${t}, so keep scanning.`
                  : `Exactly. ${x} > ${t}, and in a sorted array ${t} would have come before ${x}. It isn’t in the array.`,
            wrong: (given) => {
              if (given === 'found') return `${x} is not ${t}.`;
              if (answer === 'found') return `Look again: ${x} <b>is</b> the target.`;
              return x < t
                ? `${x} < ${t}, so the target could still be further along this block.`
                : `${x} > ${t}. In a sorted array, ${t} would have appeared before ${x}.`;
            },
            after,
          });
          if (answer !== 'next') break;
        }
        break;
      }

      return {
        steps,
        final: foundAt >= 0 ? view({ found: foundAt }) : view(),
        stats: [
          ['Comparisons', comparisons],
          ['Linear search worst case', n],
        ],
      };
    },
  });
})();
