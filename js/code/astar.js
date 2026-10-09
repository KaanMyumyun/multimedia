// A* search in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// h[v] is the estimate of the distance from v to the goal. "N|" is the pseudocode line each code line matches.
BTA.impl('astar', {
  python: `
  |INF = float('inf')
  |
  |# adj[u] = list of (v, weight); returns the length of a shortest path to the goal
  |def a_star(adj, h, start, goal):
 1|    g = [INF] * len(adj)
 1|    g[start] = 0
 1|    open_nodes = {start}
  |    closed = set()
 2|    while open_nodes:
 3|        u = min(open_nodes, key=lambda x: g[x] + h[x])
 4|        if u == goal:
 4|            return g[u]
 5|        open_nodes.remove(u)
 5|        closed.add(u)
 6|        for v, w in adj[u]:
 6|            if v in closed:
 6|                continue
 7|            if g[u] + w < g[v]:
 8|                g[v] = g[u] + w
 8|                open_nodes.add(v)
  |    return INF  # the goal can't be reached
`,
  javascript: `
  |// adj[u] = list of [v, weight]; returns the length of a shortest path to the goal
  |function aStar(adj, h, start, goal) {
 1|  const g = new Array(adj.length).fill(Infinity);
 1|  g[start] = 0;
 1|  const open = new Set([start]);
  |  const closed = new Set();
 2|  while (open.size > 0) {
 3|    let u = null;
 3|    for (const x of open) if (u === null || g[x] + h[x] < g[u] + h[u]) u = x;
 4|    if (u === goal) return g[u];
 5|    open.delete(u);
 5|    closed.add(u);
 6|    for (const [v, w] of adj[u]) {
 6|      if (closed.has(v)) continue;
 7|      if (g[u] + w < g[v]) {
 8|        g[v] = g[u] + w;
 8|        open.add(v);
  |      }
  |    }
  |  }
  |  return Infinity; // the goal can't be reached
  |}
`,
  java: `
  |// Needs: import java.util.*;  adj.get(u) = list of {v, weight}
  |static int aStar(List<List<int[]>> adj, int[] h, int start, int goal) {
  |  int n = adj.size();
 1|  int[] g = new int[n];
 1|  Arrays.fill(g, Integer.MAX_VALUE);
 1|  g[start] = 0;
 1|  boolean[] open = new boolean[n], closed = new boolean[n];
 1|  open[start] = true;
 2|  while (true) {
 3|    int u = -1;
 3|    for (int x = 0; x < n; x++)
 3|      if (open[x] && (u == -1 || g[x] + h[x] < g[u] + h[u])) u = x;
 2|    if (u == -1) return -1; // open is empty: the goal can't be reached
 4|    if (u == goal) return g[u];
 5|    open[u] = false;
 5|    closed[u] = true;
 6|    for (int[] e : adj.get(u)) {
 6|      int v = e[0], w = e[1];
 6|      if (closed[v]) continue;
 7|      if (g[u] + w < g[v]) {
 8|        g[v] = g[u] + w;
 8|        open[v] = true;
  |      }
  |    }
  |  }
  |}
`,
  cpp: `
  |// adj[u] = list of {v, weight}; returns the length of a shortest path to the goal
  |int aStar(const vector<vector<pair<int, int>>>& adj, const vector<int>& h, int start, int goal) {
  |  int n = adj.size();
 1|  vector<int> g(n, INT_MAX);
 1|  g[start] = 0;
 1|  vector<bool> open(n, false), closed(n, false);
 1|  open[start] = true;
 2|  while (true) {
 3|    int u = -1;
 3|    for (int x = 0; x < n; x++)
 3|      if (open[x] && (u == -1 || g[x] + h[x] < g[u] + h[u])) u = x;
 2|    if (u == -1) return -1; // open is empty: the goal can't be reached
 4|    if (u == goal) return g[u];
 5|    open[u] = false;
 5|    closed[u] = true;
 6|    for (auto [v, w] : adj[u]) {
 6|      if (closed[v]) continue;
 7|      if (g[u] + w < g[v]) {
 8|        g[v] = g[u] + w;
 8|        open[v] = true;
  |      }
  |    }
  |  }
  |}
`,
  c: `
  |#define MAXN 26
  |#define INF 1000000000
  |
  |// w[u][v] = weight of the edge between u and v, or 0 if there is none.
  |// Returns the length of a shortest path to the goal, or -1 if it can't be reached.
  |int a_star(int n, int w[][MAXN], int h[], int start, int goal) {
 1|  int g[MAXN], open[MAXN] = {0}, closed[MAXN] = {0};
 1|  for (int v = 0; v < n; v++) g[v] = INF;
 1|  g[start] = 0;
 1|  open[start] = 1;
 2|  for (;;) {
 3|    int u = -1;
 3|    for (int x = 0; x < n; x++)
 3|      if (open[x] && (u == -1 || g[x] + h[x] < g[u] + h[u])) u = x;
 2|    if (u == -1) return -1; // open is empty
 4|    if (u == goal) return g[u];
 5|    open[u] = 0;
 5|    closed[u] = 1;
 6|    for (int v = 0; v < n; v++) {
 6|      if (!w[u][v] || closed[v]) continue;
 7|      if (g[u] + w[u][v] < g[v]) {
 8|        g[v] = g[u] + w[u][v];
 8|        open[v] = 1;
  |      }
  |    }
  |  }
  |}
`,
});
