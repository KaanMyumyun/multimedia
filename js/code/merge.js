// Merge Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('merge', {
  python: `
  |# Call it as merge_sort(a, 0, len(a) - 1)
 1|def merge_sort(a, lo, hi):
 2|    if lo >= hi:
 2|        return
 3|    mid = (lo + hi) // 2
 4|    merge_sort(a, lo, mid)
 5|    merge_sort(a, mid + 1, hi)
  |    left, right = a[lo:mid + 1], a[mid + 1:hi + 1]
  |    i = j = 0
  |    k = lo
 6|    while i < len(left) and j < len(right):
 7|        if left[i] <= right[j]:
 7|            a[k] = left[i]
 7|            i += 1
 7|        else:
 7|            a[k] = right[j]
 7|            j += 1
 7|        k += 1
 8|    for x in left[i:] + right[j:]:
 8|        a[k] = x
 8|        k += 1
`,
  javascript: `
  |// Call it as mergeSort(a, 0, a.length - 1)
 1|function mergeSort(a, lo, hi) {
 2|  if (lo >= hi) return;
 3|  const mid = Math.floor((lo + hi) / 2);
 4|  mergeSort(a, lo, mid);
 5|  mergeSort(a, mid + 1, hi);
  |  const left = a.slice(lo, mid + 1);
  |  const right = a.slice(mid + 1, hi + 1);
  |  let i = 0, j = 0, k = lo;
 6|  while (i < left.length && j < right.length) {
 7|    a[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  |  }
 8|  while (i < left.length) a[k++] = left[i++];
 8|  while (j < right.length) a[k++] = right[j++];
  |}
`,
  java: `
  |// Call it as mergeSort(a, 0, a.length - 1). Needs: import java.util.Arrays;
 1|static void mergeSort(int[] a, int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int mid = (lo + hi) / 2;
 4|  mergeSort(a, lo, mid);
 5|  mergeSort(a, mid + 1, hi);
  |  int[] left = Arrays.copyOfRange(a, lo, mid + 1);
  |  int[] right = Arrays.copyOfRange(a, mid + 1, hi + 1);
  |  int i = 0, j = 0, k = lo;
 6|  while (i < left.length && j < right.length) {
 7|    a[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  |  }
 8|  while (i < left.length) a[k++] = left[i++];
 8|  while (j < right.length) a[k++] = right[j++];
  |}
`,
  cpp: `
  |// Call it as mergeSort(a, 0, a.size() - 1)
 1|void mergeSort(vector<int>& a, int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int mid = (lo + hi) / 2;
 4|  mergeSort(a, lo, mid);
 5|  mergeSort(a, mid + 1, hi);
  |  vector<int> left(a.begin() + lo, a.begin() + mid + 1);
  |  vector<int> right(a.begin() + mid + 1, a.begin() + hi + 1);
  |  size_t i = 0, j = 0;
  |  int k = lo;
 6|  while (i < left.size() && j < right.size()) {
 7|    a[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  |  }
 8|  while (i < left.size()) a[k++] = left[i++];
 8|  while (j < right.size()) a[k++] = right[j++];
  |}
`,
  c: `
  |// Call it as merge_sort(a, 0, n - 1)
 1|void merge_sort(int a[], int lo, int hi) {
 2|  if (lo >= hi) return;
 3|  int mid = (lo + hi) / 2;
 4|  merge_sort(a, lo, mid);
 5|  merge_sort(a, mid + 1, hi);
  |  int tmp[hi - lo + 1];
  |  int i = lo, j = mid + 1, k = 0;
 6|  while (i <= mid && j <= hi) {
 7|    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
  |  }
 8|  while (i <= mid) tmp[k++] = a[i++];
 8|  while (j <= hi) tmp[k++] = a[j++];
  |  for (k = 0; k <= hi - lo; k++) a[lo + k] = tmp[k];
  |}
`,
});
