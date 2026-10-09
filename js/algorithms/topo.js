(function () {
  'use strict';
  const { register, randomDag, graphView, list, plural } = BTA;

  register({
    id: 'topo',
    name: 'Topological Sort',
    group: 'Graphs',
    blurb: 'Put the nodes of a graph in order, so that every arrow points forward.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', stable: '—' },
    graph: { directed: true },
    validate: (g) => (BTA.topoOrder(g).length < g.ids.length ? 'The arrows go round in a circle, so there is no valid order.' : null),
    how: [
      'The graph has arrows and no cycles. Think of tasks: an arrow A → B means A has to happen before B.',
      'A node’s in-degree is how many arrows point into it. A node with in-degree 0 has nothing left to wait for, so it is ready.',
      'Take a ready node (here, the first alphabetically), add it to the order, and remove its outgoing arrows.',
      'Removing arrows lowers in-degrees. Any node that drops to 0 becomes ready. Repeat until every node is placed. This is Kahn’s algorithm.',
    ],
    code: [
      'indeg[v] ← number of arrows into v',
      'ready ← nodes with indeg 0',
      'while ready is not empty',
      '  u ← first node in ready (A → Z)',
      '  remove u from ready; output u',
      '  for each arrow u → v',
      '    indeg[v] ← indeg[v] − 1',
      '    if indeg[v] = 0: add v to ready',
    ],
    legend: [
      ['current', 'Being placed'],
      ['queued', 'Ready: in-degree 0'],
      ['visited', 'Placed in the order'],
      ['gone-edge', 'Arrow removed'],
    ],
    kinds: {
      pick: 'Which node goes next',
      ready: 'Which nodes become ready',
    },
    summary:
      'Kahn’s algorithm only ever placed a node once everything pointing into it was already placed, so every arrow points forward in the final order. ' +
      'Each node and each arrow was handled once: O(V + E). ' +
      'If the arrows formed a cycle, the nodes on it would never reach in-degree 0, and the algorithm would stop early. That is how it detects cycles. ' +
      'Build tools, spreadsheets and course planners use it to work out what has to happen first.',

    generate: () => randomDag({ extra: 3 }),

    build(g) {
      const indeg = Object.fromEntries(g.ids.map((id) => [id, 0]));
      for (const e of g.edges) indeg[e.v]++;
      const ready = g.ids.filter((id) => indeg[id] === 0);
      const placed = new Set();
      const order = [];
      const gone = new Set();
      const steps = [];

      const view = (cur, active = []) =>
        graphView(g, {
          state: (id) => (id === cur ? 'current' : placed.has(id) ? 'visited' : ready.includes(id) ? 'queued' : 'idle'),
          badge: (id) => (placed.has(id) ? null : String(indeg[id])),
          badgeName: 'in-degree',
          edge: (e) => (active.includes(e.u + e.v) ? 'active' : gone.has(e.u + e.v) ? 'gone' : 'idle'),
          lists: [
            { title: 'Ready', note: 'A → Z', items: ready },
            { title: 'Order', items: order },
          ],
        });

      steps.push({
        line: 1,
        view: view(null),
        prompt:
          'Each badge is a node’s <b>in-degree</b>: how many arrows point into it. ' +
          `Nodes with in-degree 0 are ready to go first: here ${list(ready)}.`,
        ask: { type: 'info' },
      });

      while (ready.length) {
        ready.sort();
        const u = ready[0];
        const readyNow = ready.slice();
        const deg = { ...indeg };
        const isPlaced = new Set(placed);
        const first = order.length === 0;
        const before = view(null);
        ready.shift();
        placed.add(u);
        order.push(u);
        const targets = g.adj[u].map((x) => x.to);

        steps.push({
          line: 3,
          kind: 'pick',
          view: before,
          prompt: first ? 'Which node goes first in the order?' : 'Which node goes next in the order?',
          ask: { type: 'pick', answer: [u] },
          hint: 'Only nodes with in-degree 0 are ready. If several are, take the first alphabetically.',
          correct:
            (readyNow.length > 1
              ? `Right. ${list(readyNow)} are ready, and <b>${u}</b> comes first alphabetically.`
              : `Right. <b>${u}</b> is the only node with in-degree 0.`) +
            (targets.length ? '' : ` ${u} has no outgoing arrows, so nothing else changes.`),
          wrong: ([k]) => {
            if (isPlaced.has(k)) return `${k} is already in the order.`;
            if (deg[k] > 0) {
              return `${k} still has ${deg[k]} ${plural(deg[k], 'arrow', 'arrows')} pointing in, so something has to come before it.`;
            }
            return `${k} is ready too, but ${u} comes first alphabetically.`;
          },
          after: view(u),
        });

        if (!targets.length) continue;

        const keys = targets.map((v) => u + v);
        const before2 = view(u, keys);
        const freed = targets.filter((v) => indeg[v] === 1);
        const stillWaiting = Object.fromEntries(
          targets.map((v) => [v, g.edges.filter((e) => e.v === v && e.u !== u && !placed.has(e.u)).map((e) => e.u)]),
        );
        for (const v of targets) indeg[v]--;
        keys.forEach((k) => gone.add(k));
        ready.push(...freed);
        ready.sort();

        steps.push({
          line: 7,
          kind: 'ready',
          view: before2,
          prompt:
            `Remove ${u}’s ${plural(targets.length, 'arrow', 'arrows')} to ${list(targets)}. ` +
            'Which nodes become ready? Select them all, or none, then press Check.',
          ask: { type: 'multi', answer: freed },
          hint: 'A node becomes ready when its last incoming arrow is removed, so its in-degree drops to 0.',
          correct: freed.length
            ? `Right. ${list(freed)} ${plural(freed.length, 'has', 'have')} no incoming arrows left, so ${plural(freed.length, 'it joins', 'they join')} the ready list.`
            : `Right. Each node ${u} points to still has another arrow coming in, so nothing new is ready.`,
          wrong: (given) => {
            const extra = given.find((k) => !targets.includes(k));
            if (extra) return `${extra} isn’t one of the nodes ${u} points to, so its in-degree doesn’t change.`;
            const busy = given.find((k) => !freed.includes(k));
            if (busy) return `${busy} still has an arrow coming in from ${list(stillWaiting[busy])}.`;
            return 'You missed one. Which of these nodes had in-degree 1 before the arrows were removed?';
          },
          after: view(u),
        });
      }

      return {
        steps,
        final: view(null),
        stats: [
          ['Order', order.join(' → ')],
          ['Arrows removed', g.edges.length],
        ],
      };
    },
  });
})();
