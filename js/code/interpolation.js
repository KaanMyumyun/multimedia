// Interpolation Search in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('interpolation', {
  python: `
  |def interpolation_search(a, target):  # a must be sorted
 1|    lo, hi = 0, len(a) - 1
 2|    while lo <= hi and a[lo] <= target <= a[hi]:
 3|        if a[hi] == a[lo]:  # only one value left
 3|            pos = lo
 3|        else:
 3,4|            pos = lo + (target - a[lo]) * (hi - lo) // (a[hi] - a[lo])
 5|        if a[pos] == target:
 5|            return pos
 6|        if a[pos] < target:
 6|            lo = pos + 1
 7|        else:
 7|            hi = pos - 1
 8|    return -1  # not found
`,
  javascript: `
  |function interpolationSearch(a, target) { // a must be sorted
 1|  let lo = 0, hi = a.length - 1;
 2|  while (lo <= hi && a[lo] <= target && target <= a[hi]) {
 3|    const pos = a[hi] === a[lo]
 3|      ? lo // only one value left
 3,4|      : lo + Math.floor(((target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));
 5|    if (a[pos] === target) return pos;
 6|    if (a[pos] < target) lo = pos + 1;
 7|    else hi = pos - 1;
  |  }
 8|  return -1; // not found
  |}
`,
  java: `
  |static int interpolationSearch(int[] a, int target) { // a must be sorted
 1|  int lo = 0, hi = a.length - 1;
 2|  while (lo <= hi && a[lo] <= target && target <= a[hi]) {
 3|    int pos = a[hi] == a[lo]
 3|      ? lo // only one value left
 3,4|      : lo + (target - a[lo]) * (hi - lo) / (a[hi] - a[lo]);
 5|    if (a[pos] == target) return pos;
 6|    if (a[pos] < target) lo = pos + 1;
 7|    else hi = pos - 1;
  |  }
 8|  return -1; // not found
  |}
`,
  cpp: `
  |int interpolationSearch(const vector<int>& a, int target) { // a must be sorted
 1|  int lo = 0, hi = a.size() - 1;
 2|  while (lo <= hi && a[lo] <= target && target <= a[hi]) {
 3|    int pos = a[hi] == a[lo]
 3|      ? lo // only one value left
 3,4|      : lo + (target - a[lo]) * (hi - lo) / (a[hi] - a[lo]);
 5|    if (a[pos] == target) return pos;
 6|    if (a[pos] < target) lo = pos + 1;
 7|    else hi = pos - 1;
  |  }
 8|  return -1; // not found
  |}
`,
  c: `
  |int interpolation_search(int a[], int n, int target) { // a must be sorted
 1|  int lo = 0, hi = n - 1;
 2|  while (lo <= hi && a[lo] <= target && target <= a[hi]) {
 3|    int pos = a[hi] == a[lo]
 3|      ? lo // only one value left
 3,4|      : lo + (target - a[lo]) * (hi - lo) / (a[hi] - a[lo]);
 5|    if (a[pos] == target) return pos;
 6|    if (a[pos] < target) lo = pos + 1;
 7|    else hi = pos - 1;
  |  }
 8|  return -1; // not found
  |}
`,
});
