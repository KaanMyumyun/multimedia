// Bellman-Ford in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('bellman', {
  python: `
  |INF = float('inf')
  |
  |# edges = list of (u, v, w) arrows, in the order to relax them
  |def bellman_ford(n, edges, start):
 1|    dist = [INF] * n
 1|    dist[start] = 0
 2|    for _ in range(n - 1):
 3|        changed = False
 4|        for u, v, w in edges:
 5|            if dist[u] != INF and dist[u] + w < dist[v]:
 6|                dist[v] = dist[u] + w
 6|                changed = True
 7|        if not changed:
 7|            break  # every distance is final
  |    return dist
`,
  javascript: `
  |// edges = [[u, v, w], ...] arrows, in the order to relax them
  |function bellmanFord(n, edges, start) {
 1|  const dist = new Array(n).fill(Infinity);
 1|  dist[start] = 0;
 2|  for (let pass = 1; pass <= n - 1; pass++) {
 3|    let changed = false;
 4|    for (const [u, v, w] of edges) {
 5|      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
 6|        dist[v] = dist[u] + w;
 6|        changed = true;
  |      }
  |    }
 7|    if (!changed) break; // every distance is final
  |  }
  |  return dist;
  |}
`,
  java: `
  |// edges[i] = {u, v, w} arrows, in the order to relax them
  |static int[] bellmanFord(int n, int[][] edges, int start) {
  |  final int INF = Integer.MAX_VALUE;
 1|  int[] dist = new int[n];
 1|  java.util.Arrays.fill(dist, INF);
 1|  dist[start] = 0;
 2|  for (int pass = 1; pass <= n - 1; pass++) {
 3|    boolean changed = false;
 4|    for (int[] e : edges) {
 5|      if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) {
 6|        dist[e[1]] = dist[e[0]] + e[2];
 6|        changed = true;
  |      }
  |    }
 7|    if (!changed) break; // every distance is final
  |  }
  |  return dist;
  |}
`,
  cpp: `
  |// edges = {u, v, w} arrows, in the order to relax them
  |vector<int> bellmanFord(int n, const vector<array<int, 3>>& edges, int start) {
 1|  vector<int> dist(n, INT_MAX);
 1|  dist[start] = 0;
 2|  for (int pass = 1; pass <= n - 1; pass++) {
 3|    bool changed = false;
 4|    for (auto [u, v, w] : edges) {
 5|      if (dist[u] != INT_MAX && dist[u] + w < dist[v]) {
 6|        dist[v] = dist[u] + w;
 6|        changed = true;
  |      }
  |    }
 7|    if (!changed) break; // every distance is final
  |  }
  |  return dist;
  |}
`,
  c: `
  |#define INF 1000000000
  |
  |// edges[i] = {u, v, w} arrows, in the order to relax them
  |void bellman_ford(int n, int m, int edges[][3], int start, int dist[]) {
 1|  for (int v = 0; v < n; v++) dist[v] = INF;
 1|  dist[start] = 0;
 2|  for (int pass = 1; pass <= n - 1; pass++) {
 3|    int changed = 0;
 4|    for (int i = 0; i < m; i++) {
 4|      int u = edges[i][0], v = edges[i][1], w = edges[i][2];
 5|      if (dist[u] != INF && dist[u] + w < dist[v]) {
 6|        dist[v] = dist[u] + w;
 6|        changed = 1;
  |      }
  |    }
 7|    if (!changed) break; // every distance is final
  |  }
  |}
`,
});
