// Exponential Search in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('exponential', {
  python: `
  |def exponential_search(a, target):  # a must be sorted
  |    n = len(a)
 1|    if a[0] == target:
 1|        return 0
 2|    i = 1
 3|    while i < n and a[i] < target:
 4|        i *= 2
 5|    lo, hi = i // 2, min(i, n - 1)
 6|    while lo <= hi:  # binary search a[lo..hi]
 6|        mid = (lo + hi) // 2
 6|        if a[mid] == target:
 6|            return mid
 6|        if a[mid] < target:
 6|            lo = mid + 1
 6|        else:
 6|            hi = mid - 1
  |    return -1  # not found
`,
  javascript: `
  |function exponentialSearch(a, target) { // a must be sorted
  |  const n = a.length;
 1|  if (a[0] === target) return 0;
 2|  let i = 1;
 3|  while (i < n && a[i] < target) {
 4|    i *= 2;
  |  }
 5|  let lo = Math.floor(i / 2), hi = Math.min(i, n - 1);
 6|  while (lo <= hi) { // binary search a[lo..hi]
 6|    const mid = Math.floor((lo + hi) / 2);
 6|    if (a[mid] === target) return mid;
 6|    if (a[mid] < target) lo = mid + 1;
 6|    else hi = mid - 1;
  |  }
  |  return -1; // not found
  |}
`,
  java: `
  |static int exponentialSearch(int[] a, int target) { // a must be sorted
  |  int n = a.length;
 1|  if (a[0] == target) return 0;
 2|  int i = 1;
 3|  while (i < n && a[i] < target) {
 4|    i *= 2;
  |  }
 5|  int lo = i / 2, hi = Math.min(i, n - 1);
 6|  while (lo <= hi) { // binary search a[lo..hi]
 6|    int mid = (lo + hi) / 2;
 6|    if (a[mid] == target) return mid;
 6|    if (a[mid] < target) lo = mid + 1;
 6|    else hi = mid - 1;
  |  }
  |  return -1; // not found
  |}
`,
  cpp: `
  |int exponentialSearch(const vector<int>& a, int target) { // a must be sorted
  |  int n = a.size();
 1|  if (a[0] == target) return 0;
 2|  int i = 1;
 3|  while (i < n && a[i] < target) {
 4|    i *= 2;
  |  }
 5|  int lo = i / 2, hi = min(i, n - 1);
 6|  while (lo <= hi) { // binary search a[lo..hi]
 6|    int mid = (lo + hi) / 2;
 6|    if (a[mid] == target) return mid;
 6|    if (a[mid] < target) lo = mid + 1;
 6|    else hi = mid - 1;
  |  }
  |  return -1; // not found
  |}
`,
  c: `
  |int exponential_search(int a[], int n, int target) { // a must be sorted
 1|  if (a[0] == target) return 0;
 2|  int i = 1;
 3|  while (i < n && a[i] < target) {
 4|    i *= 2;
  |  }
 5|  int lo = i / 2, hi = i < n - 1 ? i : n - 1;
 6|  while (lo <= hi) { // binary search a[lo..hi]
 6|    int mid = (lo + hi) / 2;
 6|    if (a[mid] == target) return mid;
 6|    if (a[mid] < target) lo = mid + 1;
 6|    else hi = mid - 1;
  |  }
  |  return -1; // not found
  |}
`,
});
