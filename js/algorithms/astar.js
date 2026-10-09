(function () {
  'use strict';
  const { register, randomGraph, makeGraph, graphView, randInt, edgeLength, list } = BTA;

  const INF = Infinity;
  const fmt = (d) => (d === INF ? '∞' : String(d));
  const GOAL = 'G';
  const UNIT = 50; // layout distance per unit of weight

  // The estimate h is the straight-line distance to G, rounded down. Every edge weighs at least
  // its own straight-line length (rounded up), so h never overestimates and never misleads.
  const h = (id) => Math.floor(edgeLength(id, GOAL) / UNIT);
  const minWeight = (u, v) => Math.ceil(edgeLength(u, v) / UNIT);

  // Runs A* from A to G. Returns the order nodes were expanded in, the final g values, and
  // whether the smallest f was ever tied (which would make a question ambiguous).
  function search(g) {
    const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
    const via = Object.fromEntries(g.ids.map((id) => [id, null]));
    dist.A = 0;
    const open = new Set(['A']);
    const closed = new Set();
    const expanded = [];
    let tie = false;
    while (open.size) {
      const fs = [...open].map((id) => [id, dist[id] + h(id)]).sort((a, b) => a[1] - b[1]);
      if (fs.length > 1 && fs[0][1] === fs[1][1]) tie = true;
      const u = fs[0][0];
      expanded.push(u);
      if (u === GOAL) break;
      open.delete(u);
      closed.add(u);
      for (const { to, w } of g.adj[u]) {
        if (closed.has(to)) continue;
        if (dist[u] + w < dist[to]) {
          dist[to] = dist[u] + w;
          via[to] = u;
          open.add(to);
        }
      }
    }
    return { expanded, dist, via, tie };
  }

  // How many nodes Dijkstra would expand before it reaches G.
  function dijkstraCount(g) {
    const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
    dist.A = 0;
    const done = new Set();
    for (;;) {
      let u = null;
      for (const id of g.ids) if (!done.has(id) && dist[id] < INF && (u === null || dist[id] < dist[u])) u = id;
      if (u === null) return done.size;
      done.add(u);
      if (u === GOAL) return done.size;
      for (const { to, w } of g.adj[u]) if (!done.has(to)) dist[to] = Math.min(dist[to], dist[u] + w);
    }
  }

  // Every simple path from A to G, cheapest first, as [cost, 'A → B → G'].
  function allPaths(g) {
    const out = [];
    const walk = (x, seen, cost, path) => {
      if (x === GOAL) return out.push([cost, path.join(' → ')]);
      for (const { to, w } of g.adj[x]) if (!seen.has(to)) walk(to, new Set([...seen, to]), cost + w, [...path, to]);
    };
    walk('A', new Set(['A']), 0, ['A']);
    return out.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
  }

  register({
    id: 'astar',
    name: 'A* Search',
    group: 'Graphs',
    blurb: 'Find the shortest path to one goal, using a distance estimate to search in the right direction first.',
    complexity: { best: 'O(path)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)', space: 'O(V)', stable: '—' },
    graph: { weighted: true, weightFor: (u, v) => minWeight(u, v) + 1 },
    validate(g) {
      const short = g.edges.find((e) => e.w < minWeight(e.u, e.v));
      if (short) {
        return `${short.u}–${short.v} needs a weight of at least ${minWeight(short.u, short.v)}, its straight-line length. Otherwise the estimates could be too big, and A* could miss the shortest path.`;
      }
      return search(g).tie ? 'Two open nodes tie for the smallest f at some point, so a question would have two right answers. Change a weight.' : null;
    },
    how: [
      'A* finds the shortest path from A to one goal, G. It works like Dijkstra, with one addition: a guess of how far each node still is from G.',
      'Here the guess h is the straight-line distance to G (written next to each node). An edge is never shorter than a straight line, so h never overestimates.',
      'g is the shortest distance from A found so far (the badge). A* always expands the open node with the smallest f = g + h: the route that looks shortest overall, not just the node closest to A.',
      'As soon as G has the smallest f, its g is final and A* stops, without expanding the nodes that only lead away from G.',
    ],
    code: [
      'g[start] ← 0; open ← {start}',
      'while open is not empty',
      '  u ← node in open with the smallest g[u] + h[u]',
      '  if u is the goal: stop',
      '  move u from open to closed',
      '  for each neighbour v of u not in closed',
      '    if g[u] + w(u, v) < g[v]',
      '      g[v] ← g[u] + w(u, v); add v to open',
    ],
    legend: [
      ['current', 'Being expanded'],
      ['queued', 'Open: found, not expanded yet'],
      ['visited', 'Closed: expanded'],
      ['active-edge', 'Edge being checked'],
      ['tree', 'Best way found to a node'],
    ],
    kinds: {
      pick: 'Which node to expand',
      relax: 'Updating g',
      path: 'Reading off the path',
    },
    summary:
      'A* expanded the open node with the smallest f = g + h each time, so it went towards G first and stopped once G itself had the smallest f. ' +
      'With an estimate that never overestimates, the path it finds is a shortest one; with h = 0 everywhere it is exactly Dijkstra. ' +
      'The better the estimate, the fewer nodes it expands. That is why maps, games and robots use it for pathfinding.',

    generate() {
      let pick = null;
      for (let tries = 0; tries < 300; tries++) {
        const base = randomGraph({ extra: 3 });
        const edges = base.edges.map((e) => ({ u: e.u, v: e.v, w: minWeight(e.u, e.v) + randInt(0, 3) }));
        const g = makeGraph(edges);
        const s = search(g);
        if (s.tie) continue;
        pick = g;
        // Prefer graphs where A* saves work compared with Dijkstra.
        if (s.expanded.length < dijkstraCount(g)) break;
      }
      return pick;
    },

    build(g) {
      const dist = Object.fromEntries(g.ids.map((id) => [id, INF]));
      const via = Object.fromEntries(g.ids.map((id) => [id, null]));
      dist.A = 0;
      const open = ['A'];
      const closed = new Set();
      const steps = [];
      let expanded = 0;

      const f = (id) => dist[id] + h(id);
      const view = (cur, active) =>
        graphView(g, {
          state: (id) => (id === cur ? 'current' : closed.has(id) ? 'visited' : open.includes(id) ? 'queued' : 'idle'),
          badge: (id) => fmt(dist[id]),
          badgeName: 'g',
          note: (id) => `h ${h(id)}`,
          edge: (e) => (active && e === active ? 'active' : via[e.v] === e.u || via[e.u] === e.v ? 'tree' : 'idle'),
          table: {
            head: ['Node', 'g', 'h', 'f', 'Via'],
            rows: g.ids.map((id) => [id, fmt(dist[id]), String(h(id)), fmt(f(id)), via[id] || '—']),
          },
        });

      for (;;) {
        const fs = open.map((id) => [id, f(id)]).sort((a, b) => a[1] - b[1]);
        const u = fs[0][0];
        const snapG = { ...dist };
        const wasOpen = open.slice();
        const wasClosed = new Set(closed);
        const first = expanded === 0;
        const before = view(null);
        expanded++;
        const isGoal = u === GOAL;
        if (!isGoal) {
          open.splice(open.indexOf(u), 1);
          closed.add(u);
        }

        steps.push({
          line: 2,
          kind: 'pick',
          view: before,
          prompt: first
            ? `Each node shows g, the distance from A so far (the badge), and h, its straight-line estimate to G. ` +
              `A starts with g = 0, so f = 0 + ${h('A')}. Which node does A* expand first?`
            : 'Which open node has the smallest f = g + h?',
          ask: { type: 'pick', answer: [u] },
          hint: 'Only open nodes (orange) can be expanded. For each one add g (the badge) and h, and take the smallest.',
          correct: isGoal
            ? `Right. G has the smallest f (${snapG.G} + 0 = ${snapG.G}). G is the goal, so its distance ${snapG.G} is final and A* stops here.`
            : `Right. ${u} has f = ${snapG[u]} + ${h(u)} = ${snapG[u] + h(u)}, the smallest of the open nodes${wasOpen.length > 1 ? ` (${list(wasOpen.filter((x) => x !== u))} ${wasOpen.length > 2 ? 'are' : 'is'} also open)` : ''}.`,
          wrong: ([k]) => {
            if (wasClosed.has(k)) return `${k} has already been expanded.`;
            if (!wasOpen.includes(k)) return `${k} hasn’t been reached yet, so it isn’t open.`;
            return `${k} has f = ${snapG[k]} + ${h(k)} = ${snapG[k] + h(k)}. Another open node has a smaller f.`;
          },
          after: view(u),
        });
        if (isGoal) break;

        for (const { to: v, w } of g.adj[u]) {
          if (closed.has(v)) continue;
          const e = g.edges.find((x) => (x.u === u && x.v === v) || (x.u === v && x.v === u));
          const gu = dist[u];
          const gv = dist[v];
          const alt = gu + w;
          const nd = Math.min(gv, alt);
          const opts = [];
          const add = (x) => x >= 0 && !opts.includes(x) && opts.push(x);
          [nd, gv, alt, w].forEach(add);
          for (let d = 1; opts.length < 3; d++) add(alt + d);
          opts.sort((x, y) => x - y);
          const before2 = view(u, e);
          if (alt < gv) {
            dist[v] = alt;
            via[v] = u;
            if (!open.includes(v)) open.push(v);
          }

          steps.push({
            line: 6,
            kind: 'relax',
            view: before2,
            prompt: `Check the edge ${u}–${v} (weight ${w}). g[${u}] = ${gu} and g[${v}] = ${fmt(gv)}. What is g[${v}] now?`,
            ask: { type: 'choice', answer: String(nd), options: opts.map((x) => ({ label: fmt(x), value: String(x) })) },
            hint: `Going through ${u} costs g[${u}] + ${w}. Keep whichever is smaller: that, or the current g[${v}].`,
            correct:
              alt < gv
                ? `Correct. ${gu} + ${w} = ${alt}, which beats ${fmt(gv)}, so g[${v}] becomes ${alt} and ${v} is open.`
                : `Correct. ${gu} + ${w} = ${alt} isn’t smaller than ${gv}, so g[${v}] stays ${gv}.`,
            wrong: (given) => {
              if (given === String(w) && w !== nd) return `That is just the edge weight. The route through ${u} costs g[${u}] + ${w}.`;
              return alt < gv
                ? `Going through ${u} costs ${gu} + ${w} = ${alt}. Is that smaller than ${fmt(gv)}?`
                : `Going through ${u} costs ${gu} + ${w} = ${alt}. Is that really smaller than ${gv}?`;
            },
            after: view(u, e),
          });
        }
      }

      // Read the path off the Via column.
      const path = [];
      for (let x = GOAL; x; x = via[x]) path.unshift(x);
      const route = path.join(' → ');
      const others = allPaths(g)
        .map((p) => p[1])
        .filter((p) => p !== route)
        .slice(0, 2);
      steps.push({
        line: 3,
        kind: 'path',
        view: view(GOAL),
        prompt: 'Follow the Via column back from G to A. Which path did A* find?',
        ask: {
          type: 'choice',
          answer: route,
          options: [route, ...others].sort().map((p) => ({ label: p, value: p })),
        },
        hint: 'G’s Via entry says which node G was reached from. Then look up that node’s Via, and so on back to A.',
        correct: `Right: ${route}, with a total length of ${dist.G}.`,
        wrong: `Start at G and follow Via: G came from ${via.G}. Keep going back to A.`,
        after: view(null),
      });

      return {
        steps,
        final: view(null),
        stats: [
          ['Shortest path', `${route} (${dist.G})`],
          ['Nodes A* expanded', expanded],
          ['Dijkstra would expand', dijkstraCount(g)],
        ],
      };
    },
  });
})();
