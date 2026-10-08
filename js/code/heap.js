// Heap Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('heap', {
  python: `
 6|def sift_down(a, i, size):
 7|    big = i
 7|    for c in (2 * i + 1, 2 * i + 2):
 7|        if c < size and a[c] > a[big]:
 7|            big = c
 8|    if big != i:
 9|        a[i], a[big] = a[big], a[i]
10|        sift_down(a, big, size)
  |
  |def heap_sort(a):
  |    n = len(a)
 1|    for i in range(n // 2 - 1, -1, -1):
 2|        sift_down(a, i, n)
 3|    for end in range(n - 1, 0, -1):
 4|        a[0], a[end] = a[end], a[0]
 5|        sift_down(a, 0, end)
`,
  javascript: `
 6|function siftDown(a, i, size) {
 7|  let big = i;
 7|  for (const c of [2 * i + 1, 2 * i + 2]) {
 7|    if (c < size && a[c] > a[big]) big = c;
  |  }
 8|  if (big !== i) {
 9|    [a[i], a[big]] = [a[big], a[i]];
10|    siftDown(a, big, size);
  |  }
  |}
  |
  |function heapSort(a) {
  |  const n = a.length;
 1|  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
 2|    siftDown(a, i, n);
  |  }
 3|  for (let end = n - 1; end >= 1; end--) {
 4|    [a[0], a[end]] = [a[end], a[0]];
 5|    siftDown(a, 0, end);
  |  }
  |}
`,
  java: `
 6|static void siftDown(int[] a, int i, int size) {
 7|  int big = i;
 7|  for (int c = 2 * i + 1; c <= 2 * i + 2; c++) {
 7|    if (c < size && a[c] > a[big]) big = c;
  |  }
 8|  if (big != i) {
 9|    int t = a[i]; a[i] = a[big]; a[big] = t;
10|    siftDown(a, big, size);
  |  }
  |}
  |
  |static void heapSort(int[] a) {
  |  int n = a.length;
 1|  for (int i = n / 2 - 1; i >= 0; i--) {
 2|    siftDown(a, i, n);
  |  }
 3|  for (int end = n - 1; end >= 1; end--) {
 4|    int t = a[0]; a[0] = a[end]; a[end] = t;
 5|    siftDown(a, 0, end);
  |  }
  |}
`,
  cpp: `
 6|void siftDown(vector<int>& a, int i, int size) {
 7|  int big = i;
 7|  for (int c = 2 * i + 1; c <= 2 * i + 2; c++) {
 7|    if (c < size && a[c] > a[big]) big = c;
  |  }
 8|  if (big != i) {
 9|    swap(a[i], a[big]);
10|    siftDown(a, big, size);
  |  }
  |}
  |
  |void heapSort(vector<int>& a) {
  |  int n = a.size();
 1|  for (int i = n / 2 - 1; i >= 0; i--) {
 2|    siftDown(a, i, n);
  |  }
 3|  for (int end = n - 1; end >= 1; end--) {
 4|    swap(a[0], a[end]);
 5|    siftDown(a, 0, end);
  |  }
  |}
`,
  c: `
 6|void sift_down(int a[], int i, int size) {
 7|  int big = i;
 7|  for (int c = 2 * i + 1; c <= 2 * i + 2; c++) {
 7|    if (c < size && a[c] > a[big]) big = c;
  |  }
 8|  if (big != i) {
 9|    int t = a[i]; a[i] = a[big]; a[big] = t;
10|    sift_down(a, big, size);
  |  }
  |}
  |
  |void heap_sort(int a[], int n) {
 1|  for (int i = n / 2 - 1; i >= 0; i--) {
 2|    sift_down(a, i, n);
  |  }
 3|  for (int end = n - 1; end >= 1; end--) {
 4|    int t = a[0]; a[0] = a[end]; a[end] = t;
 5|    sift_down(a, 0, end);
  |  }
  |}
`,
});
