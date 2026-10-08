// Depth-First Search in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('dfs', {
  python: `
  |# Call it as: order = []; dfs(adj, 0, set(), order)
  |# adj[u] = neighbours of u, smallest first
 1|def dfs(adj, u, visited, order):
 2|    visited.add(u)
 2|    order.append(u)
 3|    for v in adj[u]:
 4|        if v not in visited:
 5|            dfs(adj, v, visited, order)
 6|    # returning from here is the backtrack
`,
  javascript: `
  |// Call it as dfs(adj, 0). adj[u] = neighbours of u, smallest first
 1|function dfs(adj, u, visited = new Set(), order = []) {
 2|  visited.add(u);
 2|  order.push(u);
 3|  for (const v of adj[u]) {
 4|    if (!visited.has(v)) {
 5|      dfs(adj, v, visited, order);
  |    }
  |  }
 6|  return order; // returning is the backtrack
  |}
`,
  java: `
  |// Needs: import java.util.*;  adj.get(u) = neighbours of u, smallest first
  |// Call it as dfs(adj, 0, new boolean[n], order)
 1|static void dfs(List<List<Integer>> adj, int u, boolean[] visited, List<Integer> order) {
 2|  visited[u] = true;
 2|  order.add(u);
 3|  for (int v : adj.get(u)) {
 4|    if (!visited[v]) {
 5|      dfs(adj, v, visited, order);
  |    }
  |  }
 6|} // returning is the backtrack
`,
  cpp: `
  |// adj[u] = neighbours of u, smallest first
  |// Call it as dfs(adj, 0, visited, order) with visited = vector<bool>(n)
 1|void dfs(const vector<vector<int>>& adj, int u, vector<bool>& visited, vector<int>& order) {
 2|  visited[u] = true;
 2|  order.push_back(u);
 3|  for (int v : adj[u]) {
 4|    if (!visited[v]) {
 5|      dfs(adj, v, visited, order);
  |    }
  |  }
 6|} // returning is the backtrack
`,
  c: `
  |#define MAXN 26
  |
  |// adj[u][v] = 1 if u and v are joined. Call it as dfs(n, adj, 0, visited, order, &count)
 1|void dfs(int n, int adj[][MAXN], int u, int visited[], int order[], int *count) {
 2|  visited[u] = 1;
 2|  order[(*count)++] = u;
 3|  for (int v = 0; v < n; v++) {
 4|    if (adj[u][v] && !visited[v]) {
 5|      dfs(n, adj, v, visited, order, count);
  |    }
  |  }
 6|} // returning is the backtrack
`,
});
