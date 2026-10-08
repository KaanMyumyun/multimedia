// Insertion Sort in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('insertion', {
  python: `
  |def insertion_sort(a):
 1|    for i in range(1, len(a)):
 2|        key = a[i]
 3|        j = i - 1
 4|        while j >= 0 and a[j] > key:
 5|            a[j + 1] = a[j]
 5|            j -= 1
 6|        a[j + 1] = key
`,
  javascript: `
  |function insertionSort(a) {
 1|  for (let i = 1; i < a.length; i++) {
 2|    const key = a[i];
 3|    let j = i - 1;
 4|    while (j >= 0 && a[j] > key) {
 5|      a[j + 1] = a[j];
 5|      j--;
  |    }
 6|    a[j + 1] = key;
  |  }
  |}
`,
  java: `
  |static void insertionSort(int[] a) {
 1|  for (int i = 1; i < a.length; i++) {
 2|    int key = a[i];
 3|    int j = i - 1;
 4|    while (j >= 0 && a[j] > key) {
 5|      a[j + 1] = a[j];
 5|      j--;
  |    }
 6|    a[j + 1] = key;
  |  }
  |}
`,
  cpp: `
  |void insertionSort(vector<int>& a) {
  |  int n = a.size();
 1|  for (int i = 1; i < n; i++) {
 2|    int key = a[i];
 3|    int j = i - 1;
 4|    while (j >= 0 && a[j] > key) {
 5|      a[j + 1] = a[j];
 5|      j--;
  |    }
 6|    a[j + 1] = key;
  |  }
  |}
`,
  c: `
  |void insertion_sort(int a[], int n) {
 1|  for (int i = 1; i < n; i++) {
 2|    int key = a[i];
 3|    int j = i - 1;
 4|    while (j >= 0 && a[j] > key) {
 5|      a[j + 1] = a[j];
 5|      j--;
  |    }
 6|    a[j + 1] = key;
  |  }
  |}
`,
});
