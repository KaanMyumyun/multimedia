// Jump Search in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('jump', {
  python: `
  |import math
  |
  |def jump_search(a, target):  # a must be sorted
  |    n = len(a)
 1|    m = math.isqrt(n)  # block size
 1|    start = 0
 2|    while a[min(start + m, n) - 1] < target:
 3|        start += m
 4|        if start >= n:
 4|            return -1  # not found
 5|    for i in range(start, min(start + m, n)):
 6|        if a[i] == target:
 6|            return i
 7|        if a[i] > target:
 7|            return -1  # not found
  |    return -1
`,
  javascript: `
  |function jumpSearch(a, target) { // a must be sorted
  |  const n = a.length;
 1|  const m = Math.floor(Math.sqrt(n)); // block size
 1|  let start = 0;
 2|  while (a[Math.min(start + m, n) - 1] < target) {
 3|    start += m;
 4|    if (start >= n) return -1; // not found
  |  }
 5|  for (let i = start; i < Math.min(start + m, n); i++) {
 6|    if (a[i] === target) return i;
 7|    if (a[i] > target) return -1; // not found
  |  }
  |  return -1;
  |}
`,
  java: `
  |static int jumpSearch(int[] a, int target) { // a must be sorted
  |  int n = a.length;
 1|  int m = (int) Math.sqrt(n); // block size
 1|  int start = 0;
 2|  while (a[Math.min(start + m, n) - 1] < target) {
 3|    start += m;
 4|    if (start >= n) return -1; // not found
  |  }
 5|  for (int i = start; i < Math.min(start + m, n); i++) {
 6|    if (a[i] == target) return i;
 7|    if (a[i] > target) return -1; // not found
  |  }
  |  return -1;
  |}
`,
  cpp: `
  |int jumpSearch(const vector<int>& a, int target) { // a must be sorted
  |  int n = a.size();
 1|  int m = (int) sqrt(n); // block size
 1|  int start = 0;
 2|  while (a[min(start + m, n) - 1] < target) {
 3|    start += m;
 4|    if (start >= n) return -1; // not found
  |  }
 5|  for (int i = start; i < min(start + m, n); i++) {
 6|    if (a[i] == target) return i;
 7|    if (a[i] > target) return -1; // not found
  |  }
  |  return -1;
  |}
`,
  c: `
  |int jump_search(int a[], int n, int target) { // a must be sorted
 1|  int m = 1, start = 0;
 1|  while ((m + 1) * (m + 1) <= n) m++; // block size: the whole part of sqrt(n)
 2|  while (a[(start + m < n ? start + m : n) - 1] < target) {
 3|    start += m;
 4|    if (start >= n) return -1; // not found
  |  }
 5|  for (int i = start; i < start + m && i < n; i++) {
 6|    if (a[i] == target) return i;
 7|    if (a[i] > target) return -1; // not found
  |  }
  |  return -1;
  |}
`,
});
