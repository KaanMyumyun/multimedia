(function () {
  'use strict';
  const { register, randInt, searchTarget, items, arrayView, plural } = BTA;

  // Where interpolation search probes, and how binary search would compare.
  const probe = (a, lo, hi, t) => (hi === lo ? lo : lo + Math.floor(((t - a[lo]) * (hi - lo)) / (a[hi] - a[lo])));

  function binaryProbes(a, t) {
    let lo = 0;
    let hi = a.length - 1;
    let n = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      n++;
      if (a[mid] === t) break;
      if (a[mid] < t) lo = mid + 1;
      else hi = mid - 1;
    }
    return n;
  }

  register({
    id: 'interpolation',
    name: 'Interpolation Search',
    group: 'Searching',
    blurb: 'Guess where the target should be from its value, like opening a dictionary near the right letter.',
    complexity: { best: 'O(1)', average: 'O(log log n)', worst: 'O(n)', space: 'O(1)', stable: '—' },
    input: { label: 'Size', options: [8, 10, 12], default: 10, target: true, sorted: true },
    how: [
      'This works on a <b>sorted</b> array whose values are spread out fairly evenly.',
      'Instead of the middle, probe where the target <i>should</i> be: if it is 30% of the way from a[lo] to a[hi] in value, look 30% of the way along.',
      'Compare the probe with the target and keep the side that could still contain it, as in binary search.',
      'Stop when you find it, or when the target falls outside a[lo]…a[hi].',
    ],
    code: [
      'lo ← 0; hi ← n − 1',
      'while lo ≤ hi and a[lo] ≤ target ≤ a[hi]',
      '  pos ← lo + ⌊(target − a[lo]) × (hi − lo)',
      '            / (a[hi] − a[lo])⌋',
      '  if a[pos] = target: return pos',
      '  if a[pos] < target: lo ← pos + 1',
      '  else: hi ← pos − 1',
      'return "not found"',
    ],
    legend: [
      ['active', 'Probe'],
      ['dim', 'Ruled out'],
      ['found', 'Found'],
    ],
    summary:
      'Interpolation search used the target’s value to guess its position, so on evenly spread data it often lands right next to it. ' +
      'On uniform data that averages O(log log n) probes, far fewer than binary search. ' +
      'The catch: on badly skewed data (say 1, 2, 3, 1000) the guesses are poor and it can degrade to O(n). Binary search never does worse than log₂ n.',

    generate(n) {
      // Roughly evenly spaced values, so the estimates are good.
      const gap = randInt(5, Math.min(9, Math.floor(92 / n))); // keeps every value under 100
      const base = randInt(1, 6);
      const values = [];
      for (let i = 0; i < n; i++) values.push(base + i * gap + randInt(0, gap - 2));
      return { values, target: searchTarget(values, values[0], values[n - 1]) };
    },

    build({ values, target: t }) {
      const a = items(values);
      const v = values;
      const n = a.length;
      const max = Math.max(...values);
      const steps = [];
      let lo = 0;
      let hi = n - 1;
      let probes = 0;

      const view = (o = {}) => {
        const ptrs = {};
        const tag = (k, label) => k >= 0 && k < n && (ptrs[k] = ptrs[k] || []).push(label);
        if (lo <= hi) {
          tag(lo, 'lo');
          if (o.at != null) tag(o.at, 'pos');
          tag(hi, 'hi');
        }
        return arrayView(a, {
          max,
          ptrs,
          chips: [
            { label: 'Target', value: t, tone: 'accent' },
            { label: 'Range', value: lo <= hi ? `positions ${lo}–${hi}` : 'empty' },
          ],
          state: (k) => (k === o.found ? 'found' : k === o.at ? 'active' : k < lo || k > hi ? 'dim' : 'idle'),
        });
      };

      let foundAt = -1;
      while (lo <= hi && v[lo] <= t && t <= v[hi]) {
        const pos = probe(v, lo, hi, t);
        const L = lo;
        const H = hi;
        const share = hi === lo ? 0 : Math.round(((t - v[lo]) / (v[hi] - v[lo])) * 100);
        const formula =
          hi === lo
            ? `lo = hi = ${lo}, so there is only one place to look`
            : `pos = ${lo} + ⌊(${t} − ${v[lo]}) × (${hi} − ${lo}) / (${v[hi]} − ${v[lo]})⌋ = ${lo} + ⌊${(t - v[lo]) * (hi - lo)} / ${v[hi] - v[lo]}⌋ = ${pos}`;

        steps.push({
          line: 2,
          view: view(),
          prompt:
            `Range ${lo}–${hi}: values ${v[lo]} to ${v[hi]}. The target <b>${t}</b> is about ${share}% of the way through those values. ` +
            'Click the position interpolation search probes.',
          ask: { type: 'pick', answer: [String(pos)], position: true },
          hint: `pos = lo + ⌊(target − a[lo]) × (hi − lo) / (a[hi] − a[lo])⌋. Roughly ${share}% of the way from position ${lo} to ${hi}.`,
          correct: `Right: ${formula}.`,
          wrong: ([k]) =>
            +k < L || +k > H
              ? 'That position is outside the search range. The dimmed part has already been ruled out.'
              : `Not quite. Work it out: ${formula.replace(/ = \d+$/, ' = ?')}.`,
          after: view({ at: pos }),
        });

        probes++;
        const pv = v[pos];
        const before = view({ at: pos });
        let answer;
        let correct;
        if (pv === t) {
          answer = 'found';
          foundAt = pos;
          correct = `Found it! ${t} is at position ${pos}, after ${probes} ${plural(probes, 'probe', 'probes')}.`;
        } else if (t < pv) {
          answer = 'left';
          hi = pos - 1;
          correct = `Right. ${t} < ${pv}, so ${t} can only be to the <b>left</b>. Positions ${pos}–${H} are ruled out.`;
        } else {
          answer = 'right';
          lo = pos + 1;
          correct = `Right. ${t} > ${pv}, so ${t} can only be to the <b>right</b>. Positions ${L}–${pos} are ruled out.`;
        }

        steps.push({
          line: pv === t ? 4 : t > pv ? 5 : 6,
          view: before,
          prompt: `The probe found <b>${pv}</b>. The target is <b>${t}</b>. What now?`,
          ask: {
            type: 'choice',
            answer,
            options: [
              { label: '← Search the left part', value: 'left' },
              { label: 'Found it!', value: 'found' },
              { label: 'Search the right part →', value: 'right' },
            ],
          },
          hint: `Is ${t} smaller than, equal to, or bigger than ${pv}?`,
          correct,
          wrong: (given) => {
            if (given === 'found') return `${pv} is not ${t}. Keep searching.`;
            if (pv === t) return `Look again: the probe <b>is</b> ${t}.`;
            return t < pv
              ? `${t} < ${pv}. Everything to the right of ${pv} is even bigger, so ${t} can’t be there.`
              : `${t} > ${pv}. Everything to the left of ${pv} is even smaller, so ${t} can’t be there.`;
          },
          after: pv === t ? view({ found: pos }) : view(),
        });

        if (pv === t) break;
      }

      if (foundAt < 0) {
        const empty = lo > hi;
        const why = empty
          ? `lo = ${lo} and hi = ${hi}, so the range is empty`
          : `the target ${t} is ${t < v[lo] ? `smaller than a[lo] = ${v[lo]}` : `bigger than a[hi] = ${v[hi]}`}, so it can’t be in the range`;
        const prev = view();
        lo = n;
        steps.push({
          line: 7,
          view: prev,
          prompt: `Now ${why}. What does that mean?`,
          ask: {
            type: 'choice',
            answer: 'absent',
            options: [
              { label: `${t} is not in the array`, value: 'absent' },
              { label: 'Probe the middle instead', value: 'middle' },
            ],
          },
          hint: 'In a sorted array, a value can only sit between the values around it.',
          correct: `Exactly. ${empty ? 'Every position has been ruled out' : `Every value in the range is ${t < v[Math.min(hi, n - 1)] ? 'bigger' : 'smaller'} than ${t}`}, so ${t} isn’t in the array.`,
          wrong: 'Nothing left in the range could equal the target, so probing anywhere would not help.',
          after: view(),
        });
      }

      return {
        steps,
        final: foundAt >= 0 ? view({ found: foundAt }) : view(),
        stats: [
          ['Probes', probes],
          ['Binary search would use', binaryProbes(v, t)],
        ],
      };
    },
  });
})();
