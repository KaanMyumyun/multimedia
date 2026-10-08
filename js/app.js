/*
 * App: routing, the contents page, the report card, and the play page.
 *
 * The play page has three modes:
 *   learn    – a lesson player that steps through a worked example and explains each move
 *   practice – you make every move; hints and retries are allowed for partial credit
 *   test     – one attempt per question and no hints; graded A+ to F
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
      blurb: 'Bubble, selection, insertion, merge, quick and heap sort.',
      parts: [
        { title: 'Simple sorts', ids: ['bubble', 'selection', 'insertion'] },
        { title: 'Efficient sorts', ids: ['merge', 'quick', 'heap'] },
      ],
    },
    {
      id: 'searching',
      href: '#/searching',
      title: 'Searching',
      blurb: 'Linear, binary, jump, interpolation and exponential search, then BFS, DFS and Dijkstra on graphs.',
      parts: [
        { title: 'Searching an array', ids: ['linear', 'binary', 'jump', 'interpolation', 'exponential'] },
        { title: 'Searching a graph', ids: ['bfs', 'dfs', 'dijkstra'] },
      ],
    },
  ];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

  // Every algorithm in reading order: for "Next" links and the report card.
  const algos = BOOKS.flatMap((b) => b.parts.flatMap((p) => p.ids)).map((id) => BTA.get(id));

  // Where an algorithm sits: its book, its part, and its chapter number in that book.
  function placeOf(a) {
    for (const book of BOOKS) {
      let chapter = 0;
      for (const [i, part] of book.parts.entries()) {
        for (const id of part.ids) {
          chapter++;
          if (id === a.id) return { book, part, partNo: ROMAN[i], chapter: String(chapter).padStart(2, '0') };
        }
      }
    }
    throw new Error(`${a.id} is not in any book`);
  }

  const MODES = {
    learn: { label: 'Learn', note: 'A worked example. Step through it and read why each move is made.' },
    practice: { label: 'Practice', note: 'Make every move yourself. Hints and retries are allowed, for partial credit.' },
    test: { label: 'Test', note: 'One attempt per question, no hints. Graded A+ to F.' },
  };

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
  };
  const CREDIT_ROWS = { practice: ['first', 'hinted', 'second', 'later', 'shown'], test: ['first', 'wrong'] };

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

  // ---------- progress (this browser only, best effort) ----------

  const store = {
    key: 'bta-progress-v2',
    all() {
      try {
        return JSON.parse(localStorage.getItem(this.key)) || {};
      } catch {
        return {};
      }
    },
    write(all) {
      try {
        localStorage.setItem(this.key, JSON.stringify(all));
      } catch {
        /* storage unavailable: progress just isn't remembered */
      }
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
      } catch {
        /* nothing to reset */
      }
    },
  };

  const gradeTag = (rec) =>
    rec ? `<span class="grade-tag" title="Best: ${rec.best}%">${gradeOf(rec.best)}</span>` : '<span class="grade-tag none">—</span>';

  // ---------- routing ----------

  let ui = null; // the play page
  let session = null; // a practice or test run
  let lesson = null; // a learn-mode run

  function route() {
    stopRun();
    ui = null;
    const [, id, mode] = location.hash.match(/^#\/([\w-]+)(?:\/(\w+))?/) || [];
    const algo = id && BTA.get(id);
    let section;
    if (id === 'report') {
      reportPage();
      section = 'report';
    } else if (algo) {
      playPage(algo, MODES[mode] ? mode : 'practice');
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
          </dl>
        </aside>
      </header>
      <h2 class="book-label">Book one: Sorting</h2>`
        : `
      <header class="masthead">
        <div class="masthead-main">
          <p class="crumb"><a href="#/">Be the Algorithm</a><span aria-hidden="true">/</span>Book two</p>
          <h1 class="site-title book-title"><span class="marker">Searching</span></h1>
          <p class="tagline">Find a value in an array, or find your way around a graph. Eight algorithms, from the obvious to the clever.</p>
        </div>
        <aside class="how-to" aria-label="Where to start">
          <h2>Where to start</h2>
          <p>Do Linear and Binary Search first. Jump, Interpolation and Exponential Search are each a twist on one of them.</p>
          <p>For graphs, do Breadth-First Search before Depth-First Search, then Dijkstra.</p>
        </aside>
      </header>`;

    app.innerHTML = `
      ${head}
      ${book.parts
        .map(
          (p, i) => `
        <section class="part">
          <h2 class="part-title"><span class="part-no">Part ${ROMAN[i]}</span> ${p.title}</h2>
          <ol class="chapters">${p.ids.map((id) => chapter(BTA.get(id))).join('')}</ol>
        </section>`,
        )
        .join('')}

      <a class="book-link" href="${other.href}">
        <span class="book-link-label">${book.id === 'sorting' ? 'Book two' : 'Book one'}</span>
        <span class="book-link-title">${other.title} <span aria-hidden="true">→</span></span>
        <span class="book-link-blurb">${other.blurb}</span>
      </a>

      <footer class="foot">
        Grades are saved in this browser only. <a href="#/report">See your report card</a>.
      </footer>`;
  }

  // ---------- report card ----------

  function reportPage() {
    document.title = 'Report card · Be the Algorithm';
    const progress = store.all();
    const tests = algos.map((a) => progress[a.id]?.test?.best).filter((x) => x != null);
    const avg = tests.length ? Math.round(tests.reduce((s, x) => s + x, 0) / tests.length) : null;
    const learned = algos.filter((a) => progress[a.id]?.learned).length;

    const pct = (m) => (m ? `<span class="rc-pct">${m.best}%</span>` : '');
    const row = (a) => {
      const r = progress[a.id] || {};
      const runs = (r.practice?.plays || 0) + (r.test?.plays || 0);
      return `
          <tr>
            <td class="rc-no">${placeOf(a).chapter}</td>
            <th scope="row"><a href="#/${a.id}">${a.name}</a></th>
            <td class="rc-learn">${r.learned ? '<span class="tick" aria-label="Watched">✓</span>' : '<span class="muted">—</span>'}</td>
            <td>${gradeTag(r.practice)} ${pct(r.practice)}</td>
            <td>${gradeTag(r.test)} ${pct(r.test)}</td>
            <td class="rc-runs">${runs || '<span class="muted">—</span>'}</td>
          </tr>`;
    };
    const rows = BOOKS.map(
      (b) => `
          <tr class="rc-book"><th scope="rowgroup" colspan="6"><a href="${b.href}">${b.title}</a></th></tr>
          ${b.parts.flatMap((p) => p.ids).map((id) => row(BTA.get(id))).join('')}`,
    ).join('');

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
      </div>

      <div class="table-wrap">
        <table class="report">
          <thead>
            <tr><th scope="col">Ch.</th><th scope="col">Algorithm</th><th scope="col">Lesson</th><th scope="col">Practice</th><th scope="col">Test</th><th scope="col">Runs</th></tr>
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
      if (window.confirm('Erase all grades and lesson progress saved in this browser?')) {
        store.reset();
        reportPage();
      }
    });
  }

  function gradingHelp(mode) {
    if (mode === 'test') {
      return '<p><b>Test:</b> each question is worth 1 point if your first answer is right, and 0 otherwise.</p>';
    }
    return (
      '<p><b>Practice:</b> each question is worth 1 point. ' +
      'You get ¾ after a hint, ½ on the second try, ¼ after that, and 0 if you reveal the answer.</p>'
    );
  }

  // ---------- play page ----------

  function playPage(algo, mode) {
    const noun = algo.group === 'Graphs' ? 'graph' : 'array';
    const cx = algo.complexity;
    const place = placeOf(algo);

    app.innerHTML = `
      <div class="play">
        <header class="page-head">
          <p class="crumb">
            <a href="${place.book.href}">${place.book.title}</a><span aria-hidden="true">/</span>Part ${place.partNo}: ${place.part.title}<span aria-hidden="true">/</span>Chapter ${place.chapter}
          </p>
          <h1>${algo.name}</h1>
          <p class="blurb">${algo.blurb}</p>
        </header>

        <div class="toolbar">
          <div class="modes" role="group" aria-label="Mode">
            ${Object.entries(MODES)
              .map(([k, m]) => `<button type="button" data-mode="${k}" aria-pressed="false">${m.label}</button>`)
              .join('')}
          </div>
          <div class="controls">
            ${
              algo.input
                ? `<label class="size">${algo.input.label}
                    <select id="size">${algo.input.options
                      .map((o) => `<option value="${o}"${o === algo.input.default ? ' selected' : ''}>${o}</option>`)
                      .join('')}</select>
                  </label>`
                : ''
            }
            <button class="btn" id="new" type="button">New ${noun}</button>
            <button class="btn quiet" id="restart" type="button">Restart</button>
          </div>
          <p class="mode-note" id="mode-note"></p>
        </div>

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
            <section>
              <h2>Pseudocode</h2>
              <ol class="code" id="code">${algo.code
                .map((l, i) => `<li class="ln" data-line="${i}"><code>${esc(l)}</code></li>`)
                .join('')}</ol>
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

    ui = {
      algo,
      noun,
      mode,
      stage: document.getElementById('stage'),
      stageSheet: app.querySelector('.stage-sheet'),
      desk: document.getElementById('desk'),
      code: document.getElementById('code'),
      size: document.getElementById('size'),
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
    document.getElementById('new').addEventListener('click', newInput);
    document.getElementById('restart').addEventListener('click', start);
    if (ui.size) {
      ui.size.addEventListener('change', () => {
        ui.sizeValue = Number(ui.size.value);
        newInput();
      });
    }

    ui.input = algo.generate(ui.sizeValue);
    setMode(mode, { replaceUrl: false });
  }

  // Switch modes, keeping the same input so "watch, then try it" uses one array.
  function setMode(mode, { replaceUrl = true } = {}) {
    ui.mode = mode;
    document.title = `${ui.algo.name} · ${MODES[mode].label} · Be the Algorithm`;
    app.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    document.getElementById('mode-note').textContent = MODES[mode].note;
    const grading = document.getElementById('grading');
    grading.hidden = mode === 'learn';
    document.getElementById('grading-body').innerHTML =
      gradingHelp(mode) +
      '<p class="scale"><span><b>A</b> 90%+</span><span><b>B</b> 80%+</span><span><b>C</b> 70%+</span><span><b>D</b> 60%+</span><span><b>F</b> below</span></p>' +
      '<p class="scale-foot">Within each band the top scores get a + and the bottom scores a −.</p>';
    if (replaceUrl) history.replaceState(null, '', `#/${ui.algo.id}${mode === 'practice' ? '' : '/' + mode}`);
    start();
  }

  function newInput() {
    ui.input = ui.algo.generate(ui.sizeValue);
    start();
  }

  function start() {
    stopRun();
    ui.run = ui.algo.build(ui.input);
    BTA.render(ui.stage, ui.run.steps[0].view, { animate: false });
    ui.stage.classList.remove('locked', 'pickable');
    ui.desk.className = `sheet desk desk-${ui.mode}`;
    if (ui.mode === 'learn') startLesson();
    else startQuiz();
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

  function highlightLine(line) {
    ui.code.querySelectorAll('.ln').forEach((n) => n.classList.toggle('hl', Number(n.dataset.line) === line));
  }

  // What the right answer is, in words ("8 and 3", "position 4", "Swap").
  function answerLabel(st) {
    const a = st.ask;
    if (a.type === 'choice') return a.options.find((o) => o.value === a.answer).label;
    if (!a.answer.length) return 'none of them';
    const v = st.view;
    if (v.kind === 'graph') return BTA.list(a.answer);
    if (a.position) return BTA.list(a.answer.map((k) => `position ${k}`));
    const valueOf = (k) => {
      for (const r of v.rows) for (const c of r.cells) if (c && !c.ghost && c.key === k) return c.value;
      return k;
    };
    if (a.answer.length === 1 && /^\d+$/.test(a.answer[0])) return `${valueOf(a.answer[0])} (position ${a.answer[0]})`;
    return BTA.list(a.answer.map(valueOf));
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
      `<p class="n-answer"><span class="n-tag">Answer</span><b>${answerLabel(st)}</b></p>` +
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
  // Practice and test: the question engine
  // ==========================================================================

  function startQuiz() {
    const run = ui.run;
    session = {
      mode: ui.mode,
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
    };
    const test = ui.mode === 'test';

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
        ${test ? '' : '<button class="link" id="hint" type="button">Hint <span class="cost">(−¼)</span></button>'}
        ${test ? '' : '<button class="link" id="reveal" type="button" hidden>Show answer <span class="cost">(no credit)</span></button>'}
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
      nextBtn: $('next'),
      checkBtn: null,
    });
    if (ui.hintBtn) ui.hintBtn.addEventListener('click', showHint);
    if (ui.revealBtn) ui.revealBtn.addEventListener('click', reveal);
    ui.nextBtn.addEventListener('click', advance);

    const s = session;
    clock = setInterval(() => {
      if (session === s) ui.qclock.textContent = fmtTime(Date.now() - s.t0);
    }, 1000);

    advance();
  }

  const current = () => session && session.steps[session.idx];
  const show = (btn, on) => btn && (btn.hidden = !on);

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

    BTA.render(ui.stage, st.view);
    ui.stage.classList.remove('locked');
    ui.stage.classList.toggle('pickable', st.ask.type === 'pick' || st.ask.type === 'multi');

    ui.prompt.innerHTML = st.prompt;
    renderAnswers(st);
    ui.hintbox.hidden = true;
    setFeedback(null);
    show(ui.hintBtn, !!st.hint && st.ask.type !== 'info');
    show(ui.revealBtn, false);
    show(ui.nextBtn, st.ask.type === 'info');
    highlightLine(st.line);
    updateStatus();

    if (ui.stageSheet.getBoundingClientRect().top < 0) ui.stageSheet.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (st.ask.type === 'info') ui.nextBtn.focus({ preventScroll: true });
    else ui.prompt.focus({ preventScroll: true });
  }

  function renderAnswers(st) {
    const a = st.ask;
    const what = ui.algo.group === 'Graphs' ? 'node' : 'element';
    ui.checkBtn = null;

    if (a.type === 'choice') {
      ui.answers.innerHTML = `<div class="choices">${a.options
        .map(
          (o, i) =>
            `<button class="choice" type="button" data-value="${esc(o.value)}"><span class="bubble" aria-hidden="true">${'ABCDEFGH'[i]}</span><span>${esc(o.label)}</span></button>`,
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
    else if (session.mode === 'test') failTest(given);
    else fail(given);
  }

  // Score the current question and lock it.
  function settle(kind) {
    const s = session;
    const pts = CREDIT[kind].pts;
    s.answered = true;
    s.points += pts;
    s.results.push({ idx: s.idx, kind, pts });
    s.streak = kind === 'first' ? s.streak + 1 : 0;
    s.bestStreak = Math.max(s.bestStreak, s.streak);

    const cell = ui.strip.children[s.asked - 1];
    cell.className = pts === 1 ? 'r-full' : pts > 0 ? 'r-part' : 'r-zero';
    cell.title = `Question ${s.asked}: ${CREDIT[kind].label}`;

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

  function succeed() {
    const st = current();
    const s = session;
    const kind = s.attempts === 0 ? (s.hinted ? 'hinted' : 'first') : s.attempts === 1 ? 'second' : 'later';
    settle(kind);
    markAnswer(st);
    const credit = kind === 'first' ? '' : `<span class="credit">+${fraction(CREDIT[kind].pts)}</span> `;
    setFeedback(kind === 'first' ? 'ok' : 'part', credit + st.correct);
    if (st.after) later(() => BTA.render(ui.stage, st.after), 380);
  }

  function fail(given) {
    const st = current();
    session.attempts++;
    session.streak = 0;
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

  // Test mode: one attempt. Show what was right, then move on.
  function failTest(given) {
    const st = current();
    settle('wrong');
    markAnswer(st, given);
    const msg = typeof st.wrong === 'function' ? st.wrong(given) : st.wrong;
    setFeedback('bad', `${msg} <span class="then">The answer was <b>${answerLabel(st)}</b>. ${stripLead(st.correct)}</span>`);
    if (st.after) later(() => BTA.render(ui.stage, st.after), 1400);
  }

  function reveal() {
    const st = current();
    if (!st || session.answered) return;
    settle('shown');
    markAnswer(st);
    setFeedback('shown', `The answer is <b>${answerLabel(st)}</b>. ${stripLead(st.correct)}`);
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
    const mark = { ok: '✓', part: '✓', bad: '✗', shown: '→' }[kind];
    f.className = `feedback fb-${kind}`;
    f.innerHTML = `<span class="fb-mark" aria-hidden="true">${mark}</span><div class="fb-text">${html}</div>`;
    f.hidden = false;
    if (kind === 'bad') {
      f.classList.remove('shake');
      void f.offsetWidth; // restart the animation
      f.classList.add('shake');
    }
    if (f.getBoundingClientRect().bottom > window.innerHeight) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
    BTA.render(ui.stage, ui.run.final);
    ui.stage.classList.add('locked');
    ui.stage.classList.remove('pickable');
    highlightLine(null);

    const pct = s.total ? Math.round((s.points / s.total) * 100) : 100;
    const grade = gradeOf(pct);
    const prev = store.record(algo.id, mode, pct);
    const isBest = prev != null && pct > prev;
    const time = fmtTime(Date.now() - s.t0);
    const next = algos[(algos.indexOf(algo) + 1) % algos.length];

    const count = (kind) => s.results.filter((r) => r.kind === kind).length;
    const breakdown = CREDIT_ROWS[mode]
      .map((kind) => {
        const n = count(kind);
        return `<tr class="${n ? '' : 'zero'}"><th scope="row">${CREDIT[kind].label}</th><td>${n}</td><td>× ${fraction(CREDIT[kind].pts)}</td><td>${+(n * CREDIT[kind].pts).toFixed(2)}</td></tr>`;
      })
      .join('');

    const missed = s.results.filter((r) => r.pts < 1);
    const review = missed
      .map((r) => {
        const st = s.steps[r.idx];
        return `
          <li>
            <p class="r-q">${st.prompt}</p>
            <p class="r-meta"><span class="r-how">${CREDIT[r.kind].label}</span> Answer: <b>${answerLabel(st)}</b></p>
            <p class="r-why">${stripLead(st.correct)}</p>
          </li>`;
      })
      .join('');

    ui.desk.innerHTML = `
      <div class="results">
        <div class="grade-mark" role="img" aria-label="Grade ${grade}, ${pct} percent">
          ${CIRCLE}
          <span class="grade-letter">${grade}</span>
          <span class="grade-pct">${pct}%</span>
        </div>
        <div class="results-body">
          <p class="teacher-note">${teacherNote(pct)}${isBest ? ' New personal best.' : ''}</p>
          <h2>${algo.name} · ${MODES[mode].label}</h2>
          <p class="results-line">${s.total} questions · ${time} · best streak ${s.bestStreak}</p>
        </div>
      </div>

      <table class="breakdown">
        <thead><tr><th scope="col">Answered</th><th scope="col">Count</th><th scope="col">Credit</th><th scope="col">Points</th></tr></thead>
        <tbody>${breakdown}</tbody>
        <tfoot><tr><th scope="row">Total</th><td>${s.total}</td><td></td><td>${+s.points.toFixed(2)} / ${s.total}</td></tr></tfoot>
      </table>

      ${
        missed.length
          ? `<details class="review"${missed.length <= 4 ? ' open' : ''}>
              <summary>Review ${missed.length} ${plural(missed.length, 'question', 'questions')} you missed</summary>
              <ol>${review}</ol>
            </details>`
          : ''
      }

      <dl class="stats">${ui.run.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>

      <div class="recap">
        <h3>What just happened</h3>
        <p>${algo.summary}</p>
      </div>

      <div class="actions">
        <button class="btn primary" id="again" type="button">${mode === 'test' ? 'Take another test' : 'Try a new ' + ui.noun}</button>
        <button class="btn" id="same" type="button">Replay this ${ui.noun}</button>
        ${
          pct < 80
            ? `<button class="btn" id="to-learn" type="button">Watch the lesson</button>`
            : mode === 'practice'
              ? `<button class="btn" id="to-test" type="button">Take the test</button>`
              : ''
        }
        <a class="btn quiet" href="#/${next.id}">Next: ${next.name} <span aria-hidden="true">→</span></a>
      </div>`;

    const on = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    on('again', newInput);
    on('same', start);
    on('to-learn', () => setMode('learn'));
    on('to-test', () => {
      ui.input = ui.algo.generate(ui.sizeValue);
      setMode('test');
    });
    document.getElementById('again').focus({ preventScroll: true });
    ui.desk.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    session = null;
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
      const i = /^[1-8]$/.test(e.key) ? Number(e.key) - 1 : 'abcdefgh'.indexOf(e.key.toLowerCase());
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

  window.addEventListener('hashchange', route);
  route();
})();
