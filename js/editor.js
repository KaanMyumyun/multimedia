/*
 * "Your own graph": click the layout's possible edges to switch them on and off, then set
 * weights (and arrow directions) in the list. The result is checked like a graph from a link.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const SQUEEZE = 0.62; // the same sideways layout the renderer uses on phones
  const node = (tag, attrs = {}, text) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };
  const keyOf = (u, v) => (u < v ? u + v : v + u);

  /*
   *   algo     – a graph exercise; algo.graph says weighted / directed / negative, and
   *              algo.graph.weightFor(u, v) can suggest a weight for a new edge
   *   current() → the graph to start from
   *   onUse(graph)
   * Returns { form, toggle(button) }, like the "Your own array" form.
   */
  BTA.graphEditor = function ({ algo, current, onUse }) {
    const opts = algo.graph || {};
    const L = BTA.LAYOUT;
    const [wMin, wMax] = opts.negative ? [-9, 9] : [1, 9];
    const suggest = (u, v) => (opts.weightFor ? opts.weightFor(u, v) : 5);
    const chosen = new Map(); // "AB" → { u, v, w }, with u → v the arrow's direction

    const form = document.createElement('form');
    form.className = 'own ge';
    form.hidden = true;
    form.noValidate = true;
    form.innerHTML = `
      <p class="own-help">
        Click a line to ${opts.directed ? 'add an arrow; click again to turn it round, and a third time to remove it' : 'add or remove that edge'}.
        ${opts.weighted ? `Set the weights in the list (${opts.negative ? 'from −9 to 9, but not 0' : 'from 1 to 9'}).` : ''}
        Every node has to be connected.
      </p>
      <div class="ge-body">
        <div class="ge-canvas"></div>
        <ul class="ge-list" aria-label="Edges in your graph"></ul>
      </div>
      <div class="own-fields">
        <button class="btn primary" type="submit">Use this graph</button>
        <button class="btn" type="button" data-clear>Clear</button>
        <button class="btn quiet" type="button" data-cancel>Cancel</button>
      </div>
      <p class="own-error" role="alert"></p>`;
    const canvas = form.querySelector('.ge-canvas');
    const list = form.querySelector('.ge-list');
    const err = form.querySelector('.own-error');
    let opener = null;

    const label = (e) => `${e.u} ${opts.directed ? '→' : '–'} ${e.v}`;

    function draw() {
      const narrow = canvas.clientWidth > 0 && canvas.clientWidth < 520;
      const place = narrow ? (x, y) => [y, 40 + (x - 40) * SQUEEZE] : (x, y) => [x, y];
      const W = narrow ? L.height : L.width;
      const H = narrow ? Math.round(40 + (L.width - 40) * SQUEEZE) : L.height;
      const at = Object.fromEntries(Object.entries(L.nodes).map(([id, [x, y]]) => [id, place(x, y)]));
      const root = node('svg', { class: 'ge-svg', viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': 'Possible edges' });

      for (const [a, b] of L.edges) {
        const key = a + b;
        const e = chosen.get(key);
        const [x1, y1] = at[e ? e.u : a];
        let [x2, y2] = at[e ? e.v : b];
        const g = node('g', {
          class: 'ge-edge' + (e ? ' on' : ''),
          tabindex: '0',
          role: 'button',
          'data-edge': key,
          'aria-pressed': e ? 'true' : 'false',
          'aria-label': e ? `${opts.directed ? 'Arrow' : 'Edge'} ${label(e)}${opts.weighted ? `, weight ${e.w}` : ''}` : `Edge ${a}–${b}, not in the graph`,
        });
        g.append(node('line', { class: 'ge-hit', x1, y1, x2, y2 }));
        if (e && opts.directed) {
          const len = Math.hypot(x2 - x1, y2 - y1);
          const ux = (x2 - x1) / len;
          const uy = (y2 - y1) / len;
          const tx = x2 - ux * 29;
          const ty = y2 - uy * 29;
          const bx = tx - ux * 13;
          const by = ty - uy * 13;
          g.append(node('polygon', { class: 'ge-arrow', points: `${tx},${ty} ${bx - uy * 6.5},${by + ux * 6.5} ${bx + uy * 6.5},${by - ux * 6.5}` }));
          x2 = bx;
          y2 = by;
        }
        g.append(node('line', { class: 'ge-line', x1, y1, x2, y2 }));
        if (e && opts.weighted) {
          const [ax, ay] = at[e.u];
          const [cx, cy] = at[e.v];
          const mx = (ax + cx) / 2;
          const my = (ay + cy) / 2;
          g.append(node('circle', { class: 'ge-w', cx: mx, cy: my, r: 15 }), node('text', { class: 'ge-wt', x: mx, y: my }, String(e.w)));
        }
        root.append(g);
      }
      for (const [id, [x, y]] of Object.entries(at)) {
        root.append(node('circle', { class: 'ge-node', cx: x, cy: y, r: 26 }), node('text', { class: 'ge-label', x, y }, id));
      }
      canvas.replaceChildren(root);
    }

    function renderList() {
      const items = [...chosen.entries()].sort((x, y) => x[0].localeCompare(y[0]));
      list.innerHTML = items.length
        ? items
            .map(
              ([key, e]) => `
          <li data-edge="${key}">
            <span class="ge-name">${label(e)}</span>
            ${opts.weighted ? `<label class="ge-weight">weight <input type="number" inputmode="numeric" min="${wMin}" max="${wMax}" step="1" value="${e.w}" /></label>` : ''}
            ${opts.directed ? '<button type="button" class="link" data-turn>Turn round</button>' : ''}
            <button type="button" class="link" data-remove>Remove</button>
          </li>`,
            )
            .join('')
        : '<li class="ge-empty">No edges yet. Click the lines in the picture.</li>';
    }

    function toggle(key) {
      const [a, b] = key.split('');
      const e = chosen.get(key);
      if (!e) chosen.set(key, { u: a, v: b, w: opts.weighted ? suggest(a, b) : null });
      else if (opts.directed && e.u === a) chosen.set(key, { ...e, u: b, v: a });
      else chosen.delete(key);
      err.textContent = '';
      draw();
      renderList();
      const again = canvas.querySelector(`[data-edge="${key}"]`);
      if (again) again.focus();
    }

    canvas.addEventListener('click', (ev) => {
      const g = ev.target.closest('[data-edge]');
      if (g) toggle(g.dataset.edge);
    });
    canvas.addEventListener('keydown', (ev) => {
      const g = ev.target.closest('[data-edge]');
      if (g && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        toggle(g.dataset.edge);
      }
    });
    list.addEventListener('input', (ev) => {
      const li = ev.target.closest('[data-edge]');
      if (!li || ev.target.tagName !== 'INPUT') return;
      const e = chosen.get(li.dataset.edge);
      e.w = ev.target.value.trim() === '' ? NaN : Number(ev.target.value);
      draw();
    });
    list.addEventListener('click', (ev) => {
      const li = ev.target.closest('[data-edge]');
      if (!li) return;
      const e = chosen.get(li.dataset.edge);
      if (ev.target.closest('[data-turn]')) chosen.set(li.dataset.edge, { ...e, u: e.v, v: e.u });
      else if (ev.target.closest('[data-remove]')) chosen.delete(li.dataset.edge);
      else return;
      draw();
      renderList();
    });

    const close = () => {
      form.hidden = true;
      if (opener) {
        opener.setAttribute('aria-expanded', 'false');
        opener.focus();
      }
    };
    form.querySelector('[data-cancel]').addEventListener('click', close);
    form.querySelector('[data-clear]').addEventListener('click', () => {
      chosen.clear();
      err.textContent = '';
      draw();
      renderList();
    });
    form.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!chosen.size) return void (err.textContent = 'Add some edges first.');
      if (opts.weighted) {
        const bad = [...chosen.values()].find((e) => !Number.isInteger(e.w) || e.w < wMin || e.w > wMax || e.w === 0);
        if (bad) return void (err.textContent = `${label(bad)} needs a whole-number weight ${opts.negative ? 'from −9 to 9, but not 0' : 'from 1 to 9'}.`);
      }
      const text = [...chosen.values()].map((e) => e.u + e.v + (opts.weighted ? e.w : '')).join(',');
      const r = BTA.decodeGraph(text, opts);
      if (r.error) return void (err.textContent = r.error);
      const problem = algo.validate ? algo.validate(r.graph) : null;
      if (problem) return void (err.textContent = problem);
      err.textContent = '';
      close();
      onUse(r.graph);
    });

    return {
      form,
      toggle(btn) {
        opener = btn;
        if (!form.hidden) return close();
        chosen.clear();
        for (const e of current().edges) chosen.set(keyOf(e.u, e.v), { u: e.u, v: e.v, w: e.w });
        err.textContent = '';
        form.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        draw();
        renderList();
        const first = canvas.querySelector('[data-edge]');
        if (first) first.focus();
      },
    };
  };
})();
