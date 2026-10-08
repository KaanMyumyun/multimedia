# Be the Algorithm

A workbook for learning algorithms by running them yourself. Every step is a question: you pick which two elements Bubble Sort compares, decide whether to swap them, choose which node leaves the BFS queue next, and so on. Each answer gets instant feedback that explains why.

It's a plain static site (HTML, CSS and JavaScript) with no build step. The only outside resource is Google Fonts; without it the page falls back to system fonts.

## Modes

Each algorithm has three modes, switched with the tabs on its page:

- **Learn** steps through a worked example. Each step shows the question, a hint on how to think about it, then the answer and why. Use the back, play and next buttons, the slider, or the arrow keys and space bar.
- **Practice** lets you make every move yourself. Hints and retries are allowed but earn partial credit.
- **Test** gives one attempt per question, with no hints and no way to reveal the answer.

## Grading

Each question is worth one point.

| Practice                  | Credit |
| ------------------------- | ------ |
| Right on the first try    | 1      |
| Right after using a hint  | ¾      |
| Right on the second try   | ½      |
| Right after more tries    | ¼      |
| Answer revealed           | 0      |

In Test mode a question scores 1 if your first answer is right and 0 otherwise.

The percentage becomes a letter grade on the usual scale: A+ 97, A 93, A− 90, B+ 87, B 83, B− 80, C+ 77, C 73, C− 70, D+ 67, D 60, and F below that. The results screen shows the grade, a breakdown of how each point was earned, and a review of every question you missed with the right answer. Best grades per algorithm appear on the contents page and on the report card (`#/report`).

## Your own arrays and shareable links

- **Your own array:** every array exercise has a *Your own array* button. Type numbers separated by spaces or commas, and a target for searches. Searches that need a sorted array sort it for you.
- **Links:** the address bar always holds the exact exercise, so *Copy link* gives you a link that opens the same array (or graph) in the same mode. The format is:
  - `#/bubble?a=8,3,5,1`, or `#/bubble/test?a=8,3,5,1` to open it in Test mode
  - `#/binary?a=3,8,15,23&t=15` for a search, where `t` is the target
  - `#/dijkstra?e=AB3,AC5,BD2` for a graph: each edge is two node letters, plus a weight for Dijkstra
  - `#/race?a=5,1,4,2,3` for the race

## Code in five languages

The sidebar's *Code* panel shows each algorithm as pseudocode, Python, JavaScript, Java, C++ or C. The line for the current step is highlighted in whichever language you pick, and the choice is remembered. Every snippet has been compiled and run against the exercises' own answers.

## Sort race

`#/race` runs all eight array sorts on the same array at once, one step per tick. You can guess the winner first, then compare comparisons and moves in two bar charts and a results table. The *Random*, *Nearly sorted*, *Reversed* and *Already sorted* buttons show where each sort does well or badly.

## Algorithms

The site is split into two pages ("books"):

**Sorting** (`#/`, the home page)

- Simple sorts: Bubble, Selection, Insertion
- Efficient sorts: Shell, Merge, Quick, Heap
- Special-purpose sorts: Counting Sort, Topological Sort

**Searching** (`#/searching`)

- Searching an array: Linear, Binary, Jump, Interpolation, Exponential
- Searching a graph: Breadth-First Search, Depth-First Search, Dijkstra’s Algorithm

Which algorithms go on which page, and in what order, is set by `BOOKS` at the top of `js/app.js`.

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
css/styles.css        all styles (light and dark themes)
js/core.js            algorithm registry and shared helpers (views, graphs, typed-in input, links)
js/render.js          draws a view: array tiles, heap tree, graph SVG, move animations
js/app.js             routing, contents, report card, lesson player, question engine, grading,
                      the Code panel and the "Your own array" form
js/race.js            the sort race page
js/algorithms/*.js    one file per algorithm
js/code/*.js          the same algorithm in Python, JavaScript, Java, C++ and C
```

## Adding an algorithm

Create `js/algorithms/<name>.js`, add a `<script>` tag for it in `index.html`, call `BTA.register({...})`, and add its id to a part in `BOOKS` in `js/app.js`. The full contract is documented at the top of `js/core.js`. In short:

- `generate(size)` returns a random input.
- `build(input)` simulates the algorithm and returns `{ steps, final, stats }`.
- Each step is one question: a `view` to show, a `prompt`, an `ask` (`pick`, `multi`, `choice` or `info`), the feedback texts `correct`, `wrong` and `hint`, and optionally an `after` view that is animated in once the answer is right.

Learn mode is built from the same steps, so a new algorithm gets all three modes for free.

To go with it:

- **Input rules.** Array exercises declare their size picker in `input`, plus rules for typed-in arrays, such as `target: true` for a search and `sorted: true` if it needs sorted input. Graph exercises declare `graph: { weighted, directed }` instead. Links and the *Your own array* form then work automatically.
- **Code.** Add `js/code/<name>.js` calling `BTA.impl(id, { python, javascript, java, cpp, c })`. Start each source line with the pseudocode line number it matches, as in `4|    if a[j] > a[j + 1]:`. Use ` |` for lines that match none.
- **Race.** An array sort can add `trace(values)`, returning its operations (compare, swap, write), and it joins the race.

Grades are kept in the visitor's browser (`localStorage`). Nothing is sent anywhere.
