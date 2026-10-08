// Quick Sort (Lomuto partition) in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('quick', {
  python: `
  |# Call it as quick_sort(a, 0, len(a) - 1)
 1|def quick_sort(a, lo, hi):
 2|    if lo >= hi:
 2|        return
 3|    pivot = a[hi]
 3|    i = lo
 4|    for j in range(lo, hi):
 5|        if a[j] < pivot:
 6|            a[i], a[j] = a[j], a[i]
 6|            i += 1
 7|    a[i], a[hi] = a[hi], a[i]
 8|    quick_sort(a, lo, i - 1)
 9|    quick_sort(a, i + 1, hi)
`,
  javascript: `
  |// Call it as quickSort(a, 0, a.length - 1)
 1|function quickSort(a, lo, hi) {
 2|  if (lo >= hi) return;
 3|  const pivot = a[hi];
 3|  let i = lo;
 4|  for (let j = lo; j < hi; j++) {
 5|    if (a[j] < pivot) {
 6|      [a[i], a[j]] = [a[j], a[i]];
 6|      i++;
  |    }
  |  }
 7|  [a[i], a[hi]] = [a[hi], a[i]];
 8|  quickSort(a, lo, i - 1);
 9|  quickSort(a, i + 1, hi);
  |}
`,
  java: `
  |// Call it as quickSort(a, 0, a.length - 1)
 1|static void quickSort(int[] a, int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int pivot = a[hi];
 3|  int i = lo;
 4|  for (int j = lo; j < hi; j++) {
 5|    if (a[j] < pivot) {
 6|      int t = a[i]; a[i] = a[j]; a[j] = t;
 6|      i++;
  |    }
  |  }
 7|  int t = a[i]; a[i] = a[hi]; a[hi] = t;
 8|  quickSort(a, lo, i - 1);
 9|  quickSort(a, i + 1, hi);
  |}
`,
  cpp: `
  |// Call it as quickSort(a, 0, a.size() - 1)
 1|void quickSort(vector<int>& a, int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int pivot = a[hi];
 3|  int i = lo;
 4|  for (int j = lo; j < hi; j++) {
 5|    if (a[j] < pivot) {
 6|      swap(a[i], a[j]);
 6|      i++;
  |    }
  |  }
 7|  swap(a[i], a[hi]);
 8|  quickSort(a, lo, i - 1);
 9|  quickSort(a, i + 1, hi);
  |}
`,
  c: `
  |// Call it as quick_sort(a, 0, n - 1)
 1|void quick_sort(int a[], int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int pivot = a[hi];
 3|  int i = lo;
 4|  for (int j = lo; j < hi; j++) {
 5|    if (a[j] < pivot) {
 6|      int t = a[i]; a[i] = a[j]; a[j] = t;
 6|      i++;
  |    }
  |  }
 7|  int t = a[i]; a[i] = a[hi]; a[hi] = t;
 8|  quick_sort(a, lo, i - 1);
 9|  quick_sort(a, i + 1, hi);
  |}
`,
});
