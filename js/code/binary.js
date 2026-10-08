// Binary Search in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('binary', {
  python: `
  |def binary_search(a, target):  # a must be sorted
 1|    lo, hi = 0, len(a) - 1
 2|    while lo <= hi:
 3|        mid = (lo + hi) // 2
 4|        if a[mid] == target:
 5|            return mid
 6|        elif a[mid] < target:
 7|            lo = mid + 1
 8|        else:
 9|            hi = mid - 1
10|    return -1  # not found
`,
  javascript: `
  |function binarySearch(a, target) { // a must be sorted
 1|  let lo = 0, hi = a.length - 1;
 2|  while (lo <= hi) {
 3|    const mid = Math.floor((lo + hi) / 2);
 4|    if (a[mid] === target) {
 5|      return mid;
 6|    } else if (a[mid] < target) {
 7|      lo = mid + 1;
 8|    } else {
 9|      hi = mid - 1;
  |    }
  |  }
10|  return -1; // not found
  |}
`,
  java: `
  |static int binarySearch(int[] a, int target) { // a must be sorted
 1|  int lo = 0, hi = a.length - 1;
 2|  while (lo <= hi) {
 3|    int mid = (lo + hi) / 2;
 4|    if (a[mid] == target) {
 5|      return mid;
 6|    } else if (a[mid] < target) {
 7|      lo = mid + 1;
 8|    } else {
 9|      hi = mid - 1;
  |    }
  |  }
10|  return -1; // not found
  |}
`,
  cpp: `
  |int binarySearch(const vector<int>& a, int target) { // a must be sorted
 1|  int lo = 0, hi = a.size() - 1;
 2|  while (lo <= hi) {
 3|    int mid = (lo + hi) / 2;
 4|    if (a[mid] == target) {
 5|      return mid;
 6|    } else if (a[mid] < target) {
 7|      lo = mid + 1;
 8|    } else {
 9|      hi = mid - 1;
  |    }
  |  }
10|  return -1; // not found
  |}
`,
  c: `
  |int binary_search(int a[], int n, int target) { // a must be sorted
 1|  int lo = 0, hi = n - 1;
 2|  while (lo <= hi) {
 3|    int mid = (lo + hi) / 2;
 4|    if (a[mid] == target) {
 5|      return mid;
 6|    } else if (a[mid] < target) {
 7|      lo = mid + 1;
 8|    } else {
 9|      hi = mid - 1;
  |    }
  |  }
10|  return -1; // not found
  |}
`,
});
