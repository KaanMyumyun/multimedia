/*
 * Core: the algorithm registry plus helpers shared by every algorithm module.
 *
 * An algorithm module calls BTA.register({...}) with:
 *   id, name, group, blurb, complexity, how[], code[], legend[], summary
 *   input    – { label, options[], default } for a size picker (omit for graphs)
 *   generate(size) → a fresh random input
 *   build(input)   → { steps[], final (view), stats[[label, value]] }
 *
 * A step is one question:
 *   view     – what the stage shows while the question is asked
 *   prompt   – HTML question text
 *   ask      – { type: 'pick',   answer: [keys], count?, position? }  click N elements
 *              (position: the answer is a slot, not the value in it)
 *              { type: 'multi',  answer: [keys] }          select any number, then Check
 *              { type: 'choice', answer: value, options: [{ label, value }] }
 *              { type: 'info' }                            no question, just Continue
 *   correct  – HTML shown after a correct answer
 *   wrong    – HTML, or fn(given) → HTML, shown after a wrong answer
 *   hint     – HTML
 *   after    – optional view shown once the answer is correct (animated)
 *   line     – index into code[] to highlight
 *
 * Closures in `wrong` run later, after build() has finished mutating its data,
 * so they must only use values captured at the time the step was created.
 */
(function () {
  'use strict';

  const registry = [];

  const BTA = (window.BTA = {
    algorithms: registry,
    register(def) {
      registry.push(def);
    },
    get(id) {
      return registry.find((a) => a.id === id);
    },
  });

  // ---------- randomness ----------

  BTA.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  BTA.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // n distinct integers from [lo, hi], in random order.
  BTA.distinct = (n, lo, hi) => {
    const pool = [];
    for (let v = lo; v <= hi; v++) pool.push(v);
    return BTA.shuffle(pool).slice(0, n);
  };

  // Random distinct values that are not already sorted.
  BTA.unsorted = (n, lo = 1, hi = 20) => {
    let v;
    do v = BTA.distinct(n, lo, hi);
    while (v.every((x, i) => i === 0 || v[i - 1] < x));
    return v;
  };

  // A target for a search exercise: usually one of the values, sometimes missing.
  BTA.searchTarget = (values, lo = 1, hi = 99) => {
    if (Math.random() < 0.75) return values[BTA.randInt(0, values.length - 1)];
    let t;
    do t = BTA.randInt(lo, hi);
    while (values.includes(t));
    return t;
  };

  // ---------- text ----------

  // ['3', '5', '8'] → "3, 5 and 8"
  BTA.list = (xs) => {
    xs = xs.map(String);
    if (xs.length <= 1) return xs.join('');
    return xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  };

  BTA.plural = (n, one, many) => (n === 1 ? one : many);

  // ---------- array views ----------

  // Items carry a stable id so the renderer can animate them as they move.
  BTA.items = (values) => values.map((v, i) => ({ id: 'e' + i, v }));

  /*
   * Build a single-row array view from items.
   *   max     – largest value in the input (keeps bar heights stable between steps)
   *   state   – fn(index, item) → state name
   *   ptrs    – { index: ['lo', 'mid'] } pointer tags under cells
   *   keys    – false to make cells unclickable
   *   lifted  – index of a cell drawn raised (insertion sort's key)
   *   tree    – heap size; also draws the array as a binary tree
   *   chips   – [{ label, value }] shown above the stage
   */
  BTA.arrayView = (items, o = {}) => {
    const state = o.state || (() => 'idle');
    return {
      kind: 'array',
      max: o.max,
      chips: o.chips || [],
      tree: o.tree == null ? null : o.tree,
      rows: [
        {
          label: o.label || null,
          showIndex: o.showIndex !== false,
          ptrs: o.ptrs || {},
          cells: items.map((it, i) => ({
            flip: it.id,
            value: it.v,
            state: state(i, it),
            key: o.keys === false ? null : String(i),
            lifted: o.lifted === i,
          })),
        },
      ],
    };
  };

  // ---------- graphs ----------

  // A fixed, planar layout. Random subsets of these edges give varied graphs
  // that never have crossing lines.
  const LAYOUT = {
    width: 720,
    height: 360,
    nodes: {
      A: [70, 180],
      B: [215, 70],
      C: [215, 290],
      D: [360, 180],
      E: [505, 70],
      F: [505, 290],
      G: [650, 180],
    },
    edges: [
      ['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D'], ['C', 'D'], ['B', 'E'],
      ['C', 'F'], ['D', 'E'], ['D', 'F'], ['D', 'G'], ['E', 'G'], ['F', 'G'],
    ],
  };

  // A connected graph: a random spanning tree plus `extra` additional edges.
  BTA.randomGraph = ({ extra = 3, weighted = false } = {}) => {
    const ids = Object.keys(LAYOUT.nodes);
    const parent = Object.fromEntries(ids.map((id) => [id, id]));
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));

    const chosen = [];
    const spare = [];
    for (const [u, v] of BTA.shuffle(LAYOUT.edges.map((e) => e.slice()))) {
      const ru = find(u);
      const rv = find(v);
      if (ru !== rv) {
        parent[ru] = rv;
        chosen.push([u, v]);
      } else {
        spare.push([u, v]);
      }
    }
    chosen.push(...spare.slice(0, extra));

    const edges = chosen
      .map(([u, v]) => (u < v ? [u, v] : [v, u]))
      .sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]))
      .map(([u, v]) => ({ u, v, w: weighted ? BTA.randInt(1, 9) : null }));

    return BTA.withAdjacency({ ids, pos: LAYOUT.nodes, width: LAYOUT.width, height: LAYOUT.height, edges });
  };

  // (Re)build the adjacency lists, neighbours in alphabetical order.
  BTA.withAdjacency = (g) => {
    const adj = Object.fromEntries(g.ids.map((id) => [id, []]));
    for (const e of g.edges) {
      adj[e.u].push({ to: e.v, w: e.w });
      adj[e.v].push({ to: e.u, w: e.w });
    }
    for (const id of g.ids) adj[id].sort((a, b) => a.to.localeCompare(b.to));
    return { ...g, adj };
  };

  BTA.edgeKey = (a, b) => (a < b ? a + b : b + a);

  /*
   * Build a graph view.
   *   state  – fn(id) → node state
   *   badge  – fn(id) → small label next to the node (e.g. a distance), or null
   *   edge   – fn(edge) → edge state
   *   lists  – [{ title, note, items: [ids] }] queues, stacks, visit orders
   *   table  – { head: [...], rows: [[...]] }
   */
  BTA.graphView = (g, o = {}) => ({
    kind: 'graph',
    width: g.width,
    height: g.height,
    chips: o.chips || [],
    nodes: g.ids.map((id) => ({
      id,
      key: id,
      x: g.pos[id][0],
      y: g.pos[id][1],
      state: o.state ? o.state(id) : 'idle',
      badge: o.badge ? o.badge(id) : null,
    })),
    edges: g.edges.map((e) => ({ ...e, state: o.edge ? o.edge(e) : 'idle' })),
    lists: (o.lists || []).map((l) => ({ ...l, items: l.items.slice() })),
    table: o.table || null,
  });
})();
