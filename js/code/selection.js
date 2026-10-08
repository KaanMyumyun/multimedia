// Selection Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('selection', {
  python: `
  |def selection_sort(a):
  |    n = len(a)
 1|    for i in range(n - 1):
 2|        m = i
 3|        for j in range(i + 1, n):
 4|            if a[j] < a[m]:
 4|                m = j
 5|        a[i], a[m] = a[m], a[i]
`,
  javascript: `
  |function selectionSort(a) {
  |  const n = a.length;
 1|  for (let i = 0; i < n - 1; i++) {
 2|    let min = i;
 3|    for (let j = i + 1; j < n; j++) {
 4|      if (a[j] < a[min]) min = j;
  |    }
 5|    [a[i], a[min]] = [a[min], a[i]];
  |  }
  |}
`,
  java: `
  |static void selectionSort(int[] a) {
  |  int n = a.length;
 1|  for (int i = 0; i < n - 1; i++) {
 2|    int min = i;
 3|    for (int j = i + 1; j < n; j++) {
 4|      if (a[j] < a[min]) min = j;
  |    }
 5|    int t = a[i]; a[i] = a[min]; a[min] = t;
  |  }
  |}
`,
  cpp: `
  |void selectionSort(vector<int>& a) {
  |  int n = a.size();
 1|  for (int i = 0; i < n - 1; i++) {
 2|    int min = i;
 3|    for (int j = i + 1; j < n; j++) {
 4|      if (a[j] < a[min]) min = j;
  |    }
 5|    swap(a[i], a[min]);
  |  }
  |}
`,
  c: `
  |void selection_sort(int a[], int n) {
 1|  for (int i = 0; i < n - 1; i++) {
 2|    int min = i;
 3|    for (int j = i + 1; j < n; j++) {
 4|      if (a[j] < a[min]) min = j;
  |    }
 5|    int t = a[i]; a[i] = a[min]; a[min] = t;
  |  }
  |}
`,
});
