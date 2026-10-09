// KMP string search in five languages: returns where every match starts.
// "N|" is the pseudocode line each code line matches.
BTA.impl('kmp', {
  python: `
  |def kmp_search(text, pattern):
  |    m = len(pattern)
 1,2|    lps = [0] * m  # lps[q]: longest proper prefix of pattern[:q + 1] that is also its suffix
 1,2|    k = 0
 1,2|    for q in range(1, m):
 1,2|        while k > 0 and pattern[q] != pattern[k]:
 1,2|            k = lps[k - 1]
 1,2|        if pattern[q] == pattern[k]:
 1,2|            k += 1
 1,2|        lps[q] = k
  |    matches = []
 3|    i = j = 0  # i in the text, j in the pattern
 4|    while i < len(text):
 5|        if text[i] == pattern[j]:
 5|            i += 1
 5|            j += 1
 8|            if j == m:
 8|                matches.append(i - m)
 8|                j = lps[m - 1]
 6|        elif j > 0:
 6|            j = lps[j - 1]  # keep what still matches; never go back in the text
 7|        else:
 7|            i += 1
  |    return matches
`,
  javascript: `
  |function kmpSearch(text, pattern) {
  |  const m = pattern.length;
 1,2|  const lps = new Array(m).fill(0); // longest proper prefix that is also a suffix
 1,2|  for (let q = 1, k = 0; q < m; q++) {
 1,2|    while (k > 0 && pattern[q] !== pattern[k]) k = lps[k - 1];
 1,2|    if (pattern[q] === pattern[k]) k++;
 1,2|    lps[q] = k;
  |  }
  |  const matches = [];
 3|  let i = 0, j = 0; // i in the text, j in the pattern
 4|  while (i < text.length) {
 5|    if (text[i] === pattern[j]) {
 5|      i++;
 5|      j++;
 8|      if (j === m) {
 8|        matches.push(i - m);
 8|        j = lps[m - 1];
  |      }
 6|    } else if (j > 0) {
 6|      j = lps[j - 1]; // keep what still matches; never go back in the text
 7|    } else {
 7|      i++;
  |    }
  |  }
  |  return matches;
  |}
`,
  java: `
  |// Needs: import java.util.*;
  |static List<Integer> kmpSearch(String text, String pattern) {
  |  int m = pattern.length();
 1,2|  int[] lps = new int[m]; // longest proper prefix that is also a suffix
 1,2|  for (int q = 1, k = 0; q < m; q++) {
 1,2|    while (k > 0 && pattern.charAt(q) != pattern.charAt(k)) k = lps[k - 1];
 1,2|    if (pattern.charAt(q) == pattern.charAt(k)) k++;
 1,2|    lps[q] = k;
  |  }
  |  List<Integer> matches = new ArrayList<>();
 3|  int i = 0, j = 0; // i in the text, j in the pattern
 4|  while (i < text.length()) {
 5|    if (text.charAt(i) == pattern.charAt(j)) {
 5|      i++;
 5|      j++;
 8|      if (j == m) {
 8|        matches.add(i - m);
 8|        j = lps[m - 1];
  |      }
 6|    } else if (j > 0) {
 6|      j = lps[j - 1]; // keep what still matches; never go back in the text
 7|    } else {
 7|      i++;
  |    }
  |  }
  |  return matches;
  |}
`,
  cpp: `
  |vector<int> kmpSearch(const string& text, const string& pattern) {
  |  int n = text.size(), m = pattern.size();
 1,2|  vector<int> lps(m, 0); // longest proper prefix that is also a suffix
 1,2|  for (int q = 1, k = 0; q < m; q++) {
 1,2|    while (k > 0 && pattern[q] != pattern[k]) k = lps[k - 1];
 1,2|    if (pattern[q] == pattern[k]) k++;
 1,2|    lps[q] = k;
  |  }
  |  vector<int> matches;
 3|  int i = 0, j = 0; // i in the text, j in the pattern
 4|  while (i < n) {
 5|    if (text[i] == pattern[j]) {
 5|      i++;
 5|      j++;
 8|      if (j == m) {
 8|        matches.push_back(i - m);
 8|        j = lps[m - 1];
  |      }
 6|    } else if (j > 0) {
 6|      j = lps[j - 1]; // keep what still matches; never go back in the text
 7|    } else {
 7|      i++;
  |    }
  |  }
  |  return matches;
  |}
`,
  c: `
  |// Needs <string.h>. Writes where every match starts into matches[] and returns how many.
  |int kmp_search(const char *text, const char *pattern, int matches[]) {
  |  int n = strlen(text), m = strlen(pattern), count = 0;
 1,2|  int lps[m]; // longest proper prefix that is also a suffix
 1,2|  lps[0] = 0;
 1,2|  for (int q = 1, k = 0; q < m; q++) {
 1,2|    while (k > 0 && pattern[q] != pattern[k]) k = lps[k - 1];
 1,2|    if (pattern[q] == pattern[k]) k++;
 1,2|    lps[q] = k;
  |  }
 3|  int i = 0, j = 0; // i in the text, j in the pattern
 4|  while (i < n) {
 5|    if (text[i] == pattern[j]) {
 5|      i++;
 5|      j++;
 8|      if (j == m) {
 8|        matches[count++] = i - m;
 8|        j = lps[m - 1];
  |      }
 6|    } else if (j > 0) {
 6|      j = lps[j - 1]; // keep what still matches; never go back in the text
 7|    } else {
 7|      i++;
  |    }
  |  }
  |  return count;
  |}
`,
});
