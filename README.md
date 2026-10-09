# Be the Algorithm

A workbook for learning algorithms by running them yourself. Every step is a question: you pick which two elements Bubble Sort compares, decide whether to swap them, choose which node leaves the BFS queue next, and so on. Each answer gets instant feedback that explains why.

It's a plain static site (HTML, CSS and JavaScript) with no build step. The only outside resource is Google Fonts; without it the page falls back to system fonts.

## Modes

Each algorithm has four modes, switched with the tabs on its page:

- **Learn** steps through a worked example. Each step shows the question, a hint on how to think about it, then the answer and why. Use the back, play and next buttons, the slider, or the arrow keys and space bar.
- **Practice** lets you make every move yourself. Hints and retries are allowed but earn partial credit.
- **Test** gives one attempt per question, with no hints and no way to reveal the answer.
- **Quiz** asks five questions about the algorithm as a whole: speed, memory, stability, and when to use it. One attempt each.

**Fast-forward** (Practice and Test): once you answer three questions of one kind right first time in a row, the rest of that kind play by themselves, so a long Bubble Sort doesn't ask "swap or keep?" twenty times. Fast-forwarded questions aren't graded. A checkbox turns it off, and "Keep asking me" turns it off for one kind.

**Drills** (`#/bubble/drill?k=swap`): ten questions of just one kind, each from a fresh exercise. Every algorithm page lists its kinds of question, how often you get each right first time, and a *Drill* link for each. The report card lists your weakest kinds across all algorithms.

## Grading

Each question is worth one point.

| Practice and drills       | Credit |
| ------------------------- | ------ |
| Right on the first try    | 1      |
| Right after using a hint  | ¾      |
| Right on the second try   | ½      |
| Right after more tries    | ¼      |
| Answer revealed           | 0      |

In Test, Quiz and the daily challenge a question scores 1 if your first answer is right and 0 otherwise.

The percentage becomes a letter grade on the usual scale: A+ 97, A 93, A− 90, B+ 87, B 83, B− 80, C+ 77, C 73, C− 70, D+ 67, D 60, and F below that. The results screen shows the grade, a breakdown of how each point was earned, and a review of every question you missed with the right answer. Best grades appear on the book pages and on the report card (`#/report`).

## Daily challenge

`#/daily` gives everyone the same exercise each day, under test rules. The date picks the algorithm and seeds its random input, so no server is needed; every algorithm comes round once before any repeats. Afterwards you get a result to share, like:

```
Be the Algorithm · Daily · 2026-10-09
Quick Sort · A− · 11/12
🟩🟩🟩🟥🟩🟩🟩🟩🟩🟩
🟩🟩
https://your-site.pages.dev/#/daily
```

One go per day; the result and your streak are kept in your browser.

## Your own input and shareable links

- **Your own array:** every array exercise has a *Your own array* button. Type whole numbers from -99 to 99 separated by spaces or commas, and a target for searches. Searches that need a sorted array sort it for you. Counting Sort only takes 0 to 9 (each value is the number of its counter) and Radix Sort 0 to 99.
- **Your own text:** KMP takes a text and a pattern of letters.
- **Your own graph:** graph exercises have a *Your own graph* editor. Click the lines to add or remove edges (or turn arrows round), and set weights in the list. Graphs are checked before use: every node connected, no cycle for Topological Sort, no negative cycle for Bellman-Ford, no ties that would give a question two right answers.
- **Links:** the address bar always holds the exact exercise, so *Copy link* gives a link that opens it again, in the same mode:
  - `#/bubble?a=8,3,5,1`, or `#/bubble/test?a=8,3,5,1` to open it in Test mode
  - `#/binary?a=3,8,15,23&t=15` for a search, where `t` is the target
  - `#/dijkstra?e=AB3,AC5,BD2` for a graph: two node letters per edge, plus a weight (`AB-3` for a negative one)
  - `#/kmp?s=ABABCABAB&p=ABAB` for a text search
  - `#/race?a=5,1,4,2,3` for the race

## Printable worksheets

The *Worksheet* button (`#/bubble/sheet?a=…`) turns the current exercise into a sheet to print: every question in order with a picture of the array or graph at that moment and room to answer, then an answer key on a page of its own.

## Code in five languages

The sidebar's *Code* panel shows each algorithm as pseudocode, Python, JavaScript, Java, C++ or C. The line for the current step is highlighted in whichever language you pick, and the choice is remembered. On phones the panel is a drawer at the bottom of the screen that shows the current line and pulls up to the full code. Every snippet has been compiled and run against the exercises' own answers.

## Sort race and growth chart

`#/race` runs all nine array sorts on the same array at once, one step per tick. You can guess the winner first, then compare comparisons and moves in two bar charts and a results table.

`#/race/growth` plots each sort's comparisons, moves or total steps for arrays of 4 to 64 elements, so O(n²) and O(n log n) show up as curves. Pick two sorts to compare; the others stay as grey lines. Hover, or use the arrow keys on the chart, to read any size; *Show the numbers* has the full table.

## Algorithms

The site is split into two pages ("books"):

**Sorting** (`#/`, the home page)

- Simple sorts: Bubble, Selection, Insertion
- Efficient sorts: Shell, Merge, Quick, Heap
- Special-purpose sorts: Counting, Radix, Topological Sort

**Searching** (`#/searching`)

- Searching an array: Linear, Binary, Jump, Interpolation, Exponential
- Searching a graph: Breadth-First Search, Depth-First Search
- Shortest paths and spanning trees: Dijkstra, Bellman-Ford, A*, Kruskal
- Searching text: KMP

Which algorithms go on which page, and in what order, is set by `BOOKS` at the top of `js/app.js`.

## Light and dark

The site follows your system's light or dark setting. The switch in the top bar cycles Auto, Light and Dark, and is remembered.

## Run locally

Open `index.html` in a browser. Or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to Cloudflare Pages

**Dashboard (Git):** push this folder to a GitHub or GitLab repo. In Cloudflare go to *Workers & Pages → Create → Pages → Connect to Git*, pick the repo, then set:

- Framework preset: **None**
- Build command: *(leave empty)*
- Build output directory: **`/`**

**Direct upload (no Git):**

```sh
npx wrangler pages deploy . --project-name be-the-algorithm
```

The site uses hash URLs (`/#/bubble`), so no redirect rules are needed. `_headers` sets a few security headers and a short cache lifetime for the JS and CSS.

## Project layout

```
index.html            page shell; loads the scripts in order
css/styles.css        all styles (light and dark themes, print)
js/core.js            algorithm registry and shared helpers (views, graphs, typed-in input,
                      links, drills, quizzes, seeded randomness)
js/render.js          draws a view: array tiles, buckets, heap tree, graph SVG, move animations
js/app.js             routing, book pages, report card, lesson player, question engine,
                      grading, fast-forward, the Code panel and the input forms
js/algorithms/*.js    one file per algorithm
js/code/*.js          the same algorithm in Python, JavaScript, Java, C++ and C
js/quizzes.js         the concept questions for Quiz mode
js/daily.js           the daily challenge
js/editor.js          the "Your own graph" editor
js/worksheet.js       printable worksheets
js/race.js            the sort race page
js/growth.js          the growth chart page
```

## Adding an algorithm

Create `js/algorithms/<name>.js`, add a `<script>` tag for it in `index.html`, call `BTA.register({...})`, and add its id to a part in `BOOKS` in `js/app.js`. The full contract is documented at the top of `js/core.js`. In short:

- `generate(size)` returns a random input.
- `build(input)` simulates the algorithm and returns `{ steps, final, stats }`.
- Each step is one question: a `view` to show, a `prompt`, an `ask` (`pick`, `multi`, `choice` or `info`), the feedback texts `correct`, `wrong` and `hint`, and optionally an `after` view that is animated in once the answer is right.
- Every question has a `kind` (a key of the algorithm's `kinds`, which gives each kind a readable name). Fast-forward and drills group questions by it, so it must not depend on the answer.

Learn mode is built from the same steps, so a new algorithm gets every mode for free.

To go with it:

- **Input rules.** Array exercises declare their size picker in `input`, plus rules for typed-in arrays, such as `target: true` for a search, `sorted: true` if it needs sorted input, or `text: true` for a text search. Graph exercises declare `graph: { weighted, directed, negative }` instead, and can add `validate(graph)`. Links, the input forms and the graph editor then work automatically.
- **Code.** Add `js/code/<name>.js` calling `BTA.impl(id, { python, javascript, java, cpp, c })`. Start each source line with the pseudocode line number it matches, as in `4|    if a[j] > a[j + 1]:`. Use ` |` for lines that match none.
- **Quiz.** Add its questions to `js/quizzes.js` with `BTA.quiz(id, [...])`.
- **Race.** An array sort can add `trace(values)`, returning its operations (compare, swap, write), and it joins the race and the growth chart.

Grades, drill statistics and daily results are kept in the visitor's browser (`localStorage`). Nothing is sent anywhere.
