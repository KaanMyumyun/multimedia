// Dijkstra's algorithm in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('dijkstra', {
  python: `
  |INF = float('inf')
  |
  |def dijkstra(adj, start):  # adj[u] = list of (v, weight)
  |    n = len(adj)
 1|    dist = [INF] * n
 1|    dist[start] = 0
  |    visited = [False] * n
 2|    for _ in range(n):
 3|        u = -1
 3|        for v in range(n):  # the closest unvisited node
 3|            if not visited[v] and (u == -1 or dist[v] < dist[u]):
 3|                u = v
 3|        if dist[u] == INF:
 3|            break  # the rest can't be reached
 4|        visited[u] = True
 5|        for v, w in adj[u]:
 5|            if not visited[v]:
 6|                alt = dist[u] + w
 7|                dist[v] = min(dist[v], alt)
  |    return dist
`,
  javascript: `
  |function dijkstra(adj, start) { // adj[u] = list of [v, weight]
  |  const n = adj.length;
 1|  const dist = new Array(n).fill(Infinity);
 1|  dist[start] = 0;
  |  const visited = new Array(n).fill(false);
 2|  for (let round = 0; round < n; round++) {
 3|    let u = -1;
 3|    for (let v = 0; v < n; v++) { // the closest unvisited node
 3|      if (!visited[v] && (u === -1 || dist[v] < dist[u])) u = v;
  |    }
 3|    if (dist[u] === Infinity) break; // the rest can't be reached
 4|    visited[u] = true;
 5|    for (const [v, w] of adj[u]) {
 5|      if (visited[v]) continue;
 6|      const alt = dist[u] + w;
 7|      dist[v] = Math.min(dist[v], alt);
  |    }
  |  }
  |  return dist;
  |}
`,
  java: `
  |// Needs: import java.util.*;  adj.get(u) = list of {v, weight}
  |static int[] dijkstra(List<List<int[]>> adj, int start) {
  |  int n = adj.size();
 1|  int[] dist = new int[n];
 1|  Arrays.fill(dist, Integer.MAX_VALUE);
 1|  dist[start] = 0;
  |  boolean[] visited = new boolean[n];
 2|  for (int round = 0; round < n; round++) {
 3|    int u = -1;
 3|    for (int v = 0; v < n; v++) { // the closest unvisited node
 3|      if (!visited[v] && (u == -1 || dist[v] < dist[u])) u = v;
  |    }
 3|    if (dist[u] == Integer.MAX_VALUE) break; // the rest can't be reached
 4|    visited[u] = true;
 5|    for (int[] e : adj.get(u)) {
 5|      int v = e[0], w = e[1];
 5|      if (visited[v]) continue;
 6|      int alt = dist[u] + w;
 7|      dist[v] = Math.min(dist[v], alt);
  |    }
  |  }
  |  return dist;
  |}
`,
  cpp: `
  |// adj[u] = list of {v, weight}
  |vector<int> dijkstra(const vector<vector<pair<int, int>>>& adj, int start) {
  |  int n = adj.size();
 1|  vector<int> dist(n, INT_MAX);
 1|  dist[start] = 0;
  |  vector<bool> visited(n, false);
 2|  for (int round = 0; round < n; round++) {
 3|    int u = -1;
 3|    for (int v = 0; v < n; v++) { // the closest unvisited node
 3|      if (!visited[v] && (u == -1 || dist[v] < dist[u])) u = v;
  |    }
 3|    if (dist[u] == INT_MAX) break; // the rest can't be reached
 4|    visited[u] = true;
 5|    for (auto [v, w] : adj[u]) {
 5|      if (visited[v]) continue;
 6|      int alt = dist[u] + w;
 7|      dist[v] = min(dist[v], alt);
  |    }
  |  }
  |  return dist;
  |}
`,
  c: `
  |#define MAXN 26
  |#define INF 1000000000
  |
  |// w[u][v] = weight of the edge between u and v, or 0 if there is none.
  |void dijkstra(int n, int w[][MAXN], int start, int dist[]) {
  |  int visited[MAXN] = {0};
 1|  for (int v = 0; v < n; v++) dist[v] = INF;
 1|  dist[start] = 0;
 2|  for (int round = 0; round < n; round++) {
 3|    int u = -1;
 3|    for (int v = 0; v < n; v++) { // the closest unvisited node
 3|      if (!visited[v] && (u == -1 || dist[v] < dist[u])) u = v;
  |    }
 3|    if (dist[u] == INF) break; // the rest can't be reached
 4|    visited[u] = 1;
 5|    for (int v = 0; v < n; v++) {
 5|      if (!w[u][v] || visited[v]) continue;
 6|      int alt = dist[u] + w[u][v];
 7|      if (alt < dist[v]) dist[v] = alt;
  |    }
  |  }
  |}
`,
});
