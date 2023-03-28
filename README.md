# README

Notes on the Prudens Viz's "Pure" version.

## Dependencies

This version has no external dependencies other than `D3.js` and, of course, Prudens.

## Directory Structure

```bash
.
├── css 
│   └── style.css                 # All CSS styles
├── index.html                    # Landing page
└── scripts
    ├── entities.js               # Unused (so far classes)
    ├── main.js                   # On page-load functionalities
    ├── prudens                   # Prudens related scripts
    │   ├── parsers.js
    │   ├── prudens.js
    │   └── prudensUtils.js
    ├── prudensmode.js            # CodeMirror theme
    ├── simplemode.js             # CodeMirror specifications
    └── utils.js                  # All plotting related functionalities

3 directories, 10 files

```

## How-to

Just write your policy and the corresponding context and hit the "Compile" button.

## Visualization Explanation

| Edge Type | Color          | Description                      |
| ---       | ---            | ---                              |
| 0         | None           | No edge                          |
| 1         | Green (a=1.0)  | Positive inference               |
| 2         | Red (a=1.0)    | Negative inference               |
| 3         | Green (a=0.3)  | Positive defeated inference      |
| 4         | Red (a=0.3)    | negative defeated inference      |
| 5         | White          | Attack                           |
| 6         | Orange         | Dilemma                          |


## Using GraphViz

In this version, we are using [d3-graphviz](https://github.com/magjac/d3-graphviz#d3_graphviz) to render the desired graph. Changes correspond to [./scripts/utils.js](./scripts/utils.js) and specifically to [lines 177-178](./scripts/utils.js#L177) and the newly introduced [graphVizGraph()](./scripts/utils.js#L185) function. The latter accepts a DOT string as an argument and renders the corresponding plot on the same part of the page where the previous version did.

## Limitations / TODOs

- [ ] So far, induced knowledge graphs should be acyclic.
- [ ] Relational policies might lead to unexpectedly ugly graphs.
- [ ] Node names should be short, since no care is taken to shorten their names when displaying in graphs.
- [ ] Layering is done using the Longest Path layering algorithm, taking only inference edges into account.
- [ ] It remains to try and minimize the number of edge crossings within each pair of layers.
