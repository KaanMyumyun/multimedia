/*
 * Renderer: turns a view (see core.js) into DOM inside the stage element.
 *
 * Elements that represent the same item across views share a data-flip id.
 * BTA.render measures them before and after a re-render and animates the
 * difference (FLIP), so swaps and moves slide instead of jumping.
 * Clickable elements carry data-key, which is what questions answer with.
 */
(function () {
  'use strict';

  const SVG = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    node.append(...children.filter((c) => c != null));
    return node;
  }

  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
    node.append(...children.filter((c) => c != null));
    return node;
  }

  // ---------- FLIP ----------

  function capture(root) {
    const rects = new Map();
    root.querySelectorAll('[data-flip]').forEach((n) => rects.set(n.dataset.flip, n.getBoundingClientRect()));
    return rects;
  }

  function play(root, before) {
    if (reducedMotion.matches || !before.size) return;
    root.querySelectorAll('[data-flip]').forEach((n) => {
      const r0 = before.get(n.dataset.flip);
      if (!r0) {
        n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
        return;
      }
      const r1 = n.getBoundingClientRect();
      let dx = r0.left + r0.width / 2 - (r1.left + r1.width / 2);
      let dy = r0.top + r0.height / 2 - (r1.top + r1.height / 2);
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      if (n instanceof SVGElement) {
        // CSS px inside an SVG are user units; convert from screen px.
        const owner = n.ownerSVGElement;
        const scale = owner.getBoundingClientRect().width / owner.viewBox.baseVal.width || 1;
        dx /= scale;
        dy /= scale;
      }
      const sx = r1.width ? r0.width / r1.width : 1;
      const from = `translate(${dx}px, ${dy}px)` + (Math.abs(sx - 1) > 0.02 ? ` scale(${sx})` : '');
      n.animate([{ transform: from }, { transform: 'none' }], {
        duration: 480,
        easing: 'cubic-bezier(.2, .8, .2, 1)',
      });
    });
  }

  // ---------- shared bits ----------

  function chips(list) {
    if (!list || !list.length) return null;
    return el(
      'div',
      { class: 'chips' },
      ...list.map((c) =>
        el('span', { class: 'chip' + (c.tone ? ' tone-' + c.tone : '') }, el('span', { class: 'chip-label' }, c.label), String(c.value)),
      ),
    );
  }

  // ---------- arrays ----------

  function cellNode(c, max, index) {
    if (!c || c.ghost) return el('div', { class: 'cell ghost', 'aria-hidden': 'true' });
    const clickable = c.key != null;
    const h = max > 0 ? Math.min(100, Math.max(8, Math.round((c.value / max) * 100))) : 8;
    const node = el(
      clickable ? 'button' : 'div',
      {
        class: `cell s-${c.state}` + (c.lifted ? ' lifted' : ''),
        'data-flip': c.flip,
        'data-key': clickable ? c.key : null,
        type: clickable ? 'button' : null,
        'aria-label': clickable ? `${c.value}, position ${index}` : null,
        style: `--h:${h}%`,
      },
      el('span', { class: 'bar', 'aria-hidden': 'true' }),
      el('span', { class: 'val' }, String(c.value)),
    );
    return node;
  }

  function arrayRow(row, max) {
    const track = el('div', { class: 'track', style: `--n:${row.cells.length}` });
    row.cells.forEach((c, i) => {
      const slot = el('div', { class: 'slot' }, cellNode(c, max, i));
      if (row.showIndex) slot.append(el('span', { class: 'idx' }, String(i)));
      const tags = row.ptrs && row.ptrs[i];
      if (tags && tags.length) slot.append(el('span', { class: 'ptrs' }, ...tags.map((t) => el('span', { class: 'ptr' }, t))));
      track.append(slot);
    });
    return el(
      'div',
      { class: 'row' + (row.mini ? ' mini' : '') + (row.half ? ' half' : '') },
      row.label ? el('div', { class: 'row-label' }, row.label) : null,
      track,
    );
  }

  // The first row drawn as a binary tree (heap sort). Positions >= view.tree
  // are no longer part of the heap and are drawn faded.
  function heapTree(view) {
    const cells = view.rows[0].cells;
    const n = cells.length;
    const levels = Math.floor(Math.log2(n)) + 1;
    const W = 520;
    const LH = 74;
    const H = levels * LH;
    const pos = (k) => {
      const level = Math.floor(Math.log2(k + 1));
      const at = k - (2 ** level - 1);
      return [((at + 0.5) * W) / 2 ** level, LH / 2 + level * LH];
    };

    const root = svg('svg', { class: 'tree', viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': 'Heap drawn as a tree' });
    for (let k = 1; k < n; k++) {
      const [x1, y1] = pos((k - 1) >> 1);
      const [x2, y2] = pos(k);
      root.append(svg('line', { class: 'tedge' + (k >= view.tree ? ' out' : ''), x1, y1, x2, y2 }));
    }
    cells.forEach((c, k) => {
      const [x, y] = pos(k);
      const g = svg(
        'g',
        {
          class: `tnode s-${c.state}`,
          'data-flip': 't-' + c.flip,
          'data-key': c.key,
          tabindex: c.key != null ? '0' : null,
          role: c.key != null ? 'button' : null,
          'aria-label': c.key != null ? `${c.value}, position ${k}` : null,
        },
        svg('circle', { class: 'ring', cx: x, cy: y, r: 29 }),
        svg('circle', { class: 'disc', cx: x, cy: y, r: 23 }),
        svg('text', { x, y }, String(c.value)),
        svg('text', { class: 'tidx', x: x + 27, y: y - 20 }, String(k)),
      );
      root.append(g);
    });
    return el('div', { class: 'tree-wrap' }, root);
  }

  function arrayStage(view) {
    const wrap = el('div', { class: 'arr' });
    const c = chips(view.chips);
    if (c) wrap.append(c);
    if (view.tree != null) wrap.append(heapTree(view));
    const rows = el('div', { class: 'rows' });
    view.rows.forEach((r) => rows.append(arrayRow(r, view.max)));
    wrap.append(rows);
    return wrap;
  }

  // ---------- graphs ----------

  // On narrow screens the wide layout is turned on its side (and squeezed a
  // little along its length) so nodes stay big enough to read and tap.
  const SQUEEZE = 0.62;

  function graphStage(view, narrow) {
    const byId = Object.fromEntries(view.nodes.map((n) => [n.id, n]));
    const place = narrow ? (x, y) => [y, 40 + (x - 40) * SQUEEZE] : (x, y) => [x, y];
    const W = narrow ? view.height : view.width;
    const H = narrow ? Math.round(40 + (view.width - 40) * SQUEEZE) : view.height;
    const at = Object.fromEntries(view.nodes.map((n) => [n.id, place(n.x, n.y)]));
    const root = svg('svg', {
      class: 'graph-svg',
      viewBox: `0 0 ${W} ${H}`,
      role: 'group',
      'aria-label': 'Graph',
    });

    const marks = svg('g', { class: 'edge-marks' });
    const edges = svg('g', { class: 'edges' });
    const weights = svg('g', { class: 'weights' });
    for (const e of view.edges) {
      const [ax, ay] = at[e.u];
      let [bx, by] = at[e.v];
      // A wide highlighter stroke drawn under the edge being worked on.
      if (e.state === 'active') marks.append(svg('line', { class: 'edge-hl', x1: ax, y1: ay, x2: bx, y2: by }));
      if (view.directed) {
        // Stop the line at the target node's rim and put an arrowhead there.
        const len = Math.hypot(bx - ax, by - ay);
        const ux = (bx - ax) / len;
        const uy = (by - ay) / len;
        const tipX = bx - ux * 29;
        const tipY = by - uy * 29;
        const baseX = tipX - ux * 13;
        const baseY = tipY - uy * 13;
        edges.append(
          svg('polygon', {
            class: `arrow e-${e.state}`,
            points: `${tipX},${tipY} ${baseX - uy * 6.5},${baseY + ux * 6.5} ${baseX + uy * 6.5},${baseY - ux * 6.5}`,
          }),
        );
        bx = baseX;
        by = baseY;
      }
      edges.append(svg('line', { class: `edge e-${e.state}`, x1: ax, y1: ay, x2: bx, y2: by }));
      if (e.w != null) {
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        weights.append(
          svg(
            'g',
            { class: `weight e-${e.state}` },
            svg('circle', { cx: mx, cy: my, r: 14 }),
            svg('text', { x: mx, y: my }, String(e.w)),
          ),
        );
      }
    }
    root.append(marks, edges, weights);

    // Put each badge on the side of its node that is furthest from the node's edges,
    // so a badge never hides an edge or an arrowhead.
    const edgeAngles = Object.fromEntries(view.nodes.map((n) => [n.id, []]));
    for (const e of view.edges) {
      const [ax, ay] = at[e.u];
      const [bx, by] = at[e.v];
      edgeAngles[e.u].push(Math.atan2(by - ay, bx - ax));
      edgeAngles[e.v].push(Math.atan2(ay - by, ax - bx));
    }
    const SIDES = [-45, -135, 45, 135, -90, 90, 0, 180].map((d) => (d * Math.PI) / 180);
    const gap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const badgeSide = (id) =>
      SIDES.reduce(
        (best, s) => {
          const clear = Math.min(Math.PI, ...edgeAngles[id].map((t) => gap(s, t)));
          return clear > best.clear + 0.01 ? { s, clear } : best;
        },
        { s: SIDES[0], clear: -1 },
      ).s;

    for (const n of view.nodes) {
      const [x, y] = at[n.id];
      const g = svg(
        'g',
        {
          class: `gnode s-${n.state}`,
          'data-key': n.key,
          tabindex: '0',
          role: 'button',
          'aria-label': `Node ${n.id}` + (n.badge != null ? `, ${view.badgeName} ${n.badge}` : ''),
        },
        svg('circle', { class: 'ring', cx: x, cy: y, r: 33 }),
        svg('circle', { class: 'disc', cx: x, cy: y, r: 26 }),
        svg('text', { x, y }, n.id),
      );
      if (n.badge != null) {
        const side = badgeSide(n.id);
        const bx = x + 39 * Math.cos(side);
        const by = y + 39 * Math.sin(side);
        const wide = n.badge.length > 1;
        g.append(
          svg(
            'g',
            { class: 'badge' },
            svg('rect', { x: bx - (wide ? 18 : 14), y: by - 13, width: wide ? 36 : 28, height: 26, rx: 13 }),
            svg('text', { x: bx, y: by }, n.badge),
          ),
        );
      }
      root.append(g);
    }

    const side = el('div', { class: 'graph-side' });
    for (const l of view.lists) {
      side.append(
        el(
          'div',
          { class: 'glist' },
          el('div', { class: 'glist-title' }, l.title, l.note ? el('span', { class: 'glist-note' }, l.note) : null),
          el(
            'div',
            { class: 'glist-items' },
            ...(l.items.length
              ? l.items.map((id) => el('span', { class: `tok s-${byId[id] ? byId[id].state : 'idle'}`, 'data-flip': `${l.title}-${id}` }, id))
              : [el('span', { class: 'glist-empty' }, 'empty')]),
          ),
        ),
      );
    }
    if (view.table) {
      const t = el('table', { class: 'dist-table' });
      t.append(el('thead', {}, el('tr', {}, ...view.table.head.map((h) => el('th', { scope: 'col' }, h)))));
      const body = el('tbody');
      for (const r of view.table.rows) {
        const state = byId[r[0]] ? byId[r[0]].state : 'idle';
        body.append(el('tr', { class: `s-${state}` }, ...r.map((v) => el('td', {}, v))));
      }
      t.append(body);
      side.append(t);
    }

    const wrap = el('div', { class: 'graph' + (narrow ? ' narrow' : '') });
    const c = chips(view.chips);
    if (c) wrap.append(c);
    wrap.append(el('div', { class: 'graph-main' }, el('div', { class: 'graph-canvas' }, root), side));
    return wrap;
  }

  // ---------- public ----------

  BTA.render = function (stage, view, { animate = true } = {}) {
    const before = animate ? capture(stage) : new Map();
    const narrow = stage.clientWidth < 560;
    stage.replaceChildren(view.kind === 'graph' ? graphStage(view, narrow) : arrayStage(view));
    stage.btaView = view;
    stage.btaNarrow = narrow;
    if (animate) play(stage, before);
  };

  // Re-draw the current view if the graph layout no longer suits the width.
  BTA.refit = function (stage) {
    const view = stage.btaView;
    if (!view || view.kind !== 'graph' || stage.btaNarrow === stage.clientWidth < 560) return false;
    BTA.render(stage, view, { animate: false });
    return true;
  };

  // Toggle a marker class on every clickable element whose key is in `keys`.
  BTA.mark = function (stage, cls, keys) {
    const set = new Set(keys || []);
    stage.querySelectorAll('[data-key]').forEach((n) => n.classList.toggle(cls, set.has(n.dataset.key)));
  };

  BTA.el = el;
})();
