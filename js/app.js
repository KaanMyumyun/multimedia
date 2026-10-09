/*
 * App: routing, the book pages, the report card, and the play page.
 *
 * The play page has these modes:
 *   learn    – a lesson player that steps through a worked example and explains each move
 *   practice – you make every move; hints and retries are allowed for partial credit
 *   test     – one attempt per question and no hints; graded A+ to F
 *   quiz     – concept questions about the algorithm (quizzes.js), one attempt each
 *   drill    – ten questions of one kind from fresh exercises (#/bubble/drill?k=swap)
 *   daily    – the daily challenge (#/daily), under test rules
 * In practice and test, fast-forward lets the rest of a kind of question play by itself
 * once you get three of that kind right first time in a row. Those aren't graded.
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const plural = BTA.plural;

  // The site is two books, each on its own page, with its algorithms in chapter order.
  const BOOKS = [
    {
      id: 'sorting',
      href: '#/',
      title: 'Sorting',
      blurb: 'Bubble, selection, insertion, shell, merge, quick, heap, counting and radix sort, then topological sort for graphs.',
      parts: [
        { title: 'Simple sorts', ids: ['bubble', 'selection', 'insertion'] },
        { title: 'Efficient sorts', ids: ['shell', 'merge', 'quick', 'heap'] },
        { title: 'Special-purpose sorts', ids: ['counting', 'radix', 'topo'] },
      ],
    },
    {
      id: 'searching',
      href: '#/searching',
      title: 'Searching',
      blurb: 'Arrays, graphs and text: from linear search to Dijkstra, A*, minimum spanning trees and KMP.',
      parts: [
        { title: 'Searching an array', ids: ['linear', 'binary', 'jump', 'interpolation', 'exponential'] },
        { title: 'Searching a graph', ids: ['bfs', 'dfs'] },
        { title: 'Shortest paths and spanning trees', ids: ['dijkstra', 'bellman', 'astar', 'kruskal'] },
        { title: 'Searching text', ids: ['kmp'] },
      ],
    },
  ];
  // Part numbers: 1 → I, 4 → IV, 9 → IX …
  const roman = (n) =>
    [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((out, [v, r]) => {
      for (; n >= v; n -= v) out += r;
      return out;
    }, '');

  // Every algorithm in reading order: for "Next" links, the report card and the daily challenge.
  const algos = BOOKS.flatMap((b) => b.parts.flatMap((p) => p.ids)).map((id) => BTA.get(id));

  // The sorts that take part in the race: every array sort, in book order.
  const raceSorts = algos.filter((a) => a.trace);

  // Where an algorithm sits: its book, its part, and its chapter number in that book.
  function placeOf(a) {
    for (const book of BOOKS) {
      let chapter = 0;
      for (const [i, part] of book.parts.entries()) {
        for (const id of part.ids) {
          chapter++;
          if (id === a.id) return { book, part, partNo: roman(i + 1), chapter: String(chapter).padStart(2, '0') };
        }
      }
    }
    throw new Error(`${a.id} is not in any book`);
  }

  const MODES = {
    learn: { label: 'Learn', note: 'A worked example. Step through it and read why each move is made.' },
    practice: { label: 'Practice', note: 'Make every move yourself. Hints and retries are allowed, for partial credit.' },
    test: { label: 'Test', note: 'One attempt per question, no hints. Graded A+ to F.' },
    quiz: { label: 'Quiz', note: 'Questions about the algorithm as a whole: how fast it is, what it needs, and when to use it. One attempt each.' },
    drill: { label: 'Drill', tab: false, note: '' },
    daily: { label: 'Daily challenge', tab: false, note: 'One attempt per question, no hints, and the same exercise for everyone today.' },
  };
  // Modes with one attempt per question and no hints.
  const ONE_SHOT = new Set(['test', 'quiz', 'daily']);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const textOf = (html) => html.replace(/<[^>]+>/g, '');
  const stripLead = (html) => html.replace(/^(Correct|Right|Yes|Exactly)[.!]?\s*/, '');
  const fmtTime = (ms) => {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const ICON = {
    first: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5v11"/><path d="M13 2.5 5.5 8l7.5 5.5z"/></svg>',
    back: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5 4 8l7.5 5.5z"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5 12 8l-7.5 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5h2.5v11H4.5zM9 2.5h2.5v11H9z"/></svg>',
  };

  // A hand-drawn loop for circling grades.
  const CIRCLE =
    '<svg class="pen-circle" viewBox="0 0 140 110" aria-hidden="true"><path d="M74 10C110 8 134 30 130 58c-4 30-38 46-70 42C28 96 6 76 10 48 14 22 40 8 80 13"/></svg>';

  // ---------- grading ----------

  // How much a question is worth, by how it was answered.
  const CREDIT = {
    first: { label: 'First try', pts: 1 },
    hinted: { label: 'First try, after a hint', pts: 0.75 },
    second: { label: 'Second try', pts: 0.5 },
    later: { label: 'Three or more tries', pts: 0.25 },
    shown: { label: 'Answer shown', pts: 0 },
    wrong: { label: 'Wrong', pts: 0 },
    auto: { label: 'Played by itself (fast-forward)', pts: null },
  };
  const creditRows = (mode) => (ONE_SHOT.has(mode) ? ['first', 'wrong'] : ['first', 'hinted', 'second', 'later', 'shown']);

  const SCALE = [
    [97, 'A+'], [93, 'A'], [90, 'A−'], [87, 'B+'], [83, 'B'], [80, 'B−'],
    [77, 'C+'], [73, 'C'], [70, 'C−'], [67, 'D+'], [60, 'D'], [0, 'F'],
  ];
  const gradeOf = (pct) => SCALE.find(([min]) => pct >= min)[1];

  function teacherNote(pct) {
    if (pct === 100) return 'Perfect. Not a single slip!';
    if (pct >= 90) return 'Excellent work!';
    if (pct >= 80) return 'Good job, nearly there.';
    if (pct >= 70) return 'Solid. Look over the misses below.';
    if (pct >= 60) return 'Getting there. Rewatch the lesson?';
    return 'Watch the lesson, then try again.';
  }

  const fraction = (x) => ({ 1: '1', 0.75: '¾', 0.5: '½', 0.25: '¼', 0: '0' })[x] ?? String(x);

  // ---------- saved in this browser only (best effort) ----------

  const saved = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* not remembered */
    }
  };

  const store = {
    key: 'bta-progress-v2',
    all() {
      return saved(this.key, {}) || {};
    },
    write(all) {
      save(this.key, all);
    },
    // Returns the previous best for this mode, or null on the first run.
    record(id, mode, pct) {
      const all = this.all();
      const rec = (all[id] = all[id] || {});
      const m = (rec[mode] = rec[mode] || { best: 0, plays: 0 });
      const prev = m.plays ? m.best : null;
      m.best = Math.max(m.best, pct);
      m.plays += 1;
      this.write(all);
      return prev;
    },
    learned(id) {
      const all = this.all();
      (all[id] = all[id] || {}).learned = true;
      this.write(all);
    },
    reset() {
      try {
        localStorage.removeItem(this.key);
        localStorage.removeItem(kindStats.key);
      } catch {
        /* nothing to reset */
      }
      BTA.daily.reset();
    },
  };

  // How often each kind of question was answered right first time: { algo: { kind: [asked, right] } }.
  const kindStats = {
    key: 'bta-kinds-v1',
    all() {
      return saved(this.key, {}) || {};
    },
    add(id, kind, right) {
      const all = this.all();
      const a = (all[id] = all[id] || {});
      const k = (a[kind] = a[kind] || [0, 0]);
      k[0]++;
      if (right) k[1]++;
      save(this.key, all);
    },
  };

  const FF_KEY = 'bta-ff'; // fast-forward on or off

  const gradeTag = (rec) =>
    rec ? `<span class="grade-tag" title="Best: ${rec.best}%">${gradeOf(rec.best)}</span>` : '<span class="grade-tag none">—</span>';

  // ---------- routing ----------

  let ui = null; // the play page
  let session = null; // a practice or test run
  let lesson = null; // a learn-mode run
  let leavePage = null; // cleanup for the race page

  // "#/bubble/test?a=8,3,5" → { id: 'bubble', mode: 'test', params }
  function parseHash() {
    const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
    const [id = '', mode = ''] = path.split('/');
    return { id, mode, params: new URLSearchParams(query) };
  }

  // Link parameters are only digits, letters and commas, so they are written as they are.
  const queryOf = (params) =>
    Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

  function route() {
    stopRun();
    if (leavePage) leavePage();
    leavePage = null;
    ui = null;
    const { id, mode, params } = parseHash();
    const algo = id && BTA.get(id);
    let section;
    if (id === 'report') {
      reportPage();
      section = 'report';
    } else if (id === 'daily') {
      const key = BTA.daily.key();
      const pick = BTA.daily.pick(key, algos);
      playPage(pick.algo, 'daily', new URLSearchParams(), { daily: { key, input: pick.input } });
      section = 'daily';
    } else if (id === 'race') {
      const growth = mode === 'growth';
      const kit = {
        params,
        sorts: raceSorts,
        setUrl: (p) => history.replaceState(null, '', `#/race${growth ? '/growth' : ''}?${queryOf(p)}`),
        tabs: (active) => `
          <nav class="subtabs" aria-label="Race pages">
            <a href="#/race"${active === 'race' ? ' aria-current="page"' : ''}>Race</a>
            <a href="#/race/growth"${active === 'growth' ? ' aria-current="page"' : ''}>How they grow</a>
          </nav>`,
        ownInputForm,
        copyLink,
        esc,
      };
      document.title = growth ? 'How sorts grow · Be the Algorithm' : 'Sort race · Be the Algorithm';
      leavePage = growth ? BTA.growthPage(app, kit) : BTA.racePage(app, kit);
      section = 'race';
    } else if (algo && mode === 'sheet') {
      worksheet(algo, params);
      section = placeOf(algo).book.id;
    } else if (algo) {
      const drillOk = mode !== 'drill' || (algo.kinds && algo.kinds[params.get('k')]);
      const quizOk = mode !== 'quiz' || BTA.getQuiz(algo.id).length;
      playPage(algo, MODES[mode] && mode !== 'daily' && drillOk && quizOk ? mode : 'practice', params);
      section = placeOf(algo).book.id;
    } else {
      const book = BOOKS.find((b) => b.id === id) || BOOKS[0];
      bookPage(book);
      section = book.id;
    }
    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.nav === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }

  // A printable worksheet for an exercise from a link (or a random one).
  function worksheet(algo, params) {
    let input = null;
    if ([...params.keys()].length) {
      const r = BTA.fromParams(algo, params);
      if (!r.error) input = r.input;
    }
    if (!input) input = algo.generate(algo.input ? algo.input.default : null);
    const q = queryOf(BTA.toParams(algo, input));
    history.replaceState(null, '', `#/${algo.id}/sheet?${q}`);
    document.title = `${algo.name} worksheet · Be the Algorithm`;
    BTA.worksheetPage(app, algo, input, { esc, back: `#/${algo.id}?${q}` });
  }

  // ---------- book pages: Sorting (home) and Searching ----------

  function bookPage(book) {
    document.title = book.id === 'sorting' ? 'Be the Algorithm' : `${book.title} · Be the Algorithm`;
    const progress = store.all();
    const other = BOOKS.find((b) => b !== book);

    const chapter = (a) => {
      const r = progress[a.id] || {};
      const shown = r.test || r.practice;
      return `
        <li>
          <a class="chapter" href="#/${a.id}">
            <span class="ch-no">${placeOf(a).chapter}</span>
            <span class="ch-name">${a.name}</span>
            <span class="ch-dots" aria-hidden="true"></span>
            <span class="ch-cx" title="Average time">${a.complexity.average}</span>
            <span class="ch-grade">
              ${gradeTag(shown)}
              ${shown ? `<span class="ch-grade-src">${r.test ? 'test' : 'practice'}</span>` : ''}
            </span>
            <span class="ch-blurb">${a.blurb}</span>
          </a>
        </li>`;
    };

    const head =
      book.id === 'sorting'
        ? `
      <header class="masthead">
        <div class="masthead-main">
          <h1 class="site-title"><span class="marker">Be</span> the Algorithm</h1>
          <p class="tagline">A workbook for sorting, searching and graph algorithms. You make every move, and the page checks your work.</p>
        </div>
        <aside class="how-to" aria-label="How to use this workbook">
          <h2>How to use it</h2>
          <dl>
            <dt>Learn</dt><dd>Step through a worked example, with the reason for every move.</dd>
            <dt>Practice</dt><dd>Make the moves yourself. Hints and retries earn partial credit.</dd>
            <dt>Test</dt><dd>One attempt per question, no hints. Graded A+ to F.</dd>
            <dt>Quiz</dt><dd>Questions about speed, memory and when to use each algorithm.</dd>
          </dl>
        </aside>
      </header>
      <h2 class="book-label">Book one: Sorting</h2>`
        : `
      <header class="masthead">
        <div class="masthead-main">
          <p class="crumb"><a href="#/">Be the Algorithm</a><span aria-hidden="true">/</span>Book two</p>
          <h1 class="site-title book-title"><span class="marker">Searching</span></h1>
          <p class="tagline">Find a value in an array, a way around a graph, or a word in a text. ${book.parts.flatMap((p) => p.ids).length} algorithms, from the obvious to the clever.</p>
        </div>
        <aside class="how-to" aria-label="Where to start">
          <h2>Where to start</h2>
          <p>Do Linear and Binary Search first. Jump, Interpolation and Exponential Search are each a twist on one of them.</p>
          <p>For graphs, do Breadth-First Search before Depth-First Search. Dijkstra comes next: Bellman-Ford and A* are each a twist on it.</p>
        </aside>
      </header>`;

    app.innerHTML = `
      ${head}
      ${book.parts
        .map(
          (p, i) => `
        <section class="part">
          <h2 class="part-title"><span class="part-no">Part ${roman(i + 1)}</span> ${p.title}</h2>
          <ol class="chapters">${p.ids.map((id) => chapter(BTA.get(id))).join('')}</ol>
        </section>`,
        )
        .join('')}

      ${book.id === 'sorting' ? dailyCard() : ''}

      ${
        book.id === 'sorting'
          ? `<a class="book-link race-link" href="#/race">
              <span class="book-link-label">Extra</span>
              <span class="book-link-title">Sort race <span aria-hidden="true">→</span></span>
              <span class="book-link-blurb">All ${raceSorts.length} array sorts on the same array at once. Guess the winner, then compare comparisons and moves.</span>
            </a>`
          : ''
      }

      <a class="book-link" href="${other.href}">
        <span class="book-link-label">${book.id === 'sorting' ? 'Book two' : 'Book one'}</span>
        <span class="book-link-title">${other.title} <span aria-hidden="true">→</span></span>
        <span class="book-link-blurb">${other.blurb}</span>
      </a>

      <footer class="foot">
        Grades are saved in this browser only. <a href="#/report">See your report card</a>.
      </footer>`;
  }

  // The "today's challenge" card on the home page.
  function dailyCard() {
    const key = BTA.daily.key();
    const { algo } = BTA.daily.pick(key, algos);
    const done = BTA.daily.get(key);
    const streak = BTA.daily.streak();
    return `
      <a class="book-link daily-link" href="#/daily">
        <span class="book-link-label">Daily challenge · ${esc(BTA.daily.label(key))}</span>
        <span class="book-link-title">${algo.name} <span aria-hidden="true">→</span></span>
        <span class="book-link-blurb">${
          done
            ? `Done today: ${done.grade} (${done.right} of ${done.total}). Streak: ${streak} ${plural(streak, 'day', 'days')}.`
            : `The same exercise for everyone today, under test rules.${streak ? ` Your streak: ${streak} ${plural(streak, 'day', 'days')}.` : ''}`
        }</span>
      </a>`;
  }

  // ---------- report card ----------

  function reportPage() {
    document.title = 'Report card · Be the Algorithm';
    const progress = store.all();
    const tests = algos.map((a) => progress[a.id]?.test?.best).filter((x) => x != null);
    const avg = tests.length ? Math.round(tests.reduce((s, x) => s + x, 0) / tests.length) : null;
    const learned = algos.filter((a) => progress[a.id]?.learned).length;
    const streak = BTA.daily.streak();

    const pct = (m) => (m ? `<span class="rc-pct">${m.best}%</span>` : '');
    const row = (a) => {
      const r = progress[a.id] || {};
      const runs = (r.practice?.plays || 0) + (r.test?.plays || 0) + (r.quiz?.plays || 0);
      return `
          <tr>
            <td class="rc-no">${placeOf(a).chapter}</td>
            <th scope="row"><a href="#/${a.id}">${a.name}</a></th>
            <td class="rc-learn">${r.learned ? '<span class="tick" aria-label="Watched">✓</span>' : '<span class="muted">—</span>'}</td>
            <td>${gradeTag(r.practice)} ${pct(r.practice)}</td>
            <td>${gradeTag(r.test)} ${pct(r.test)}</td>
            <td>${gradeTag(r.quiz)} ${pct(r.quiz)}</td>
            <td class="rc-runs">${runs || '<span class="muted">—</span>'}</td>
          </tr>`;
    };
    const rows = BOOKS.map(
      (b) => `
          <tr class="rc-book"><th scope="rowgroup" colspan="7"><a href="${b.href}">${b.title}</a></th></tr>
          ${b.parts.flatMap((p) => p.ids).map((id) => row(BTA.get(id))).join('')}`,
    ).join('');

    // Weak spots: the kinds of question answered right first time least often (at least 3 tries).
    const stats = kindStats.all();
    const weak = [];
    for (const a of algos) {
      for (const [kind, [n, right]] of Object.entries(stats[a.id] || {})) {
        if (n >= 3 && right < n && a.kinds && a.kinds[kind]) weak.push({ a, kind, n, right });
      }
    }
    weak.sort((x, y) => x.right / x.n - y.right / y.n || y.n - x.n);

    app.innerHTML = `
      <header class="page-head">
        <p class="crumb"><a href="#/">Be the Algorithm</a><span aria-hidden="true">/</span>Report card</p>
        <h1>Report card</h1>
        <p class="blurb">Your best grade for each algorithm in this browser.</p>
      </header>

      <div class="rc-summary">
        <div><strong>${tests.length}<small>/${algos.length}</small></strong><span>tests taken</span></div>
        <div><strong>${avg == null ? '—' : gradeOf(avg)}</strong><span>average test grade${avg == null ? '' : ` (${avg}%)`}</span></div>
        <div><strong>${learned}<small>/${algos.length}</small></strong><span>lessons finished</span></div>
        <div><strong>${streak}</strong><span><a href="#/daily">daily challenge</a> streak, in days</span></div>
      </div>

      <section class="weak">
        <h2>Weak spots</h2>
        ${
          weak.length
            ? `<p class="weak-note">The kinds of question you get right first time least often. A drill gives you ten in a row.</p>
               <ul class="types">${weak
                 .slice(0, 6)
                 .map(
                   (w) => `
                 <li>
                   <span class="type-name">${w.a.name}: ${w.a.kinds[w.kind]}</span>
                   <span class="type-score">${w.right}/${w.n} first time</span>
                   <span class="type-bar" aria-hidden="true"><span style="width:${Math.round((w.right / w.n) * 100)}%"></span></span>
                   <a class="link type-drill" href="#/${w.a.id}/drill?k=${w.kind}">Drill</a>
                 </li>`,
                 )
                 .join('')}</ul>`
            : '<p class="weak-note">Nothing yet. Weak spots show up once you have answered a kind of question at least three times.</p>'
        }
      </section>

      <div class="table-wrap">
        <table class="report">
          <thead>
            <tr><th scope="col">Ch.</th><th scope="col">Algorithm</th><th scope="col">Lesson</th><th scope="col">Practice</th><th scope="col">Test</th><th scope="col">Quiz</th><th scope="col">Runs</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <section class="scale-note">
        <h2>How grading works</h2>
        ${gradingHelp('practice')}
        ${gradingHelp('test')}
        <p class="scale">${SCALE.map(([min, g]) => `<span><b>${g}</b> ${min}%</span>`).join('')}</p>
      </section>

      <p><button class="btn quiet" id="reset" type="button">Erase all progress</button></p>`;

    document.getElementById('reset').addEventListener('click', () => {
      if (window.confirm('Erase all grades, weak spots, daily results and lesson progress saved in this browser?')) {
        store.reset();
        reportPage();
      }
    });
  }

  function gradingHelp(mode) {
    if (ONE_SHOT.has(mode)) {
      return '<p><b>Test, quiz and daily challenge:</b> each question is worth 1 point if your first answer is right, and 0 otherwise.</p>';
    }
    return (
      '<p><b>Practice and drills:</b> each question is worth 1 point. ' +
      'You get ¾ after a hint, ½ on the second try, ¼ after that, and 0 if you reveal the answer.</p>'
    );
  }

  // ---------- play page ----------

  // opts.daily – { key, input } for the daily challenge
  function playPage(algo, mode, params, opts = {}) {
    const noun = algo.graph ? 'graph' : algo.input && algo.input.text ? 'text' : 'array';
    const cx = algo.complexity;
    const place = placeOf(algo);
    const rules = BTA.inputRules(algo);
    const daily = opts.daily || null;
    const hasQuiz = BTA.getQuiz(algo.id).length > 0;

    app.innerHTML = `
      <div class="play${daily ? ' is-daily' : ''}">
        <header class="page-head">
          <p class="crumb">
            ${
              daily
                ? `<a href="#/">Be the Algorithm</a><span aria-hidden="true">/</span>Daily challenge<span aria-hidden="true">/</span>${BTA.daily.label(daily.key)}`
                : `<a href="${place.book.href}">${place.book.title}</a><span aria-hidden="true">/</span>Part ${place.partNo}: ${place.part.title}<span aria-hidden="true">/</span>Chapter ${place.chapter}`
            }
          </p>
          <h1>${daily ? '<span class="daily-tag">Today’s challenge</span> ' : ''}${algo.name}</h1>
          <p class="blurb">${algo.blurb}</p>
        </header>

        <div class="toolbar">
          ${
            daily
              ? ''
              : `<div class="modes" role="group" aria-label="Mode">
                  ${Object.entries(MODES)
                    .filter(([k, m]) => m.tab !== false && (k !== 'quiz' || hasQuiz))
                    .map(([k, m]) => `<button type="button" data-mode="${k}" aria-pressed="false">${m.label}</button>`)
                    .join('')}
                </div>`
          }
          <div class="controls"${daily ? ' hidden' : ''}>
            ${algo.input ? `<label class="size" id="size-wrap">${algo.input.label} <select id="size"></select></label>` : ''}
            <button class="btn" id="new" type="button">New ${noun}</button>
            ${algo.input || algo.graph ? `<button class="btn" id="edit" type="button" aria-expanded="false">Your own ${noun}</button>` : ''}
            <button class="btn quiet" id="share" type="button">Copy link</button>
            <a class="btn quiet" id="sheet" href="#/">Worksheet</a>
            <button class="btn quiet" id="restart" type="button">Restart</button>
          </div>
          <p class="mode-note" id="mode-note"></p>
        </div>
        <p class="notice" id="notice" role="status" hidden></p>
        <div id="own-slot"></div>

        <div class="layout">
          <div class="main">
            <section class="sheet stage-sheet" aria-label="Visualization">
              <div id="stage" class="stage"></div>
            </section>
            <section class="sheet desk" id="desk"></section>
          </div>

          <aside class="side">
            <section>
              <h2>How it works</h2>
              <ol class="how">${algo.how.map((h) => `<li>${h}</li>`).join('')}</ol>
            </section>
            <section class="code-sec" id="code-sec">
              <div class="code-head">
                <h2>Code</h2>
                <span class="code-peek" id="code-peek" aria-hidden="true"></span>
                <button class="link" id="copy-code" type="button">Copy</button>
                <button class="drawer-toggle" id="drawer-toggle" type="button" aria-expanded="false" aria-controls="code-body">Show</button>
              </div>
              <div class="code-body" id="code-body">
                <div class="langs" role="group" aria-label="Language">
                  <button type="button" data-lang="pseudo">Pseudocode</button>
                  ${BTA.LANGS.map((l) => `<button type="button" data-lang="${l.id}">${l.label}</button>`).join('')}
                </div>
                <div class="code-box" id="code-box"><ol class="code" id="code"></ol></div>
              </div>
            </section>
            <section id="types-sec">
              <h2>Question types</h2>
              <ul class="types" id="types"></ul>
            </section>
            <section>
              <h2>Key</h2>
              <ul class="legend">${algo.legend
                .map(([state, label]) => `<li><span class="sw sw-${state} s-${state}" aria-hidden="true"></span>${label}</li>`)
                .join('')}</ul>
            </section>
            <section>
              <h2>Complexity</h2>
              <table class="cx-table">
                <tbody>
                  <tr><th scope="row">Best</th><td>${cx.best}</td></tr>
                  <tr><th scope="row">Average</th><td>${cx.average}</td></tr>
                  <tr><th scope="row">Worst</th><td>${cx.worst}</td></tr>
                  <tr><th scope="row">Extra space</th><td>${cx.space}</td></tr>
                  ${cx.stable !== '—' ? `<tr><th scope="row">Stable</th><td>${cx.stable}</td></tr>` : ''}
                </tbody>
              </table>
            </section>
            <section id="grading" hidden>
              <h2>Grading</h2>
              <div id="grading-body"></div>
            </section>
          </aside>
        </div>
      </div>`;

    const $ = (id) => document.getElementById(id);
    ui = {
      algo,
      noun,
      mode,
      daily,
      drillKind: mode === 'drill' ? params.get('k') : null,
      stage: $('stage'),
      stageSheet: app.querySelector('.stage-sheet'),
      desk: $('desk'),
      code: $('code'),
      codeBox: $('code-box'),
      codeSec: $('code-sec'),
      peek: $('code-peek'),
      lang: savedLang(),
      line: null,
      size: $('size'),
      sizeValue: algo.input ? algo.input.default : null,
      input: null,
      run: null,
    };

    ui.stage.addEventListener('click', (e) => {
      const t = e.target.closest('[data-key]');
      if (t && ui.stage.contains(t)) onPick(t.dataset.key);
    });
    app.querySelectorAll('.modes button').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.mode !== ui.mode) setMode(b.dataset.mode);
      }),
    );
    $('new').addEventListener('click', () => (ui.mode === 'drill' ? start() : newInput()));
    $('restart').addEventListener('click', start);
    $('share').addEventListener('click', (e) => copyLink(e.currentTarget));
    if (ui.size) {
      ui.size.addEventListener('change', () => {
        ui.sizeValue = Number(ui.size.value);
        newInput();
      });
    }

    // Code panel; on phones it is a drawer at the bottom of the screen.
    app.querySelectorAll('.langs button').forEach((b) =>
      b.addEventListener('click', () => {
        ui.lang = b.dataset.lang;
        saveLang(ui.lang);
        renderCode();
      }),
    );
    $('copy-code').addEventListener('click', (e) => copyText(ui.codeLines.map((l) => l.text).join('\n'), e.currentTarget));
    $('drawer-toggle').addEventListener('click', (e) => {
      const open = ui.codeSec.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
      e.currentTarget.textContent = open ? 'Hide' : 'Show';
      if (open) highlightLine(ui.line);
    });
    renderCode();

    // Typing in your own array or text, or drawing your own graph
    if (algo.input || algo.graph) {
      const use = (input) => {
        ui.input = input;
        syncSize();
        if (ui.mode !== 'learn' && ui.mode !== 'practice' && ui.mode !== 'test') setMode('practice');
        else {
          syncUrl();
          start();
        }
      };
      const own = algo.graph
        ? BTA.graphEditor({ algo, current: () => ui.input, onUse: use })
        : ownInputForm({
            rules,
            noun,
            note: rules.sorted ? `${algo.name} needs a sorted array, so it will be sorted for you.` : '',
            fill: () =>
              rules.text
                ? { s: ui.input.text, p: ui.input.pattern }
                : rules.target
                  ? { a: ui.input.values.join(' '), t: ui.input.target }
                  : { a: ui.input.join(' ') },
            parse: (p) => BTA.fromParams(algo, p),
            onUse: use,
          });
      $('own-slot').append(own.form);
      $('edit').addEventListener('click', (e) => own.toggle(e.currentTarget));
    }

    // The exercise: today's challenge, one from a link, or a random one
    if (daily) {
      ui.input = daily.input;
    } else {
      if (mode !== 'drill' && [...params.keys()].length) {
        const r = BTA.fromParams(algo, params);
        if (r.error) {
          const notice = $('notice');
          notice.textContent = `The ${noun} in this link couldn’t be used: ${r.error} Here is a random one instead.`;
          notice.hidden = false;
        } else {
          ui.input = r.input;
        }
      }
      if (!ui.input) ui.input = algo.generate(ui.sizeValue);
    }
    syncSize();
    renderTypes();
    setMode(mode);
  }

  // The address bar always holds a link to exactly this exercise (and the worksheet link follows it).
  function syncUrl() {
    const q = queryOf(BTA.toParams(ui.algo, ui.input));
    const sheet = document.getElementById('sheet');
    if (sheet) sheet.href = `#/${ui.algo.id}/sheet?${q}`;
    let url = `#/${ui.algo.id}${ui.mode === 'practice' ? '' : '/' + ui.mode}?${q}`;
    if (ui.mode === 'daily') url = '#/daily';
    if (ui.mode === 'drill') url = `#/${ui.algo.id}/drill?k=${ui.drillKind}`;
    history.replaceState(null, '', url);
  }

  // Show the current array's size in the size picker, adding it if it is unusual.
  function syncSize() {
    if (!ui.size) return;
    const n = Array.isArray(ui.input) ? ui.input.length : ui.input.values ? ui.input.values.length : ui.input.text.length;
    const opts = [...new Set([...ui.algo.input.options, n])].sort((x, y) => x - y);
    ui.size.innerHTML = opts.map((o) => `<option value="${o}"${o === n ? ' selected' : ''}>${o}</option>`).join('');
    ui.sizeValue = n;
  }

  // Only the controls that make sense in this mode.
  function syncControls() {
    const m = ui.mode;
    const toggle = (id, on) => {
      const n = document.getElementById(id);
      if (n) n.hidden = !on;
    };
    toggle('size-wrap', !['quiz', 'drill', 'daily'].includes(m));
    toggle('new', !['quiz', 'daily'].includes(m));
    toggle('edit', !['quiz', 'drill', 'daily'].includes(m));
    toggle('share', m !== 'daily');
    toggle('sheet', !['quiz', 'drill', 'daily'].includes(m));
    toggle('restart', m !== 'daily');
    const nb = document.getElementById('new');
    if (nb) nb.textContent = m === 'drill' ? 'New questions' : `New ${ui.noun}`;
    const rb = document.getElementById('restart');
    if (rb) rb.textContent = m === 'quiz' ? 'Retake' : 'Restart';
    if (['quiz', 'drill', 'daily'].includes(m)) document.querySelectorAll('#own-slot form').forEach((f) => (f.hidden = true));
    ui.stageSheet.hidden = m === 'quiz';
  }

  // Switch modes, keeping the same input so "watch, then try it" uses one array.
  function setMode(mode) {
    ui.mode = mode;
    const kindName = mode === 'drill' ? ui.algo.kinds[ui.drillKind] : null;
    document.title = `${ui.algo.name} · ${kindName ? `Drill: ${kindName}` : MODES[mode].label} · Be the Algorithm`;
    app.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    document.getElementById('mode-note').innerHTML = kindName
      ? `Drill: <b>${esc(kindName)}</b>. Ten questions of just this kind, each from a fresh ${ui.noun}. Hints and retries are allowed.`
      : esc(MODES[mode].note);
    const grading = document.getElementById('grading');
    grading.hidden = mode === 'learn';
    document.getElementById('grading-body').innerHTML =
      gradingHelp(mode) +
      (mode === 'practice' || mode === 'test' ? '<p>Questions that play by themselves (fast-forward) don’t count towards the grade.</p>' : '') +
      '<p class="scale"><span><b>A</b> 90%+</span><span><b>B</b> 80%+</span><span><b>C</b> 70%+</span><span><b>D</b> 60%+</span><span><b>F</b> below</span></p>' +
      '<p class="scale-foot">Within each band the top scores get a + and the bottom scores a −.</p>';
    syncControls();
    syncUrl();
    start();
  }

  function newInput() {
    ui.input = ui.algo.generate(ui.sizeValue);
    syncUrl();
    start();
  }

  function start() {
    stopRun();
    if (ui.mode === 'quiz') {
      ui.run = { steps: BTA.quizSteps(ui.algo.id), final: null, stats: [] };
    } else if (ui.mode === 'drill') {
      const steps = BTA.drillSteps(ui.algo, ui.drillKind, 10);
      const last = steps[steps.length - 1];
      ui.run = { steps, final: last ? last.after || last.view : null, stats: [] };
    } else {
      ui.run = ui.algo.build(ui.input);
    }
    const first = ui.run.steps[0];
    if (first && first.view) BTA.render(ui.stage, first.view, { animate: false });
    ui.stage.classList.remove('locked', 'pickable');
    ui.desk.className = `sheet desk desk-${ui.mode}`;
    highlightLine(null);
    if (ui.mode === 'daily') {
      const done = BTA.daily.get(ui.daily.key);
      if (done) {
        if (ui.run.final) BTA.render(ui.stage, ui.run.final, { animate: false });
        ui.stage.classList.add('locked');
        return dailyDone(done);
      }
    }
    if (!ui.run.steps.length) {
      ui.desk.innerHTML = '<p class="prompt">No questions of this kind turned up. Press “New questions” to try again.</p>';
      return;
    }
    if (ui.mode === 'learn') startLesson();
    else startQuiz();
  }

  // The "Question types" list in the sidebar: how you do on each kind, with a drill for each.
  function renderTypes() {
    const list = document.getElementById('types');
    if (!list) return;
    const stats = kindStats.all()[ui.algo.id] || {};
    list.innerHTML = Object.entries(ui.algo.kinds || {})
      .map(([k, label]) => {
        const [n, right] = stats[k] || [0, 0];
        return `
          <li>
            <span class="type-name">${label}</span>
            <span class="type-score">${n ? `${right}/${n} first time` : 'not tried yet'}</span>
            ${n ? `<span class="type-bar" aria-hidden="true"><span style="width:${Math.round((right / n) * 100)}%"></span></span>` : ''}
            <a class="link type-drill" href="#/${ui.algo.id}/drill?k=${k}" aria-label="Drill: ${esc(label)}">Drill</a>
          </li>`;
      })
      .join('');
  }

  // ---------- timers ----------

  let timers = [];
  let clock = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function stopRun() {
    clearTimers();
    clearInterval(clock);
    clock = null;
    session = null;
    lesson = null;
  }

  // ---------- the Code panel ----------

  const LANG_KEY = 'bta-lang';
  function savedLang() {
    try {
      const l = localStorage.getItem(LANG_KEY);
      return l && (l === 'pseudo' || BTA.LANGS.some((x) => x.id === l)) ? l : 'pseudo';
    } catch {
      return 'pseudo';
    }
  }
  function saveLang(l) {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* not remembered */
    }
  }

  // Code lines with their comments set in a quieter colour.
  function codeHtml(text, comment) {
    if (!text) return ' ';
    const at = comment ? text.indexOf(comment) : -1;
    return at < 0 ? esc(text) : `${esc(text.slice(0, at))}<span class="cm">${esc(text.slice(at))}</span>`;
  }

  function renderCode() {
    const impl = BTA.getImpl(ui.algo.id);
    const lang = ui.lang !== 'pseudo' && impl && impl[ui.lang] ? ui.lang : 'pseudo';
    const info = BTA.LANGS.find((l) => l.id === lang);
    ui.codeLines = lang === 'pseudo' ? ui.algo.code.map((text, i) => ({ text, tags: [i] })) : impl[lang];
    ui.code.className = `code lang-${lang}`;
    ui.code.innerHTML = ui.codeLines
      .map((l) => `<li class="ln" data-tags="${l.tags.join(' ')}"><code>${codeHtml(l.text, info && info.comment)}</code></li>`)
      .join('');
    app.querySelectorAll('.langs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    ui.codeBox.scrollTop = 0;
    highlightLine(ui.line);
  }

  // Highlight the code lines for a pseudocode line, and scroll the code box (never the page) to them.
  // On phones the drawer's handle shows the highlighted line too.
  function highlightLine(line) {
    ui.line = line;
    let first = null;
    ui.code.querySelectorAll('.ln').forEach((n) => {
      const on = line != null && n.dataset.tags.split(' ').includes(String(line));
      n.classList.toggle('hl', on);
      if (on && !first) first = n;
    });
    if (ui.peek) ui.peek.textContent = first ? first.textContent.trim() : '';
    const box = ui.codeBox;
    if (first && box.scrollHeight > box.clientHeight) {
      const top = first.offsetTop;
      if (top < box.scrollTop || top + first.offsetHeight > box.scrollTop + box.clientHeight) {
        box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' });
      }
    }
  }

  // ---------- sharing and typing in arrays ----------

  async function copyText(text, btn) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Older browsers, or no permission: fall back to a hidden text box.
      const t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.append(t);
      t.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      t.remove();
    }
    const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    btn.textContent = ok ? 'Copied' : 'Couldn’t copy';
    setTimeout(() => {
      if (btn.isConnected) btn.textContent = label;
    }, 1600);
  }

  const copyLink = (btn) => copyText(location.href, btn);

  /*
   * The "Your own array" form (or text and pattern, for a text search).
   *   rules  – from BTA.inputRules
   *   fill() → { a, t } or { s, p } to start the fields with
   *   parse(URLSearchParams) → { input } or { error }
   *   onUse(input)
   */
  function ownInputForm({ rules, noun, note, fill, parse, onUse }) {
    const [lo, hi] = rules.range;
    const [min, max] = rules.length;
    const field = (name, label, cls, placeholder) => `
      <label class="own-field ${cls}">${label}
        <input name="${name}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${placeholder}" />
      </label>`;
    const names = rules.text ? ['s', 'p'] : rules.target ? ['a', 't'] : ['a'];
    const form = document.createElement('form');
    form.className = 'own';
    form.hidden = true;
    form.noValidate = true;
    form.innerHTML = `
      <div class="own-fields">
        ${
          rules.text
            ? field('s', 'Text', 'own-a', 'ABABCABAB') + field('p', 'Pattern', 'own-t', 'ABAB')
            : field('a', `Your ${noun}`, 'own-a', lo < 0 ? '8 -3 5 1' : '8 3 5 1') + (rules.target ? field('t', 'Target', 'own-t', '5') : '')
        }
        <button class="btn primary" type="submit">Use it</button>
        <button class="btn quiet" type="button" data-cancel>Cancel</button>
      </div>
      <p class="own-help">
        ${
          rules.text
            ? `Letters A to Z: ${rules.textLength[0]} to ${rules.textLength[1]} for the text and ${rules.patternLength[0]} to ${rules.patternLength[1]} for the pattern.`
            : `Whole numbers from ${lo} to ${hi}${rules.distinct ? ', all different' : ''}, ${min} to ${max} of them,
               with spaces or commas in between. ${rules.why || ''}`
        } ${note || ''}
      </p>
      <p class="own-error" role="alert"></p>`;
    const err = form.querySelector('.own-error');
    let opener = null;

    const close = () => {
      form.hidden = true;
      if (opener) {
        opener.setAttribute('aria-expanded', 'false');
        opener.focus();
      }
    };
    form.querySelector('[data-cancel]').addEventListener('click', close);
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = new URLSearchParams();
      for (const n of names) p.set(n, form.elements[n].value);
      const r = parse(p);
      if (r.error) {
        err.textContent = r.error;
        return;
      }
      err.textContent = '';
      close();
      onUse(r.input);
    });

    return {
      form,
      toggle(btn) {
        opener = btn;
        if (!form.hidden) return close();
        const v = fill();
        for (const n of names) form.elements[n].value = v[n];
        err.textContent = '';
        form.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        form.elements[names[0]].focus();
        form.elements[names[0]].select();
      },
    };
  }

  // ==========================================================================
  // Learn mode: a lesson player
  // ==========================================================================

  function startLesson() {
    const steps = ui.run.steps;
    const frames = [];
    steps.forEach((st, i) => {
      if (st.ask.type === 'info') frames.push({ step: i, phase: 'info' });
      else frames.push({ step: i, phase: 'q' }, { step: i, phase: 'a' });
    });
    lesson = { steps, frames, fi: -1, playing: false, speed: 1 };

    ui.desk.innerHTML = `
      <div class="desk-top">
        <span class="desk-label">Worked example</span>
        <span class="desk-meta" id="l-count"></span>
      </div>
      <div class="narration" id="narr" aria-live="polite"></div>
      <div class="player">
        <div class="player-buttons">
          <button class="pbtn" id="l-first" type="button" aria-label="Back to the start" title="Back to the start (Home)">${ICON.first}</button>
          <button class="pbtn" id="l-back" type="button" aria-label="Previous step" title="Previous step (←)">${ICON.back}</button>
          <button class="btn primary pplay" id="l-play" type="button"></button>
          <button class="pbtn" id="l-next" type="button" aria-label="Next step" title="Next step (→)">${ICON.next}</button>
        </div>
        <input class="scrub" id="l-scrub" type="range" min="0" max="${frames.length}" value="0" aria-label="Position in the lesson" />
        <label class="speed">Speed
          <select id="l-speed">
            <option value="0.6">Slow</option>
            <option value="1" selected>Normal</option>
            <option value="1.8">Fast</option>
          </select>
        </label>
      </div>
      <p class="keys-help"><kbd>←</kbd> <kbd>→</kbd> step · <kbd>space</kbd> play or pause</p>`;

    const $ = (id) => document.getElementById(id);
    Object.assign(ui, {
      narr: $('narr'),
      lcount: $('l-count'),
      lplay: $('l-play'),
      lback: $('l-back'),
      lnext: $('l-next'),
      lfirst: $('l-first'),
      scrub: $('l-scrub'),
    });
    ui.lfirst.addEventListener('click', () => go(0));
    ui.lback.addEventListener('click', () => go(lesson.fi - 1));
    ui.lnext.addEventListener('click', () => go(lesson.fi + 1));
    ui.lplay.addEventListener('click', togglePlay);
    ui.scrub.addEventListener('input', () => {
      setPlaying(false);
      go(Number(ui.scrub.value));
    });
    $('l-speed').addEventListener('change', (e) => {
      lesson.speed = Number(e.target.value);
      if (lesson.playing) go(lesson.fi);
    });

    setPlaying(false);
    go(0);
  }

  function setPlaying(on) {
    lesson.playing = on;
    ui.lplay.innerHTML = on ? `${ICON.pause}<span>Pause</span>` : `${ICON.next}<span>Play</span>`;
    ui.lplay.setAttribute('aria-pressed', String(on));
  }

  function togglePlay() {
    if (!lesson) return;
    if (lesson.playing) {
      setPlaying(false);
      clearTimers();
      return;
    }
    setPlaying(true);
    go(lesson.fi >= lesson.frames.length ? 0 : lesson.fi + (lesson.fi < 0 ? 1 : 0), { resume: true });
  }

  // Show frame `fi`. Frames come in pairs per question: the question, then its answer.
  function go(fi, { resume = false } = {}) {
    const L = lesson;
    if (!L) return;
    clearTimers();
    fi = Math.max(0, Math.min(fi, L.frames.length));
    const prev = L.fi;
    L.fi = fi;
    ui.scrub.value = String(fi);
    ui.lfirst.disabled = ui.lback.disabled = fi === 0;
    ui.lnext.disabled = fi >= L.frames.length;

    if (fi === L.frames.length) return endLesson();

    const f = L.frames[fi];
    const st = L.steps[f.step];
    let settle = 0;

    if (f.phase === 'a') {
      if (prev === fi - 1 && !resume) {
        // Moving forward from the question: point at the answer, then play the move.
        BTA.mark(ui.stage, 'is-answer', st.ask.type === 'choice' ? [] : st.ask.answer);
        if (st.after) {
          later(() => BTA.render(ui.stage, st.after), 750);
          settle = 750;
        }
      } else {
        BTA.render(ui.stage, st.after || st.view);
      }
    } else if (!(resume && prev === fi)) {
      BTA.render(ui.stage, st.view);
      if (f.phase === 'q') BTA.mark(ui.stage, 'is-answer', []);
    }

    ui.stage.classList.add('locked');
    ui.narr.innerHTML = narrate(f, st);
    ui.lcount.textContent = `Step ${fi + 1} of ${L.frames.length}`;
    highlightLine(st.line);

    if (L.playing) {
      const words = textOf(ui.narr.innerHTML).length;
      const wait = Math.min(9000, Math.max(2200, 1200 + words * 32)) / L.speed + settle;
      later(() => go(L.fi + 1), wait);
    }
  }

  function narrate(f, st) {
    if (f.phase === 'info') return `<p class="n-text">${st.prompt}</p>`;
    const q = `<p class="n-label">Question</p><p class="n-q${f.phase === 'a' ? ' answered' : ''}">${st.prompt}</p>`;
    if (f.phase === 'q') {
      return q + (st.hint ? `<p class="n-think"><span class="n-tag">Think</span>${st.hint}</p>` : '');
    }
    return (
      q +
      `<p class="n-answer"><span class="n-tag">Answer</span><b>${BTA.answerLabel(st)}</b></p>` +
      `<p class="n-why">${stripLead(st.correct)}</p>`
    );
  }

  function endLesson() {
    setPlaying(false);
    store.learned(ui.algo.id);
    BTA.render(ui.stage, ui.run.final);
    highlightLine(null);
    ui.lcount.textContent = 'Finished';
    ui.narr.innerHTML = `
      <div class="lesson-end">
        <p class="n-label">End of the worked example</p>
        <h2>That was ${ui.algo.name}, start to finish.</h2>
        <p>${ui.algo.summary}</p>
        <dl class="stats">${ui.run.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="actions">
          <button class="btn primary" id="try-same" type="button">Now you try it on this ${ui.noun}</button>
          <button class="btn" id="try-new" type="button">Practice on a new ${ui.noun}</button>
          <button class="btn quiet" id="rewatch" type="button">Watch again</button>
        </div>
      </div>`;
    document.getElementById('try-same').addEventListener('click', () => setMode('practice'));
    document.getElementById('try-new').addEventListener('click', () => {
      ui.input = ui.algo.generate(ui.sizeValue);
      setMode('practice');
    });
    document.getElementById('rewatch').addEventListener('click', () => go(0));
    document.getElementById('try-same').focus({ preventScroll: true });
  }

  // ==========================================================================
  // Practice, test, quiz, drill and daily: the question engine
  // ==========================================================================

  function startQuiz() {
    const run = ui.run;
    const mode = ui.mode;
    const oneShot = ONE_SHOT.has(mode);
    const canSkip = mode === 'practice' || mode === 'test';
    session = {
      mode,
      oneShot,
      steps: run.steps,
      total: run.steps.filter((s) => s.ask.type !== 'info').length,
      idx: -1,
      asked: 0,
      points: 0,
      results: [],
      streak: 0,
      bestStreak: 0,
      t0: Date.now(),
      sel: new Set(),
      attempts: 0,
      hinted: false,
      answered: false,
      // fast-forward
      ff: canSkip && saved(FF_KEY, true) !== false,
      kindRun: {},
      auto: new Set(),
      noAuto: new Set(),
      autoCount: 0,
      ffNote: null,
      jumped: false,
      // drill questions come from different arrays, so moving between them isn't animated
      fresh: mode === 'drill',
    };

    ui.desk.innerHTML = `
      <div class="desk-top">
        <ol class="strip" id="strip" aria-label="Your answers so far">${'<li></li>'.repeat(session.total)}</ol>
        <span class="desk-meta"><span id="qcount"></span><span id="qstreak"></span><span id="qclock">0:00</span></span>
      </div>
      <p class="prompt" id="prompt" tabindex="-1"></p>
      <div class="answers" id="answers"></div>
      <div class="hintbox" id="hintbox" hidden></div>
      <div class="feedback" id="feedback" role="status" aria-live="polite" hidden></div>
      <div class="desk-actions">
        ${
          canSkip
            ? `<label class="ff-toggle" title="After three right first time in a row of one kind of question, the rest of that kind play by themselves.">
                <input type="checkbox" id="ff"${session.ff ? ' checked' : ''} /> Fast-forward repeats
              </label>`
            : ''
        }
        ${oneShot ? '' : '<button class="link" id="hint" type="button">Hint <span class="cost">(−¼)</span></button>'}
        ${oneShot ? '' : '<button class="link" id="reveal" type="button" hidden>Show answer <span class="cost">(no credit)</span></button>'}
        <button class="link" id="skip" type="button" hidden>Skip to the next real question</button>
        <button class="btn primary" id="next" type="button" hidden>Continue <span aria-hidden="true">→</span></button>
      </div>`;

    const $ = (id) => document.getElementById(id);
    Object.assign(ui, {
      strip: $('strip'),
      qcount: $('qcount'),
      qstreak: $('qstreak'),
      qclock: $('qclock'),
      prompt: $('prompt'),
      answers: $('answers'),
      hintbox: $('hintbox'),
      feedback: $('feedback'),
      hintBtn: $('hint'),
      revealBtn: $('reveal'),
      skipBtn: $('skip'),
      nextBtn: $('next'),
      checkBtn: null,
    });
    if (ui.hintBtn) ui.hintBtn.addEventListener('click', showHint);
    if (ui.revealBtn) ui.revealBtn.addEventListener('click', reveal);
    ui.nextBtn.addEventListener('click', advance);
    ui.skipBtn.addEventListener('click', skipAuto);
    const ff = $('ff');
    if (ff) {
      ff.addEventListener('change', () => {
        session.ff = ff.checked;
        save(FF_KEY, ff.checked);
        if (!ff.checked) session.auto.clear();
      });
    }

    const s = session;
    clock = setInterval(() => {
      if (session === s) ui.qclock.textContent = fmtTime(Date.now() - s.t0);
    }, 1000);

    advance();
  }

  const current = () => session && session.steps[session.idx];
  const show = (btn, on) => btn && (btn.hidden = !on);
  const isAuto = (st) => session.ff && st.ask.type !== 'info' && st.kind && session.auto.has(st.kind);

  function markStrip(cls, title) {
    const cell = ui.strip.children[session.asked - 1];
    if (cell) {
      cell.className = cls;
      cell.title = title;
    }
  }

  function advance() {
    clearTimers();
    const s = session;
    s.idx++;
    if (s.idx >= s.steps.length) return finish();

    const st = current();
    s.sel = new Set();
    s.attempts = 0;
    s.hinted = false;
    s.answered = false;
    if (st.ask.type !== 'info') s.asked++;
    if (isAuto(st)) return autoStep(st);

    if (st.view) BTA.render(ui.stage, st.view, { animate: !s.fresh && !s.jumped });
    s.jumped = false;
    ui.stage.classList.remove('locked');
    ui.stage.classList.toggle('pickable', st.ask.type === 'pick' || st.ask.type === 'multi');

    ui.prompt.innerHTML = st.prompt;
    renderAnswers(st);
    ui.hintbox.hidden = true;
    setFeedback(null);
    show(ui.hintBtn, !!st.hint && st.ask.type !== 'info');
    show(ui.revealBtn, false);
    show(ui.skipBtn, false);
    show(ui.nextBtn, st.ask.type === 'info');
    highlightLine(st.line);
    updateStatus();

    if (ui.stageSheet.getBoundingClientRect().top < 0) ui.stageSheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (st.ask.type === 'info') ui.nextBtn.focus({ preventScroll: true });
    else ui.prompt.focus({ preventScroll: true });
  }

  // A question of a kind you've already shown you know: show its answer, play the move, move on.
  function autoStep(st) {
    const s = session;
    s.answered = true;
    s.autoCount++;
    s.results.push({ idx: s.idx, kind: 'auto', pts: null });
    markStrip('r-auto', `Question ${s.asked}: played by itself`);
    if (st.view) BTA.render(ui.stage, st.view, { animate: !s.jumped });
    s.jumped = false;
    ui.stage.classList.add('locked');
    ui.stage.classList.remove('pickable');
    if (st.ask.type !== 'choice') BTA.mark(ui.stage, 'is-answer', st.ask.answer);
    ui.prompt.innerHTML = st.prompt;
    ui.answers.innerHTML = '';
    ui.hintbox.hidden = true;
    setFeedback('auto', `<b>${BTA.answerLabel(st)}</b>. ${stripLead(st.correct)}`);
    show(ui.hintBtn, false);
    show(ui.revealBtn, false);
    show(ui.skipBtn, true);
    show(ui.nextBtn, true);
    highlightLine(st.line);
    updateStatus();
    if (st.after) later(() => BTA.render(ui.stage, st.after), 650);
    later(advance, 1600);
  }

  // Jump past every question that would play by itself, straight to the next one to answer.
  function skipAuto() {
    clearTimers();
    const s = session;
    while (s.idx + 1 < s.steps.length && isAuto(s.steps[s.idx + 1])) {
      s.idx++;
      s.asked++;
      s.autoCount++;
      s.results.push({ idx: s.idx, kind: 'auto', pts: null });
      markStrip('r-auto', `Question ${s.asked}: played by itself`);
    }
    s.jumped = true;
    advance();
  }

  function renderAnswers(st) {
    const a = st.ask;
    const what = ui.algo.graph ? 'node' : st.view && st.view.buckets ? 'bucket' : 'element';
    ui.checkBtn = null;

    if (a.type === 'choice') {
      ui.answers.innerHTML = `<div class="choices">${a.options
        .map(
          (o, i) =>
            `<button class="choice" type="button" data-value="${esc(o.value)}"><span class="bubble" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span>${esc(o.label)}</span></button>`,
        )
        .join('')}</div>`;
      ui.answers.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => onChoice(b)));
    } else if (a.type === 'pick') {
      const n = a.count || a.answer.length;
      ui.answers.innerHTML = `<p class="instr">${n === 1 ? `Click one ${what} above.` : `Click ${n} ${what}s above.`}</p>`;
    } else if (a.type === 'multi') {
      ui.answers.innerHTML = `
        <p class="instr">Click ${what}s above to select them. Click again to unselect.</p>
        <button class="btn primary" id="check" type="button">Check</button>`;
      ui.checkBtn = document.getElementById('check');
      ui.checkBtn.addEventListener('click', () => {
        if (!session.answered) check([...session.sel]);
      });
      updateCheckLabel();
    } else {
      ui.answers.innerHTML = '';
    }
  }

  function updateCheckLabel() {
    if (!ui.checkBtn) return;
    const n = session.sel.size;
    ui.checkBtn.textContent = n ? `Check (${n} selected)` : 'Check (none selected)';
  }

  function onPick(key) {
    const st = current();
    if (!st || session.answered) return;
    const t = st.ask.type;
    if (t !== 'pick' && t !== 'multi') return;
    const need = st.ask.count || st.ask.answer.length;

    if (session.sel.has(key)) session.sel.delete(key);
    else if (t === 'pick' && need === 1) session.sel = new Set([key]);
    else session.sel.add(key);

    BTA.mark(ui.stage, 'is-selected', [...session.sel]);
    updateCheckLabel();
    if (t === 'pick' && session.sel.size === need) check([...session.sel]);
  }

  function onChoice(btn) {
    if (session.answered || btn.disabled) return;
    check(btn.dataset.value);
  }

  function check(given) {
    const a = current().ask;
    const ok =
      a.type === 'choice'
        ? given === a.answer
        : given.length === a.answer.length && given.every((k) => a.answer.includes(k));
    if (ok) succeed();
    else if (session.oneShot) failTest(given);
    else fail(given);
  }

  // Score the current question and lock it.
  function settle(kind) {
    const s = session;
    const st = current();
    const pts = CREDIT[kind].pts;
    s.answered = true;
    s.points += pts;
    s.results.push({ idx: s.idx, kind, pts });
    s.streak = kind === 'first' ? s.streak + 1 : 0;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    markStrip(pts === 1 ? 'r-full' : pts > 0 ? 'r-part' : 'r-zero', `Question ${s.asked}: ${CREDIT[kind].label}`);
    if (st.kind && st.kind !== 'quiz') kindStats.add(ui.algo.id, st.kind, kind === 'first');

    // Fast-forward: three of a kind right first time in a row, with more of that kind to come.
    s.ffNote = null;
    if (s.ff && st.kind && !s.noAuto.has(st.kind) && !s.auto.has(st.kind)) {
      s.kindRun[st.kind] = kind === 'first' ? (s.kindRun[st.kind] || 0) + 1 : 0;
      const left = s.steps.slice(s.idx + 1).filter((x) => x.kind === st.kind).length;
      if (s.kindRun[st.kind] >= 3 && left > 0) {
        s.auto.add(st.kind);
        s.ffNote = { kind: st.kind, left };
      }
    }

    ui.stage.classList.add('locked');
    show(ui.hintBtn, false);
    show(ui.revealBtn, false);
    ui.hintbox.hidden = true;
    show(ui.nextBtn, true);
    ui.nextBtn.focus({ preventScroll: true });
    updateStatus();
  }

  function markAnswer(st, given) {
    if (st.ask.type === 'choice') {
      ui.answers.querySelectorAll('.choice').forEach((b) => {
        b.disabled = true;
        if (b.dataset.value === st.ask.answer) b.classList.add('is-correct');
        if (given != null && b.dataset.value === given) b.classList.add('is-wrong');
      });
    } else {
      BTA.mark(ui.stage, 'is-selected', []);
      if (given) BTA.mark(ui.stage, 'is-wrong', given.filter((k) => !st.ask.answer.includes(k)));
      BTA.mark(ui.stage, 'is-correct', st.ask.answer);
      if (ui.checkBtn) ui.checkBtn.disabled = true;
    }
  }

  // "Three in a row!" under the feedback, with a way to say no.
  function ffNoteHtml() {
    const n = session.ffNote;
    if (!n) return '';
    const label = esc(ui.algo.kinds[n.kind]);
    return (
      `<p class="ff-note"><b>Three in a row!</b> ` +
      (n.left === 1 ? `The last “${label}” question will play by itself.` : `The other ${n.left} “${label}” questions will play by themselves.`) +
      ` <button class="link" id="ff-keep" type="button">Keep asking me</button></p>`
    );
  }

  function wireFfNote() {
    const b = document.getElementById('ff-keep');
    if (!b) return;
    const kind = session.ffNote.kind;
    b.addEventListener('click', () => {
      session.auto.delete(kind);
      session.noAuto.add(kind);
      b.closest('.ff-note').textContent = 'OK, you’ll keep getting these.';
    });
  }

  function succeed() {
    const st = current();
    const s = session;
    const kind = s.attempts === 0 ? (s.hinted ? 'hinted' : 'first') : s.attempts === 1 ? 'second' : 'later';
    settle(kind);
    markAnswer(st);
    const credit = kind === 'first' ? '' : `<span class="credit">+${fraction(CREDIT[kind].pts)}</span> `;
    setFeedback(kind === 'first' ? 'ok' : 'part', credit + st.correct + ffNoteHtml());
    wireFfNote();
    if (st.after) later(() => BTA.render(ui.stage, st.after), 380);
  }

  function fail(given) {
    const st = current();
    session.attempts++;
    session.streak = 0;
    if (st.kind) session.kindRun[st.kind] = 0;
    const msg = typeof st.wrong === 'function' ? st.wrong(given) : st.wrong || 'Not quite. Try again.';
    setFeedback('bad', msg);

    if (st.ask.type === 'choice') {
      const b = [...ui.answers.querySelectorAll('.choice')].find((x) => x.dataset.value === given);
      if (b) {
        b.disabled = true;
        b.classList.add('is-wrong');
      }
    } else {
      session.sel = new Set();
      BTA.mark(ui.stage, 'is-selected', []);
      BTA.mark(ui.stage, 'is-wrong', given);
      later(() => BTA.mark(ui.stage, 'is-wrong', []), 700);
      updateCheckLabel();
    }
    show(ui.revealBtn, true);
    updateStatus();
  }

  // One attempt only: show what was right, then move on.
  function failTest(given) {
    const st = current();
    settle('wrong');
    markAnswer(st, given);
    const msg = typeof st.wrong === 'function' ? st.wrong(given) : st.wrong;
    setFeedback('bad', `${msg} <span class="then">The answer was <b>${BTA.answerLabel(st)}</b>. ${stripLead(st.correct)}</span>`);
    if (st.after) later(() => BTA.render(ui.stage, st.after), 1400);
  }

  function reveal() {
    const st = current();
    if (!st || session.answered) return;
    settle('shown');
    markAnswer(st);
    setFeedback('shown', `The answer is <b>${BTA.answerLabel(st)}</b>. ${stripLead(st.correct)}`);
    if (st.after) later(() => BTA.render(ui.stage, st.after), 1000);
  }

  function showHint() {
    const st = current();
    if (!st || !st.hint || session.answered) return;
    session.hinted = true;
    ui.hintbox.innerHTML = `<span class="hint-tag">Hint</span> ${st.hint}`;
    ui.hintbox.hidden = false;
    show(ui.hintBtn, false);
  }

  function setFeedback(kind, html) {
    const f = ui.feedback;
    if (!kind) {
      f.hidden = true;
      f.className = 'feedback';
      f.innerHTML = '';
      return;
    }
    const mark = { ok: '✓', part: '✓', bad: '✗', shown: '→', auto: '»' }[kind];
    f.className = `feedback fb-${kind}`;
    f.innerHTML = `<span class="fb-mark" aria-hidden="true">${mark}</span><div class="fb-text">${html}</div>`;
    f.hidden = false;
    if (kind === 'bad') {
      f.classList.remove('shake');
      void f.offsetWidth; // restart the animation
      f.classList.add('shake');
    }
    if (kind !== 'auto' && f.getBoundingClientRect().bottom > window.innerHeight) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateStatus() {
    const s = session;
    const st = current();
    const strip = ui.strip.children;
    for (let i = 0; i < strip.length; i++) strip[i].classList.toggle('now', i === s.asked - 1 && !s.answered);
    ui.qcount.textContent = st && st.ask.type === 'info' ? `${s.total} questions` : `Q${s.asked}/${s.total}`;
    ui.qstreak.textContent = s.streak >= 3 ? `streak ${s.streak}` : '';
  }

  // ---------- results ----------

  function finish() {
    clearTimers();
    clearInterval(clock);
    const s = session;
    const algo = ui.algo;
    const mode = s.mode;
    if (ui.run.final) BTA.render(ui.stage, ui.run.final);
    ui.stage.classList.add('locked');
    ui.stage.classList.remove('pickable');
    highlightLine(null);

    const graded = s.total - s.autoCount;
    const pct = graded ? Math.round((s.points / graded) * 100) : 100;
    const grade = gradeOf(pct);

    if (mode === 'daily') {
      const marks = s.results.filter((r) => r.pts !== null).map((r) => r.pts === 1);
      const result = { id: algo.id, name: algo.name, pct, grade, right: marks.filter(Boolean).length, total: marks.length, marks };
      BTA.daily.save(ui.daily.key, result);
      session = null;
      return dailyDone(result);
    }

    const prev = mode === 'drill' ? null : store.record(algo.id, mode, pct);
    const isBest = prev != null && pct > prev;
    const time = fmtTime(Date.now() - s.t0);
    const next = algos[(algos.indexOf(algo) + 1) % algos.length];
    renderTypes();

    const count = (kind) => s.results.filter((r) => r.kind === kind).length;
    const breakdown =
      creditRows(mode)
        .map((kind) => {
          const n = count(kind);
          return `<tr class="${n ? '' : 'zero'}"><th scope="row">${CREDIT[kind].label}</th><td>${n}</td><td>× ${fraction(CREDIT[kind].pts)}</td><td>${+(n * CREDIT[kind].pts).toFixed(2)}</td></tr>`;
        })
        .join('') +
      (s.autoCount ? `<tr class="auto-row"><th scope="row">${CREDIT.auto.label}</th><td>${s.autoCount}</td><td>—</td><td>not graded</td></tr>` : '');

    const missed = s.results.filter((r) => r.pts !== null && r.pts < 1);
    const review = missed
      .map((r) => {
        const st = s.steps[r.idx];
        return `
          <li>
            <p class="r-q">${st.prompt}</p>
            <p class="r-meta"><span class="r-how">${CREDIT[r.kind].label}</span> Answer: <b>${BTA.answerLabel(st)}</b></p>
            <p class="r-why">${stripLead(st.correct)}</p>
          </li>`;
      })
      .join('');

    // The kind of question missed most this time, to drill.
    const misses = {};
    for (const r of missed) {
      const k = s.steps[r.idx].kind;
      if (k && k !== 'quiz') misses[k] = (misses[k] || 0) + 1;
    }
    const weakest = Object.entries(misses).sort((x, y) => y[1] - x[1])[0];
    const drillWeak = weakest && mode !== 'drill' ? weakest[0] : null;

    const title = mode === 'drill' ? `Drill: ${algo.kinds[ui.drillKind]}` : `${algo.name} · ${MODES[mode].label}`;
    let actions;
    if (mode === 'quiz') {
      actions = `
        <button class="btn primary" id="again" type="button">Take the quiz again</button>
        <button class="btn" id="to-practice" type="button">Practice ${algo.name}</button>`;
    } else if (mode === 'drill') {
      actions = `
        <button class="btn primary" id="again" type="button">Ten more</button>
        <button class="btn" id="to-practice" type="button">Back to practice</button>`;
    } else {
      actions = `
        <button class="btn primary" id="again" type="button">${mode === 'test' ? 'Take another test' : 'Try a new ' + ui.noun}</button>
        <button class="btn" id="same" type="button">Replay this ${ui.noun}</button>
        ${
          drillWeak
            ? `<a class="btn" href="#/${algo.id}/drill?k=${drillWeak}">Drill: ${esc(algo.kinds[drillWeak])}</a>`
            : pct < 80
              ? `<button class="btn" id="to-learn" type="button">Watch the lesson</button>`
              : mode === 'practice'
                ? `<button class="btn" id="to-test" type="button">Take the test</button>`
                : ''
        }`;
    }

    ui.desk.innerHTML = `
      <div class="results">
        <div class="grade-mark" role="img" aria-label="Grade ${grade}, ${pct} percent">
          ${CIRCLE}
          <span class="grade-letter">${grade}</span>
          <span class="grade-pct">${pct}%</span>
        </div>
        <div class="results-body">
          <p class="teacher-note">${teacherNote(pct)}${isBest ? ' New personal best.' : ''}</p>
          <h2>${esc(title)}</h2>
          <p class="results-line">${graded} ${plural(graded, 'question', 'questions')} graded${s.autoCount ? ` · ${s.autoCount} played by themselves` : ''} · ${time} · best streak ${s.bestStreak}</p>
        </div>
      </div>

      <table class="breakdown">
        <thead><tr><th scope="col">Answered</th><th scope="col">Count</th><th scope="col">Credit</th><th scope="col">Points</th></tr></thead>
        <tbody>${breakdown}</tbody>
        <tfoot><tr><th scope="row">Total</th><td>${graded}</td><td></td><td>${+s.points.toFixed(2)} / ${graded}</td></tr></tfoot>
      </table>

      ${
        missed.length
          ? `<details class="review"${missed.length <= 4 ? ' open' : ''}>
              <summary>Review ${missed.length} ${plural(missed.length, 'question', 'questions')} you missed</summary>
              <ol>${review}</ol>
            </details>`
          : ''
      }

      ${ui.run.stats.length ? `<dl class="stats">${ui.run.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}

      ${
        mode === 'drill'
          ? ''
          : `<div class="recap">
              <h3>${mode === 'quiz' ? 'In short' : 'What just happened'}</h3>
              <p>${algo.summary}</p>
            </div>`
      }

      <div class="actions">
        ${actions}
        <a class="btn quiet" href="#/${next.id}">Next: ${next.name} <span aria-hidden="true">→</span></a>
      </div>`;

    const on = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    on('again', mode === 'quiz' || mode === 'drill' ? start : newInput);
    on('same', start);
    on('to-learn', () => setMode('learn'));
    on('to-practice', () => setMode('practice'));
    on('to-test', () => {
      ui.input = ui.algo.generate(ui.sizeValue);
      setMode('test');
    });
    document.getElementById('again').focus({ preventScroll: true });
    ui.desk.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    session = null;
  }

  // ---------- daily challenge results ----------

  function dailyDone(r) {
    const key = ui.daily.key;
    const base = location.href.split('#')[0];
    const text = BTA.daily.share(key, r, `${base}#/daily`);
    const streak = BTA.daily.streak();
    ui.desk.innerHTML = `
      <div class="results">
        <div class="grade-mark" role="img" aria-label="Grade ${r.grade}, ${r.pct} percent">
          ${CIRCLE}
          <span class="grade-letter">${r.grade}</span>
          <span class="grade-pct">${r.pct}%</span>
        </div>
        <div class="results-body">
          <p class="teacher-note">${teacherNote(r.pct)}</p>
          <h2>Daily challenge · ${esc(BTA.daily.label(key))}</h2>
          <p class="results-line">${esc(r.name)} · ${r.right} of ${r.total} right · streak: ${streak} ${plural(streak, 'day', 'days')}</p>
        </div>
      </div>
      <section class="share">
        <h3>Share your result</h3>
        <pre class="share-text">${esc(text)}</pre>
        <div class="actions">
          <button class="btn primary" id="copy-share" type="button">Copy</button>
          <a class="btn" href="#/${r.id}">Practice ${esc(r.name)}</a>
        </div>
      </section>
      <p class="next-daily" id="next-daily"></p>`;
    document.getElementById('copy-share').addEventListener('click', (e) => copyText(text, e.currentTarget));
    const tick = () => {
      const el = document.getElementById('next-daily');
      if (!el) return clearInterval(clock);
      const m = Math.ceil(BTA.daily.msToNext() / 60000);
      el.textContent = `The next challenge is in ${Math.floor(m / 60)} h ${m % 60} min.`;
    };
    tick();
    clearInterval(clock);
    clock = setInterval(tick, 30000);
  }

  // ---------- keyboard ----------

  document.addEventListener('keydown', (e) => {
    if (!ui || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && t.closest('select, input, textarea')) return;
    const onButton = t.closest && t.closest('button, a');

    if (lesson) {
      if (e.key === 'ArrowRight') go(lesson.fi + 1);
      else if (e.key === 'ArrowLeft') go(lesson.fi - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === ' ' && !onButton) togglePlay();
      else return;
      e.preventDefault();
      return;
    }

    if (!session) return;
    const st = current();

    if (e.key === 'Enter' || e.key === ' ') {
      // SVG nodes act as buttons, but don't get native keyboard activation.
      if (t instanceof SVGElement && t.closest('[data-key]')) {
        e.preventDefault();
        onPick(t.closest('[data-key]').dataset.key);
        return;
      }
      if (onButton) return; // native activation
      if (e.key === 'Enter' && st) {
        if (!ui.nextBtn.hidden) {
          e.preventDefault();
          ui.nextBtn.click();
        } else if (ui.checkBtn && !session.answered) {
          e.preventDefault();
          ui.checkBtn.click();
        }
      }
      return;
    }

    if (st && st.ask.type === 'choice' && !session.answered) {
      // 1, 2, 3 … or the letter on the button: a, b, c …
      const i = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : /^[a-z]$/i.test(e.key) ? e.key.toLowerCase().charCodeAt(0) - 97 : -1;
      const b = i >= 0 ? ui.answers.querySelectorAll('.choice')[i] : null;
      if (b && !b.disabled) b.click();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!ui || !ui.stage.isConnected || !BTA.refit(ui.stage)) return;
      if (session && !session.answered) BTA.mark(ui.stage, 'is-selected', [...session.sel]);
    }, 150);
  });

  // ---------- colour theme: follows the system unless one is picked ----------

  const THEMES = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  function applyTheme(t) {
    if (t === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    const b = document.getElementById('theme');
    if (b) {
      b.dataset.theme = t;
      b.querySelector('.theme-label').textContent = THEMES[t];
      b.setAttribute('aria-label', `Colour theme: ${THEMES[t]}. Click to change it.`);
    }
  }
  const themeBtn = document.getElementById('theme');
  if (themeBtn) {
    const keys = Object.keys(THEMES);
    let theme = keys.includes(saved('bta-theme', 'auto')) ? saved('bta-theme', 'auto') : 'auto';
    applyTheme(theme);
    themeBtn.addEventListener('click', () => {
      theme = keys[(keys.indexOf(theme) + 1) % keys.length];
      save('bta-theme', theme);
      applyTheme(theme);
    });
  }

  window.addEventListener('hashchange', route);
  route();
})();
