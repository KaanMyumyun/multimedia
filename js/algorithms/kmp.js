(function () {
  'use strict';
  const { register, randInt } = BTA;

  // lps[q]: the length of the longest proper prefix of pattern[0..q] that is also its suffix.
  function lpsTable(p) {
    const lps = new Array(p.length).fill(0);
    let k = 0;
    for (let q = 1; q < p.length; q++) {
      while (k > 0 && p[q] !== p[k]) k = lps[k - 1];
      if (p[q] === p[k]) k++;
      lps[q] = k;
    }
    return lps;
  }

  // Runs KMP, calling on(event) for each mismatch that moves j back and each match.
  function run(text, p, on = () => {}) {
    const lps = lpsTable(p);
    const matches = [];
    let i = 0;
    let j = 0;
    let compares = 0;
    while (i < text.length) {
      compares++;
      if (text[i] === p[j]) {
        i++;
        j++;
        if (j === p.length) {
          matches.push(i - p.length);
          on({ type: 'match', i, j, start: i - p.length });
          j = lps[j - 1];
        }
      } else if (j > 0) {
        on({ type: 'jump', i, j, to: lps[j - 1] });
        j = lps[j - 1];
      } else {
        i++;
      }
    }
    return { matches, compares, lps };
  }

  const randomWord = (len, alphabet) => Array.from({ length: len }, () => alphabet[randInt(0, alphabet.length - 1)]).join('');

  register({
    id: 'kmp',
    name: 'KMP String Search',
    group: 'Searching',
    blurb: 'Find a word in a text without ever going back in the text.',
    complexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n + m)', space: 'O(m)', stable: '—' },
    input: { label: 'Text length', options: [12, 14, 16, 18], default: 14, text: true },
    how: [
      'The simple way to find a pattern in a text tries every starting position and can re-read the same letters many times.',
      'KMP (Knuth, Morris and Pratt) first works out, for each prefix of the pattern, the longest part that is both a proper prefix and a suffix. That table is called lps.',
      'Then it reads the text once, left to right. While letters match, both move on. On a mismatch it never moves back in the text: the lps table says how much of what already matched can stay matched.',
      'When the whole pattern matches, it reports where, and carries on to find every match.',
    ],
    code: [
      'lps ← for each prefix of the pattern, the longest',
      '      proper prefix that is also a suffix',
      'i ← 0; j ← 0        // i in the text, j in the pattern',
      'while i < n',
      '  if text[i] = pattern[j]: i ← i + 1; j ← j + 1',
      '  else if j > 0: j ← lps[j − 1]',
      '  else: i ← i + 1',
      '  if j = m: match at i − m; j ← lps[m − 1]',
    ],
    legend: [
      ['part', 'Matched so far'],
      ['key', 'Being compared'],
      ['found', 'Part of a match'],
      ['dim', 'Already passed'],
    ],
    kinds: {
      lps: 'Working out the lps table',
      jump: 'Where to carry on after a mismatch',
      match: 'Where a match starts',
    },
    summary:
      'KMP read each letter of the text at most a couple of times and never moved back in it, so it takes O(n + m) for a text of n letters and a pattern of m, ' +
      'where trying every starting position can take O(n·m). ' +
      'The lps table is what makes that possible: after a mismatch it says how much of the part that already matched is also the start of the pattern, so that part doesn’t need to be checked again. ' +
      'Text editors, search tools and DNA matching use KMP or close relatives of it.',

    generate(len) {
      for (;;) {
        const alphabet = Math.random() < 0.6 ? 'AB' : 'ABC';
        const m = randInt(3, 5);
        let p;
        do p = randomWord(m, alphabet);
        while (Math.max(...lpsTable(p)) === 0 || new Set(p).size === 1);
        // Random text with the pattern planted once or twice, and a near miss in front of one copy.
        const t = randomWord(len, alphabet).split('');
        const at = randInt(0, len - m);
        p.split('').forEach((ch, k) => (t[at + k] = ch));
        if (Math.random() < 0.5 && len - m >= m + 2) {
          const at2 = randInt(0, len - m);
          if (Math.abs(at2 - at) >= m) p.split('').forEach((ch, k) => (t[at2 + k] = ch));
        }
        const text = t.join('');
        let jumps = 0;
        run(text, p, (e) => e.type === 'jump' && e.j >= 2 && jumps++);
        if (jumps >= 1 && jumps <= 5) return { text, pattern: p };
      }
    },

    build({ text, pattern: p }) {
      const n = text.length;
      const m = p.length;
      const width = n + m - 1; // room for the pattern to hang past the end
      const lps = lpsTable(p);
      const known = new Array(m).fill(false);
      known[0] = true;
      const found = new Set();
      const steps = [];

      // o: { off: where the pattern starts under the text, i, j, lpsAt, showText }
      const view = (o = {}) => {
        const off = o.off || 0;
        const pad = (cells, from) =>
          Array.from({ length: width }, (_, k) => (k >= from && k < from + cells.length ? cells[k - from] : { spacer: true }));
        const rows = [];
        if (o.showText !== false) {
          rows.push({
            label: 'Text',
            showIndex: true,
            ptrs: o.i != null && o.i < n ? { [o.i]: ['i'] } : {},
            cells: pad(
              text.split('').map((ch, k) => ({
                flip: 't' + k,
                value: ch,
                key: 't' + k,
                state: found.has(k)
                  ? 'found'
                  : o.i != null && k === o.i
                    ? 'key'
                    : o.i != null && k >= o.i - (o.j || 0) && k < o.i
                      ? 'part'
                      : o.i != null && k < o.i - (o.j || 0)
                        ? 'dim'
                        : 'idle',
              })),
              0,
            ),
          });
        }
        rows.push({
          label: 'Pattern',
          showIndex: false,
          ptrs: o.j != null ? { [off + o.j]: ['j'] } : {},
          cells: pad(
            p.split('').map((ch, q) => ({
              flip: 'p' + q,
              value: ch,
              key: null,
              state: o.j != null && q < o.j ? 'part' : o.j != null && q === o.j ? 'key' : o.lpsAt != null && q <= o.lpsAt ? 'part' : 'idle',
            })),
            off,
          ),
        });
        rows.push({
          label: 'lps',
          showIndex: false,
          ptrs: {},
          cells: pad(
            lps.map((x, q) => (known[q] ? { flip: 'l' + q, value: x, key: null, state: q === o.lpsAt ? 'key' : 'idle' } : { ghost: true })),
            off,
          ),
        });
        return { kind: 'array', aligned: true, max: Math.max(1, ...lps), chips: [{ label: 'Pattern', value: p, tone: 'accent' }], rows };
      };

      // Phase 1: the lps table
      for (let q = 1; q < m; q++) {
        const s = p.slice(0, q + 1);
        const L = lps[q];
        const opts = Array.from({ length: q + 1 }, (_, x) => ({ label: String(x), value: String(x) }));
        const before = view({ lpsAt: q, showText: false });
        known[q] = true;
        steps.push({
          line: 0,
          kind: 'lps',
          view: before,
          prompt:
            (q === 1 ? 'First, the lps table. lps[0] is always 0. ' : '') +
            `What is lps[${q}]: the longest part of <b>${s}</b> that is both a proper prefix and a suffix?`,
          ask: { type: 'choice', answer: String(L), options: opts },
          hint: `Compare the start of ${s} with its end. The prefix can’t be the whole of ${s}.`,
          correct: L
            ? `Right. <b>${s.slice(0, L)}</b> is both the start and the end of ${s}, so lps[${q}] = ${L}.`
            : `Right. No proper prefix of ${s} is also a suffix, so lps[${q}] = 0.`,
          wrong: (given) => {
            const G = Number(given);
            if (G >= s.length) return 'A proper prefix can’t be the whole word.';
            if (G > L) return `The first ${G} letters (${s.slice(0, G)}) aren’t the same as the last ${G} (${s.slice(-G)}).`;
            return `There is a longer one: ${s.slice(0, L)} starts and ends ${s}.`;
          },
          after: view({ lpsAt: q, showText: false }),
        });
      }
      known.fill(true);

      // Phase 2: the search
      let firstSearch = true;
      const intro = () => {
        const t = firstSearch ? 'Now the search: compare letters while they match. ' : '';
        firstSearch = false;
        return t;
      };
      run(text, p, (e) => {
        // After only one matching letter there is nowhere to go but pattern[0], so that isn't asked.
        if (e.type === 'jump' && e.j >= 2) {
          const { i, j, to } = e;
          const back = i - j + 1;
          const done = p.slice(0, j);
          const before = view({ off: i - j, i, j });
          steps.push({
            line: 5,
            kind: 'jump',
            view: before,
            prompt:
              intro() +
              `Mismatch: text[${i}] is <b>${text[i]}</b> but pattern[${j}] is <b>${p[j]}</b>. ` +
              `Which pattern position is compared with text[${i}] next?`,
            ask: {
              type: 'choice',
              answer: String(to),
              options: [
                ...Array.from({ length: j }, (_, x) => ({ label: `pattern[${x}], still at text[${i}]`, value: String(x) })),
                { label: `Go back to text[${back}] and start the pattern again`, value: 'back' },
              ],
            },
            hint: `Look up lps[${j - 1}] in the table: how much of ${done} is also the start of the pattern?`,
            correct: to
              ? `Right. ${done} matched, and lps[${j - 1}] = ${to}: its last ${to} ${to === 1 ? 'letter is' : 'letters are'} also the start of the pattern. ` +
                `So the pattern slides along, those ${to} stay matched, and pattern[${to}] is compared with text[${i}]. The text never moves back.`
              : `Right. lps[${j - 1}] = 0: no part of ${done} can start the pattern again, so start again at pattern[0], still at text[${i}].`,
            wrong: (given) =>
              given === 'back'
                ? `That is what the simple method does, re-reading text it has already seen. KMP never moves back in the text: lps[${j - 1}] says how much of ${done} is still matched.`
                : `Use lps[${j - 1}]: the length of the longest part of ${done} that is both a prefix and a suffix.`,
            after: view({ off: i - to, i, j: to }),
          });
        } else if (e.type === 'match') {
          const { i, start } = e;
          const before = view({ off: start, i, j: m });
          for (let k = start; k < start + m; k++) found.add(k);
          const next = lps[m - 1];
          steps.push({
            line: 7,
            kind: 'match',
            view: before,
            prompt: intro() + 'All of the pattern matches here. Click the text position where this match starts.',
            ask: { type: 'pick', answer: ['t' + start] },
            hint: `The match ends at text[${i - 1}], and the pattern is ${m} letters long.`,
            correct:
              `Right. The match starts at position ${start}. To keep looking, KMP sets j = lps[${m - 1}] = ${next}` +
              (next ? `: the last ${next} matched ${next === 1 ? 'letter' : 'letters'} can be the start of another match.` : '.'),
            wrong: ([k]) => `That isn’t where it starts. Count ${m} letters back from the end of the match at position ${i - 1}.`,
            after: view({ off: i - next, i, j: next }),
          });
        }
      });
      const result = run(text, p);

      return {
        steps,
        final: view({ off: 0, showText: true }),
        stats: [
          ['Matches at', result.matches.length ? result.matches.join(', ') : 'none'],
          ['Letter comparisons', result.compares],
          ['Trying every start could take', (n - m + 1) * m],
        ],
      };
    },
  });
})();
