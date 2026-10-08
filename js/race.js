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
  const RULES = { length: [2, 16], range: [0, 99], distinct: true, sorted: false, target: false };

  const ordinal = (k) => {
    const t = k % 100;
    return k + (t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th');
  };
  const isSorted = (v) => v.every((x, i) => i === 0 || v[i - 1] < x);

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
        </section>
        <section class="sheet desk race-desk" id="r-desk"></section>
      </div>`;

    const $ = (id) => document.getElementById(id);
    const lanesEl = $('r-lanes');
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
      const max = Math.max(...st.values, 1);
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
          <li class="lane" data-id="${L.algo.id}">
            <span class="lane-name"><a href="#/${L.algo.id}">${L.algo.name}</a><span class="lane-guess">your guess</span></span>
            <span class="lane-bars" aria-hidden="true">${L.a
              .map((v) => `<span class="lb" style="--h:${Math.max(6, Math.round((v / max) * 100))}%"></span>`)
              .join('')}</span>
            <span class="lane-stats"><b class="l-cmp">0</b> comparisons · <b class="l-mov">0</b> moves</span>
            <span class="lane-place" aria-live="polite"></span>
          </li>`,
        )
        .join('');
      st.lanes.forEach((L) => {
        L.el = lanesEl.querySelector(`[data-id="${L.algo.id}"]`);
        L.bars = [...L.el.querySelectorAll('.lb')];
        L.cmpEl = L.el.querySelector('.l-cmp');
        L.movEl = L.el.querySelector('.l-mov');
        L.placeEl = L.el.querySelector('.lane-place');
        L.max = max;
      });
      markGuess();
      syncControls();
      renderDesk();
    }

    const height = (L, v) => `${Math.max(6, Math.round((v / L.max) * 100))}%`;

    function apply(L, e) {
      for (const i of L.hl) L.bars[i].classList.remove('cmp', 'mov');
      L.hl = [];
      const [op, i, j] = e;
      if (op === 'c') {
        L.cmp++;
        L.hl = [i, j];
      } else if (op === 's') {
        [L.a[i], L.a[j]] = [L.a[j], L.a[i]];
        L.bars[i].style.setProperty('--h', height(L, L.a[i]));
        L.bars[j].style.setProperty('--h', height(L, L.a[j]));
        L.mov += 2;
        L.hl = [i, j];
      } else if (op === 'w') {
        L.a[i] = j;
        L.bars[i].style.setProperty('--h', height(L, j));
        L.mov++;
        L.hl = [i];
      } else if (op === 'r') {
        L.hl = [i];
      }
      const cls = op === 'c' || op === 'r' ? 'cmp' : 'mov';
      for (const k of L.hl) L.bars[k].classList.add(cls);
    }

    function tick() {
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
      for (const L of st.lanes) {
        L.cmpEl.textContent = L.cmp;
        L.movEl.textContent = L.mov;
      }
      if (st.lanes.every((L) => L.place)) {
        stop();
        st.phase = 'done';
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
      const ms = SPEEDS.find(([k]) => k === st.speed)[2];
      st.timer = setInterval(tick, ms);
      renderDesk();
    }

    function finishNow() {
      stop();
      while (st.phase !== 'done') {
        st.phase = 'running';
        tick();
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

    function renderDesk() {
      const shapeLabel = st.shape === 'custom' ? 'your own array' : SHAPES.find(([k]) => k === st.shape)[1].toLowerCase();
      if (st.phase === 'done') return renderResults();

      const guessName = st.guess && BTA.get(st.guess).name;
      desk.innerHTML = `
        <div class="desk-top">
          <span class="desk-label">${st.phase === 'ready' ? 'Before the race' : 'Racing'}</span>
          <span class="desk-meta">n = ${st.values.length} · ${shapeLabel}</span>
        </div>
        ${
          st.phase === 'ready'
            ? `<p class="prompt">Which sort will finish first?</p>
               <div class="choices race-choices">${sorts
                 .map(
                   (a, i) =>
                     `<button class="choice" type="button" data-guess="${a.id}" aria-pressed="${a.id === st.guess}"><span class="bubble" aria-hidden="true">${'ABCDEFGH'[i]}</span><span>${a.name}</span></button>`,
                 )
                 .join('')}</div>
               <p class="instr">${guessName ? `Your guess: ${guessName}. ` : ''}Pick one, or just start the race.</p>`
            : `<p class="prompt">${guessName ? `Your guess: <b>${guessName}</b>. ` : ''}Yellow bars are being compared and orange bars are being moved. A lane finishes when its sort has done every step.</p>`
        }
        <div class="desk-actions race-actions">
          ${speedPicker()}
          ${
            st.phase === 'ready'
              ? '<button class="btn primary" id="r-go" type="button">Start the race</button>'
              : `<button class="btn" id="r-pause" type="button">${st.phase === 'paused' ? 'Resume' : 'Pause'}</button>
                 <button class="btn quiet" id="r-skip" type="button">Skip to the end</button>
                 <button class="btn quiet" id="r-reset" type="button">Start over</button>`
          }
        </div>`;

      desk.querySelectorAll('[data-guess]').forEach((b) =>
        b.addEventListener('click', () => {
          st.guess = st.guess === b.dataset.guess ? null : b.dataset.guess;
          markGuess();
          renderDesk();
          const again = desk.querySelector(`[data-guess="${b.dataset.guess}"]`);
          if (again) again.focus();
        }),
      );
      $('r-speed').addEventListener('change', (e) => {
        st.speed = e.target.value;
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

      desk.innerHTML = `
        <div class="desk-top">
          <span class="desk-label">Results</span>
          <span class="desk-meta">n = ${st.values.length} · ${st.shape === 'custom' ? 'your own array' : SHAPES.find(([k]) => k === st.shape)[1].toLowerCase()}</span>
        </div>
        <p class="teacher-note race-verdict">${verdict}</p>

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
        <p class="race-foot">Total steps also count reads and counter steps that are neither comparisons nor moves (only Counting Sort has these).</p>

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
