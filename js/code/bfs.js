// Breadth-First Search in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('bfs', {
  python: `
  |from collections import deque
  |
  |def bfs(adj, start):  # adj[u] = neighbours of u, smallest first
 1|    queue = deque([start])
 2|    seen = {start}
  |    order = []
 3|    while queue:
 4|        u = queue.popleft()
 4|        order.append(u)
 5|        for v in adj[u]:
 6|            if v not in seen:
 7|                seen.add(v)
 8|                queue.append(v)
  |    return order
`,
  javascript: `
  |function bfs(adj, start) { // adj[u] = neighbours of u, smallest first
 1|  const queue = [start];
 2|  const seen = new Set([start]);
  |  const order = [];
 3|  while (queue.length > 0) {
 4|    const u = queue.shift();
 4|    order.push(u);
 5|    for (const v of adj[u]) {
 6|      if (!seen.has(v)) {
 7|        seen.add(v);
 8|        queue.push(v);
  |      }
  |    }
  |  }
  |  return order;
  |}
`,
  java: `
  |// Needs: import java.util.*;  adj.get(u) = neighbours of u, smallest first
  |static List<Integer> bfs(List<List<Integer>> adj, int start) {
 1|  Deque<Integer> queue = new ArrayDeque<>();
 1|  queue.add(start);
 2|  boolean[] seen = new boolean[adj.size()];
 2|  seen[start] = true;
  |  List<Integer> order = new ArrayList<>();
 3|  while (!queue.isEmpty()) {
 4|    int u = queue.poll();
 4|    order.add(u);
 5|    for (int v : adj.get(u)) {
 6|      if (!seen[v]) {
 7|        seen[v] = true;
 8|        queue.add(v);
  |      }
  |    }
  |  }
  |  return order;
  |}
`,
  cpp: `
  |// adj[u] = neighbours of u, smallest first
  |vector<int> bfs(const vector<vector<int>>& adj, int start) {
 1|  queue<int> q;
 1|  q.push(start);
 2|  vector<bool> seen(adj.size(), false);
 2|  seen[start] = true;
  |  vector<int> order;
 3|  while (!q.empty()) {
 4|    int u = q.front();
 4|    q.pop();
 4|    order.push_back(u);
 5|    for (int v : adj[u]) {
 6|      if (!seen[v]) {
 7|        seen[v] = true;
 8|        q.push(v);
  |      }
  |    }
  |  }
  |  return order;
  |}
`,
  c: `
  |#define MAXN 26
  |
  |// adj[u][v] = 1 if u and v are joined. Writes the visit order, returns its length.
  |int bfs(int n, int adj[][MAXN], int start, int order[]) {
 1|  int queue[MAXN], head = 0, tail = 0, count = 0;
 1|  queue[tail++] = start;
 2|  int seen[MAXN] = {0};
 2|  seen[start] = 1;
 3|  while (head < tail) {
 4|    int u = queue[head++];
 4|    order[count++] = u;
 5|    for (int v = 0; v < n; v++) {
 6|      if (adj[u][v] && !seen[v]) {
 7|        seen[v] = 1;
 8|        queue[tail++] = v;
  |      }
  |    }
  |  }
  |  return count;
  |}
`,
});
