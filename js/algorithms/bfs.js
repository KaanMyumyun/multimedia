(function () {
  'use strict';
  const { register, randomGraph, graphView, edgeKey, list, plural } = BTA;

  register({
    id: 'bfs',
    name: 'Breadth-First Search',
    group: 'Graphs',
    blurb: 'Explore a graph level by level using a queue.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', stable: '—' },
    how: [
      'Put the start node in a queue and mark it as seen.',
      'Take the node at the front of the queue and visit it.',
      'Add each neighbour you have not seen yet to the back of the queue (in alphabetical order here).',
      'Repeat until the queue is empty. Nodes are visited in order of their distance (in edges) from the start.',
    ],
    code: [
      'queue ← [start]',
      'mark start as seen',
      'while queue is not empty',
      '  u ← dequeue()',
      '  for each neighbour v of u',
      '    if v has not been seen',
      '      mark v as seen',
      '      enqueue(v)',
    ],
    legend: [
      ['current', 'Visiting now'],
      ['queued', 'Waiting in the queue'],
      ['visited', 'Visited'],
      ['tree', 'Edge used to discover a node'],
    ],
    kinds: {
      dequeue: 'Which node leaves the queue',
      enqueue: 'Which neighbours join the queue',
    },
    summary:
      'BFS spread out from the start like a ripple. First it visited every node one edge away, then two edges away, and so on. That order comes from the queue: first in, first out. ' +
      'Each node and each edge is handled once, so BFS runs in O(V + E). ' +
      'The green edges form a shortest-path tree: following them back to the start gives the path with the fewest edges.',

    graph: {},
    generate: () => randomGraph({ extra: 3 }),

    build(g) {
      const start = 'A';
      const seen = new Set([start]);
      const visited = new Set();
      const queue = [start];
      const order = [];
      const tree = new Set();
      const steps = [];
      let edgesChecked = 0;

      const view = (cur) =>
        graphView(g, {
          state: (id) => (id === cur ? 'current' : visited.has(id) ? 'visited' : queue.includes(id) ? 'queued' : 'idle'),
          edge: (e) => (tree.has(e.u + e.v) ? 'tree' : 'idle'),
          lists: [
            { title: 'Queue', note: 'front → back', items: queue },
            { title: 'Visit order', items: order },
          ],
        });

      let first = true;
      while (queue.length) {
        const u = queue[0];

        if (!first) {
          const q = queue.slice();
          const vis = new Set(visited);
          const before = view(null);
          queue.shift();
          order.push(u);
          steps.push({
            line: 3,
            kind: 'dequeue',
            view: before,
            prompt: 'Which node comes out of the queue next?',
            ask: { type: 'pick', answer: [u] },
            hint: 'A queue is first in, first out. The node that has waited longest leaves first.',
            correct: `Right. <b>${u}</b> is at the front of the queue, so BFS visits it next.`,
            wrong: ([k]) => {
              if (vis.has(k)) return `${k} has already been visited.`;
              if (!q.includes(k)) return `${k} isn’t in the queue yet. BFS only visits nodes that are waiting in the queue.`;
              return `${k} is in the queue, but not at the front. BFS takes nodes in the order they were added.`;
            },
            after: view(u),
          });
        } else {
          queue.shift();
          order.push(u);
        }

        const nbrs = g.adj[u].map((x) => x.to);
        const fresh = nbrs.filter((v) => !seen.has(v));
        edgesChecked += nbrs.length;
        const before = view(u);

        for (const v of fresh) {
          seen.add(v);
          queue.push(v);
          tree.add(edgeKey(u, v));
        }
        visited.add(u);

        steps.push({
          line: 5,
          kind: 'enqueue',
          view: before,
          prompt:
            (first ? `BFS starts at <b>${start}</b>. ` : '') +
            `Visiting <b>${u}</b>. Select every neighbour that gets added to the queue, then press Check.`,
          ask: { type: 'multi', answer: fresh },
          hint: `Look at ${u}’s neighbours. Add those that have never been seen: not visited and not already in the queue. If there are none, just press Check.`,
          correct: fresh.length
            ? `Correct. ${list(fresh)} ${plural(fresh.length, 'joins', 'join')} the back of the queue.`
            : `Correct. Every neighbour of ${u} has already been seen, so nothing is added.`,
          wrong: (given) => {
            if (given.includes(u)) return `${u} is the node being visited. Select its <b>neighbours</b>.`;
            const far = given.find((k) => !nbrs.includes(k));
            if (far) return `${far} isn’t connected to ${u} by an edge.`;
            const old = given.find((k) => !fresh.includes(k));
            if (old) return `${old} has already been seen (visited, or waiting in the queue). BFS never adds a node twice.`;
            const missing = fresh.length - given.length;
            return `You missed ${plural(missing, 'a neighbour', 'some neighbours')} of ${u} that ${plural(missing, 'hasn’t', 'haven’t')} been seen yet.`;
          },
          after: view(u),
        });

        first = false;
      }

      return {
        steps,
        final: view(null),
        stats: [
          ['Nodes visited', order.length],
          ['Edges checked', edgesChecked],
          ['Visit order', order.join(' → ')],
        ],
      };
    },
  });
})();
