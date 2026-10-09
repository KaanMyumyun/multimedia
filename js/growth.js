/*
 * "How they grow": comparisons (or moves, or total steps) against array size for every sort,
 * sizes 4 to 64, from the same traces the race uses. Two sorts are drawn in colour to compare;
 * the rest stay as thin grey lines for context. Random arrays use a fixed seed, so the curves
 * are the same every visit.
 */
(function () {
  'use strict';

  const SIZES = Array.from({ length: 16 }, (_, i) => (i + 1) * 4);
  const TRIALS = 8;
  const SHAPES = [
    ['random', 'Random'],
    ['nearly', 'Nearly sorted'],
    ['reversed', 'Reversed'],
    ['sorted', 'Already sorted'],
  ];
  const METRICS = [
    ['cmp', 'Comparisons', 'comparisons'],
    ['mov', 'Moves', 'moves'],
    ['steps', 'Total steps', 'steps'],
  ];
  const DEFAULT_PAIR = ['bubble', 'merge'];

  // One sort's work on one array, counted from its race trace.
  function measure(algo, values) {
    let cmp = 0;
    let mov = 0;
    let steps = 0;
    for (const e of algo.trace(values)) {
      steps++;
      if (e[0] === 'c') cmp++;
      else if (e[0] === 's') mov += 2;
      else if (e[0] === 'w') mov++;
    }
    return { cmp, mov, steps };
  }

  // { sortId: [{ cmp, mov, steps } for each size] }, averaged over several arrays when random.
  function compute(sorts, shape) {
    const trials = shape === 'sorted' || shape === 'reversed' ? 1 : TRIALS;
    return BTA.withRandom(BTA.seeded(`bta-growth-${shape}`), () => {
      const out = Object.fromEntries(sorts.map((a) => [a.id, []]));
      for (const n of SIZES) {
        const sum = Object.fromEntries(sorts.map((a) => [a.id, { cmp: 0, mov: 0, steps: 0 }]));
        for (let t = 0; t < trials; t++) {
          const values = BTA.raceValues(n, shape);
          for (const a of sorts) {
            const m = measure(a, values);
            for (const k of ['cmp', 'mov', 'steps']) sum[a.id][k] += m[k];
          }
        }
        for (const a of sorts) {
          const s = sum[a.id];
          out[a.id].push({ cmp: Math.round(s.cmp / trials), mov: Math.round(s.mov / trials), steps: Math.round(s.steps / trials) });
        }
      }
      return out;
    });
  }

  // A round number at or above v for the top of the axis, and its tick step.
  function niceScale(v) {
    if (v <= 0) return { top: 10, step: 2 };
    const raw = v / 5;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    return { top: Math.ceil(v / step) * step, step };
  }
  const fmt = (x) => x.toLocaleString('en-US');

  BTA.growthPage = function (root, kit) {
    const { esc } = kit;
    const sorts = kit.sorts;
    const byId = Object.fromEntries(sorts.map((a) => [a.id, a]));
    const st = {
      shape: SHAPES.some(([k]) => k === kit.params.get('shape')) ? kit.params.get('shape') : 'random',
      metric: METRICS.some(([k]) => k === kit.params.get('m')) ? kit.params.get('m') : 'cmp',
      pair: (kit.params.get('vs') || '').split(',').filter((id) => byId[id]).slice(0, 2),
      data: null,
      hover: null,
    };
    if (st.pair.length < 2 || st.pair[0] === st.pair[1]) st.pair = DEFAULT_PAIR.filter((id) => byId[id]);

    const options = (selected, other) =>
      sorts.map((a) => `<option value="${a.id}"${a.id === selected ? ' selected' : ''}${a.id === other ? ' disabled' : ''}>${esc(a.name)}</option>`).join('');

    root.innerHTML = `
      <div class="growth">
        <header class="page-head">
          <p class="crumb"><a href="#/">Sorting</a><span aria-hidden="true">/</span>Race<span aria-hidden="true">/</span>How they grow</p>
          <h1>How sorts grow</h1>
          <p class="blurb">The work each sort does as the array gets longer, from 4 to 64 elements. This is where O(n²) and O(n log n) part ways.</p>
          ${kit.tabs('growth')}
        </header>

        <div class="toolbar growth-filters">
          <div class="modes" role="group" aria-label="Kind of array">
            ${SHAPES.map(([k, label]) => `<button type="button" data-shape="${k}" aria-pressed="false">${label}</button>`).join('')}
          </div>
          <div class="modes" role="group" aria-label="What to count">
            ${METRICS.map(([k, label]) => `<button type="button" data-metric="${k}" aria-pressed="false">${label}</button>`).join('')}
          </div>
        </div>

        <section class="sheet growth-sheet" aria-label="Chart">
          <div class="growth-head">
            <h2 class="chart-title" id="g-title"></h2>
            <div class="growth-compare">
              <label><span class="g-key g-key-1" aria-hidden="true"></span><select id="g-a" aria-label="First sort to compare"></select></label>
              <span>and</span>
              <label><span class="g-key g-key-2" aria-hidden="true"></span><select id="g-b" aria-label="Second sort to compare"></select></label>
              <span class="g-others"><span class="g-key g-key-0" aria-hidden="true"></span>the other sorts</span>
            </div>
          </div>
          <div class="growth-chart" id="g-chart" tabindex="0" aria-describedby="g-insight"></div>
          <p class="growth-insight" id="g-insight"></p>
          <details class="growth-table">
            <summary>Show the numbers</summary>
            <div class="table-wrap" id="g-table"></div>
          </details>
        </section>
        <p class="race-foot">${
          'Random and nearly sorted arrays are the average of ' + TRIALS + ' arrays per size. ' +
          'Moves count every write into the array, with a swap as two. Total steps add the reads and counter steps that Counting and Radix Sort use instead of comparisons.'
        }</p>
      </div>`;

    const chart = root.querySelector('#g-chart');
    const selA = root.querySelector('#g-a');
    const selB = root.querySelector('#g-b');

    function syncControls() {
      root.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === st.shape)));
      root.querySelectorAll('[data-metric]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.metric === st.metric)));
      selA.innerHTML = options(st.pair[0], st.pair[1]);
      selB.innerHTML = options(st.pair[1], st.pair[0]);
      kit.setUrl({ shape: st.shape, m: st.metric, vs: st.pair.join(',') });
    }

    function draw() {
      const metric = METRICS.find(([k]) => k === st.metric);
      const W = chart.clientWidth;
      if (!W) return; // not laid out yet; the resize observer draws it once it is
      const narrow = W < 560;
      const H = narrow ? 280 : 360;
      const M = { l: narrow ? 44 : 56, r: narrow ? 96 : 132, t: 14, b: 42 };
      const pw = W - M.l - M.r;
      const ph = H - M.t - M.b;
      const max = Math.max(...sorts.flatMap((a) => st.data[a.id].map((p) => p[st.metric])));
      const { top, step } = niceScale(max);
      const x = (n) => M.l + ((n - SIZES[0]) / (SIZES[SIZES.length - 1] - SIZES[0])) * pw;
      const y = (v) => M.t + ph - (v / top) * ph;
      const path = (id) => st.data[id].map((p, i) => `${i ? 'L' : 'M'}${x(SIZES[i]).toFixed(1)},${y(p[st.metric]).toFixed(1)}`).join('');

      const grid = [];
      for (let v = 0; v <= top + 1e-9; v += step) {
        grid.push(`<line class="g-grid" x1="${M.l}" x2="${M.l + pw}" y1="${y(v)}" y2="${y(v)}"/>`);
        grid.push(`<text class="g-tick" x="${M.l - 8}" y="${y(v)}" text-anchor="end">${fmt(v)}</text>`);
      }
      const xt = [4, 16, 32, 48, 64].map((n) => `<text class="g-tick" x="${x(n)}" y="${M.t + ph + 18}" text-anchor="middle">${n}</text>`).join('');

      const context = sorts
        .filter((a) => !st.pair.includes(a.id))
        .map((a) => `<path class="g-line g-ctx" d="${path(a.id)}"><title>${esc(a.name)}</title></path>`)
        .join('');
      const main = st.pair.map((id, i) => `<path class="g-line g-s${i + 1}" d="${path(id)}"/>`).join('');

      // End labels for the two compared sorts, nudged apart if they would overlap.
      const ends = st.pair.map((id, i) => ({ i, id, y: y(st.data[id][SIZES.length - 1][st.metric]) }));
      if (Math.abs(ends[0].y - ends[1].y) < 16) {
        const mid = (ends[0].y + ends[1].y) / 2;
        const [lo, hi] = ends[0].y <= ends[1].y ? [ends[0], ends[1]] : [ends[1], ends[0]];
        lo.y = mid - 8;
        hi.y = mid + 8;
      }
      const labels = ends
        .map(
          (e) => `
          <line class="g-key-line g-s${e.i + 1}" x1="${M.l + pw + 6}" x2="${M.l + pw + 18}" y1="${e.y}" y2="${e.y}"/>
          <text class="g-end" x="${M.l + pw + 22}" y="${e.y}">${esc(byId[e.id].name.replace(' Sort', ''))}</text>`,
        )
        .join('');

      let hoverMarks = '';
      if (st.hover != null) {
        const hx = x(SIZES[st.hover]);
        hoverMarks =
          `<line class="g-cross" x1="${hx}" x2="${hx}" y1="${M.t}" y2="${M.t + ph}"/>` +
          st.pair.map((id, i) => `<circle class="g-dot g-s${i + 1}" cx="${hx}" cy="${y(st.data[id][st.hover][st.metric])}" r="4.5"/>`).join('');
      }

      chart.innerHTML = `
        <svg class="g-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(metric[1])} against array size for each sort">
          ${grid.join('')}
          <line class="g-axis" x1="${M.l}" x2="${M.l + pw}" y1="${M.t + ph}" y2="${M.t + ph}"/>
          ${xt}
          <text class="g-axis-label" x="${M.l + pw / 2}" y="${H - 4}" text-anchor="middle">array size, n</text>
          ${context}${main}${labels}${hoverMarks}
          <rect class="g-hit" x="${M.l}" y="${M.t}" width="${pw}" height="${ph}"/>
        </svg>
        <div class="g-tip" id="g-tip" hidden></div>`;

      chart.dataset.left = M.l;
      chart.dataset.width = pw;
      root.querySelector('#g-title').textContent = `${metric[1]}, by array size`;
      if (st.hover != null) showTip(x(SIZES[st.hover]), M.t);

      // The sentence under the chart: the two compared sorts at the largest size.
      const last = SIZES.length - 1;
      const [a, b] = st.pair.map((id) => ({ name: byId[id].name, v: st.data[id][last][st.metric] }));
      const [big, small] = a.v >= b.v ? [a, b] : [b, a];
      const ratio = small.v > 0 ? big.v / small.v : null;
      root.querySelector('#g-insight').innerHTML =
        `At n = 64, ${esc(big.name)} needs ${fmt(big.v)} ${metric[2]} and ${esc(small.name)} ${fmt(small.v)}` +
        (small.v === 0 ? ': none at all.' : ratio >= 1.1 ? `, about ${ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)} times fewer.` : ', about the same.') +
        ` Hover or use the arrow keys on the chart to read any size.`;
    }

    function showTip(px) {
      const tip = root.querySelector('#g-tip');
      const i = st.hover;
      const rows = sorts
        .map((a) => ({ a, v: st.data[a.id][i][st.metric], k: st.pair.indexOf(a.id) + 1 }))
        .sort((p, q) => q.v - p.v);
      tip.innerHTML =
        `<p class="g-tip-head">n = ${SIZES[i]}</p>` +
        rows
          .map((r) => `<p class="g-tip-row${r.k ? ' strong' : ''}"><span class="g-key g-key-${r.k}" aria-hidden="true"></span><b>${fmt(r.v)}</b> <span></span></p>`)
          .join('');
      // Names go in with textContent.
      tip.querySelectorAll('.g-tip-row > span:last-child').forEach((s, j) => (s.textContent = rows[j].a.name));
      tip.hidden = false;
      const w = chart.clientWidth;
      const left = px + 14 + 190 > w ? px - 14 - 190 : px + 14;
      tip.style.left = `${Math.max(0, left)}px`;
    }

    function setHover(i) {
      st.hover = i;
      draw();
    }

    function refresh() {
      st.data = compute(sorts, st.shape);
      syncControls();
      draw();
      renderTable();
    }

    function renderTable() {
      const metric = METRICS.find(([k]) => k === st.metric);
      root.querySelector('#g-table').innerHTML = `
        <table class="race-table growth-numbers">
          <caption>${esc(metric[1])} for each sort and array size</caption>
          <thead><tr><th scope="col">n</th>${sorts.map((a) => `<th scope="col">${esc(a.name.replace(' Sort', ''))}</th>`).join('')}</tr></thead>
          <tbody>${SIZES.map((n, i) => `<tr><th scope="row">${n}</th>${sorts.map((a) => `<td>${fmt(st.data[a.id][i][st.metric])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    }

    root.querySelectorAll('[data-shape]').forEach((b) =>
      b.addEventListener('click', () => {
        st.shape = b.dataset.shape;
        refresh();
      }),
    );
    root.querySelectorAll('[data-metric]').forEach((b) =>
      b.addEventListener('click', () => {
        st.metric = b.dataset.metric;
        syncControls();
        draw();
        renderTable();
      }),
    );
    selA.addEventListener('change', () => {
      st.pair[0] = selA.value;
      syncControls();
      draw();
    });
    selB.addEventListener('change', () => {
      st.pair[1] = selB.value;
      syncControls();
      draw();
    });

    // Hover: the nearest size to the pointer. Keyboard: arrow keys along the sizes.
    chart.addEventListener('pointermove', (e) => {
      if (!e.target.closest('.g-hit')) return;
      const r = chart.getBoundingClientRect();
      const left = Number(chart.dataset.left);
      const width = Number(chart.dataset.width);
      const i = Math.round(((e.clientX - r.left - left) / width) * (SIZES.length - 1));
      const k = Math.max(0, Math.min(SIZES.length - 1, i));
      if (k !== st.hover) setHover(k);
    });
    chart.addEventListener('pointerleave', () => setHover(null));
    chart.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const d = e.key === 'ArrowRight' ? 1 : -1;
        setHover(st.hover == null ? (d > 0 ? 0 : SIZES.length - 1) : Math.max(0, Math.min(SIZES.length - 1, st.hover + d)));
      } else if (e.key === 'Escape') setHover(null);
    });
    chart.addEventListener('blur', () => setHover(null));

    // Redraw whenever the chart's own width changes (window resizes, the page first laying out).
    let lastWidth = 0;
    const observer = new ResizeObserver(() => {
      if (chart.clientWidth !== lastWidth) {
        lastWidth = chart.clientWidth;
        draw();
      }
    });
    observer.observe(chart);

    refresh();
    return () => observer.disconnect();
  };
})();
