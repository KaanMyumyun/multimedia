// Topological sort (Kahn's algorithm) in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('topo', {
  python: `
  |import heapq
  |
  |def topological_sort(adj):  # adj[u] = the nodes u points to
  |    n = len(adj)
 1|    indeg = [0] * n
 1|    for u in range(n):
 1|        for v in adj[u]:
 1|            indeg[v] += 1
 2|    ready = [v for v in range(n) if indeg[v] == 0]
 2|    heapq.heapify(ready)  # always hands out the smallest first
  |    order = []
 3|    while ready:
 4|        u = heapq.heappop(ready)
 5|        order.append(u)
 6|        for v in adj[u]:
 7|            indeg[v] -= 1
 8|            if indeg[v] == 0:
 8|                heapq.heappush(ready, v)
  |    return order
`,
  javascript: `
  |function topologicalSort(adj) { // adj[u] = the nodes u points to
  |  const n = adj.length;
 1|  const indeg = new Array(n).fill(0);
 1|  for (const out of adj) for (const v of out) indeg[v]++;
 2|  const ready = [];
 2|  for (let v = 0; v < n; v++) if (indeg[v] === 0) ready.push(v);
  |  const order = [];
 3|  while (ready.length > 0) {
 4|    ready.sort((x, y) => x - y);
 4|    const u = ready.shift(); // the smallest ready node
 5|    order.push(u);
 6|    for (const v of adj[u]) {
 7|      indeg[v]--;
 8|      if (indeg[v] === 0) ready.push(v);
  |    }
  |  }
  |  return order;
  |}
`,
  java: `
  |// Needs: import java.util.*;  adj.get(u) = the nodes u points to
  |static List<Integer> topologicalSort(List<List<Integer>> adj) {
  |  int n = adj.size();
 1|  int[] indeg = new int[n];
 1|  for (List<Integer> out : adj) for (int v : out) indeg[v]++;
 2|  PriorityQueue<Integer> ready = new PriorityQueue<>(); // smallest first
 2|  for (int v = 0; v < n; v++) if (indeg[v] == 0) ready.add(v);
  |  List<Integer> order = new ArrayList<>();
 3|  while (!ready.isEmpty()) {
 4|    int u = ready.poll();
 5|    order.add(u);
 6|    for (int v : adj.get(u)) {
 7|      indeg[v]--;
 8|      if (indeg[v] == 0) ready.add(v);
  |    }
  |  }
  |  return order;
  |}
`,
  cpp: `
  |// adj[u] = the nodes u points to
  |vector<int> topologicalSort(const vector<vector<int>>& adj) {
  |  int n = adj.size();
 1|  vector<int> indeg(n, 0);
 1|  for (const auto& out : adj) for (int v : out) indeg[v]++;
 2|  priority_queue<int, vector<int>, greater<int>> ready; // smallest first
 2|  for (int v = 0; v < n; v++) if (indeg[v] == 0) ready.push(v);
  |  vector<int> order;
 3|  while (!ready.empty()) {
 4|    int u = ready.top();
 4|    ready.pop();
 5|    order.push_back(u);
 6|    for (int v : adj[u]) {
 7|      indeg[v]--;
 8|      if (indeg[v] == 0) ready.push(v);
  |    }
  |  }
  |  return order;
  |}
`,
  c: `
  |#define MAXN 26
  |
  |// adj[u][v] = 1 if there is an arrow u -> v. Writes the order, returns its length.
  |int topological_sort(int n, int adj[][MAXN], int order[]) {
 1|  int indeg[MAXN] = {0}, ready[MAXN] = {0}, count = 0;
 1|  for (int u = 0; u < n; u++)
 1|    for (int v = 0; v < n; v++) indeg[v] += adj[u][v];
 2|  for (int v = 0; v < n; v++) ready[v] = indeg[v] == 0;
 3|  for (;;) {
 4|    int u = -1;
 4|    for (int v = 0; v < n && u == -1; v++) // the smallest ready node
 4|      if (ready[v]) u = v;
 3|    if (u == -1) break; // nothing is ready
 5|    ready[u] = 0;
 5|    order[count++] = u;
 6|    for (int v = 0; v < n; v++) {
 6|      if (!adj[u][v]) continue;
 7|      indeg[v]--;
 8|      if (indeg[v] == 0) ready[v] = 1;
  |    }
  |  }
  |  return count;
  |}
`,
});
