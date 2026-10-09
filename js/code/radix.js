// Radix Sort (least significant digit first, ten buckets) in five languages.
// "N|" is the pseudocode line each code line matches.
BTA.impl('radix', {
  python: `
  |def radix_sort(a):  # whole numbers, 0 or more
  |    place = 1
 1|    while place == 1 or max(a) // place > 0:
 2|        buckets = [[] for _ in range(10)]
 3|        for x in a:
 4|            buckets[x // place % 10].append(x)
 5|        a[:] = [x for b in buckets for x in b]
 1|        place *= 10
`,
  javascript: `
  |function radixSort(a) { // whole numbers, 0 or more
  |  const max = Math.max(...a);
 1|  for (let place = 1; place === 1 || Math.floor(max / place) > 0; place *= 10) {
 2|    const buckets = Array.from({ length: 10 }, () => []);
 3|    for (const x of a) {
 4|      buckets[Math.floor(x / place) % 10].push(x);
  |    }
 5|    let i = 0;
 5|    for (const b of buckets) for (const x of b) a[i++] = x;
  |  }
  |}
`,
  java: `
  |// Needs: import java.util.*;  Whole numbers, 0 or more.
  |static void radixSort(int[] a) {
  |  int max = Arrays.stream(a).max().getAsInt();
 1|  for (int place = 1; place == 1 || max / place > 0; place *= 10) {
 2|    List<List<Integer>> buckets = new ArrayList<>();
 2|    for (int d = 0; d < 10; d++) buckets.add(new ArrayList<>());
 3|    for (int x : a) {
 4|      buckets.get(x / place % 10).add(x);
  |    }
 5|    int i = 0;
 5|    for (List<Integer> b : buckets) for (int x : b) a[i++] = x;
  |  }
  |}
`,
  cpp: `
  |void radixSort(vector<int>& a) { // whole numbers, 0 or more
  |  int mx = *max_element(a.begin(), a.end());
 1|  for (int place = 1; place == 1 || mx / place > 0; place *= 10) {
 2|    vector<vector<int>> buckets(10);
 3|    for (int x : a) {
 4|      buckets[x / place % 10].push_back(x);
  |    }
 5|    int i = 0;
 5|    for (const auto& b : buckets) for (int x : b) a[i++] = x;
  |  }
  |}
`,
  c: `
  |void radix_sort(int a[], int n) { // whole numbers, 0 or more
  |  int max = a[0];
  |  for (int i = 1; i < n; i++) if (a[i] > max) max = a[i];
  |  int bucket[10][n], size[10];
 1|  for (int place = 1; place == 1 || max / place > 0; place *= 10) {
 2|    for (int d = 0; d < 10; d++) size[d] = 0;
 3|    for (int i = 0; i < n; i++) {
 4|      int d = a[i] / place % 10;
 4|      bucket[d][size[d]++] = a[i];
  |    }
 5|    int k = 0;
 5|    for (int d = 0; d < 10; d++)
 5|      for (int j = 0; j < size[d]; j++) a[k++] = bucket[d][j];
  |  }
  |}
`,
});
