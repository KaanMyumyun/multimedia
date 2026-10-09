(function () {
  'use strict';
  const { register, randomGraph, graphView, edgeKey, list, plural } = BTA;

  register({
    id: 'dfs',
    name: 'Depth-First Search',
    group: 'Graphs',
    blurb: 'Go as deep as possible along each path before backtracking.',
    complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', stable: '—' },
    how: [
      'Visit the start node.',
      'Move to its first unvisited neighbour (alphabetical here) and keep going deeper from there.',
      'When a node has no unvisited neighbours left, backtrack to the previous node on the stack and try its next neighbour.',
      'Finish when you have backtracked all the way to the start.',
    ],
    code: [
      'dfs(u)',
      '  mark u as visited',
      '  for each neighbour v of u',
      '    if v is not visited',
      '      dfs(v)',
      '  return            // backtrack',
    ],
    legend: [
      ['current', 'Current node'],
      ['onstack', 'On the stack (path back to the start)'],
      ['done', 'Finished: nothing left to explore'],
      ['tree', 'Edge DFS travelled along'],
    ],
    kinds: {
      next: 'Which node DFS visits next',
    },
    summary:
      'DFS followed one path as far as it could. Only when it got stuck did it backtrack along the stack to the most recent node with an unexplored neighbour. ' +
      'Like BFS it handles each node and edge once, so it runs in O(V + E). It uses a stack (or recursion) instead of a queue. ' +
      'DFS is the basis for cycle detection, topological sorting, maze solving and finding connected components.',

    graph: {},
    generate: () => randomGraph({ extra: 3 }),

    build(g) {
      const start = 'A';
      const visited = new Set([start]);
      const done = new Set();
      const stack = [start];
      const order = [start];
      const tree = new Set();
      const steps = [];

      const firstUnvisited = (w) => g.adj[w].map((x) => x.to).find((x) => !visited.has(x));

      const view = (cur) =>
        graphView(g, {
          state: (id) =>
            id === cur ? 'current' : done.has(id) ? 'done' : stack.includes(id) ? 'onstack' : 'idle',
          edge: (e) => (tree.has(e.u + e.v) ? 'tree' : 'idle'),
          lists: [
            { title: 'Stack', note: 'bottom → top', items: stack },
            { title: 'Visit order', items: order },
          ],
        });

      let cur = start;
      while (visited.size < g.ids.length) {
        // Work out the move on a copy first, so the question shows the state before it.
        const s = stack.slice();
        const popped = [];
        let w = null;
        let v = null;
        while (s.length) {
          w = s[s.length - 1];
          v = firstUnvisited(w);
          if (v) break;
          popped.push(s.pop());
        }
        if (!v) break;

        const vis = new Set(visited);
        const options = g.adj[w].map((x) => x.to).filter((x) => !visited.has(x));
        const from = cur;
        const before = view(cur);

        for (const p of popped) {
          stack.pop();
          done.add(p);
        }
        visited.add(v);
        stack.push(v);
        order.push(v);
        tree.add(edgeKey(w, v));

        steps.push({
          line: 4,
          kind: 'next',
          view: before,
          prompt:
            (order.length === 2 ? `DFS starts at <b>${start}</b>. ` : `DFS is at <b>${from}</b>. `) +
            'Which node does it visit next?',
          ask: { type: 'pick', answer: [v] },
          hint:
            'Try the current node’s neighbours in alphabetical order. ' +
            'If all of them are visited, back up one node along the stack and try again from there.',
          correct: popped.length
            ? `Right. ${list(popped)} ${plural(popped.length, 'has', 'have')} no unvisited neighbours left, so DFS backtracks to <b>${w}</b>. ` +
              `${w}’s first unvisited neighbour is <b>${v}</b>.`
            : `Right. <b>${v}</b> is ${w}’s first unvisited neighbour (alphabetically), so DFS goes deeper.`,
          wrong: ([k]) => {
            if (vis.has(k)) return `${k} has already been visited.`;
            if (options.includes(k)) {
              return `${k} is an unvisited neighbour of ${w}, but neighbours are tried in alphabetical order, and another one comes first.`;
            }
            return popped.length
              ? `DFS can only move along an edge from the node on top of the stack. ${from} has no unvisited neighbours, so where does it back up to?`
              : `DFS goes deep: it continues from ${from}, the node it just reached. Is ${k} a neighbour of ${from}?`;
          },
          after: view(v),
        });

        cur = v;
      }

      while (stack.length) done.add(stack.pop());

      return {
        steps,
        final: view(null),
        stats: [
          ['Nodes visited', order.length],
          ['Edges travelled', order.length - 1],
          ['Visit order', order.join(' → ')],
        ],
      };
    },
  });
})();
