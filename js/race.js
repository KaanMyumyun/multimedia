/*
 * Race page: every array sort runs on the same array at the same time, one step
 * per tick. A step is one comparison, one move, or one other bit of work (counting
 * sort's counters). The steps come from each algorithm's trace().
 */
(function () {
  'use strict';

  const SIZES = [6, 8, 10, 12, 16];
  const SHAPES = [
    ['random', 'Random'],
    ['nearly', 'Nearly sorted'],
    ['reversed', 'Reversed'],
    ['sorted', 'Already sorted'],
  ];
  const SPEEDS = [
    ['slow', 'Slow', 260],
    ['normal', 'Normal', 110],
    ['fast', 'Fast', 35],
  ];
  const RULES = { length: [2, 16], range: [-99, 99], why: '', distinct: true, sorted: false, target: false };

  const ordinal = (k) => {
    const t = k % 100;
    return k + (t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th');
  };
  const isSorted = (v) => v.every((x, i) => i === 0 || v[i - 1] < x);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function makeValues(n, shape) {
    const v = BTA.distinct(n, 1, Math.max(12, 2 * n)).sort((x, y) => x - y);
    if (shape === 'sorted') return v;
    if (shape === 'reversed') return v.reverse();
    if (shape === 'nearly') {
      for (let s = 0; s < Math.max(1, Math.round(n / 5)); s++) {
        const i = BTA.randInt(0, n - 2);
        [v[i], v[i + 1]] = [v[i + 1], v[i]];
      }
      if (isSorted(v)) [v[0], v[1]] = [v[1], v[0]];
      return v;
    }
    let r;
    do r = BTA.shuffle(v.slice());
    while (isSorted(r));
    return r;
  }

  // The growth chart builds its arrays the same way.
  BTA.raceValues = makeValues;

  // Lane bars, shaped like BTA.barScale's but sized by rank: each bar is one step taller
  // than the next smaller value's, standing on the zero line or hanging from it. A linear
  // scale squashes small numbers flat when the range is wide (1 to 15 next to -99 and 99);
  // ranks keep every bar distinct, and the numbers on the bars give the actual values.
  function rankScale(values) {
    const sorted = values.slice().sort((x, y) => x - y);
    const step = 100 / sorted.length;
    const neg = sorted.filter((v) => v < 0).length;
    const zero = neg * step;
    return {
      zero,
      bar(v) {
        const i = sorted.indexOf(v);
        const h = (i < neg ? neg - i : i - neg + 1) * step;
        return { b: i < neg ? zero - h : zero, h };
      },
    };
  }

  function checkTyped(params) {
    const r = BTA.parseNumbers(params.get('a') || '');
    if (r.error) return r;
    const error = BTA.checkValues(r.values, RULES);
    return error ? { error } : { input: r.values };
  }

  // Why the results came out the way they did, for this array.
  function insights(shape, values, rows) {
    const n = values.length;
    if (shape === 'custom') {
      shape = isSorted(values) ? 'sorted' : isSorted(values.slice().reverse()) ? 'reversed' : 'random';
    }
    const by = (id) => rows.find((r) => r.id === id);
    const out = [];
    if (shape === 'sorted') {
      out.push(
        `On an array that is already sorted, Bubble and Insertion Sort make one pass of ${n - 1} comparisons and stop, without moving anything. ` +
          `Quick Sort, which always picks the last element as its pivot, hits its worst case: every partition is as lopsided as it can be (${by('quick').cmp} comparisons).`,
      );
    } else if (shape === 'reversed') {
      out.push(
        'A reversed array is the worst case for Bubble and Insertion Sort: every pair is out of order, so almost every comparison leads to a move. ' +
          `Selection Sort makes the same ${(n * (n - 1)) / 2} comparisons whatever the order.`,
      );
    } else if (shape === 'nearly') {
      out.push(
        `Insertion Sort shines on nearly sorted data: each element only slides a step or two, so it needs just ${by('insertion').cmp} comparisons. ` +
          'That is why real sorting libraries switch to insertion sort for small or almost-sorted pieces.',
      );
    } else {
      out.push(
        `On random data the O(n log n) sorts pull ahead as the array grows. Try size ${SIZES[SIZES.length - 1]}, then compare Bubble Sort with Merge and Heap Sort.`,
      );
    }
    const counting = by('counting');
    if (counting) {
      const k = Math.max(...values) - Math.min(...values) + 1;
      out.push(
        `Counting Sort made no comparisons at all. Its steps are ${n} reads, ${n} writes and one step for each of the k = ${k} possible values from ` +
          `${Math.min(...values)} to ${Math.max(...values)}, so it only wins when the values sit in a small range.`,
      );
    }
    const radix = by('radix');
    if (radix) {
      // Like its trace: negative values are shifted up first, then one pass per digit of the largest.
      const shift = Math.min(0, ...values);
      const passes = String(Math.max(...values) - shift).length;
      const digits = ['ones', 'tens', 'hundreds', 'thousands'].slice(0, passes);
      out.push(
        `Radix Sort made no comparisons either. It made ${passes === 1 ? 'one pass, on the ones digit' : `${passes} passes, one per digit: the ${BTA.list(digits)}`}. ` +
          `Each pass reads all ${n} values, steps through the 10 buckets and writes the ${n} values back, ${2 * n + 10} steps a pass.` +
          (shift < 0 ? ` The values were shifted up by ${-shift} first, so the negative ones had digits to sort by too.` : ''),
      );
    }
    return out;
  }

  BTA.racePage = function (root, kit) {
    const { esc } = kit;
    const sorts = kit.sorts;
    const st = {
      shape: 'random',
      size: 10,
      values: null,
      guess: null,
      speed: 'normal',
      lanes: [],
      tick: 0,
      timer: null,
      phase: 'ready', // ready → running → paused → done
    };

    let notice = '';
    if (kit.params.has('a')) {
      const r = checkTyped(kit.params);
      if (r.error) notice = `The array in this link couldn’t be used: ${r.error} Here is a random one instead.`;
      else {
        st.values = r.input;
        st.shape = 'custom';
        st.size = r.input.length;
      }
    }
    if (!st.values) st.values = makeValues(st.size, st.shape);

    root.innerHTML = `
      <div class="race">
        <header class="page-head">
          <p class="crumb"><a href="#/">Sorting</a><span aria-hidden="true">/</span>Race</p>
          <h1>Sort race</h1>
          <p class="blurb">Every sort gets the same array and takes one step per tick: a comparison, a move or a count. The fewest steps finishes first.</p>
          ${kit.tabs('race')}
        </header>

        <div class="toolbar">
          <div class="modes" role="group" aria-label="Kind of array">
            ${SHAPES.map(([k, label]) => `<button type="button" data-shape="${k}" aria-pressed="false">${label}</button>`).join('')}
          </div>
          <div class="controls">
            <label class="size">Size <select id="r-size"></select></label>
            <button class="btn" id="r-new" type="button">New array</button>
            <button class="btn" id="r-edit" type="button" aria-expanded="false">Your own array</button>
            <button class="btn quiet" id="r-share" type="button">Copy link</button>
          </div>
        </div>
        <p class="notice" id="r-notice" role="status" ${notice ? '' : 'hidden'}>${esc(notice)}</p>
        <div id="r-own"></div>

        <section class="sheet stage-sheet race-track" aria-label="The race">
          <ol class="lanes" id="r-lanes"></ol>
          <div class="sr-only" id="r-log" role="log" aria-live="polite"></div>
        </section>
        <section class="sheet desk race-desk" id="r-desk"></section>
      </div>`;

    const $ = (id) => document.getElementById(id);
    const lanesEl = $('r-lanes');
    const logEl = $('r-log');
    const desk = $('r-desk');

    // ---------- the array ----------

    const own = kit.ownInputForm({
      rules: RULES,
      noun: 'array',
      note: '',
      fill: () => ({ a: st.values.join(' ') }),
      parse: checkTyped,
      onUse: (values) => setValues(values, 'custom'),
    });
    $('r-own').append(own.form);
    $('r-edit').addEventListener('click', (e) => own.toggle(e.currentTarget));
    $('r-share').addEventListener('click', (e) => kit.copyLink(e.currentTarget));
    $('r-new').addEventListener('click', freshArray);
    $('r-size').addEventListener('change', (e) => {
      st.size = Number(e.target.value);
      freshArray();
    });
    root.querySelectorAll('[data-shape]').forEach((b) =>
      b.addEventListener('click', () => setValues(makeValues(st.size, b.dataset.shape), b.dataset.shape)),
    );

    // A fresh array of the current kind; typed-in arrays are followed by random ones.
    function freshArray() {
      const shape = st.shape === 'custom' ? 'random' : st.shape;
      setValues(makeValues(st.size, shape), shape);
    }

    function setValues(values, shape) {
      st.shape = shape;
      st.values = values;
      st.size = values.length;
      $('r-notice').hidden = true;
      reset();
    }

    function syncControls() {
      const opts = [...new Set([...SIZES, st.size])].sort((x, y) => x - y);
      $('r-size').innerHTML = opts.map((o) => `<option value="${o}"${o === st.size ? ' selected' : ''}>${o}</option>`).join('');
      root.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === st.shape)));
      kit.setUrl({ a: st.values.join(',') });
    }

    // ---------- lanes ----------

    function reset() {
      stop();
      st.phase = 'ready';
      st.tick = 0;
      const scale = rankScale(st.values);
      lanesEl.style.setProperty('--z', `${scale.zero}%`);
      glide();
      logEl.replaceChildren();
      st.lanes = sorts.map((algo) => ({
        algo,
        events: algo.trace(st.values),
        a: st.values.slice(),
        i: 0,
        cmp: 0,
        mov: 0,
        hl: [],
        place: null,
      }));
      lanesEl.innerHTML = st.lanes
        .map(
          (L) => `
          <li class="lane" data-id="${L.algo.id}" data-flip="lane-${L.algo.id}">
            <span class="lane-name"><a href="#/${L.algo.id}">${L.algo.name}</a><span class="lane-guess">your guess</span></span>
            <span class="lane-run">
              <span class="lane-bars" aria-hidden="true">${'<span class="lb"><span class="lv"></span></span>'.repeat(L.a.length)}</span>
              <span class="lane-progress" aria-hidden="true"><span class="lane-done"></span></span>
              <span class="sr-only l-arr"></span>
            </span>
            <span class="lane-stats"><b class="l-cmp">0</b> comparisons · <b class="l-mov">0</b> moves<span class="sr-only">, <span class="l-step">0</span> of ${L.events.length} steps done</span></span>
            <span class="lane-place"></span>
          </li>`,
        )
        .join('');
      st.lanes.forEach((L) => {
        L.el = lanesEl.querySelector(`[data-id="${L.algo.id}"]`);
        L.bars = [...L.el.querySelectorAll('.lb')];
        L.arrEl = L.el.querySelector('.l-arr');
        L.doneEl = L.el.querySelector('.lane-done');
        L.cmpEl = L.el.querySelector('.l-cmp');
        L.movEl = L.el.querySelector('.l-mov');
        L.stepEl = L.el.querySelector('.l-step');
        L.placeEl = L.el.querySelector('.lane-place');
        L.scale = scale;
        L.a.forEach((v, i) => setBar(L, i, v));
        describe(L);
      });
      markGuess();
      syncControls();
      renderDesk();
    }

    const speedMs = () => SPEEDS.find(([k]) => k === st.speed)[2];

    // Bars slide to their new heights in a little under one tick.
    const glideMs = () => (reducedMotion.matches ? 0 : Math.round(speedMs() * 0.6));
    const glide = () => lanesEl.style.setProperty('--glide', `${glideMs()}ms`);

    // A bar tall enough holds its number. A shorter one gets it just past its far end,
    // or past the zero line when the far end is too close to the edge of the lane.
    function setBar(L, i, v) {
      const { b, h } = L.scale.bar(v);
      const bar = L.bars[i];
      bar.style.setProperty('--b', `${b}%`);
      bar.style.setProperty('--h', `${h}%`);
      bar.classList.toggle('neg', v < 0);
      bar.firstChild.textContent = v;
      const room = v < 0 ? b : 100 - b - h;
      const out = h >= 30 ? '' : (v < 0) === (room < 30) ? 'up' : 'down';
      const place = () => {
        bar.classList.toggle('up', out === 'up');
        bar.classList.toggle('down', out === 'down');
      };
      // A bar growing tall enough to hold its number keeps it outside until it's done growing.
      clearTimeout(bar.settle);
      if (!out && bar.matches('.up, .down')) bar.settle = setTimeout(place, glideMs());
      else place();
    }

    // What the bars show, for screen readers.
    function describe(L) {
      L.arrEl.textContent = `Array: ${L.a.join(', ')}`;
    }

    function apply(L, e) {
      for (const i of L.hl) L.bars[i].classList.remove('cmp', 'mov');
      L.hl = [];
      const [op, i, j] = e;
      if (op === 'c') {
        L.cmp++;
        L.hl = [i, j];
      } else if (op === 's') {
        [L.a[i], L.a[j]] = [L.a[j], L.a[i]];
        setBar(L, i, L.a[i]);
        setBar(L, j, L.a[j]);
        describe(L);
        L.mov += 2;
        L.hl = [i, j];
      } else if (op === 'w') {
        L.a[i] = j;
        setBar(L, i, j);
        describe(L);
        L.mov++;
        L.hl = [i];
      } else if (op === 'r') {
        L.hl = [i];
      }
      const cls = op === 'c' || op === 'r' ? 'cmp' : 'mov';
      for (const k of L.hl) L.bars[k].classList.add(cls);
    }

    // quiet: skipping to the end, so the finishes aren't read out one by one.
    function tick(quiet = false) {
      st.tick++;
      const finished = [];
      for (const L of st.lanes) {
        if (L.place) continue;
        apply(L, L.events[L.i++]);
        if (L.i >= L.events.length) finished.push(L);
      }
      const place = st.lanes.filter((L) => L.place).length + 1;
      for (const L of finished) {
        L.place = place;
        L.steps = L.events.length;
        for (const k of L.hl) L.bars[k].classList.remove('cmp', 'mov');
        L.el.classList.add('finished');
        L.placeEl.textContent = ordinal(place);
      }
      if (finished.length && !quiet) {
        const line = document.createElement('p');
        line.textContent = `${BTA.list(finished.map((L) => L.algo.name))} finished ${ordinal(place)}.`;
        logEl.append(line);
      }
      for (const L of st.lanes) {
        L.cmpEl.textContent = L.cmp;
        L.movEl.textContent = L.mov;
        L.stepEl.textContent = L.i;
        L.doneEl.style.setProperty('--p', ((L.i / L.events.length) * 100).toFixed(1));
      }
      if (st.lanes.every((L) => L.place)) {
        stop();
        st.phase = 'done';
        // Line the lanes up in finishing order; ties keep book order.
        const order = st.lanes.slice().sort((x, y) => x.place - y.place);
        BTA.flip(lanesEl, () => lanesEl.append(...order.map((L) => L.el)));
        renderDesk();
      }
    }

    function stop() {
      clearInterval(st.timer);
      st.timer = null;
    }

    function run() {
      stop();
      st.phase = 'running';
      st.timer = setInterval(tick, speedMs());
      renderDesk();
    }

    // One tick at a time; the race stays paused in between.
    function step() {
      if (st.phase !== 'paused') {
        stop();
        st.phase = 'paused';
        renderDesk();
      }
      tick();
    }

    function finishNow() {
      stop();
      while (st.phase !== 'done') {
        st.phase = 'running';
        tick(true);
      }
    }

    function markGuess() {
      st.lanes.forEach((L) => L.el.classList.toggle('is-guess', L.algo.id === st.guess));
    }

    // ---------- the desk: guess, controls, results ----------

    function speedPicker() {
      return `<label class="speed">Speed
        <select id="r-speed">${SPEEDS.map(([k, label]) => `<option value="${k}"${k === st.speed ? ' selected' : ''}>${label}</option>`).join('')}</select>
      </label>`;
    }

    // Redrawing the desk replaces the control that had focus. Focus moves to the control
    // with the same id, or else to the desk's main one, so keyboard and screen reader
    // users keep their place.
    function renderDesk() {
      const had = desk.contains(document.activeElement) ? document.activeElement.id : null;
      if (st.phase === 'done') renderResults();
      else renderControls();
      const next = had !== null && ((had && $(had)) || desk.querySelector('[data-focus]'));
      if (next) next.focus({ preventScroll: true });
    }

    function renderControls() {
      const shapeLabel = st.shape === 'custom' ? 'your own array' : SHAPES.find(([k]) => k === st.shape)[1].toLowerCase();
      const guessName = st.guess && BTA.get(st.guess).name;
      desk.innerHTML = `
        <div class="desk-top">
          <span class="desk-label">${{ ready: 'Before the race', running: 'Racing', paused: 'Paused' }[st.phase]}</span>
          <span class="desk-meta">n = ${st.values.length} · ${shapeLabel}</span>
        </div>
        ${
          st.phase === 'ready'
            ? `<p class="prompt">Which sort will finish first?</p>
               <div class="choices race-choices">${sorts
                 .map(
                   (a, i) =>
                     `<button class="choice" id="r-guess-${a.id}" type="button" data-guess="${a.id}" aria-pressed="${a.id === st.guess}"><span class="bubble" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span>${a.name}</span></button>`,
                 )
                 .join('')}</div>
               <p class="instr">${guessName ? `Your guess: ${guessName}. ` : ''}Pick one, or just start the race.</p>`
            : `<p class="prompt">${guessName ? `Your guess: <b>${guessName}</b>. ` : ''}Yellow bars are being compared and orange bars are being moved. The line under each lane fills up as its sort works through its steps.</p>`
        }
        <div class="desk-actions race-actions">
          ${speedPicker()}
          ${
            st.phase === 'ready'
              ? `<button class="btn" id="r-step" type="button">Step</button>
                 <button class="btn primary" id="r-go" type="button" data-focus>Start the race</button>`
              : `<button class="btn" id="r-pause" type="button" data-focus>${st.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                 ${st.phase === 'paused' ? '<button class="btn" id="r-step" type="button">Step</button>' : ''}
                 <button class="btn quiet" id="r-skip" type="button">Skip to the end</button>
                 <button class="btn quiet" id="r-reset" type="button">Start over</button>`
          }
        </div>`;

      desk.querySelectorAll('[data-guess]').forEach((b) =>
        b.addEventListener('click', () => {
          st.guess = st.guess === b.dataset.guess ? null : b.dataset.guess;
          markGuess();
          renderDesk();
        }),
      );
      $('r-speed').addEventListener('change', (e) => {
        st.speed = e.target.value;
        glide();
        if (st.phase === 'running') run();
      });
      const on = (id, fn) => $(id) && $(id).addEventListener('click', fn);
      on('r-go', () => {
        run();
        lanesEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      on('r-pause', () => {
        if (st.phase === 'paused') run();
        else {
          stop();
          st.phase = 'paused';
          renderDesk();
        }
      });
      on('r-step', step);
      on('r-skip', finishNow);
      on('r-reset', reset);
    }

    function barChart(title, note, rows, key, unit) {
      const max = Math.max(1, ...rows.map((r) => r[key]));
      return `
        <figure class="chart">
          <figcaption><span class="chart-title">${title}</span><span class="chart-note">${note}</span></figcaption>
          <ul class="bars">
            ${rows
              .map(
                (r) => `
              <li class="bar-row${r.id === st.guess ? ' is-guess' : ''}" tabindex="0" data-tip="${r[key]} ${unit}: ${esc(r.name)}">
                <span class="bar-label">${esc(r.name)}</span>
                <span class="bar-track">
                  <span class="bar-fill" style="--w:${((r[key] / max) * 100).toFixed(1)}"></span>
                  <span class="bar-value">${r[key]}</span>
                </span>
              </li>`,
              )
              .join('')}
          </ul>
        </figure>`;
    }

    function renderResults() {
      const rows = st.lanes.map((L) => ({ id: L.algo.id, name: L.algo.name, cmp: L.cmp, mov: L.mov, steps: L.steps, place: L.place }));
      const winners = rows.filter((r) => r.place === 1).map((r) => r.name);
      const won = winners.length > 1 ? `${BTA.list(winners)} tied for first.` : `${winners[0]} won.`;
      let verdict = won;
      if (st.guess) {
        const g = rows.find((r) => r.id === st.guess);
        verdict = g.place === 1 ? `You called it! ${won}` : `You picked ${g.name}. It came ${ordinal(g.place)}. ${won}`;
      }
      const table = rows.slice().sort((x, y) => x.place - y.place);
      // The sorts whose traces have steps that are neither comparisons nor moves.
      const extraSteps = st.lanes.filter((L) => L.events.some(([op]) => op === 'r' || op === 'k')).map((L) => L.algo.name);

      desk.innerHTML = `
        <div class="desk-top">
          <span class="desk-label">Results</span>
          <span class="desk-meta">n = ${st.values.length} · ${st.shape === 'custom' ? 'your own array' : SHAPES.find(([k]) => k === st.shape)[1].toLowerCase()}</span>
        </div>
        <p class="teacher-note race-verdict" tabindex="-1" data-focus>${verdict}</p>

        <div class="charts">
          ${barChart('Comparisons', 'Times two elements were compared.', rows, 'cmp', 'comparisons')}
          ${barChart('Moves', 'Writes into the array. A swap counts as two.', rows, 'mov', 'moves')}
        </div>
        ${st.guess ? '<p class="chart-key"><span class="key-swatch" aria-hidden="true"></span>Your guess</p>' : ''}

        <div class="table-wrap">
          <table class="race-table">
            <thead><tr><th scope="col">Place</th><th scope="col">Sort</th><th scope="col">Comparisons</th><th scope="col">Moves</th><th scope="col">Total steps</th></tr></thead>
            <tbody>${table
              .map(
                (r) =>
                  `<tr${r.id === st.guess ? ' class="is-guess"' : ''}><td>${ordinal(r.place)}</td><th scope="row"><a href="#/${r.id}">${esc(r.name)}</a></th><td>${r.cmp}</td><td>${r.mov}</td><td>${r.steps}</td></tr>`,
              )
              .join('')}</tbody>
          </table>
        </div>
        <p class="race-foot">Total steps also count reads and counter steps that are neither comparisons nor moves (only ${BTA.list(extraSteps)} ${extraSteps.length === 1 ? 'has' : 'have'} these).</p>

        <div class="recap">
          <h3>Why it came out this way</h3>
          ${insights(st.shape, st.values, rows).map((t) => `<p>${t}</p>`).join('')}
        </div>

        <div class="actions">
          <button class="btn primary" id="r-again" type="button">Race this array again</button>
          <button class="btn" id="r-fresh" type="button">New array</button>
        </div>`;

      $('r-again').addEventListener('click', reset);
      $('r-fresh').addEventListener('click', freshArray);
      desk.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    reset();
    return stop;
  };
})();
