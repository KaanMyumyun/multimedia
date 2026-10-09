// Kruskal's algorithm with a simple union–find, in five languages. Nodes are numbered 0, 1, 2, … (A, B, C, …).
// "N|" is the pseudocode line each code line matches.
BTA.impl('kruskal', {
  python: `
  |def kruskal(n, edges):  # edges = list of (weight, u, v), with u < v
  |    parent = list(range(n))  # union-find: every node starts as its own tree
  |
  |    def find(x):  # the root of x's tree
  |        while parent[x] != x:
  |            x = parent[x]
  |        return x
  |
 2|    tree = []
 1,3|    for w, u, v in sorted(edges):  # by weight, then by name
 4|        ru, rv = find(u), find(v)
 4|        if ru != rv:
 5|            parent[ru] = rv  # join the two trees
 5|            tree.append((u, v, w))
 6|        # otherwise u and v are already connected: skip the edge
 7|        if len(tree) == n - 1:
 7|            break
  |    return tree
`,
  javascript: `
  |function kruskal(n, edges) { // edges = [[weight, u, v], ...] with u < v
  |  const parent = Array.from({ length: n }, (_, i) => i); // union-find
  |  const find = (x) => {
  |    while (parent[x] !== x) x = parent[x];
  |    return x;
  |  };
 1|  const sorted = edges.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
 2|  const tree = [];
 3|  for (const [w, u, v] of sorted) {
 4|    const ru = find(u), rv = find(v);
 4|    if (ru !== rv) {
 5|      parent[ru] = rv; // join the two trees
 5|      tree.push([u, v, w]);
 6|    } // otherwise u and v are already connected: skip the edge
 7|    if (tree.length === n - 1) break;
  |  }
  |  return tree;
  |}
`,
  java: `
  |// Needs: import java.util.*;  edges[i] = {weight, u, v} with u < v
  |static List<int[]> kruskal(int n, int[][] edges) {
  |  int[] parent = new int[n]; // union-find: every node starts as its own tree
  |  for (int i = 0; i < n; i++) parent[i] = i;
 1|  int[][] sorted = edges.clone();
 1|  Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] != b[1] ? a[1] - b[1] : a[2] - b[2]);
 2|  List<int[]> tree = new ArrayList<>();
 3|  for (int[] e : sorted) {
 4|    int ru = find(parent, e[1]), rv = find(parent, e[2]);
 4|    if (ru != rv) {
 5|      parent[ru] = rv; // join the two trees
 5|      tree.add(new int[] {e[1], e[2], e[0]});
 6|    } // otherwise u and v are already connected: skip the edge
 7|    if (tree.size() == n - 1) break;
  |  }
  |  return tree;
  |}
  |
  |static int find(int[] parent, int x) { // the root of x's tree
  |  while (parent[x] != x) x = parent[x];
  |  return x;
  |}
`,
  cpp: `
  |int findRoot(const vector<int>& parent, int x) { // the root of x's tree
  |  while (parent[x] != x) x = parent[x];
  |  return x;
  |}
  |
  |// edges = {weight, u, v} with u < v. Returns the tree's edges as {u, v, weight}.
  |vector<array<int, 3>> kruskal(int n, vector<array<int, 3>> edges) {
  |  vector<int> parent(n); // union-find: every node starts as its own tree
  |  for (int i = 0; i < n; i++) parent[i] = i;
 1|  sort(edges.begin(), edges.end()); // by weight, then by name
 2|  vector<array<int, 3>> tree;
 3|  for (auto [w, u, v] : edges) {
 4|    int ru = findRoot(parent, u), rv = findRoot(parent, v);
 4|    if (ru != rv) {
 5|      parent[ru] = rv; // join the two trees
 5|      tree.push_back({u, v, w});
 6|    } // otherwise u and v are already connected: skip the edge
 7|    if ((int) tree.size() == n - 1) break;
  |  }
  |  return tree;
  |}
`,
  c: `
  |// Needs <stdlib.h> for qsort. edges[i] = {weight, u, v} with u < v.
  |int by_weight(const void *a, const void *b) { // weight, then u, then v
  |  const int *x = a, *y = b;
  |  for (int k = 0; k < 3; k++) if (x[k] != y[k]) return x[k] - y[k];
  |  return 0;
  |}
  |
  |int find_root(int parent[], int x) { // the root of x's tree
  |  while (parent[x] != x) x = parent[x];
  |  return x;
  |}
  |
  |// Writes the tree's edges into tree[] as {u, v, weight} and returns how many there are.
  |int kruskal(int n, int m, int edges[][3], int tree[][3]) {
  |  int parent[n], count = 0; // union-find: every node starts as its own tree
  |  for (int i = 0; i < n; i++) parent[i] = i;
 1|  qsort(edges, m, sizeof edges[0], by_weight);
 3|  for (int i = 0; i < m && count < n - 1; i++) {
 4|    int ru = find_root(parent, edges[i][1]), rv = find_root(parent, edges[i][2]);
 4|    if (ru != rv) {
 5|      parent[ru] = rv; // join the two trees
 5|      tree[count][0] = edges[i][1];
 5|      tree[count][1] = edges[i][2];
 5|      tree[count][2] = edges[i][0];
 5|      count++;
 6|    } // otherwise u and v are already connected: skip the edge
  |  }
 7|  return count; // the loop stops once the tree has n - 1 edges
  |}
`,
});
