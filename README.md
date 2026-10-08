# Be the Algorithm

An interactive site for learning algorithms by running them yourself. Every step is a question: you pick which two elements Bubble Sort compares, decide whether to swap them, choose which node leaves the BFS queue next, and so on. Each answer gets instant feedback that explains why, and you get a score at the end.

It's a plain static site (HTML, CSS and JavaScript) with no build step and no dependencies.

## Algorithms

| Sorting        | Searching     | Graphs               |
| -------------- | ------------- | -------------------- |
| Bubble Sort    | Binary Search | Breadth-First Search |
| Selection Sort |               | Depth-First Search   |
| Insertion Sort |               | Dijkstra’s Algorithm |
| Merge Sort     |               |                      |
| Quick Sort     |               |                      |
| Heap Sort      |               |                      |

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
js/core.js            algorithm registry and shared helpers (views, random graphs)
js/render.js          draws a view: array tiles, heap tree, graph SVG, move animations
js/app.js             routing, home page, question engine, scoring, results
js/algorithms/*.js    one file per algorithm
```

## Adding an algorithm

Create `js/algorithms/<name>.js`, add a `<script>` tag for it in `index.html`, and call `BTA.register({...})`. The full contract is documented at the top of `js/core.js`. In short:

- `generate(size)` returns a random input.
- `build(input)` simulates the algorithm and returns `{ steps, final, stats }`.
- Each step is one question: a `view` to show, a `prompt`, an `ask` (`pick`, `multi`, `choice` or `info`), the feedback texts `correct`, `wrong` and `hint`, and optionally an `after` view that is animated in once the answer is right.

Best scores are kept in the visitor's browser (`localStorage`). Nothing is sent anywhere.
