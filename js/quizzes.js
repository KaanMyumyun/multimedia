/*
 * Concept questions for each algorithm's Quiz mode: things the step-by-step exercises can't
 * ask, like speed, memory, stability and when to use it. The right option is written first
 * here (answer: 0); the options are shuffled every time they are shown.
 */
(function () {
  'use strict';
  const q = (question, options, why) => ({ q: question, options, answer: 0, why });

  BTA.quiz('bubble', [
    q('In the worst case, about how many comparisons does Bubble Sort make on n elements?', ['About n²/2', 'About n log₂ n', 'About n', 'About 2n'],
      'Each pass compares neighbours: (n − 1) + (n − 2) + … + 1 = n(n − 1)/2, which is about n²/2.'),
    q('Which input lets Bubble Sort (with its early stop) finish fastest?', ['An array that is already sorted', 'A reversed array', 'A random array', 'Every input takes the same time'],
      'One pass with no swaps proves the array is sorted, so it stops after n − 1 comparisons: O(n).'),
    q('Is Bubble Sort stable: does it keep equal values in their original order?', ['Yes', 'No'],
      'It only swaps neighbours when the left one is strictly bigger, so equal values never pass each other.'),
    q('After the first pass, what is certain?', ['The largest value is in the last position', 'The smallest value is in the first position', 'The first half is sorted', 'Nothing yet'],
      'Every comparison carries the bigger value to the right, so the largest one bubbles all the way to the end.'),
    q('How much extra memory does Bubble Sort need?', ['O(1): one spare variable for swaps', 'O(n): a second array', 'O(log n), for recursion', 'O(n²)'],
      'It sorts in place, swapping neighbours inside the array.'),
  ]);

  BTA.quiz('selection', [
    q('How many comparisons does Selection Sort make on an array that is already sorted?', ['About n²/2, the same as always', 'n − 1', 'None', 'About n log₂ n'],
      'It still scans the whole unsorted part every round to be sure it has the smallest: (n − 1) + … + 1 comparisons, whatever the order.'),
    q('What is Selection Sort better at than Bubble or Insertion Sort?', ['Making few swaps: at most n − 1', 'Keeping equal values in order', 'Nearly sorted data', 'Avoiding comparisons'],
      'One swap per round makes it a fit when writing to memory is expensive.'),
    q('Is Selection Sort stable?', ['No', 'Yes'],
      'Its long-distance swap can jump an element over an equal one: [5a, 5b, 1] becomes [1, 5b, 5a].'),
    q('After k rounds, what is true?', ['The first k positions hold the k smallest values, in order', 'The last k positions are sorted', 'Exactly half the array is sorted', 'Only the first value is in place'],
      'Each round puts the next smallest value at the front of the unsorted part.'),
    q('What is its best-case running time?', ['O(n²)', 'O(n)', 'O(n log n)', 'O(1)'],
      'It can’t stop early: it always scans the unsorted part, so even the best case is O(n²).'),
  ]);

  BTA.quiz('insertion', [
    q('Which input is fastest for Insertion Sort?', ['Already sorted', 'Reversed', 'Random', 'All are equally fast'],
      'Each key needs just one comparison to see it is already in place: n − 1 comparisons in total, O(n).'),
    q('Which input is slowest?', ['Reversed', 'Already sorted', 'Nearly sorted', 'All are equally slow'],
      'Every key has to shift past every element before it: about n²/2 comparisons and shifts.'),
    q('Why do fast library sorts often switch to Insertion Sort for small pieces?', ['It has very little overhead, and it is quick on short or nearly sorted data', 'It is O(n log n)', 'It makes no comparisons', 'It is the only stable sort'],
      'For a dozen or so elements its simple loop beats the bookkeeping of Merge or Quick Sort.'),
    q('Is Insertion Sort stable?', ['Yes', 'No'],
      'A key only moves past elements that are strictly bigger, so equal values keep their order.'),
    q('Once the key at position i has been inserted, what is true?', ['The first i + 1 elements are sorted among themselves', 'The first i + 1 elements are in their final places', 'The i largest values are at the end', 'Nothing yet'],
      'They are in order relative to each other, but a later key may still slide in between them, so they aren’t final.'),
  ]);

  BTA.quiz('shell', [
    q('What does Shell Sort do before its final pass?', ['Insertion-sorts elements that are a big gap apart', 'Splits the array in halves and merges them', 'Picks a pivot', 'Builds a heap'],
      'Sorting far-apart elements first lets a small value far to the right jump a long way in one move.'),
    q('What is the last pass of Shell Sort?', ['Plain insertion sort, with gap 1', 'A merge', 'A swap of the first and last element', 'A check that changes nothing'],
      'Gap 1 compares neighbours, which guarantees a sorted result. The earlier passes just make that pass quick.'),
    q('Is Shell Sort stable?', ['No', 'Yes'],
      'Elements jump over others when the gap is big, so equal values can swap order.'),
    q('Does Shell Sort need extra memory?', ['No, it sorts in place', 'Yes, a second array', 'Yes, a stack for recursion', 'Yes, ten buckets'],
      'Like Insertion Sort, it only shifts elements within the array.'),
    q('What mostly decides how fast Shell Sort is?', ['The sequence of gaps', 'How big the values are', 'How many values repeat', 'The first element'],
      'Halving the gap, as here, has an O(n²) worst case. Better gap sequences bring it to about O(n^1.3).'),
  ]);

  BTA.quiz('merge', [
    q('What is Merge Sort’s running time?', ['O(n log n), in every case', 'O(n²) in the worst case', 'O(n) in the best case', 'O(log n)'],
      'There are about log₂ n levels of halving, and each level merges all n elements, whatever the input.'),
    q('How much extra memory does the usual array version need?', ['O(n), for the merged output', 'O(1)', 'O(log n)', 'O(n²)'],
      'Merging needs somewhere to put the merged elements, which is why Merge Sort doesn’t sort in place.'),
    q('Is Merge Sort stable?', ['Yes, when ties take the left element first', 'No', 'Only on small arrays', 'Only for whole numbers'],
      'Taking the left half’s element on a tie keeps equal values in their original order.'),
    q('Merging [2, 7] with [3, 4]: which element goes into the output first?', ['2', '3', '4', '7'],
      'Only the fronts matter: 2 against 3, and 2 is smaller.'),
    q('Where does Merge Sort shine?', ['Linked lists, and data too big to fit in memory', 'Tiny arrays', 'Sorting with no extra memory', 'Values from 0 to 9'],
      'Merging reads each list from front to back, which suits linked lists and data streamed from a disk.'),
  ]);

  BTA.quiz('quick', [
    q('After one partition, where is the pivot?', ['In its final sorted position', 'At the front', 'Removed from the array', 'Always in the middle of the array'],
      'Everything smaller is on its left and everything bigger on its right, so it never has to move again.'),
    q('With the last element as the pivot, which input is the worst case?', ['An array that is already sorted', 'A random array', 'An array of all different values', 'An array of two elements'],
      'The pivot is always the largest value, so each partition only peels off one element: about n²/2 comparisons.'),
    q('What is Quick Sort’s average running time?', ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      'On average the pivot splits the range roughly in half, giving about log₂ n levels of O(n) work.'),
    q('How do real implementations avoid the worst case?', ['They choose the pivot more carefully, for example at random or the median of three', 'They sort the array first', 'They copy it into a bigger array', 'They only sort small arrays'],
      'A well-chosen pivot makes lopsided partitions very unlikely.'),
    q('Is Quick Sort stable?', ['No', 'Yes'],
      'Partitioning swaps elements over long distances, so equal values can change order.'),
  ]);

  BTA.quiz('heap', [
    q('Where is the largest value in a max-heap?', ['At the root, position 0', 'At the last position', 'In the middle', 'It could be anywhere'],
      'Every parent is at least as big as its children, so nothing can be bigger than the root.'),
    q('Where are the children of position i?', ['2i + 1 and 2i + 2', 'i + 1 and i + 2', 'i / 2 and i / 2 + 1', '2i and 2i + 1'],
      'With the root at 0: position 0 has children 1 and 2, position 1 has 3 and 4, and so on.'),
    q('What is Heap Sort’s worst-case running time?', ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      'Building the heap is O(n), and each of the n removals sifts down at most log₂ n levels.'),
    q('How much extra memory does Heap Sort need?', ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
      'The heap lives inside the array, and the sorted values fill up the end of the same array.'),
    q('Why is Heap Sort often slower than Quick Sort in practice, despite a better worst case?', ['It jumps around the array, which the memory cache handles badly', 'It swaps more neighbours', 'It is O(n²) on average', 'It needs extra memory'],
      'Parents and children are far apart in memory, so it gets less help from the cache.'),
  ]);

  BTA.quiz('counting', [
    q('How many comparisons between elements does Counting Sort make?', ['None', 'n − 1', 'About n log₂ n', 'About n²/2'],
      'It only counts how often each value appears; it never compares two elements.'),
    q('What does its O(n + k) running time stand for?', ['n elements to count, plus k possible values to go through', 'n comparisons plus k swaps', 'n seconds plus k', 'k passes over n elements'],
      'It reads every element once, then walks through all k counters once.'),
    q('When is Counting Sort a bad choice?', ['When the values can be anything up to a billion', 'When many values repeat', 'When the array is small', 'When the values are 0 to 9'],
      'It needs a counter for every possible value, so a huge range means a huge and mostly empty table.'),
    q('Why can’t this version sort negative numbers?', ['Each value is used as a counter’s position, and there is no position −1', 'Negative numbers can’t be counted', 'It would need comparisons', 'Negative numbers are always smaller'],
      'Real versions shift every value by the smallest one first, so −5 goes in counter 0.'),
    q('Which sort builds on Counting Sort to handle bigger numbers?', ['Radix Sort', 'Heap Sort', 'Shell Sort', 'Merge Sort'],
      'Radix Sort runs a counting-style pass for each digit, so it never needs more than ten buckets.'),
  ]);

  BTA.quiz('radix', [
    q('Which digit does this radix sort look at first?', ['The ones digit, the last one', 'The first digit', 'The biggest digit', 'The middle digit'],
      'It works from the least significant digit up: ones, then tens. The last pass, on the most important digit, decides the final order.'),
    q('Why must each pass keep elements with the same digit in their current order?', ['So the order from earlier passes still breaks ties', 'To save memory', 'To make each pass faster', 'It doesn’t matter'],
      'After the ones pass, 41 is before 47. In the tens pass both go to bucket 4, and keeping their order leaves 41 first.'),
    q('How many passes does it need for numbers up to 999?', ['3', '1', '10', '999'],
      'One pass per digit: ones, tens and hundreds.'),
    q('How many comparisons between elements does Radix Sort make?', ['None', 'n − 1 per pass', 'About n log₂ n', 'About n²'],
      'It only reads digits and drops elements into buckets.'),
    q('What is its running time for numbers with d digits?', ['O(d·(n + 10))', 'O(n²)', 'O(n log n)', 'O(10ⁿ)'],
      'Each of the d passes reads all n elements and goes through the 10 buckets.'),
  ]);

  BTA.quiz('topo', [
    q('What does a topological order guarantee?', ['Every arrow points from an earlier node to a later one', 'The nodes are in alphabetical order', 'The shortest path comes first', 'Every node has the same number of arrows'],
      'If A → B means “A before B”, the order respects every one of those requirements.'),
    q('Which graphs have a topological order?', ['Directed graphs with no cycles', 'Every graph', 'Only trees', 'Only graphs without arrows'],
      'With a cycle A → B → C → A, each node would have to come before itself.'),
    q('In Kahn’s algorithm, what makes a node ready?', ['No arrows left pointing into it (in-degree 0)', 'No arrows pointing out of it', 'Being first alphabetically', 'Having the most arrows'],
      'In-degree 0 means everything it depends on has already been placed.'),
    q('How does Kahn’s algorithm notice a cycle?', ['It runs out of ready nodes before every node is placed', 'It visits a node twice', 'An in-degree becomes negative', 'It can’t'],
      'The nodes on a cycle keep each other’s in-degree above 0, so they never become ready.'),
    q('Does a graph always have exactly one topological order?', ['No, often several orders are valid', 'Yes, always', 'Only if it is a tree', 'Only if the nodes have letters'],
      'Whenever two nodes are ready at once, either could go first. Here the A → Z rule picks one.'),
  ]);

  BTA.quiz('linear', [
    q('Does Linear Search need a sorted array?', ['No', 'Yes'],
      'It checks every element in turn, so the order doesn’t matter.'),
    q('In the worst case, how many elements does it check in an array of n?', ['All n', 'log₂ n', 'n / 2', '1'],
      'If the target is last, or missing, it has to look at every element.'),
    q('If the target is at a random position, about how many checks does it take on average?', ['About n / 2', 'About log₂ n', '1', 'About n²'],
      'The target is equally likely to be anywhere, so on average it turns up halfway through.'),
    q('When is Linear Search the right choice?', ['Small or unsorted data that you only search once', 'A huge sorted array searched again and again', 'Searching a graph', 'Never'],
      'Sorting first only pays off if you are going to search many times.'),
    q('What is its running time?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
      'The work grows in step with the number of elements.'),
  ]);

  BTA.quiz('binary', [
    q('What does Binary Search need?', ['A sorted array', 'An array with no repeats', 'An even number of elements', 'Only numbers'],
      'Halving only works because everything left of the middle is smaller and everything right of it is bigger.'),
    q('At most how many comparisons does it need for 1,000,000 sorted values?', ['About 20', 'About 1,000', 'About 500,000', 'About 100'],
      '2²⁰ is just over a million, so 20 halvings narrow a million values down to one.'),
    q('What is its running time?', ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'],
      'Every comparison throws away half of what is left.'),
    q('Why is Binary Search a poor fit for a linked list?', ['It can’t jump straight to the middle element', 'A linked list can’t be sorted', 'It needs repeated values', 'It works just as well'],
      'Reaching the middle of a linked list means walking there one node at a time, which is already O(n).'),
    q('How does it know the target is missing?', ['The range becomes empty: lo > hi', 'It checks every element', 'The middle value is 0', 'It can’t tell'],
      'Each step only ruled out positions that couldn’t hold the target. When none are left, it isn’t there.'),
  ]);

  BTA.quiz('jump', [
    q('How big are Jump Search’s blocks, for n elements?', ['About √n', 'About n / 2', 'About log₂ n', 'Always 10'],
      '√n jumps plus a scan of √n balance out at about 2√n checks.'),
    q('What is its running time?', ['O(√n)', 'O(log n)', 'O(n)', 'O(1)'],
      'At most √n jumps, then at most √n steps inside one block.'),
    q('Does it need a sorted array?', ['Yes', 'No'],
      'It relies on “the end of this block is smaller than the target, so the whole block is”.'),
    q('How does it compare with Binary Search?', ['It needs more comparisons, but only ever steps back once', 'It is faster in every case', 'It is exactly the same', 'It also works on unsorted data'],
      'Stepping back just once helps where going backwards is expensive, as on tape.'),
    q('When does it stop scanning a block early?', ['When it passes a value bigger than the target', 'After two elements', 'At the middle of the block', 'Never'],
      'In a sorted array the target would have come before any bigger value.'),
  ]);

  BTA.quiz('interpolation', [
    q('Where does Interpolation Search probe?', ['Where the target should be, judging by its value', 'Always in the middle', 'Always at the start', 'At a random position'],
      'If the target is 30% of the way from a[lo] to a[hi] in value, it looks 30% of the way along.'),
    q('On what data is it fastest?', ['Sorted data spread out evenly', 'Unsorted data', 'Data with big jumps, like 1, 2, 3, 1000', 'Data with many repeats'],
      'Evenly spread values make the guesses very accurate: about O(log log n) probes.'),
    q('What is its worst-case running time?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
      'On badly skewed data each guess may only rule out one element.'),
    q('Does it need a sorted array?', ['Yes', 'No'],
      'The guess assumes the values grow steadily from a[lo] to a[hi].'),
    q('When is plain Binary Search the safer choice?', ['When you don’t know how the values are spread', 'When the values are evenly spread', 'Never', 'Only when the target is missing'],
      'Binary Search is never worse than log₂ n, whatever the data looks like.'),
  ]);

  BTA.quiz('exponential', [
    q('Which positions does Exponential Search check before its binary search?', ['0, then 1, 2, 4, 8, …', '0, 1, 2, 3, …', 'The middle, then the quarters', 'Every √n positions'],
      'Doubling finds a stretch that holds the target in about log₂ i steps.'),
    q('When does it beat plain Binary Search?', ['When the target is near the start', 'When the target is near the end', 'On unsorted arrays', 'Never'],
      'Its cost is O(log i), where i is the target’s position, not the length of the whole array.'),
    q('What kind of list is it especially good for?', ['One with no known end, such as a stream', 'A linked list', 'An unsorted array', 'A tiny array'],
      'Doubling doesn’t need to know where the list ends.'),
    q('If the doubling stops at position i, which stretch does it binary search?', ['From i / 2 to i', 'From 0 to i', 'From i to the end', 'The whole array'],
      'Position i / 2 was still too small and position i wasn’t, so the target can only be between them.'),
    q('What is its running time?', ['O(log i), so at most O(log n)', 'O(n)', 'O(√n)', 'O(1)'],
      'About log₂ i doublings, then a binary search over a stretch of about i elements.'),
  ]);

  BTA.quiz('bfs', [
    q('In what order does BFS visit nodes?', ['By their distance, in edges, from the start', 'Alphabetically', 'Deepest first', 'At random'],
      'The queue serves every node 1 edge away before any node 2 edges away, and so on.'),
    q('Which data structure does BFS use?', ['A queue: first in, first out', 'A stack', 'A priority queue', 'A sorted array'],
      'First in, first out keeps the nodes in order of distance.'),
    q('What does BFS find in a graph without weights?', ['Shortest paths, counted in edges', 'The cheapest path when edges have weights', 'A minimum spanning tree', 'A topological order'],
      'Nodes are reached in order of distance, so the first way BFS reaches a node is a shortest one.'),
    q('What is its running time?', ['O(V + E)', 'Always O(V²)', 'O(E log V)', 'O(V · E)'],
      'Each node joins the queue once, and each edge is looked at once from each end.'),
    q('Why mark a node as seen when it joins the queue, not when it leaves?', ['So no node is added to the queue twice', 'So the start is skipped', 'It is easier to write', 'It makes no difference'],
      'Marking it on the way in stops another neighbour adding the same node again.'),
  ]);

  BTA.quiz('dfs', [
    q('Which data structure is behind DFS?', ['A stack, or recursion', 'A queue', 'A priority queue', 'A sorted list'],
      'The most recent node is always carried on first: last in, first out.'),
    q('What does DFS do when the current node has no unvisited neighbours?', ['It backtracks to the previous node on the stack', 'It stops the search', 'It jumps to a random node', 'It starts again from A'],
      'It returns to the most recent node that may still have an unexplored neighbour.'),
    q('Does DFS find shortest paths?', ['No, not in general', 'Yes, always', 'Only when edges have weights'],
      'It follows one path as deep as it can, which may be a long way round.'),
    q('What is DFS used for?', ['Finding cycles, solving mazes and topological sorting', 'Shortest paths with weights', 'Sorting numbers', 'Finding the median'],
      'Exploring one path completely before the next makes it a natural fit for these.'),
    q('What is its running time?', ['O(V + E)', 'Always O(V²)', 'O(log V)', 'O(V · E)'],
      'Every node is visited once, and every edge is checked once from each end.'),
  ]);

  BTA.quiz('dijkstra', [
    q('What does Dijkstra assume about edge weights?', ['None of them is negative', 'They are all equal', 'They are whole numbers', 'They are below 10'],
      'It treats the closest node as final. A negative edge found later could make it closer still.'),
    q('Which node does Dijkstra finalise next?', ['The unvisited node with the smallest tentative distance', 'The next node alphabetically', 'The node with the most edges', 'The furthest node'],
      'With no negative weights, no route through the other unvisited nodes can beat it.'),
    q('What does relaxing an edge u–v mean?', ['Checking whether going through u gives v a shorter distance', 'Removing the edge', 'Lowering its weight', 'Marking v as visited'],
      'If dist[u] + w is less than dist[v], v gets the shorter distance.'),
    q('With a priority queue, what is its running time?', ['O((V + E) log V)', 'O(V + E)', 'O(V · E)', 'O(V³)'],
      'Each node leaves the queue once and each edge can update it, at a cost of about log V each time.'),
    q('Which algorithm handles negative weights instead?', ['Bellman-Ford', 'Breadth-First Search', 'Depth-First Search', 'Kruskal'],
      'Bellman-Ford keeps relaxing every edge, so a late negative edge is still taken into account.'),
  ]);

  BTA.quiz('bellman', [
    q('Why can Bellman-Ford cope with negative weights when Dijkstra can’t?', ['It never treats a distance as final early', 'It ignores negative edges', 'It adds a constant to every weight', 'It sorts the edges first'],
      'It relaxes every edge pass after pass, so a later improvement always gets through.'),
    q('How many passes over the edges are always enough?', ['V − 1', 'E', '1', 'log₂ V'],
      'A shortest path has at most V − 1 edges, and each pass gets at least one more of them right.'),
    q('How does it detect a negative cycle?', ['One more pass after V − 1 still makes something shorter', 'A distance becomes negative', 'It visits a node twice', 'It can’t'],
      'Without a negative cycle everything is final after V − 1 passes, so any later improvement means a loop you could go round forever.'),
    q('When can it stop early?', ['When a whole pass changes nothing', 'After the first pass', 'When it reaches a goal node', 'Never'],
      'The next pass would start from exactly the same distances, so it couldn’t change anything either.'),
    q('What is its running time?', ['O(V · E)', 'O(V + E)', 'O((V + E) log V)', 'O(E log E)'],
      'Up to V − 1 passes, each relaxing all E edges.'),
  ]);

  BTA.quiz('astar', [
    q('What does A* add to Dijkstra?', ['An estimate h of the distance left to the goal', 'Negative weights', 'A second start node', 'Random choices'],
      'It expands the node with the smallest f = g + h, so it heads towards the goal first.'),
    q('What must the estimate h never do, for A* to find a shortest path?', ['Overestimate the real distance left', 'Be zero', 'Underestimate the distance left', 'Differ between nodes'],
      'An estimate that never overestimates is called admissible. Straight-line distance is one, because no route is shorter than a straight line.'),
    q('If h is 0 for every node, what does A* turn into?', ['Dijkstra’s algorithm', 'Breadth-First Search', 'Depth-First Search', 'Bellman-Ford'],
      'With h = 0, f is just g, so it always expands the closest node, exactly like Dijkstra.'),
    q('When does A* stop?', ['When the goal has the smallest f', 'When every node has been expanded', 'As soon as it first sees the goal', 'After V − 1 steps'],
      'At that moment no other open route can be shorter, so the goal’s g is final.'),
    q('Why does A* usually expand fewer nodes than Dijkstra?', ['h keeps it away from nodes that lead away from the goal', 'It skips half of the edges', 'It ignores weights', 'It doesn’t; they always expand the same'],
      'Nodes in the wrong direction get a large h, so their f is too big to come up before the goal does.'),
  ]);

  BTA.quiz('kruskal', [
    q('What does Kruskal’s algorithm build?', ['A minimum spanning tree', 'The shortest paths from A', 'A topological order', 'A sorted list of the nodes'],
      'It connects every node with V − 1 edges and the smallest possible total weight.'),
    q('Why does it skip some edges?', ['Their ends are already connected, so the edge would make a cycle', 'They are too heavy', 'They point the wrong way', 'They have negative weights'],
      'A tree has no cycles, and an edge between two connected nodes would make one.'),
    q('In what order does it look at the edges?', ['From lightest to heaviest', 'Alphabetically', 'From heaviest to lightest', 'At random'],
      'Taking the cheapest safe edge every time is what makes the total as small as possible.'),
    q('What takes most of its time?', ['Sorting the edges: O(E log E)', 'Checking for cycles: O(V²) each time', 'Visiting the nodes: O(V)', 'Nothing; it is O(1)'],
      'With a union–find structure, each “already connected?” check is almost constant time.'),
    q('How many edges does the finished tree have, for V nodes?', ['V − 1', 'V', 'E', 'V + 1'],
      'Any tree on V nodes has exactly V − 1 edges.'),
  ]);

  BTA.quiz('kmp', [
    q('What does lps[i] hold?', ['The length of the longest proper prefix of pattern[0..i] that is also its suffix', 'The position of the last match', 'The number of mismatches so far', 'The letter at position i'],
      'For ABAB, lps[3] = 2, because AB is both a prefix and a suffix.'),
    q('After a mismatch, what does KMP never do?', ['Move back in the text', 'Use the lps table', 'Compare letters', 'Move the pattern'],
      'The lps table says how much of what matched can stay matched, so the text position only moves forward.'),
    q('What is KMP’s running time, for a text of n letters and a pattern of m?', ['O(n + m)', 'O(n · m)', 'O(n log m)', 'O(m²)'],
      'Building lps is O(m), and the search never moves back in the text: O(n).'),
    q('What is the lps table for the pattern AAAA?', ['0, 1, 2, 3', '0, 0, 0, 0', '1, 2, 3, 4', '0, 1, 1, 1'],
      'Every prefix is a run of A’s, and its longest proper border is one A shorter.'),
    q('After a full match, how does KMP keep looking?', ['It sets j to lps[m − 1] and carries on', 'It goes back to the start of the text', 'It stops', 'It skips the next m letters'],
      'Matches can overlap: in ABABAB, ABAB matches at 0 and at 2.'),
  ]);
})();
