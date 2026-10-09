(function () {
  'use strict';
  const { register, randomGraph, graphView, edgeKey } = BTA;

  const INF = Infinity;
  const fmt = (d) => (d === INF ? '∞' : String(d));

  // Run Dijkstra quietly and report whether any "pick the smallest" step has a tie.
  function hasTies(g) {
    const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
    dist.A = 0;
    const done = new Set();
    while (done.size < g.ids.length) {
      const open = g.ids.filter((id) => !done.has(id) && dist[id] < INF);
      if (!open.length) return false;
      const best = Math.min(...open.map((id) => dist[id]));
      const at = open.filter((id) => dist[id] === best);
      if (at.length > 1) return true;
      const u = at[0];
      done.add(u);
      for (const { to, w } of g.adj[u]) if (!done.has(to)) dist[to] = Math.min(dist[to], dist[u] + w);
    }
    return false;
  }

  register({
    id: 'dijkstra',
    name: 'Dijkstra’s Algorithm',
    group: 'Graphs',
    blurb: 'Find the shortest distance from a start node to every other node.',
    complexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)', space: 'O(V)', stable: '—' },
    how: [
      'Give the start node distance 0 and every other node ∞. These are tentative distances.',
      'Pick the unvisited node with the smallest tentative distance. Its distance is now final.',
      'Relax its edges: for each unvisited neighbour, check whether going through this node is shorter than the neighbour’s current distance.',
      'Repeat until every node is final. Edge weights must not be negative.',
    ],
    code: [
      'dist[start] ← 0, others ← ∞',
      'while unvisited nodes remain',
      '  u ← closest unvisited node',
      '  mark u visited (final)',
      '  for each unvisited neighbour v',
      '    alt ← dist[u] + w(u, v)',
      '    dist[v] ← min(dist[v], alt)',
    ],
    legend: [
      ['current', 'Being processed'],
      ['queued', 'Tentative distance'],
      ['visited', 'Distance is final'],
      ['active-edge', 'Edge being relaxed'],
      ['tree', 'Shortest-path edge'],
    ],
    kinds: {
      pick: 'Finding the closest node',
      relax: 'Updating a distance',
    },
    summary:
      'Dijkstra always finalized the closest unfinished node next. Because weights are never negative, no later route could beat it. ' +
      'Relaxing that node’s edges then improved the tentative distances of its neighbours. ' +
      'With a priority queue this runs in O((V + E) log V). The green edges form the shortest-path tree: follow them back to A to get the actual route. ' +
      'This is the core of how maps and network routers find shortest paths.',

    graph: { weighted: true },
    // A tie for "closest node" would give a question two right answers.
    validate: (g) => (hasTies(g) ? 'Two nodes tie for closest at some point, so a question would have two right answers.' : null),

    generate() {
      let g;
      let tries = 0;
      do g = randomGraph({ extra: 2, weighted: true });
      while (hasTies(g) && ++tries < 200);
      return g;
    },

    build(g) {
      const start = 'A';
      const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
      const via = Object.fromEntries(g.ids.map((id) => [id, null]));
      dist[start] = 0;
      const done = new Set();
      const steps = [];
      let relaxations = 0;
      let updates = 0;

      const view = (cur, active) =>
        graphView(g, {
          state: (id) => (id === cur ? 'current' : done.has(id) ? 'visited' : dist[id] < INF ? 'queued' : 'idle'),
          badge: (id) => fmt(dist[id]),
          edge: (e) =>
            active && e.u + e.v === active
              ? 'active'
              : via[e.u] === e.v || via[e.v] === e.u
                ? 'tree'
                : 'idle',
          table: {
            head: ['Node', 'Dist', 'Via', 'Final'],
            rows: g.ids.map((id) => [id, fmt(dist[id]), via[id] || '—', done.has(id) ? '✓' : '']),
          },
        });

      while (done.size < g.ids.length) {
        let u = null;
        for (const id of g.ids) {
          if (!done.has(id) && dist[id] < INF && (u === null || dist[id] < dist[u])) u = id;
        }
        if (u === null) break;

        const snap = { ...dist };
        const fin = new Set(done);
        const firstPick = done.size === 0;
        const before = view(null);
        done.add(u);

        steps.push({
          line: 2,
          kind: 'pick',
          view: before,
          prompt: firstPick
            ? `Every distance starts at ∞, except the start node A, which is 0. Which node does Dijkstra finalize first?`
            : 'Which unvisited node has the <b>smallest</b> tentative distance?',
          ask: { type: 'pick', answer: [u] },
          hint: 'Look at the distance labels of the nodes that are not final yet (no ✓). Pick the smallest.',
          correct: firstPick
            ? `Right. A has distance 0, the smallest possible, so it is final.`
            : `Right. <b>${u}</b> has the smallest distance (${snap[u]}). Every other route would already cost more, so ${snap[u]} is final.`,
          wrong: ([k]) =>
            fin.has(k)
              ? `${k} is already final.`
              : `${k} has distance ${fmt(snap[k])}. There is an unvisited node with a smaller one.`,
          after: view(u),
        });

        for (const { to: v, w } of g.adj[u]) {
          if (done.has(v)) continue;
          relaxations++;
          const du = dist[u];
          const dv = dist[v];
          const c = du + w;
          const nd = Math.min(dv, c);

          const opts = [];
          const add = (x) => {
            if (x >= 0 && !opts.includes(x)) opts.push(x);
          };
          [nd, dv, c, w].forEach(add);
          for (let d = 1; opts.length < 3; d++) add(c + d);
          opts.sort((x, y) => x - y);

          const key = edgeKey(u, v);
          const before = view(u, key);
          if (c < dv) {
            dist[v] = c;
            via[v] = u;
            updates++;
          }

          steps.push({
            line: 5,
            kind: 'relax',
            view: before,
            prompt:
              `Relax edge <b>${u}–${v}</b> (weight ${w}). dist[${u}] = ${du} and dist[${v}] = ${fmt(dv)}. ` +
              `What is dist[${v}] now?`,
            ask: { type: 'choice', answer: String(nd), options: opts.map((x) => ({ label: fmt(x), value: String(x) })) },
            hint: `The route through ${u} costs dist[${u}] + ${w}. Keep whichever is smaller: that, or the current dist[${v}].`,
            correct:
              c < dv
                ? `Correct. ${du} + ${w} = ${c}, which beats ${fmt(dv)}, so dist[${v}] becomes ${c} (reached via ${u}).`
                : `Correct. ${du} + ${w} = ${c} is not shorter than ${dv}, so dist[${v}] stays ${dv}.`,
            wrong: (given) => {
              if (given === String(w) && w !== nd) {
                return `That is just the edge weight. The route to ${v} through ${u} costs dist[${u}] + ${w}.`;
              }
              if (c < dv) return `Going through ${u} costs ${du} + ${w}. Is that shorter than ${fmt(dv)}?`;
              return `Going through ${u} costs ${du} + ${w} = ${c}. Is that really shorter than the current ${dv}?`;
            },
            after: view(u, key),
          });
        }
      }

      return {
        steps,
        final: view(null),
        stats: [
          ['Relaxations', relaxations],
          ['Distance updates', updates],
          ['Shortest distances', g.ids.filter((id) => id !== start).map((id) => `${id} ${fmt(dist[id])}`).join(' · ')],
        ],
      };
    },
  });
})();
