(function () {
  'use strict';
  const { register, randomGraph, graphView, edgeKey, shuffle } = BTA;

  const name = (e) => `${e.u}–${e.v}`;
  // Lightest first; equal weights in alphabetical order (A–B before A–C).
  const sortEdges = (edges) => edges.slice().sort((a, b) => a.w - b.w || edgeKey(a.u, a.v).localeCompare(edgeKey(b.u, b.v)));

  register({
    id: 'kruskal',
    name: 'Kruskal’s Algorithm',
    group: 'Graphs',
    blurb: 'Connect every node as cheaply as possible, by adding the lightest edges that don’t make a cycle.',
    complexity: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)', space: 'O(V)', stable: '—' },
    graph: { weighted: true },
    how: [
      'A spanning tree joins every node using V − 1 edges and no cycles. Kruskal finds the one with the smallest total weight: the minimum spanning tree.',
      'Sort the edges from lightest to heaviest. Edges with equal weights go in alphabetical order here (A–B before A–C).',
      'Go through them in that order. If an edge joins two nodes that aren’t connected yet, add it to the tree. If they are already connected, it would close a cycle, so skip it.',
      'Stop once the tree has V − 1 edges.',
    ],
    code: [
      'sort the edges by weight (ties: A–Z)',
      'tree ← no edges',
      'for each edge u–v in that order',
      '  if u and v are in different trees',
      '    add u–v to the tree',
      '  else skip it: it would make a cycle',
      '  stop when the tree has V − 1 edges',
    ],
    legend: [
      ['current', 'Ends of the edge being looked at'],
      ['active-edge', 'Edge being looked at'],
      ['tree', 'In the tree'],
      ['gone-edge', 'Skipped'],
    ],
    kinds: {
      next: 'Which edge comes next',
      cycle: 'Add it or skip it',
    },
    summary:
      'Kruskal looked at the edges from lightest to heaviest and kept each one that joined two separate trees, until one tree held every node. ' +
      'Taking the cheapest safe edge every time always gives a minimum spanning tree. ' +
      'Sorting the edges dominates the cost: O(E log E). Checking “already connected?” is fast with a union–find structure. ' +
      'Minimum spanning trees are used to lay out networks (cables, pipes, roads) as cheaply as possible.',

    generate: () => randomGraph({ extra: 3, weighted: true }),

    build(g) {
      const order = sortEdges(g.edges);
      const parent = Object.fromEntries(g.ids.map((id) => [id, id]));
      const find = (x) => (parent[x] === x ? x : find(parent[x]));
      const tree = new Set();
      const skipped = new Set();
      const steps = [];
      let total = 0;
      const need = g.ids.length - 1;

      // A path between two nodes using tree edges only, as "B–A–D".
      const treePath = (from, to) => {
        const prev = { [from]: null };
        const queue = [from];
        while (queue.length) {
          const x = queue.shift();
          if (x === to) break;
          for (const e of g.edges) {
            if (!tree.has(e.u + e.v)) continue;
            const y = e.u === x ? e.v : e.v === x ? e.u : null;
            if (y && !(y in prev)) {
              prev[y] = x;
              queue.push(y);
            }
          }
        }
        const path = [];
        for (let x = to; x != null; x = prev[x]) path.unshift(x);
        return path.join('–');
      };

      const view = (cur) =>
        graphView(g, {
          state: (id) => (cur && (id === cur.u || id === cur.v) ? 'current' : 'idle'),
          edge: (e) => (cur && e === cur ? 'active' : tree.has(e.u + e.v) ? 'tree' : skipped.has(e.u + e.v) ? 'gone' : 'idle'),
          // In alphabetical order, so finding the lightest edge left is part of the job.
          table: {
            head: ['Edge', 'Weight', 'Status'],
            rows: g.edges.map((e) => [
              name(e),
              String(e.w),
              tree.has(e.u + e.v) ? 'in tree' : skipped.has(e.u + e.v) ? 'skipped' : e === cur ? 'looking' : '—',
            ]),
          },
        });

      for (let idx = 0; idx < order.length && tree.size < need; idx++) {
        const e = order[idx];
        const key = e.u + e.v;
        const rest = order.slice(idx + 1);
        const seen = order.slice(0, idx);
        const tie = rest.find((x) => x.w === e.w);
        const firstQ = idx === 0;

        // Which edge is next? The right one plus two others from what is left (or already seen).
        const others = shuffle(rest.slice(0, 4)).slice(0, 2);
        if (others.length < 2) others.push(...seen.slice(-(2 - others.length)));
        const opts = [e, ...others].sort((a, b) => edgeKey(a.u, a.v).localeCompare(edgeKey(b.u, b.v)));

        steps.push({
          line: 2,
          kind: 'next',
          view: view(null),
          prompt: firstQ
            ? 'Kruskal goes through the edges from lightest to heaviest, with ties in A–Z order. Which edge comes first?'
            : 'Which edge does Kruskal look at next?',
          ask: { type: 'choice', answer: key, options: opts.map((x) => ({ label: `${name(x)} (weight ${x.w})`, value: x.u + x.v })) },
          hint: 'Find the lightest edge that hasn’t been looked at yet. If two weigh the same, take the one that comes first alphabetically.',
          correct: `Right. ${name(e)} (weight ${e.w}) is the lightest edge left${tie ? `. ${name(tie)} weighs the same, but ${name(e)} comes first alphabetically` : ''}.`,
          wrong: (given) => {
            const x = order.find((o) => o.u + o.v === given);
            if (!x) return 'Not quite.';
            if (seen.includes(x)) return `${name(x)} has already been looked at.`;
            if (x.w > e.w) return `${name(x)} weighs ${x.w}, and there is a lighter edge left.`;
            return `${name(x)} and ${name(e)} both weigh ${e.w}, and ${name(e)} comes first alphabetically.`;
          },
          after: view(e),
        });

        const join = find(e.u) !== find(e.v);
        const before = view(e);
        const path = join ? null : treePath(e.u, e.v);
        if (join) {
          parent[find(e.u)] = find(e.v);
          tree.add(key);
          total += e.w;
        } else {
          skipped.add(key);
        }
        const complete = tree.size === need;

        steps.push({
          line: 3,
          kind: 'cycle',
          view: before,
          prompt: `Look at <b>${name(e)}</b> (weight ${e.w}). Add it to the tree, or skip it?`,
          ask: {
            type: 'choice',
            answer: join ? 'add' : 'skip',
            options: [
              { label: 'Add it', value: 'add' },
              { label: 'Skip it: it would make a cycle', value: 'skip' },
            ],
          },
          hint: `Follow the thick tree edges. Can you already get from ${e.u} to ${e.v} along them?`,
          correct: join
            ? `Right. ${e.u} and ${e.v} aren’t connected yet, so ${name(e)} joins their trees. The tree now has ${tree.size} of ${need} edges.` +
              (complete ? ` That’s all ${need}: every node is connected, with a total weight of ${total}.` : '')
            : `Right. ${e.u} and ${e.v} are already connected through ${path}, so ${name(e)} would close a cycle. Skip it.`,
          wrong: join
            ? `There is no way from ${e.u} to ${e.v} along the tree yet, so this edge can’t make a cycle. Add it.`
            : `${e.u} and ${e.v} are already joined through ${path}. Adding ${name(e)} would make a cycle.`,
          after: view(null),
        });
      }

      return {
        steps,
        final: view(null),
        stats: [
          ['Total weight', total],
          ['Tree edges', [...tree].map((k) => `${k[0]}–${k[1]}`).join(', ')],
          ['Edges skipped', skipped.size],
        ],
      };
    },
  });
})();
