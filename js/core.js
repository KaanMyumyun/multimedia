/*
 * Core: the algorithm registry plus helpers shared by every algorithm module.
 *
 * An algorithm module calls BTA.register({...}) with:
 *   id, name, group, blurb, complexity, how[], code[], legend[], summary
 *   input    – array exercises: { label, options[], default } for the size picker, plus
 *              rules for typed-in arrays (see inputRules): length, range, distinct,
 *              sorted (sort what was typed), target (a search: the input is { values, target })
 *   graph    – graph exercises instead of input: { weighted?, directed? }
 *   validate(input) → optional extra check for a graph from a link; an error message or null
 *   generate(size) → a fresh random input
 *   build(input)   → { steps[], final (view), stats[[label, value]] }
 *   trace(values)  → sorts only: the operations for the race page, as
 *                    ['c', i, j] compare · ['s', i, j] swap · ['w', i, v] write
 *                    ['r', i] read · ['k'] any other step (counting sort's counters)
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

  // ---------- typed-in and linked inputs ----------

  // The rules an exercise's typed-in array must follow.
  BTA.inputRules = (algo) => {
    const i = algo.input || {};
    return {
      length: i.length || (i.target ? [2, 25] : [2, 12]),
      range: i.range || [0, 99],
      distinct: i.distinct !== false,
      sorted: !!i.sorted,
      target: !!i.target,
    };
  };

  // "8, 3 5" → { values: [8, 3, 5] }, or { error }.
  BTA.parseNumbers = (text) => {
    const parts = String(text).trim().split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return { error: 'Type some numbers, for example 8 3 5 1.' };
    const bad = parts.find((p) => !/^\d+$/.test(p));
    if (bad) return { error: `“${bad}” isn’t a whole number from 0 up.` };
    return { values: parts.map(Number) };
  };

  // An error message, or null if the values follow the rules.
  BTA.checkValues = (values, { length: [min, max], range: [lo, hi], distinct }) => {
    if (values.length < min) return `Use at least ${min} numbers.`;
    if (values.length > max) return `Use at most ${max} numbers.`;
    const out = values.find((v) => v < lo || v > hi);
    if (out != null) return `${out} is out of range. Use numbers from ${lo} to ${hi}.`;
    if (distinct) {
      const seen = new Set();
      for (const v of values) {
        if (seen.has(v)) return `${v} appears twice. Use different numbers, so every question has one right answer.`;
        seen.add(v);
      }
    }
    return null;
  };

  // An exercise's input as link parameters: a=8,3,5 · t=5 (search target) · e=AB3,AC5 (graph edges).
  BTA.toParams = (algo, input) => {
    if (algo.graph) return { e: input.edges.map((e) => e.u + e.v + (e.w == null ? '' : e.w)).join(',') };
    if (BTA.inputRules(algo).target) return { a: input.values.join(','), t: String(input.target) };
    return { a: input.join(',') };
  };

  // Link parameters back to an input: { input } or { error }.
  BTA.fromParams = (algo, params) => {
    if (algo.graph) {
      const r = BTA.decodeGraph(params.get('e') || '', algo.graph);
      if (r.error) return r;
      const err = algo.validate ? algo.validate(r.graph) : null;
      return err ? { error: err } : { input: r.graph };
    }
    const rules = BTA.inputRules(algo);
    const r = BTA.parseNumbers(params.get('a') || '');
    if (r.error) return r;
    const err = BTA.checkValues(r.values, rules);
    if (err) return { error: err };
    const values = rules.sorted ? r.values.slice().sort((x, y) => x - y) : r.values;
    if (!rules.target) return { input: values };
    const t = String(params.get('t') || '').trim();
    if (!/^\d+$/.test(t) || +t > rules.range[1]) {
      return { error: `The target has to be a whole number from ${rules.range[0]} to ${rules.range[1]}.` };
    }
    return { input: { values, target: Number(t) } };
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

  const allowed = new Set(LAYOUT.edges.map(([u, v]) => u + v));

  // A graph from a list of { u, v, w } edges, drawn on the fixed layout.
  BTA.makeGraph = (edges, { directed = false } = {}) =>
    BTA.withAdjacency({
      ids: Object.keys(LAYOUT.nodes),
      pos: LAYOUT.nodes,
      width: LAYOUT.width,
      height: LAYOUT.height,
      directed,
      edges: edges.slice().sort((a, b) => BTA.edgeKey(a.u, a.v).localeCompare(BTA.edgeKey(b.u, b.v))),
    });

  // "AB3,AC5" → { graph } or { error }. Edges must be ones the layout can draw.
  BTA.decodeGraph = (text, { weighted = false, directed = false } = {}) => {
    const tokens = String(text).split(',').map((t) => t.trim()).filter(Boolean);
    if (!tokens.length) return { error: 'The link has no edges in it.' };
    const shape = weighted ? /^([A-G])([A-G])([1-9])$/ : /^([A-G])([A-G])$/;
    const seen = new Set();
    const edges = [];
    for (const t of tokens) {
      const m = t.match(shape);
      if (!m || m[1] === m[2]) return { error: `“${t}” isn’t a valid edge.` };
      const [, u, v] = m;
      const key = BTA.edgeKey(u, v);
      if (!allowed.has(key)) return { error: `${u}–${v} can’t be drawn on this layout.` };
      if (seen.has(key)) return { error: `${u}–${v} appears twice.` };
      seen.add(key);
      const [a, b] = directed || u < v ? [u, v] : [v, u];
      edges.push({ u: a, v: b, w: weighted ? Number(m[3]) : null });
    }
    const g = BTA.makeGraph(edges, { directed });

    // Every node must be reachable (ignoring arrow directions).
    const reach = new Set(['A']);
    const stack = ['A'];
    while (stack.length) {
      const x = stack.pop();
      for (const e of g.edges) {
        const y = e.u === x ? e.v : e.v === x ? e.u : null;
        if (y && !reach.has(y)) reach.add(y) && stack.push(y);
      }
    }
    if (reach.size < g.ids.length) return { error: 'Some nodes aren’t connected to the rest of the graph.' };
    if (directed && BTA.topoOrder(g).length < g.ids.length) {
      return { error: 'The arrows go round in a circle, so there is no valid order.' };
    }
    return { graph: g };
  };

  // Kahn's algorithm, taking the alphabetically first ready node each time.
  // Shorter than the node count if there is a cycle.
  BTA.topoOrder = (g) => {
    const indeg = Object.fromEntries(g.ids.map((id) => [id, 0]));
    for (const e of g.edges) indeg[e.v]++;
    const ready = g.ids.filter((id) => indeg[id] === 0);
    const order = [];
    while (ready.length) {
      ready.sort();
      const u = ready.shift();
      order.push(u);
      for (const { to } of g.adj[u]) if (--indeg[to] === 0) ready.push(to);
    }
    return order;
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

    const edges = chosen.map(([u, v]) => ({ u: u < v ? u : v, v: u < v ? v : u, w: weighted ? BTA.randInt(1, 9) : null }));
    return BTA.makeGraph(edges);
  };

  // A random connected graph with no cycles, its edges turned into arrows.
  BTA.randomDag = ({ extra = 3 } = {}) => {
    const g = BTA.randomGraph({ extra });
    const rank = Object.fromEntries(BTA.shuffle(g.ids.slice()).map((id, i) => [id, i]));
    const edges = g.edges.map((e) => (rank[e.u] < rank[e.v] ? { u: e.u, v: e.v, w: null } : { u: e.v, v: e.u, w: null }));
    return BTA.makeGraph(edges, { directed: true });
  };

  // (Re)build the adjacency lists, neighbours in alphabetical order.
  // In a directed graph a node only lists the nodes its arrows point to.
  BTA.withAdjacency = (g) => {
    const adj = Object.fromEntries(g.ids.map((id) => [id, []]));
    for (const e of g.edges) {
      adj[e.u].push({ to: e.v, w: e.w });
      if (!g.directed) adj[e.v].push({ to: e.u, w: e.w });
    }
    for (const id of g.ids) adj[id].sort((a, b) => a.to.localeCompare(b.to));
    return { ...g, adj };
  };

  BTA.edgeKey = (a, b) => (a < b ? a + b : b + a);

  /*
   * Build a graph view.
   *   state  – fn(id) → node state
   *   badge  – fn(id) → small label next to the node (e.g. a distance), or null
   *   badgeName – what the badge means, for screen readers (default "distance")
   *   edge   – fn(edge) → edge state
   *   lists  – [{ title, note, items: [ids] }] queues, stacks, visit orders
   *   table  – { head: [...], rows: [[...]] }
   */
  BTA.graphView = (g, o = {}) => ({
    kind: 'graph',
    width: g.width,
    height: g.height,
    directed: !!g.directed,
    badgeName: o.badgeName || 'distance',
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

  // ---------- real code for the Code panel ----------

  BTA.LANGS = [
    { id: 'python', label: 'Python', comment: '#' },
    { id: 'javascript', label: 'JS', comment: '//' },
    { id: 'java', label: 'Java', comment: '//' },
    { id: 'cpp', label: 'C++', comment: '//' },
    { id: 'c', label: 'C', comment: '//' },
  ];

  const impls = {};

  /*
   * Register an algorithm's code in each language. Every source line starts with
   * "N|": the pseudocode line(s) it matches, 1-based like the numbers on screen.
   * Use " |" for lines that match none, and "3,4|" for more than one.
   */
  BTA.impl = (id, langs) => {
    impls[id] = {};
    for (const [lang, src] of Object.entries(langs)) {
      impls[id][lang] = src
        .replace(/^\n+|\s+$/g, '')
        .split('\n')
        .map((line) => {
          const m = line.match(/^\s*([\d,]*)\|(.*)$/);
          if (!m) throw new Error(`${id}/${lang}: line without a tag: ${line}`);
          return { tags: m[1] ? m[1].split(',').map((t) => Number(t) - 1) : [], text: m[2] };
        });
    }
  };

  BTA.getImpl = (id) => impls[id] || null;
})();
