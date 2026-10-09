/*
 * Core: the algorithm registry plus helpers shared by every algorithm module.
 *
 * An algorithm module calls BTA.register({...}) with:
 *   id, name, group, blurb, complexity, how[], code[], legend[], summary
 *   kinds    – { kind: 'Readable name' } for the kinds of question it asks (see `kind` below)
 *   input    – array exercises: { label, options[], default } for the size picker, plus
 *              rules for typed-in arrays (see inputRules): length, range, distinct,
 *              sorted (sort what was typed), target (a search: the input is { values, target }),
 *              or text: true for a text search (the input is { text, pattern })
 *   graph    – graph exercises instead of input: { weighted?, directed?, negative? }
 *   validate(input) → optional extra check for a graph from a link or the editor; an error or null
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
 *   kind     – which kind of question this is (a key of the algorithm's `kinds`); every
 *              question has one. Fast-forward and drills group questions by it, so it
 *              must not depend on the answer.
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

  // A repeatable random number generator from any text (mulberry32 over a string hash),
  // so that, for example, everyone gets the same daily challenge.
  BTA.seeded = (text) => {
    let h = 1779033703 ^ String(text).length;
    for (const ch of String(text)) {
      h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Run fn with Math.random replaced by rng, so everything it generates is repeatable.
  BTA.withRandom = (rng, fn) => {
    const saved = Math.random;
    Math.random = rng;
    try {
      return fn();
    } finally {
      Math.random = saved;
    }
  };

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
  //   rangeWhy – optional reason the range is narrower than usual, shown with the rules
  BTA.inputRules = (algo) => {
    const i = algo.input || {};
    return {
      length: i.length || (i.target ? [2, 25] : [2, 12]),
      range: i.range || [-99, 99],
      why: i.rangeWhy || '',
      distinct: i.distinct !== false,
      sorted: !!i.sorted,
      target: !!i.target,
      text: !!i.text,
      textLength: i.textLength || [4, 20],
      patternLength: i.patternLength || [2, 6],
    };
  };

  // Letters only, made upper case: "ab ab" → "ABAB". Returns { value } or { error }.
  const letters = (raw, name, [min, max]) => {
    const t = String(raw || '').replace(/\s+/g, '').toUpperCase();
    if (!t) return { error: `Type the ${name}.` };
    if (!/^[A-Z]+$/.test(t)) return { error: `The ${name} can only use the letters A to Z.` };
    if (t.length < min || t.length > max) return { error: `The ${name} needs ${min} to ${max} letters.` };
    return { value: t };
  };

  // "-3", "−3" (a real minus sign, from copy and paste) or "12" → a number; anything else → null.
  const wholeNumber = (text) => {
    const t = String(text).trim().replace(/^[−–]/, '-');
    return /^-?\d+$/.test(t) ? Number(t) || 0 : null; // "|| 0" turns -0 into 0
  };

  // "8, -3 5" → { values: [8, -3, 5] }, or { error }.
  BTA.parseNumbers = (text) => {
    const parts = String(text).trim().split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return { error: 'Type some numbers, for example 8 3 5 1.' };
    const bad = parts.find((p) => wholeNumber(p) == null);
    if (bad) return { error: `“${bad}” isn’t a whole number.` };
    return { values: parts.map(wholeNumber) };
  };

  // An error message, or null if the values follow the rules.
  BTA.checkValues = (values, { length: [min, max], range: [lo, hi], why, distinct }) => {
    if (values.length < min) return `Use at least ${min} numbers.`;
    if (values.length > max) return `Use at most ${max} numbers.`;
    const out = values.find((v) => v < lo || v > hi);
    if (out != null) return `${out} is out of range. Use numbers from ${lo} to ${hi}.${why ? ' ' + why : ''}`;
    if (distinct) {
      const seen = new Set();
      for (const v of values) {
        if (seen.has(v)) return `${v} appears twice. Use different numbers, so every question has one right answer.`;
        seen.add(v);
      }
    }
    return null;
  };

  // An exercise's input as link parameters: a=8,3,5 · t=5 (search target) · e=AB3,AC5 (graph edges)
  // · s=ABABC&p=ABC (text search).
  BTA.toParams = (algo, input) => {
    if (algo.graph) return { e: input.edges.map((e) => e.u + e.v + (e.w == null ? '' : e.w)).join(',') };
    if (BTA.inputRules(algo).text) return { s: input.text, p: input.pattern };
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
    if (rules.text) {
      const text = letters(params.get('s'), 'text', rules.textLength);
      if (text.error) return text;
      const pattern = letters(params.get('p'), 'pattern', rules.patternLength);
      if (pattern.error) return pattern;
      if (pattern.value.length > text.value.length) return { error: 'The pattern can’t be longer than the text.' };
      return { input: { text: text.value, pattern: pattern.value } };
    }
    const r = BTA.parseNumbers(params.get('a') || '');
    if (r.error) return r;
    const err = BTA.checkValues(r.values, rules);
    if (err) return { error: err };
    const values = rules.sorted ? r.values.slice().sort((x, y) => x - y) : r.values;
    if (!rules.target) return { input: values };
    const t = wholeNumber(params.get('t') || '');
    if (t == null || t < rules.range[0] || t > rules.range[1]) {
      return { error: `The target has to be a whole number from ${rules.range[0]} to ${rules.range[1]}.` };
    }
    return { input: { values, target: t } };
  };

  // ---------- describing answers ----------

  // What a question's right answer is, in words ("8 and 3", "position 4", "Swap").
  BTA.answerLabel = (st) => {
    const a = st.ask;
    if (a.type === 'choice') return a.options.find((o) => o.value === a.answer).label;
    if (!a.answer.length) return 'none of them';
    const v = st.view;
    if (v.kind === 'graph') return BTA.list(a.answer);
    if (a.position) return BTA.list(a.answer.map((k) => `position ${k}`));
    const valueOf = (k) => {
      for (const r of v.rows) for (const c of r.cells) if (c && !c.ghost && c.key === k) return c.value;
      for (const col of (v.buckets && v.buckets.cols) || []) if (col.key === k) return `bucket ${col.title}`;
      return k;
    };
    if (a.answer.length === 1 && /^\d+$/.test(a.answer[0])) return `${valueOf(a.answer[0])} (position ${a.answer[0]})`;
    return BTA.list(a.answer.map(valueOf));
  };

  // ---------- drills and quizzes ----------

  // Up to `count` questions of one kind, taken from fresh random exercises (at most two from
  // each, so no single array dominates). Each question keeps its own view, so it stands alone.
  BTA.drillSteps = (algo, kind, count = 10) => {
    const out = [];
    const sizes = algo.input ? algo.input.options : [null];
    for (let tries = 0; tries < 300 && out.length < count; tries++) {
      const run = algo.build(algo.generate(sizes[BTA.randInt(0, sizes.length - 1)]));
      const pool = BTA.shuffle(run.steps.filter((s) => s.kind === kind));
      out.push(...pool.slice(0, Math.min(2, count - out.length)));
    }
    return out;
  };

  const quizzes = {};

  /*
   * Concept questions for an algorithm's Quiz mode:
   *   [{ q: 'HTML question', options: ['A', 'B', …], answer: index of the right option, why: 'HTML explanation' }]
   */
  BTA.quiz = (id, questions) => {
    quizzes[id] = questions;
  };
  BTA.getQuiz = (id) => quizzes[id] || [];

  // Quiz questions as steps for the question engine, with the options in a fresh order.
  BTA.quizSteps = (id) =>
    BTA.getQuiz(id).map((item, n) => ({
      kind: 'quiz',
      line: null,
      view: null,
      prompt: item.q,
      ask: {
        type: 'choice',
        answer: String(item.answer),
        options: BTA.shuffle(item.options.map((label, i) => ({ label, value: String(i) }))),
      },
      correct: `Right. ${item.why}`,
      wrong: 'Not quite.',
      hint: null,
      n,
    }));

  // ---------- text ----------

  // ['3', '5', '8'] → "3, 5 and 8"
  BTA.list = (xs) => {
    xs = xs.map(String);
    if (xs.length <= 1) return xs.join('');
    return xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  };

  BTA.plural = (n, one, many) => (n === 1 ? one : many);

  // ---------- array views ----------

  // Bar heights, as a percentage from `floor` to 100. With nothing negative a bar is
  // proportional to its value; otherwise bars are measured up from the smallest value,
  // so negative numbers still get bars that put them in order.
  BTA.barHeight = (min, max, floor = 8) => {
    const lo = Math.min(0, min);
    const span = max - lo;
    return (v) => (span > 0 ? Math.min(100, Math.max(floor, Math.round(((v - lo) / span) * 100))) : floor);
  };

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
  BTA.LAYOUT = LAYOUT;

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
  // With negative: true, weights may be negative too ("AB-3"); 0 is never a weight.
  BTA.decodeGraph = (text, { weighted = false, directed = false, negative = false } = {}) => {
    const tokens = String(text).split(',').map((t) => t.trim()).filter(Boolean);
    if (!tokens.length) return { error: 'The link has no edges in it.' };
    const shape = !weighted ? /^([A-G])([A-G])$/ : negative ? /^([A-G])([A-G])(-?[1-9])$/ : /^([A-G])([A-G])([1-9])$/;
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

  // The straight-line length of a layout edge, in layout units.
  BTA.edgeLength = (u, v) => Math.hypot(LAYOUT.nodes[u][0] - LAYOUT.nodes[v][0], LAYOUT.nodes[u][1] - LAYOUT.nodes[v][1]);

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
   *   note   – fn(id) → a second, smaller label beside the node (A*'s estimates), or null
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
      note: o.note ? o.note(id) : null,
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
