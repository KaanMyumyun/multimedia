(function () {
  'use strict';
  const { register, unsorted, items, arrayView, list, plural } = BTA;

  const gapsFor = (n) => {
    const gaps = [];
    for (let g = Math.floor(n / 2); g > 0; g = Math.floor(g / 2)) gaps.push(g);
    return gaps;
  };

  register({
    id: 'shell',
    name: 'Shell Sort',
    group: 'Sorting',
    blurb: 'Insertion sort on elements far apart first, then closer and closer together.',
    complexity: { best: 'O(n log n)', average: 'O(n√n)', worst: 'O(n²)', space: 'O(1)', stable: 'No' },
    input: { label: 'Size', options: [5, 6, 7, 8, 9], default: 7 },
    how: [
      'Insertion sort is slow when a small value starts far to the right, because it only moves one step at a time.',
      'Shell sort starts with a big gap (here ⌊n/2⌋) and insertion-sorts the elements that are that gap apart.',
      'Then it halves the gap and does it again, so far-off elements make big jumps early on.',
      'The last pass has gap 1, which is plain insertion sort. By then the array is nearly sorted, so it is quick.',
    ],
    code: [
      'gap ← ⌊n / 2⌋',
      'while gap > 0',
      '  for i ← gap to n − 1',
      '    key ← a[i]; j ← i',
      '    while j ≥ gap and a[j − gap] > key',
      '      a[j] ← a[j − gap]; j ← j − gap',
      '    a[j] ← key',
      '  gap ← ⌊gap / 2⌋',
    ],
    legend: [
      ['left', 'Same gap group as the key'],
      ['key', 'Key being inserted'],
      ['sorted', 'Finished'],
    ],
    summary:
      'Each pass was an insertion sort on elements a fixed gap apart. The early, wide gaps moved far-off elements most of the way in a few jumps, ' +
      'so the final gap-1 pass (plain insertion sort) had little left to do. ' +
      'With the simple “halve the gap” sequence the worst case is still O(n²), but in practice it is much faster than insertion sort. ' +
      'Better gap sequences bring it down to about O(n^1.3). It sorts in place but is not stable.',

    generate: (n) => unsorted(n),

    build(values) {
      const a = items(values);
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let finished = false;
      let comparisons = 0;
      let shifts = 0;

      const view = (o = {}) =>
        arrayView(a, {
          max,
          lifted: o.key,
          chips: o.gap ? [{ label: 'Gap', value: o.gap }] : [],
          state: (k) =>
            finished ? 'sorted' : k === o.key ? 'key' : o.group && o.group.includes(k) ? 'left' : 'idle',
        });

      const gaps = gapsFor(n);
      gaps.forEach((gap, gi) => {
        const prev = gaps[gi - 1];
        const opts = [gap - 1, gap, gap + 1, gap + 2].filter((x) => x >= 1).slice(0, 3);

        steps.push({
          line: gi === 0 ? 0 : 7,
          view: view(),
          prompt:
            gi === 0
              ? `Shell sort starts with gap ⌊n / 2⌋, and this array has n = ${n}. What is the first gap?`
              : `The gap-${prev} pass is done. What is the next gap?`,
          ask: { type: 'choice', answer: String(gap), options: opts.map((x) => ({ label: String(x), value: String(x) })) },
          hint: gi === 0 ? `Halve ${n} and round down.` : `Halve ${prev} and round down.`,
          correct:
            gap === 1
              ? `Right: gap ${gi === 0 ? `⌊${n} / 2⌋` : `⌊${prev} / 2⌋`} = 1. A gap-1 pass is plain insertion sort, and it finishes the job.`
              : `Right: gap ${gi === 0 ? `⌊${n} / 2⌋` : `⌊${prev} / 2⌋`} = ${gap}. Now insertion-sort the elements that are ${gap} apart.`,
          wrong: `Not quite. The gap is ⌊${gi === 0 ? 'n' : 'gap'} / 2⌋, rounded down, with ${gi === 0 ? 'n' : 'gap'} = ${gi === 0 ? n : prev}.`,
          after: view({ gap }),
        });

        for (let i = gap; i < n; i++) {
          const vals = a.map((x) => x.v);
          const key = vals[i];
          const group = [];
          for (let k = i % gap; k <= i; k += gap) group.push(k);
          let pos = i;
          while (pos >= gap && vals[pos - gap] > key) pos -= gap;
          const moved = group.filter((k) => k >= pos && k < i).map((k) => vals[k]);
          comparisons += (i - pos) / gap + (pos >= gap ? 1 : 0);
          shifts += moved.length;

          const before = view({ gap, key: i, group });
          const keyItem = a[i];
          for (let k = i; k > pos; k -= gap) a[k] = a[k - gap];
          a[pos] = keyItem;
          const last = gi === gaps.length - 1 && i === n - 1;
          if (last) finished = true;

          steps.push({
            line: 4,
            view: before,
            prompt:
              gap === 1
                ? `Gap 1 is insertion sort. Where does <b>${key}</b> end up?`
                : `Gap ${gap}: <b>${key}</b> (position ${i}) is in the group at positions ${list(group)}. Where does it end up?`,
            ask: { type: 'pick', answer: [String(pos)], position: true },
            hint: `Move ${key} left in jumps of ${gap}, past every value in its group that is bigger than ${key}.`,
            correct:
              (pos === i
                ? `Correct! ${vals[i - gap]} is smaller than ${key}, so ${key} stays where it is.`
                : `Correct! ${list(moved)} ${plural(moved.length, 'is', 'are')} bigger than ${key}, so ` +
                  `${plural(moved.length, 'it moves', 'they each move')} ${gap} ${plural(gap, 'place', 'places')} right and ${key} lands at position ${pos}.`) +
              (last ? ' That was the last element of the gap-1 pass, so the array is sorted!' : ''),
            wrong: ([k]) => {
              const p = +k;
              if (!group.includes(p)) {
                return `${key} only moves in jumps of ${gap}, so it can only land on ${plural(group.length, 'position', 'positions')} ${list(group)}.`;
              }
              if (p < pos) return `${vals[p]} is smaller than ${key}, so ${key} stops before reaching it.`;
              return `${vals[p - gap]} is bigger than ${key}, so ${key} jumps past it.`;
            },
            after: view({ gap: last ? null : gap }),
          });
        }
      });

      finished = true;
      return {
        steps,
        final: view(),
        stats: [
          ['Comparisons', comparisons],
          ['Shifts', shifts],
          ['Gaps', gaps.join(', ')],
        ],
      };
    },

    trace(values) {
      const a = values.slice();
      const n = a.length;
      const ev = [];
      for (const gap of gapsFor(n)) {
        for (let i = gap; i < n; i++) {
          const key = a[i];
          let j = i;
          while (j >= gap) {
            ev.push(['c', j - gap, j]);
            if (a[j - gap] <= key) break;
            a[j] = a[j - gap];
            ev.push(['w', j, a[j]]);
            j -= gap;
          }
          a[j] = key;
          ev.push(['w', j, key]);
        }
      }
      return ev;
    },
  });
})();
