// Counting Sort in five languages, for values 0 to k − 1. "N|" is the pseudocode line each code line matches.
BTA.impl('counting', {
  python: `
  |def counting_sort(a, k=10):  # values must be 0 .. k - 1
 1|    count = [0] * k
 2|    for x in a:
 3|        count[x] += 1
 4|    i = 0
 5|    for v in range(k):
 6|        for _ in range(count[v]):
 7|            a[i] = v
 7|            i += 1
`,
  javascript: `
  |function countingSort(a, k = 10) { // values must be 0 .. k - 1
 1|  const count = new Array(k).fill(0);
 2|  for (const x of a) {
 3|    count[x]++;
  |  }
 4|  let i = 0;
 5|  for (let v = 0; v < k; v++) {
 6|    for (let r = 0; r < count[v]; r++) {
 7|      a[i++] = v;
  |    }
  |  }
  |}
`,
  java: `
  |// Call it as countingSort(a, 10). Values must be 0 .. k - 1.
  |static void countingSort(int[] a, int k) {
 1|  int[] count = new int[k];
 2|  for (int x : a) {
 3|    count[x]++;
  |  }
 4|  int i = 0;
 5|  for (int v = 0; v < k; v++) {
 6|    for (int r = 0; r < count[v]; r++) {
 7|      a[i++] = v;
  |    }
  |  }
  |}
`,
  cpp: `
  |void countingSort(vector<int>& a, int k = 10) { // values must be 0 .. k - 1
 1|  vector<int> count(k, 0);
 2|  for (int x : a) {
 3|    count[x]++;
  |  }
 4|  int i = 0;
 5|  for (int v = 0; v < k; v++) {
 6|    for (int r = 0; r < count[v]; r++) {
 7|      a[i++] = v;
  |    }
  |  }
  |}
`,
  c: `
  |// Call it as counting_sort(a, n, 10). Values must be 0 .. k - 1.
  |void counting_sort(int a[], int n, int k) {
 1|  int count[k];
 1|  for (int v = 0; v < k; v++) count[v] = 0;
 2|  for (int j = 0; j < n; j++) {
 3|    count[a[j]]++;
  |  }
 4|  int i = 0;
 5|  for (int v = 0; v < k; v++) {
 6|    for (int r = 0; r < count[v]; r++) {
 7|      a[i++] = v;
  |    }
  |  }
  |}
`,
});
