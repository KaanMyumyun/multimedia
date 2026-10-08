/*
 * App: routing, the home page, and the question engine that walks through an
 * algorithm's steps, checks answers and keeps score.
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const algos = BTA.algorithms;
  const GROUPS = ['Sorting', 'Searching', 'Graphs'];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const plural = BTA.plural;

  // ---------- progress (per-browser, best effort) ----------

  const store = {
    key: 'bta-progress-v1',
    all() {
      try {
        return JSON.parse(localStorage.getItem(this.key)) || {};
      } catch {
        return {};
      }
    },
    save(id, pct) {
      try {
        const all = this.all();
        const rec = all[id] || { best: 0, plays: 0 };
        rec.best = Math.max(rec.best, pct);
        rec.plays += 1;
        all[id] = rec;
        localStorage.setItem(this.key, JSON.stringify(all));
      } catch {
        /* storage unavailable: progress just isn't remembered */
      }
    },
  };

  // ---------- icons ----------

  const ICONS = {
    Sorting:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="24" width="6" height="10" rx="2"/><rect x="14" y="18" width="6" height="16" rx="2"/><rect x="22" y="12" width="6" height="22" rx="2"/><rect x="30" y="6" width="6" height="28" rx="2"/></svg>',
    Searching:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="17" cy="17" r="10" fill="none" stroke-width="4"/><path d="M25 25l9 9" stroke-width="4" stroke-linecap="round"/></svg>',
    Graphs:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 20L20 9M9 20l11 11M20 9l11 11M20 31l11-11" fill="none" stroke-width="2.5"/><circle cx="9" cy="20" r="5"/><circle cx="20" cy="9" r="5"/><circle cx="20" cy="31" r="5"/><circle cx="31" cy="20" r="5"/></svg>',
  };

  // ---------- routing ----------

  let session = null;

  function route() {
    clearTimers();
    session = null;
    const m = location.hash.match(/^#\/([\w-]+)/);
    const algo = m && BTA.get(m[1]);
    if (algo) playPage(algo);
    else homePage();
    window.scrollTo(0, 0);
  }

  // ---------- home ----------

  function homePage() {
    document.title = 'Be the Algorithm';
    const progress = store.all();

    const card = (a) => {
      const p = progress[a.id];
      return `
        <a class="algo-card g-${a.group.toLowerCase()}" href="#/${a.id}">
          <span class="algo-icon">${ICONS[a.group]}</span>
          <span class="algo-body">
            <span class="algo-name">${a.name}</span>
            <span class="algo-blurb">${a.blurb}</span>
            <span class="algo-meta">
              <span class="cx" title="Average time complexity">${a.complexity.average}</span>
              ${p ? `<span class="best">Best ${p.best}%</span>` : '<span class="fresh">Not tried yet</span>'}
            </span>
          </span>
        </a>`;
    };

    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Interactive algorithm practice</p>
        <h1 class="site-title"><span class="hl">Be</span> the Algorithm</h1>
        <p class="tagline">Don’t just watch the algorithm. Run it yourself, one decision at a time.</p>
        <p class="lede">
          Every step is a question. Which two elements get compared? Swap or keep? Which node leaves the queue next?
          Click your answer and get instant feedback that explains <em>why</em>.
        </p>
        <ol class="how-steps">
          <li><b>Pick</b> an algorithm</li>
          <li><b>Click</b> to make each decision</li>
          <li><b>Learn</b> from the feedback and your score</li>
        </ol>
      </section>
      ${GROUPS.map(
        (g) => `
        <section class="group">
          <h2>${g}</h2>
          <div class="cards">${algos.filter((a) => a.group === g).map(card).join('')}</div>
        </section>`,
      ).join('')}
      <footer class="foot">Your best scores are saved in this browser only.</footer>`;
  }

  // ---------- play page ----------

  let ui = null;

  function playPage(algo) {
    document.title = `${algo.name} · Be the Algorithm`;
    const noun = algo.group === 'Graphs' ? 'graph' : 'array';
    const cx = algo.complexity;

    const legend = algo.legend
      .map(([state, label]) => `<li><span class="sw sw-${state} s-${state}" aria-hidden="true"></span>${label}</li>`)
      .join('');

    app.innerHTML = `
      <div class="play">
        <div class="play-head">
          <div class="play-title">
            <a class="back" href="#/">← All algorithms</a>
            <h1>${algo.name}</h1>
            <p class="blurb">${algo.blurb}</p>
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
            <button class="btn ghost" id="restart" type="button">Restart</button>
          </div>
        </div>

        <div class="layout">
          <div class="main">
            <section class="panel stage-panel" aria-label="Visualization">
              <div id="stage" class="stage"></div>
            </section>
            <section class="panel quiz" id="quiz"></section>
          </div>

          <aside class="side">
            <section class="panel">
              <h2>How it works</h2>
              <ol class="how">${algo.how.map((h) => `<li>${h}</li>`).join('')}</ol>
            </section>
            <section class="panel">
              <h2>Pseudocode</h2>
              <pre class="code" id="code">${algo.code
                .map((l, i) => `<span class="ln" data-line="${i}">${esc(l)}</span>`)
                .join('')}</pre>
            </section>
            <section class="panel">
              <h2>Colours</h2>
              <ul class="legend">${legend}</ul>
            </section>
            <section class="panel">
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
          </aside>
        </div>
      </div>`;

    ui = {
      algo,
      noun,
      stage: document.getElementById('stage'),
      stagePanel: app.querySelector('.stage-panel'),
      quiz: document.getElementById('quiz'),
      code: document.getElementById('code'),
      size: document.getElementById('size'),
      sizeValue: algo.input ? algo.input.default : null,
      input: null,
    };

    ui.stage.addEventListener('click', (e) => {
      const t = e.target.closest('[data-key]');
      if (t && ui.stage.contains(t)) onPick(t.dataset.key);
    });
    document.getElementById('new').addEventListener('click', newInput);
    document.getElementById('restart').addEventListener('click', () => start());
    if (ui.size) {
      ui.size.addEventListener('change', () => {
        ui.sizeValue = Number(ui.size.value);
        newInput();
      });
    }

    newInput();
  }

  function newInput() {
    ui.input = ui.algo.generate(ui.sizeValue);
    start();
  }

  // ---------- engine ----------

  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  const current = () => session && session.steps[session.idx];

  function start() {
    clearTimers();
    const run = ui.algo.build(ui.input);
    session = {
      steps: run.steps,
      final: run.final,
      stats: run.stats,
      total: run.steps.filter((s) => s.ask.type !== 'info').length,
      idx: -1,
      asked: 0,
      done: 0,
      firstTry: 0,
      mistakes: 0,
      t0: Date.now(),
      sel: new Set(),
      attempts: 0,
      answered: false,
    };
    buildQuiz();
    BTA.render(ui.stage, run.steps[0].view, { animate: false });
    advance();
  }

  function buildQuiz() {
    ui.quiz.innerHTML = `
      <div class="quiz-top">
        <div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="${session.total}" aria-valuenow="0"><span></span></div>
        <div class="quiz-meta">
          <span id="qcount"></span>
          <span id="qscore" class="score"></span>
        </div>
      </div>
      <p class="prompt" id="prompt" tabindex="-1"></p>
      <div class="answers" id="answers"></div>
      <div class="hintbox" id="hintbox" hidden></div>
      <div class="feedback" id="feedback" role="status" aria-live="polite" hidden></div>
      <div class="quiz-actions">
        <button class="link" id="hint" type="button">Show hint</button>
        <button class="link" id="reveal" type="button" hidden>Show answer</button>
        <button class="btn primary" id="next" type="button" hidden>Continue <span aria-hidden="true">→</span></button>
      </div>`;
    const $ = (id) => document.getElementById(id);
    Object.assign(ui, {
      progress: ui.quiz.querySelector('.progress'),
      qcount: $('qcount'),
      qscore: $('qscore'),
      prompt: $('prompt'),
      answers: $('answers'),
      hintbox: $('hintbox'),
      feedback: $('feedback'),
      hintBtn: $('hint'),
      revealBtn: $('reveal'),
      nextBtn: $('next'),
      checkBtn: null,
    });
    ui.hintBtn.addEventListener('click', showHint);
    ui.revealBtn.addEventListener('click', reveal);
    ui.nextBtn.addEventListener('click', advance);
  }

  function advance() {
    clearTimers();
    const s = session;
    s.idx++;
    if (s.idx >= s.steps.length) return finish();

    const st = current();
    s.sel = new Set();
    s.attempts = 0;
    s.answered = false;
    if (st.ask.type !== 'info') s.asked++;

    BTA.render(ui.stage, st.view);
    ui.stage.classList.remove('locked');
    ui.stage.classList.toggle('pickable', st.ask.type === 'pick' || st.ask.type === 'multi');

    ui.prompt.innerHTML = st.prompt;
    renderAnswers(st);
    ui.hintbox.hidden = true;
    setFeedback(null);
    ui.hintBtn.hidden = !st.hint;
    ui.revealBtn.hidden = true;
    ui.nextBtn.hidden = st.ask.type !== 'info';
    highlightLine(st.line);
    updateProgress();

    if (ui.stagePanel.getBoundingClientRect().top < 0) ui.stagePanel.scrollIntoView({ block: 'start', behavior: 'smooth' });
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
            `<button class="choice" type="button" data-value="${esc(o.value)}"><kbd>${i + 1}</kbd><span>${esc(o.label)}</span></button>`,
        )
        .join('')}</div>`;
      ui.answers.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => onChoice(b)));
    } else if (a.type === 'pick') {
      const n = a.count || a.answer.length;
      ui.answers.innerHTML = `<p class="instr">${n === 1 ? `Click one ${what} above.` : `Click ${n} ${what}s above.`}</p>`;
    } else if (a.type === 'multi') {
      ui.answers.innerHTML = `
        <p class="instr">Click ${what}s above to select them (click again to unselect).</p>
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
    if (ok) succeed(false);
    else fail(given);
  }

  function succeed(revealed) {
    const st = current();
    const s = session;
    s.answered = true;
    s.done++;
    if (!revealed && s.attempts === 0) s.firstTry++;

    ui.stage.classList.add('locked');
    if (st.ask.type === 'choice') {
      ui.answers.querySelectorAll('.choice').forEach((b) => {
        b.disabled = true;
        if (b.dataset.value === st.ask.answer) b.classList.add('is-correct');
      });
    } else {
      BTA.mark(ui.stage, 'is-selected', []);
      BTA.mark(ui.stage, 'is-correct', st.ask.answer);
      if (ui.checkBtn) ui.checkBtn.disabled = true;
    }

    const text = revealed ? st.correct.replace(/^(Correct|Right|Yes|Exactly)[.!]?\s*/, '') : st.correct;
    setFeedback(revealed ? 'reveal' : 'ok', text);
    ui.hintBtn.hidden = true;
    ui.hintbox.hidden = true;
    ui.revealBtn.hidden = true;
    ui.nextBtn.hidden = false;
    ui.nextBtn.focus({ preventScroll: true });
    updateProgress();

    if (st.after) later(() => BTA.render(ui.stage, st.after), revealed ? 900 : 380);
  }

  function fail(given) {
    const st = current();
    const s = session;
    s.attempts++;
    s.mistakes++;

    const msg = typeof st.wrong === 'function' ? st.wrong(given) : st.wrong || 'Not quite. Try again.';
    setFeedback('bad', msg);

    if (st.ask.type === 'choice') {
      const b = [...ui.answers.querySelectorAll('.choice')].find((x) => x.dataset.value === given);
      if (b) {
        b.disabled = true;
        b.classList.add('is-wrong');
      }
    } else {
      s.sel = new Set();
      BTA.mark(ui.stage, 'is-selected', []);
      BTA.mark(ui.stage, 'is-wrong', given);
      later(() => BTA.mark(ui.stage, 'is-wrong', []), 700);
      updateCheckLabel();
    }
    ui.revealBtn.hidden = false;
    updateProgress();
  }

  function reveal() {
    if (!session.answered) succeed(true);
  }

  function showHint() {
    const st = current();
    if (!st || !st.hint) return;
    ui.hintbox.innerHTML = `<span class="hint-tag">Hint</span> ${st.hint}`;
    ui.hintbox.hidden = false;
    ui.hintBtn.hidden = true;
  }

  function setFeedback(kind, html) {
    const f = ui.feedback;
    if (!kind) {
      f.hidden = true;
      f.className = 'feedback';
      f.innerHTML = '';
      return;
    }
    const icon = { ok: '✓', bad: '✗', reveal: 'i' }[kind];
    f.className = `feedback fb-${kind}`;
    f.innerHTML = `<span class="fb-icon" aria-hidden="true">${icon}</span><div class="fb-text">${html}</div>`;
    f.hidden = false;
    if (kind === 'bad') {
      f.classList.remove('shake');
      void f.offsetWidth; // restart the animation
      f.classList.add('shake');
    }
    const r = f.getBoundingClientRect();
    if (r.bottom > window.innerHeight) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function highlightLine(line) {
    ui.code.querySelectorAll('.ln').forEach((n) => n.classList.toggle('hl', Number(n.dataset.line) === line));
  }

  function updateProgress() {
    const s = session;
    const pct = s.total ? (s.done / s.total) * 100 : 0;
    ui.progress.firstElementChild.style.width = pct + '%';
    ui.progress.setAttribute('aria-valuenow', String(s.done));
    const st = current();
    ui.qcount.textContent =
      st && st.ask.type === 'info' ? `${s.total} questions` : `Question ${s.asked} of ${s.total}`;
    ui.qscore.textContent = `${s.firstTry} right first try`;
  }

  // ---------- results ----------

  function finish() {
    clearTimers();
    const s = session;
    const algo = ui.algo;
    BTA.render(ui.stage, s.final);
    ui.stage.classList.add('locked');
    ui.stage.classList.remove('pickable');
    highlightLine(null);

    const pct = s.total ? Math.round((s.firstTry / s.total) * 100) : 100;
    const prev = store.all()[algo.id];
    store.save(algo.id, pct);
    const isBest = prev && pct > prev.best;

    const secs = Math.round((Date.now() - s.t0) / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const verdict =
      pct === 100 ? 'Flawless!' : pct >= 85 ? 'Excellent work!' : pct >= 65 ? 'Nice job!' : pct >= 40 ? 'Good practice.' : 'Keep at it!';
    const next = algos[(algos.indexOf(algo) + 1) % algos.length];

    ui.quiz.innerHTML = `
      <div class="results">
        <div class="score-ring" style="--p:${pct}" role="img" aria-label="Score ${pct} percent">
          <div class="score-ring-inner"><strong>${pct}%</strong><span>first try</span></div>
        </div>
        <div class="results-body">
          <p class="eyebrow">${verdict}${isBest ? ' · New best!' : ''}</p>
          <h2>You ran ${algo.name} by hand</h2>
          <p class="results-line">
            ${s.firstTry} of ${s.total} answered right on the first try ·
            ${s.mistakes} ${plural(s.mistakes, 'mistake', 'mistakes')} · ${time}
          </p>
        </div>
      </div>
      <dl class="stats">
        ${s.stats.map(([k, v]) => `<div class="stat"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
      <div class="recap">
        <h3>What just happened</h3>
        <p>${algo.summary}</p>
      </div>
      <div class="results-actions">
        <button class="btn primary" id="again" type="button">Try a new ${ui.noun}</button>
        <button class="btn" id="same" type="button">Replay this ${ui.noun}</button>
        <a class="btn ghost" href="#/${next.id}">Next: ${next.name} <span aria-hidden="true">→</span></a>
      </div>`;

    document.getElementById('again').addEventListener('click', newInput);
    document.getElementById('same').addEventListener('click', () => start());
    document.getElementById('again').focus({ preventScroll: true });
    ui.quiz.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------- keyboard ----------

  document.addEventListener('keydown', (e) => {
    if (!session || !ui || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && t.closest('select, input, textarea')) return;
    const st = current();

    if (e.key === 'Enter' || e.key === ' ') {
      // SVG nodes act as buttons, but don't get native keyboard activation.
      if (t instanceof SVGElement && t.closest('[data-key]')) {
        e.preventDefault();
        onPick(t.closest('[data-key]').dataset.key);
        return;
      }
      if (t.closest && t.closest('button, a')) return; // native activation
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

    if (st && st.ask.type === 'choice' && !session.answered && /^[1-9]$/.test(e.key)) {
      const b = ui.answers.querySelectorAll('.choice')[Number(e.key) - 1];
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
