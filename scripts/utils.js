const defaults = {
    shapes: {
        nodes: {
            r: 20,
            opacity: (d) => {
                return d.data.type === 4 || d.data.type === 1 ? 0.3 : 1.0;
            },
            color: (d) => {
                if (d.data.sign === undefined) {
                    return "#eeeeee";
                }
                return d.data.sign ? "#50ac50" : "#ac5050";
            },
            textColor: (d) => {
                return d.data.type === 3 ? "#202020" : "#eeeeee";
            },
        },
        edges: {
            strokeWidth: 2,
            opacity: (d) => {
                return d.data.type === 3 || d.data.type === 4 ? 0.3 : 1.0;
            },
            color: (d) => {
                // console.log(d.data.type);
                if (d.data.type === 1 || d.data.type === 3) {
                    return "#50ac50";
                }
                if (d.data.type === 2 || d.data.type === 4) {
                    return "#ac5050";
                }
                if (d.data.type === 5) {
                    return "#eeeeee";
                }
                return "#eeaa50";
            },
        },
    },
    animation: {
        times: {
            showDuration: 600,
        }
    }
};

const cm = {
    init: (container, width, height, params) => {
        editor = CodeMirror(container, params);
        editor.setSize(width, height);
        return editor;
    },
    initPolicyContainer: () => {
        const width = 400, height = 300;
        const container = document.getElementById("policy-editor-container");
        policyEditor = cm.init(container, width, height, {
            lineNumbers: true,
            tabSize: 2,
            gutter: true,
            value: "@Knowledge\nR1 :: a, b implies x;\nR2 :: x implies z | 0;\nR3 :: a, x implies -z | 1;\nR4 :: a, b implies y | 0;\nR5 :: a implies -y | 0;",
            theme: "default",
            mode: "simplemode",
        });
    },
    initContextContainer: () => {
        const width = 400, height = 50;
        const container = document.getElementById("context-editor-container");
        contextEditor = cm.init(container, width, height, {
            lineNumbers: true,
            tabSize: 2,
            gutter: true,
            value: "a; b;",
            theme: "default",
            mode: "simplemode",
        });
    },
    initConsoleContainer: () => {
        const width = 400, height = 300;
        const container = document.getElementById("console-editor-container");
        consoleEditor = cm.init(container, width, height, {
            lineNumbers: true,
            tabSize: 2,
            gutter: true,
            value: "~$ ",
            theme: "default",
            readOnly: true,
        });
    },
};

const init = {
    init: () => {
        cm.initPolicyContainer();
        cm.initContextContainer();
        cm.initConsoleContainer();
        init.attachEventListeners();
    },
    attachEventListeners: () => {
        document.getElementById("compile-button").addEventListener("click", eventListeners.compile);
    },
};

const prudens = {
    infer: () => {
        const policyString = policyEditor.getValue();
        const contextString = contextEditor.getValue();
        const kbObject = parseKB(policyString);
        if (kbObject["type"] === "error") {
            return {
                outputObject: undefined,
                outputString: "ERROR: " + kbObject["name"] + ":\n" + kbObject["message"],
            };
        }
        const warnings = kbObject["warnings"];
        const contextObject = parseContext(contextString);
        if (contextObject["type"] === "error") {
            return {
                outputObject: undefined,
                outputString: "ERROR: " + contextObject["name"] + ":\n" + contextObject["message"],
            };
        }
        const output = forwardChaining(kbObject, contextObject["context"]);
        const inferences = output["facts"];
        const graph = output["graph"];
        const outputString = "";
        if (warnings.length > 0) {
            outputString += "Warnings:\n";
        }
        for (const warning of warnings) {
            outputString += warning["name"] + ": " + warning["message"] + "\n";
        }
        return {
            outputObject: output,
            outputString: outputString + "Context: " + contextToString(contextObject["context"]) + "\nInferences: " + contextToString(inferences) + "\nGraph: " + graphToString(graph),
        };
    },
    utils: {
        inContext: (literal, context) => { // `literal` is string while `context` contains objects.
            for (const item of context) {
                if (item["name"] === literal) {
                    return true;
                }
            }
            return false;
        },
        stripSign: (literal) => {
            if (literal[0] === "-") {
                return {
                    sign: false,
                    literal: literal.substring(1),
                };
            }
            return {
                sign: true,
                literal: literal,
            };
        },
        stringifyLiteral: (literal) => {
            return (literal["sign"] ? "" : "-") + literal["name"];
        },
    },
};

const eventListeners = {
    compile: (event) => {
        const outObject = prudens.infer();
        // const previousConsoleValue = consoleEditor.getValue();
        if (!outObject["outputObject"]) {
            consoleEditor.setValue(outObject["outputString"] + "\n~$ ");
            return;
        }
        // TODO Here you add any functionality regarding graphs.
        // draw.graph();
        consoleEditor.setValue(outObject["outputString"] + "\n~$ ");
        // console.log(outObject);
        // const graphObject = draw.utils.graphify(outObject["outputObject"]);
        // console.log(graphObject);
        // const graphable = draw.utils.layering.generateLayeredGraph(graphObject, 100, 100);
        const dotString = "digraph  {a -> b}";
        draw.graphVizGraph(dotString);
        // console.log(graphable);
        // draw.graph(graphable["nodes"], graphable["edges"]);
    }
};

const draw = {
    graphVizGraph: (dotString) => {
        d3.select("#graph-container")
            .graphviz()
            .renderDot(dotString);
    },
    graph: (nodes, edges) => {
        // console.log(nodes, edges);
        const svgs = document.getElementsByTagName("svg")
        if (svgs.length > 0) {
            for (const svg of svgs) {
                svg.remove();
            }
        }
        const svg = d3.select("#graph-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");
        const defs = svg.append("defs");
        const filter = defs.append("svg:filter")
            .attr("id", "drop-shadow")
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 2)
            .attr("result", "blur")
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        const feMerge = filter.append("feMerge")
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        let e = svg.selectAll("g")
            .data(nodes);
        let eEnter = e.enter()
            .append("g")
            .attr("transform", (d) => { return "translate(" + d.x + "," + d.y + ")"; });
        let circle = eEnter.append("circle")
            .attr("r", (d) => { return 0; })
            .transition()
            .duration(defaults.animation.times.showDuration)
            .attr("r", (d) => { return defaults.shapes.nodes.r; })
            .style("class", "node-yshift")
            .attr("stroke", "#ac0000")
            .attr("fill", defaults.shapes.nodes.color)
            .attr("stroke-width", 0)
            .attr("opacity", defaults.shapes.nodes.opacity)
            .attr("filter", "url(#drop-shadow)");
        eEnter.append("text")
            .attr("alignment-baseline", "middle")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("fill", defaults.shapes.nodes.textColor)
            .transition()
            .delay(defaults.animation.times.showDuration)
            .text((d) => { return d.label; });
        svg.append("g")
            .selectAll("line")
            .data(edges)
            .enter()
            .append("line")
            .attr("stroke", defaults.shapes.edges.color)
            .attr("stroke-width", (d) => { return defaults.shapes.edges.strokeWidth; })
            .attr("x1", (d) => { return (d.source.x + d.target.x) / 2; })
            .attr("y1", (d) => { return (d.source.y + d.target.y) / 2; })
            .attr("x2", (d) => { return (d.source.x + d.target.x) / 2; })
            .attr("y2", (d) => { return (d.source.y + d.target.y) / 2; })
            .attr("opacity", (d) => { return 0.0; })
            .transition()
            .duration(defaults.animation.times.showDuration)
            .attr("x1", (d) => { return d.source.x + draw.utils.shorten(d).xshorten; })
            .attr("y1", (d) => { return d.source.y + draw.utils.shorten(d).yshorten; })
            .attr("x2", (d) => { return d.target.x - draw.utils.shorten(d).xshorten; })
            .attr("y2", (d) => { return d.target.y - draw.utils.shorten(d).yshorten; })
            .attr("opacity", defaults.shapes.edges.opacity)
            .attr("marker-end", (d) => {
                const color = defaults.shapes.edges.color(d);
                return draw.utils.addMarker(color, defs);
            })
    },
    utils: {
        addMarker: (color, defs) => {
            const id = "marker-arrow-" + color.replace("#", "");
            defs.append("marker")
                .attr("id", id)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 9)
                .attr("refY", 0)
                .attr("markerWidth", 15)
                .attr("markerHeight", 15)
                .attr("markerUnits", "userSpaceOnUse")
                .attr("orient", "auto")
                .attr("fill", color)
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5L5,0");
            return "url(#" + id + ")";
        },
        shorten: (d) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const xCoeff = dx === 0 ? 0 : 1 / Math.sqrt(1 + Math.pow(dy / dx, 2));
            const yCoeff = dx === 0 ? 1 : dy / (dx * Math.sqrt(1 + Math.pow(dy / dx, 2)));
            const ysign = dx * dy < 0 ? - Math.sign(dy) : Math.sign(dy);
            const xshorten = Math.sign(dx) * defaults.shapes.nodes.r * xCoeff;
            const yshorten = ysign * defaults.shapes.nodes.r * yCoeff;
            return {
                xshorten: xshorten,
                yshorten: yshorten,
            };
        },
        graphify: (prudensOutput) => {
            const graph = prudensOutput["graph"];
            const context = prudensOutput["context"];
            const defeatedRules = prudensOutput["defeatedRules"];
            const dilemmas = prudensOutput["dilemmas"];
            const nodes = [], nodeType = [], sign = [];
            let edges = [];
            // edge types: 0: no edge, 1: positive edge, 2: negative edge, 3: positive defeated edge, 4: negative defeated edge, 5: defeating edge, 6: dilemma.
            let explanations, headIndex, ruleIndex; // Types: 0: surviving simple, 1: defeated simple, 2: context, 3: surviving rule, 4: defeated rule.
            // Add graph nodes.
            for (const literal in graph) { // Remember literals as keys are strings, not objects!
                explanations = graph[literal];
                headIndex = draw.utils.addLiteralNode(literal, context, nodes, edges, nodeType, sign);
                if (nodeType[headIndex] === 2) { // Do not iterate in the case of context literals.
                    continue;
                }
                for (const explanation of explanations) {
                    // console.log("explanation", explanation);
                    ruleIndex = draw.utils.addRuleNode(explanation, context, nodes, edges, nodeType, sign, headIndex);
                }
            }
            // Add defeated nodes.
            let defeated, by, defeatedIndex, byIndex;
            for (const pair of defeatedRules) {
                defeated = pair["defeated"];
                by = pair["by"];
                headIndex = draw.utils.addLiteralNode(prudens.utils.stringifyLiteral(defeated["head"]), context, nodes, edges, nodeType, sign, true);
                defeatedIndex = draw.utils.addRuleNode(defeated, context, nodes, edges, nodeType, sign, headIndex, true);
                byIndex = draw.utils.addRuleNode(by, context, nodes, edges, nodeType, sign, headIndex, dilemmas.some((dilemma) => { return utils.deepIncludes(dilemma, by); }));
                // byIndex = draw.utils.addRuleNode(by, context, nodes, edges, nodeType, sign, headIndex);
                edges[byIndex][defeatedIndex] = 5;
            }
            // Add dilemmas.
            let index0, index1;
            for (const dilemma of dilemmas) {
                index0 = nodes.indexOf(dilemma[0]["name"]);
                index1 = nodes.indexOf(dilemma[1]["name"]);
                edges[index0][index1] = 6;
                edges[index1][index0] = 6;
                nodeType[index0] = 4;
                nodeType[index1] = 4;
            }
            // console.log(utils.matToString(edges));
            return {
                nodes: nodes,
                edges: edges,
                nodeType: nodeType,
                sign: sign,
            };
        },
        addEdgeRow: (edges) => {
            const n = edges.length;
            const newRow = [0];
            for (let i = 0; i < n; i++) {
                edges[i].push(0);
                newRow.push(0);
            }
            edges.push(newRow);
            return edges;
        },
        addRuleNode: (rule, context, nodes, edges, nodeType, sign, headIndex, defeated = false) => {
            const ruleName = rule["name"];
            const ruleBody = rule["body"];
            let ruleIndex;
            if (nodes.includes(ruleName)) {
                ruleIndex = nodes.indexOf(ruleName);
            } else {
                ruleIndex = nodes.length;
                nodes.push(ruleName);
                nodeType.push(defeated ? 4 : 3);
                sign.push(undefined);
                edges = draw.utils.addEdgeRow(edges);
            }
            edges[ruleIndex][headIndex] = defeated ? (rule["head"]["sign"] ? 3 : 4) : (rule["head"]["sign"] ? 1 : 2);
            // console.log(rule["name"], "\n\r", utils.matToString(edges));
            for (const bodyLiteral of ruleBody) {
                bodyIndex = draw.utils.addLiteralNode(prudens.utils.stringifyLiteral(bodyLiteral), context, nodes, edges, nodeType, sign);
                edges[bodyIndex][ruleIndex] = defeated ? (bodyLiteral["sign"] ? 3 : 4) : (bodyLiteral["sign"] ? 1 : 2);
            }
            return ruleIndex;
        },
        addLiteralNode: (literal, context, nodes, edges, nodeType, sign, defeated = false) => {
            if (prudens.utils.inContext(literal, context)) {
                type = 2;
            } else {
                type = defeated ? 1 : 0;
            }
            const headObject = prudens.utils.stripSign(literal);
            let index;
            if (nodes.includes(headObject["literal"])) {
                index = nodes.indexOf(headObject["literal"]);
            } else {
                index = nodes.length;
                nodes.push(headObject["literal"]);
                nodeType.push(type);
                sign.push(headObject["sign"]);
                edges = draw.utils.addEdgeRow(edges);
            }
            return index;
        },
        layering: {
            generateLayeredGraph: (graphObject, dx, dy, layering = draw.utils.layering.longestPathLayering, xshift = 100, yshift = 100) => {
                const nodes = graphObject["nodes"];
                const edges = graphObject["edges"];
                // console.log(nodes);
                // console.log(edges);

                const nodeObjects = [];
                const edgeObjects = [];
                const nodeCoords = {}
                const layers = layering(nodes, edges);
                console.log(layers);
                // console.log(edges);

                // ['a', 'b', 'x', 'R1', 'z', 'R3', 'y', 'R4', 'R5', 'R2']
                // const layers_rep=[0,0,2,1,4,3,2,1,1,3];
                // const layerCount_rep={0:2,1:3,2:2,4:1,4:1};
                // const layers ={
                //     layers: layers_rep,
                //     layerCounts: layerCount_rep,
                // }
                // console.log("this is the previous version", layers);
                // console.log("current version", layers_rep);
                const seenPerLayer = {};
                let layer, current;
                for (let i = 0; i < nodes.length; i++) {
                    layer = layers["layers"][i];
                    if (Object.keys(seenPerLayer).includes("" + layer)) {
                        seenPerLayer[layer] += 1;
                    } else {
                        seenPerLayer[layer] = 0;
                    }
                    current = {
                        label: nodes[i],
                        x: layer * dx + xshift,
                        y: seenPerLayer[layer] * dy + yshift,
                        data: {
                            sign: graphObject["sign"][i],
                            type: graphObject["nodeType"][i],
                        }
                    };
                    // console.log(current);
                    nodeObjects.push(current);
                    nodeCoords[nodes[i]] = current;
                }
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = 0; j < nodes.length; j++) {
                        if (edges[i][j] > 0) {
                            edgeObjects.push({
                                source: nodeCoords[nodes[i]],
                                target: nodeCoords[nodes[j]],
                                data: {
                                    type: edges[i][j],
                                }
                            });
                        }
                    }
                }
                return {
                    nodes: nodeObjects,
                    edges: edgeObjects,
                };
            },
            longestPathLayering: (edges) => { // Assuming that the graph is acyclic.
                const edgeTypes = [1, 2, 3, 4]; // What type of edges to consider when looking for sinks and longest paths.
                const layers = []; // 0-indexed layers, L0 is the lowest one, containing all sinks.
                const layerCounts = {};
                let layer;
                // console.log(layerCounts);
                // console.log(edges);
                for (let i = 0; i < edges.length; i++) {
                    layer = Math.abs(draw.utils.layering.assignLayerTo(i, edges, edgeTypes));
                    layers.push(layer);
                    if (Object.keys(layerCounts).includes("" + layer)) {
                        layerCounts[layer] += 1;
                    } else {
                        layerCounts[layer] = 1;
                    }
                }
                // console.log(layers);
                // console.log(layerCounts);
                console.log(edgeTypes);
                return {
                    layers: layers,
                    layerCounts: layerCounts,
                };
            },
            assignLayerTo: (node, edges, edgeTypes) => { // node is an index, not the node label.
                const sinks = draw.utils.graph.findSinks(edges, edgeTypes);
                const longestPaths = draw.utils.graph.shortestPaths(edges, node, flip = -1, edgeTypes = edgeTypes);
                let maxDist = -Infinity;
                for (const sink of sinks) {
                    if (longestPaths["d"][sink] !== Infinity && longestPaths["d"][sink] > maxDist) {
                        maxDist = longestPaths["d"][sink];
                    }
                }
                return maxDist;
            },
            DotLayering: (nodes, edges) => {
                let dotGraph = "digraph {\n";
                nodes.forEach(node => {
                    dotGraph += `  "${node}";\n`;
                });
                for (let i = 0; i < edges.length; i++) {
                    for (let j = 0; j < edges[i].length; j++) {
                        const weight = edges[i][j];
                        if (weight !== 0) {
                            dotGraph += `  "${nodes[i]}" -> "${nodes[j]}" [weight=${weight}];\n`;
                        }
                    }
                }
                dotGraph += "}\n";

                // Define the Graphviz settings
                // const vizSettings = {
                //     engine: "dot",
                //     format: "json",
                //     files: [
                //         { path: "graph.dot", data: dotGraph }
                //     ]
                // };
                // // Render the graph using Graphviz DOT and extract the node layer information
                // const viz = new Viz({ workerURL: "scripts/viz.js" });
                // viz.renderString(JSON.stringify(vizSettings))
                //     .then(layoutData => {
                //         const layerCounts = getNodeLayerCounts(layoutData);
                //         console.log(layerCounts);
                //     });
            },
            getNodeLayerCounts: (layoutData) => {
                const graph = JSON.parse(layoutData)[0];
                const layerCounts = {};
                graph.objects.forEach(object => {
                    if (object.type === "node") {
                        const layer = object.attributes.layer;
                        if (layerCounts[layer] === undefined) {
                            layerCounts[layer] = 1;
                        } else {
                            layerCounts[layer]++;
                        }
                    }
                });
                return layerCounts;
            }

        },
        graph: {
            findSinks: (edges, edgeTypes = [1, 2, 3, 4, 5, 6]) => { // Sinks are all nodes with no outgoing edges.
                const sinks = [];
                let j;
                for (let i = 0; i < edges.length; i++) {
                    j = 0;
                    while (j < edges[i].length && !edgeTypes.includes(edges[i][j])) {
                        j++;
                    }
                    if (j === edges[i].length) {
                        sinks.push(i);
                    }
                }
                return sinks;
            },
            findSprings: (edges, edgeTypes = [1, 2, 3, 4, 5, 6]) => {
                const springs = [];
                let j;
                for (let i = 0; i < edges.length; i++) {
                    j = 0;
                    while (j < edges.length && !edgeTypes.includes(edges[j][i])) {
                        j++;
                    }
                    if (j === edges.length) {
                        springs.push(i);
                    }
                }
                return springs;
            },
            shortestPaths: (edges, from, flip = 1, edgeTypes = [1, 2, 3, 4]) => { // Uniform weights. Flip determines whether we look for a min or max length path.
                const size = edges.length;
                const ordering = draw.utils.graph.topologicalOrdering(edges, edgeTypes);
                const distances = [], predecessors = [];
                for (let i = 0; i < size; i++) {
                    distances[i] = i === from ? 0 : Infinity;
                    predecessors[i] = undefined;
                }
                let count = 0;
                let current;
                // console\.log("from:", from);
                from = ordering.indexOf(from);
                // console.log(ordering);
                while (count < size) {
                    // console.log((from + count) % size);
                    current = ordering[(from + count) % size];
                    for (let i = 0; i < size; i++) {
                        // console.log(current + " " + i);
                        if (!edgeTypes.includes(edges[current][i])) {
                            continue;
                        }
                        // console.log(current, from, distances[current], i, distances[i]);
                        if (distances[i] > distances[current] + flip) {
                            // console.log("in");
                            distances[i] = distances[current] + flip;
                            predecessors[i] = current;
                        }
                    }
                    count++;
                }
                // console\.log(distances);
                return {
                    d: distances,
                    p: predecessors,
                };
            },
            topologicalOrdering: (edges, edgeTypes = [1, 2, 3, 4]) => { // Assuming graph is acyclic.
                const copyEdges = utils.edgeDeepCopy(edges);
                const size = copyEdges.length;
                const springs = draw.utils.graph.findSprings(copyEdges);
                const ordering = [];
                let i, k, hasIncoming;
                while (springs.length > 0) {
                    i = springs.pop();
                    // console.log(i);
                    // console.log(springs);
                    ordering.push(i);
                    for (let j = 0; j < size; j++) {
                        // console.log(j, size);
                        if (!edgeTypes.includes(copyEdges[i][j])) {
                            continue;
                        }
                        copyEdges[i][j] = 0;
                        hasIncoming = false;
                        k = 0;
                        while (!hasIncoming && k < size) {
                            if (edgeTypes.includes(copyEdges[k][j])) {
                                hasIncoming = true;
                            }
                            k++;
                        }
                        if (!hasIncoming) {
                            springs.push(j);
                        }
                        // console.log("springs:");
                        // console.log(springs);
                    }
                }
                return ordering;
            },
        },
    },
}

const utils = {
    matToString: (matrix) => {
        let matString = "";
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                matString += matrix[i][j] + " ";
            }
            matString += "\n";
        }
        return matString;
    },
    edgeDeepCopy: (edges) => {
        const copyEdges = [];
        for (let i = 0; i < edges.length; i++) {
            copyEdges.push([]);
            for (let j = 0; j < edges.length; j++) {
                copyEdges[i].push(edges[i][j]);
            }
        }
        return copyEdges;
    },
    deepEquals(x, y) {
        if (typeof x !== typeof y) {
            return false;
        }
        if (typeof x !== "object") {
            return x === y;
        }
        const xkeys = Object.keys(x);
        const ykeys = Object.keys(y);
        for (const xkey of xkeys) {
            if (!ykeys.includes(xkey)) {
                return false;
            }
            if (!utils.deepEquals(x[xkey], y[xkey])) {
                return false;
            }
        }
        return true;
    },
    deepIncludes(array, item) {
        for (const x of array) {
            if (utils.deepEquals(x, item)) {
                return true;
            }
        }
        return false;
    }
}