// Bubble Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('bubble', {
  python: `
  |def bubble_sort(a):
  |    n = len(a)
 1|    for p in range(n - 1):
 2|        swapped = False
 3|        for j in range(n - 1 - p):
 4|            if a[j] > a[j + 1]:
 5|                a[j], a[j + 1] = a[j + 1], a[j]
 6|                swapped = True
 7|        if not swapped:
 7|            break  # already sorted
`,
  javascript: `
  |function bubbleSort(a) {
  |  const n = a.length;
 1|  for (let pass = 0; pass < n - 1; pass++) {
 2|    let swapped = false;
 3|    for (let j = 0; j < n - 1 - pass; j++) {
 4|      if (a[j] > a[j + 1]) {
 5|        [a[j], a[j + 1]] = [a[j + 1], a[j]];
 6|        swapped = true;
  |      }
  |    }
 7|    if (!swapped) break; // already sorted
  |  }
  |}
`,
  java: `
  |static void bubbleSort(int[] a) {
  |  int n = a.length;
 1|  for (int pass = 0; pass < n - 1; pass++) {
 2|    boolean swapped = false;
 3|    for (int j = 0; j < n - 1 - pass; j++) {
 4|      if (a[j] > a[j + 1]) {
 5|        int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
 6|        swapped = true;
  |      }
  |    }
 7|    if (!swapped) break; // already sorted
  |  }
  |}
`,
  cpp: `
  |void bubbleSort(vector<int>& a) {
  |  int n = a.size();
 1|  for (int pass = 0; pass < n - 1; pass++) {
 2|    bool swapped = false;
 3|    for (int j = 0; j < n - 1 - pass; j++) {
 4|      if (a[j] > a[j + 1]) {
 5|        swap(a[j], a[j + 1]);
 6|        swapped = true;
  |      }
  |    }
 7|    if (!swapped) break; // already sorted
  |  }
  |}
`,
  c: `
  |void bubble_sort(int a[], int n) {
 1|  for (int pass = 0; pass < n - 1; pass++) {
 2|    int swapped = 0;
 3|    for (int j = 0; j < n - 1 - pass; j++) {
 4|      if (a[j] > a[j + 1]) {
 5|        int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
 6|        swapped = 1;
  |      }
  |    }
 7|    if (!swapped) break; // already sorted
  |  }
  |}
`,
});
