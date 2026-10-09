(function () {
  'use strict';
  const { register, randomGraph, makeGraph, graphView, randInt, shuffle, list, plural } = BTA;

  const INF = Infinity;
  const fmt = (d) => (d === INF ? '∞' : String(d));
  const plus = (w) => (w < 0 ? `(${w})` : String(w));
  // Edges are relaxed in alphabetical order of "from, to".
  const relaxOrder = (g) => g.edges.slice().sort((a, b) => (a.u + a.v).localeCompare(b.u + b.v));

  // Bellman-Ford itself: the distances, and how many passes changed something.
  function bellmanFord(g, passes = g.ids.length - 1) {
    const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
    dist.A = 0;
    let changedIn = 0;
    for (let p = 1; p <= passes; p++) {
      let changed = false;
      for (const e of relaxOrder(g)) {
        if (dist[e.u] !== INF && dist[e.u] + e.w < dist[e.v]) {
          dist[e.v] = dist[e.u] + e.w;
          changed = true;
        }
      }
      if (!changed) break;
      changedIn = p;
    }
    return { dist, changedIn };
  }

  // What Dijkstra would answer on the same graph: it finalises the closest node and never looks back.
  function dijkstraGuess(g) {
    const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
    dist.A = 0;
    const done = new Set();
    for (;;) {
      let u = null;
      for (const id of g.ids) if (!done.has(id) && dist[id] < INF && (u === null || dist[id] < dist[u])) u = id;
      if (u === null) return dist;
      done.add(u);
      for (const { to, w } of g.adj[u]) if (!done.has(to)) dist[to] = Math.min(dist[to], dist[u] + w);
    }
  }

  register({
    id: 'bellman',
    name: 'Bellman-Ford',
    group: 'Graphs',
    blurb: 'Shortest paths that still come out right when some edges have negative weights.',
    complexity: { best: 'O(E)', average: 'O(V·E)', worst: 'O(V·E)', space: 'O(V)', stable: '—' },
    graph: { weighted: true, directed: true, negative: true },
    validate(g) {
      // One extra pass that still finds a shorter path means a negative cycle.
      return bellmanFord(g, g.ids.length).changedIn === g.ids.length
        ? 'This graph has a negative cycle: going round it keeps making paths shorter, so there is no shortest path.'
        : null;
    },
    how: [
      'Dijkstra treats the closest node as finished and never looks at it again. A negative edge found later can break that. Bellman-Ford makes no such assumption.',
      'Start with distance 0 for A and ∞ for every other node. Then go through every edge in a fixed order (A → Z here) and relax it: if dist[u] + w is smaller than dist[v], that is the new dist[v].',
      'One pass is not always enough, so repeat. A shortest path uses at most V − 1 edges, so V − 1 passes are always enough.',
      'If a whole pass changes nothing, every distance is final and you can stop early.',
    ],
    code: [
      'dist[start] ← 0, others ← ∞',
      'repeat V − 1 times',
      '  changed ← false',
      '  for each edge u → v (A → Z)',
      '    if dist[u] + w(u, v) < dist[v]',
      '      dist[v] ← dist[u] + w(u, v); changed ← true',
      '  if not changed: stop',
    ],
    legend: [
      ['current', 'Start of the edge being relaxed'],
      ['queued', 'Reached'],
      ['active-edge', 'Edge being relaxed'],
      ['tree', 'Shortest-path edge'],
    ],
    kinds: {
      relax: 'Relaxing an edge',
      stop: 'When to stop',
    },
    summary:
      'Bellman-Ford relaxed every edge, pass after pass, until a pass changed nothing. Because it never treats a distance as final early, negative edges can’t fool it. ' +
      'It is slower than Dijkstra, O(V·E) instead of O((V + E) log V), so it is used when negative weights are possible: currency exchange, or costs that can be refunds. ' +
      'One more pass after V − 1 tells you if there is a negative cycle: if anything still gets shorter, the shortest path isn’t defined.',

    generate() {
      let pick = null;
      for (let tries = 0; tries < 300; tries++) {
        const base = randomGraph({ extra: 1 });
        // Arrows follow a breadth-first order from A (neighbours shuffled), so every node can be reached.
        const rank = { A: 0 };
        const queue = ['A'];
        let r = 1;
        while (queue.length) {
          const x = queue.shift();
          for (const { to } of shuffle(base.adj[x].slice())) {
            if (!(to in rank)) {
              rank[to] = r++;
              queue.push(to);
            }
          }
        }
        const weight = () => {
          const w = randInt(-4, 8);
          return w === 0 ? 1 : w;
        };
        const edges = base.edges.map((e) => (rank[e.u] < rank[e.v] ? { u: e.u, v: e.v, w: weight() } : { u: e.v, v: e.u, w: weight() }));
        if (edges.filter((e) => e.w < 0).length < 2) continue;
        const g = makeGraph(edges, { directed: true });
        const { dist, changedIn } = bellmanFord(g);
        const guess = dijkstraGuess(g);
        const fooled = g.ids.some((id) => guess[id] !== dist[id]);
        pick = g;
        // Prefer graphs that need a second pass and where Dijkstra would get something wrong.
        if (changedIn >= 2 && fooled) break;
      }
      return pick;
    },

    build(g) {
      const order = relaxOrder(g);
      const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
      const via = Object.fromEntries(g.ids.map((id) => [id, null]));
      dist.A = 0;
      const steps = [];
      const V = g.ids.length;
      let passes = 0;
      let relaxations = 0;
      let updates = 0;

      const view = (cur, active) =>
        graphView(g, {
          state: (id) => (cur && id === cur ? 'current' : dist[id] < INF ? 'queued' : 'idle'),
          badge: (id) => fmt(dist[id]),
          edge: (e) => (active && e === active ? 'active' : via[e.v] === e.u ? 'tree' : 'idle'),
          table: {
            head: ['Node', 'Dist', 'Via'],
            rows: g.ids.map((id) => [id, fmt(dist[id]), via[id] || '—']),
          },
        });

      for (let pass = 1; pass <= V - 1; pass++) {
        passes = pass;
        let changed = false;
        let firstInPass = true;
        let skipped = [];
        for (const e of order) {
          if (dist[e.u] === INF) {
            skipped.push(`${e.u} → ${e.v}`);
            continue;
          }
          relaxations++;
          const du = dist[e.u];
          const dv = dist[e.v];
          const alt = du + e.w;
          const nd = Math.min(dv, alt);
          const opts = [];
          const add = (x) => x !== undefined && !opts.includes(x) && opts.push(x);
          [nd, dv, alt, e.w].forEach(add);
          for (let d = 1; opts.length < 3; d++) add(alt + d);
          opts.sort((x, y) => x - y);

          const note = skipped.length
            ? ` (${list(skipped)} ${plural(skipped.length, 'was', 'were')} skipped: ${plural(skipped.length, 'its start is', 'their starts are')} still at ∞.)`
            : '';
          const intro = pass === 1 && firstInPass ? 'Pass 1 goes through every edge in A → Z order. ' : firstInPass ? `Pass ${pass} starts again from the first edge. ` : '';
          const before = view(e.u, e);
          if (alt < dv) {
            dist[e.v] = alt;
            via[e.v] = e.u;
            changed = true;
            updates++;
          }

          steps.push({
            line: 4,
            kind: 'relax',
            view: before,
            prompt:
              `${intro}Edge <b>${e.u} → ${e.v}</b> (weight ${e.w}): dist[${e.u}] = ${du} and dist[${e.v}] = ${fmt(dv)}. ` +
              `What is dist[${e.v}] now?${note}`,
            ask: { type: 'choice', answer: String(nd), options: opts.map((x) => ({ label: fmt(x), value: String(x) })) },
            hint: `Going through ${e.u} costs dist[${e.u}] + w = ${du} + ${plus(e.w)}. Keep whichever is smaller: that, or the current dist[${e.v}].`,
            correct:
              alt < dv
                ? `Correct. ${du} + ${plus(e.w)} = ${alt}, which beats ${fmt(dv)}, so dist[${e.v}] becomes ${alt}.`
                : `Correct. ${du} + ${plus(e.w)} = ${alt} isn’t smaller than ${dv}, so dist[${e.v}] stays ${dv}.`,
            wrong: (given) => {
              if (given === String(e.w) && e.w !== nd) return `That is just the edge weight. The route through ${e.u} costs dist[${e.u}] + ${plus(e.w)}.`;
              if (alt < dv) return `Going through ${e.u} costs ${du} + ${plus(e.w)} = ${alt}. Is that smaller than ${fmt(dv)}?`;
              return `Going through ${e.u} costs ${du} + ${plus(e.w)} = ${alt}. Is that really smaller than ${dv}?`;
            },
            after: view(e.u, e),
          });
          firstInPass = false;
          skipped = [];
        }

        if (!changed) {
          steps.push({
            line: 6,
            kind: 'stop',
            view: view(null),
            prompt: `Pass ${pass} changed nothing. What now?`,
            ask: {
              type: 'choice',
              answer: 'stop',
              options: [
                { label: 'Stop: every distance is final', value: 'stop' },
                { label: 'Do another pass to be sure', value: 'more' },
              ],
            },
            hint: 'If no edge improved anything in this pass, could the next pass see anything different?',
            correct:
              'Exactly. The next pass would start from exactly the same distances, so nothing could change. ' +
              (pass < V - 1 ? `Stopping now saves ${V - 1 - pass} ${plural(V - 1 - pass, 'pass', 'passes')}.` : ''),
            wrong: 'A pass that changes nothing leaves the distances exactly as they were, so another pass would just repeat it.',
            after: view(null),
          });
          break;
        }
      }

      const guess = dijkstraGuess(g);
      const fooled = g.ids.filter((id) => guess[id] !== dist[id]);
      return {
        steps,
        final: view(null),
        stats: [
          ['Passes', passes],
          ['Relaxations', relaxations],
          ['Distance updates', updates],
          ['Shortest distances', g.ids.filter((id) => id !== 'A').map((id) => `${id} ${fmt(dist[id])}`).join(' · ')],
          [
            'Dijkstra would say',
            fooled.length ? fooled.map((id) => `${id} ${fmt(guess[id])} (really ${fmt(dist[id])})`).join(' · ') : 'the same, this time',
          ],
        ],
      };
    },
  });
})();
