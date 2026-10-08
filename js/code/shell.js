// Shell Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('shell', {
  python: `
  |def shell_sort(a):
  |    n = len(a)
 1|    gap = n // 2
 2|    while gap > 0:
 3|        for i in range(gap, n):
 4|            key = a[i]
 4|            j = i
 5|            while j >= gap and a[j - gap] > key:
 6|                a[j] = a[j - gap]
 6|                j -= gap
 7|            a[j] = key
 8|        gap //= 2
`,
  javascript: `
  |function shellSort(a) {
  |  const n = a.length;
 1,2|  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
 3|    for (let i = gap; i < n; i++) {
 4|      const key = a[i];
 4|      let j = i;
 5|      while (j >= gap && a[j - gap] > key) {
 6|        a[j] = a[j - gap];
 6|        j -= gap;
  |      }
 7|      a[j] = key;
  |    }
 8|  } // (the gap halves at the end of each pass)
  |}
`,
  java: `
  |static void shellSort(int[] a) {
  |  int n = a.length;
 1,2|  for (int gap = n / 2; gap > 0; gap /= 2) {
 3|    for (int i = gap; i < n; i++) {
 4|      int key = a[i];
 4|      int j = i;
 5|      while (j >= gap && a[j - gap] > key) {
 6|        a[j] = a[j - gap];
 6|        j -= gap;
  |      }
 7|      a[j] = key;
  |    }
 8|  } // (gap /= 2 runs at the end of each pass)
  |}
`,
  cpp: `
  |void shellSort(vector<int>& a) {
  |  int n = a.size();
 1,2|  for (int gap = n / 2; gap > 0; gap /= 2) {
 3|    for (int i = gap; i < n; i++) {
 4|      int key = a[i];
 4|      int j = i;
 5|      while (j >= gap && a[j - gap] > key) {
 6|        a[j] = a[j - gap];
 6|        j -= gap;
  |      }
 7|      a[j] = key;
  |    }
 8|  } // (gap /= 2 runs at the end of each pass)
  |}
`,
  c: `
  |void shell_sort(int a[], int n) {
 1,2|  for (int gap = n / 2; gap > 0; gap /= 2) {
 3|    for (int i = gap; i < n; i++) {
 4|      int key = a[i];
 4|      int j = i;
 5|      while (j >= gap && a[j - gap] > key) {
 6|        a[j] = a[j - gap];
 6|        j -= gap;
  |      }
 7|      a[j] = key;
  |    }
 8|  } // (gap /= 2 runs at the end of each pass)
  |}
`,
});
