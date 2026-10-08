// Linear Search in five languages. "N|" is the pseudocode line each code line matches.
BTA.impl('linear', {
  python: `
  |def linear_search(a, target):
 1|    for i in range(len(a)):
 2|        if a[i] == target:
 3|            return i
 4|    return -1  # not found
`,
  javascript: `
  |function linearSearch(a, target) {
 1|  for (let i = 0; i < a.length; i++) {
 2|    if (a[i] === target) {
 3|      return i;
  |    }
  |  }
 4|  return -1; // not found
  |}
`,
  java: `
  |static int linearSearch(int[] a, int target) {
 1|  for (int i = 0; i < a.length; i++) {
 2|    if (a[i] == target) {
 3|      return i;
  |    }
  |  }
 4|  return -1; // not found
  |}
`,
  cpp: `
  |int linearSearch(const vector<int>& a, int target) {
  |  int n = a.size();
 1|  for (int i = 0; i < n; i++) {
 2|    if (a[i] == target) {
 3|      return i;
  |    }
  |  }
 4|  return -1; // not found
  |}
`,
  c: `
  |int linear_search(int a[], int n, int target) {
 1|  for (int i = 0; i < n; i++) {
 2|    if (a[i] == target) {
 3|      return i;
  |    }
  |  }
 4|  return -1; // not found
  |}
`,
});
