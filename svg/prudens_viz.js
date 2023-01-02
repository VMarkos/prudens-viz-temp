const styles = {
    opacity: {
        defeatedOpacity: 0.2,
    },
    colors: {
        edges: {
            positive: "#00ac00",
            negative: "#ac0000",
            dilemma: "#0000ac",
            defeating: "#f0a00c",
        },
    },
}

// const DEFEATED_OPACITY = 0.2;
// const POSITIVE_COLOR = "#00ac00";
// const NEGATIVE_COLOR = "#ac0000";
// const DILEMMA_COLOR = "#0000ac";
// const DEFEATING_COLOR = "#f0a00c";

function layerAssign(ruleNodeLs, ruleBody, ruleHead, nodeLayer) {
    let ruleId, ruleBodyLiterals, assignedNodes, layerInfo, i;
    // console.log("arguments:", arguments);
    // debugger;
    if (ruleNodeLs.length > 0) {
        for (let i = 0; i < ruleNodeLs.length; i++) {
            // i = 0;
            ruleId = ruleNodeLs[i];
            // console.log("ruleId:", ruleId, "ruleBody:", ruleBody, "i:", i);
            ruleBodyLiterals = ruleBody[ruleId];
            assignedNodes = Object.keys(nodeLayer);
            // console.log("ruleBodyLiterals:", ruleBodyLiterals, "assignedNodes:", assignedNodes);
            // console.log("ruleNodeLs:", ruleNodeLs);
            // debugger;
            if (isSubset(ruleBodyLiterals, assignedNodes)) {
                layerInfo = [];
                for (const key of ruleBodyLiterals) {
                    layerInfo.push(nodeLayer[key]);
                }
                nodeLayer[ruleId] = Math.max(...layerInfo) + 1;
                nodeLayer[ruleHead[ruleId]] = Math.max(...layerInfo) + 2;
                // console.log("splice before:", i, ruleNodeLs);
                ruleNodeLs.splice(i, 1); // FIXME This might be a source of logical errors!
                // i--;
                // console.log("splice after:", i, ruleNodeLs);
            }
            // layerAssign(ruleNodeLs, ruleBody, ruleHead, nodeLayer);
        }
        // return;
        layerAssign(ruleNodeLs, ruleBody, ruleHead, nodeLayer);
    } else {
        // console.log(nodeLayer);
        return nodeLayer;
    }
}

function prepareVis(data) {
    const context = [];
    const nodeLayer = {};
    console.log("data:", data);
    for (const contInfo of data["context"]) {
        const nameString = `${contInfo["sign"] ? "" : "-"}` + contInfo["name"];
        context.push(nameString);
        nodeLayer[nameString] = 0;
    }
    const ruleNodeLs = [];
    const edgesLs = [];
    const keys = Object.keys(data["graph"]);
    let rule, ruleName, ruleBody, ruleHead;
    for (const key of keys) {
        rule = data["graph"][key];
        if (rule[0]["name"][0] === "$") {
            continue;
        }
        for (let dictId = 0; dictId < rule.length; dictId++) {
            ruleName = "Rule:" + rule[dictId]["name"];
            ruleNodeLs.push(ruleName);
            ruleBody = rule[dictId]["body"];
            for (const literal of ruleBody) {
                edgesLs.push([stringifyLiteral(literal), ruleName]);
            }
            ruleHead = rule[dictId]["head"];
            edgesLs.push([ruleName, stringifyLiteral(ruleHead)]);
        }
    }
    const defeatedRuleNodeLs = [];
    let defeatedRuleBody, defeatedEdgesLs = [];
    for (let index = 0; index < data["defeatedRules"].length; index++) {
        rule = data["defeatedRules"][index]["defeated"];
        ruleName = "Rule:" + rule["name"];
        defeatedRuleNodeLs.push(ruleName);
        defeatedRuleBody = rule["body"];
        for (const literal of defeatedRuleBody) {
            defeatedEdgesLs.push([stringifyLiteral(literal), ruleName]);
        }
        ruleHead = rule["head"];
        defeatedEdgesLs.push([ruleName, stringifyLiteral(ruleHead)]);
    }
    ruleBody = {};
    ruleHead = {};
    // console.log("ruleNodeLs:", ruleNodeLs);
    // debugger;
    let ruleId, ruleBodyLiterals, edge, ruleHeadLiterals;
    for (let i = 0; i < ruleNodeLs.length + defeatedRuleNodeLs.length; i++) {
        if (i < ruleNodeLs.length) {
            ruleId = ruleNodeLs[i]
        } else {
            ruleId = defeatedRuleNodeLs[i - ruleNodeLs.length];
        }
        ruleBodyLiterals = [];
        for (let j = 0; j < edgesLs.length + defeatedEdgesLs.length; j++) {
            if (j < edgesLs.length) {
                edge = edgesLs[j];
            } else {
                edge = defeatedEdgesLs[j - edgesLs.length];
            }
            if (ruleId === edge[1]) {
                ruleBodyLiterals.push(edge[0]);
            }
            if (ruleId === edge[0]) {
                ruleHeadLiterals = edge[1];
            }
        }
        ruleBody[ruleId] = ruleBodyLiterals;
        // console.log("pushed in ruleBody:", ruleBodyLiterals);
        ruleHead[ruleId] = ruleHeadLiterals;
    }
    // console.log(ruleBody);
    const dilemmas = computeDilemmas(data.dilemmas);
    const defeatingEdges = defeatingRules(data.defeatedRules);
    return [ruleNodeLs.concat(defeatedRuleNodeLs), ruleBody, ruleHead, nodeLayer, edgesLs, defeatedRuleNodeLs, defeatedEdgesLs, dilemmas, defeatingEdges];
}

function computeDilemmas(dilemmas) {
    const nodes = [];
    const edges = [];
    const factNodes = [];
    const factEdges = [];
    let sx, sh;
    for (const dilemma of dilemmas) {
        if (!nodes.includes(dilemma[0]["name"])) {
            nodes.push(dilemma[0]["name"]);
        }
        if (!nodes.includes(dilemma[1]["name"])) {
            nodes.push(dilemma[1]["name"]);
        }
        edges.push([
            dilemma[0]["name"],
            dilemma[1]["name"],
        ]);
        for (const x of dilemma[0]["body"]) {
            sx = (x["sign"] ? "" : "-") +  x["name"];
            if (!factNodes.includes(sx)) {
                factNodes.push(sx);
            }
            factEdges.push([sx, dilemma[0]["name"]]);
        }
        sh = (dilemma[0]["head"]["sign"] ? "" : "-") + dilemma[0]["head"]["name"];
        if (!factNodes.includes(sh)) {
            factNodes.push(sh);
        }
        factEdges.push([dilemma[0]["name"], sh]);
        for (const x of dilemma[1]["body"]) {
            sx = (x["sign"] ? "" : "-") +  x["name"];
            if (!factNodes.includes(sx)) {
                factNodes.push(sx);
            }
            factEdges.push([sx, dilemma[1]["name"]]);
        }
        sh = (dilemma[1]["head"]["sign"] ? "" : "-") + dilemma[1]["head"]["name"];
        if (!factNodes.includes(sh)) {
            factNodes.push(sh);
        }
        factEdges.push([dilemma[1]["name"], sh]);
    }
    return {
        nodes: nodes,
        edges: edges,
        factNodes: factNodes,
        factEdges: factEdges,
    };
}

function defeatingRules(defeatedRules) {
    const edges = [];
    let by, defeated;
    for (const pair of defeatedRules) {
        by = pair["by"]["name"];
        defeated = pair["defeated"]["name"];
        edges.push([by, defeated]);
    }
    return edges;
}

function edgeIncludes(edges, edge) {
    let e;
    for (let i = 0; i < edges.length; i++) {
        e = edges[i];
        console.log(e, edge);
        if (edge[0] === e[0] && edge[1] === e[1]) {
            return i;
        }
    }
    return -1;
}

function visPrudens(nodeLayer, edgesLs, defeatedRuleNodeLs, defeatedEdgesLs, dilemmas, defeatingRules) {
    // console.log(nodeLayer);
    // debugger;
    const G = new jsnx.DiGraph(); // ? rankdir = "LR"
    let nodeLabel, sign, isRule;
    for (const node of Object.keys(nodeLayer)) {
        // console.log("node:", node);
        isRule = node[0] === "R";
        nodeLabel = isRule ? node.substring(5) : node;
        // console.log("nodeLabel (before):", nodeLabel);
        sign = nodeLabel[0] !== "-";
        nodeLabel = sign ? nodeLabel : nodeLabel.substring(1);
        // console.log("nodeLabel (after):", nodeLabel);
        if (G.nodes().includes(nodeLabel)) {
            continue;
        }
        // console.log(nodeLabel, defeatedRuleNodeLs);
        G.addNode(nodeLabel, data = {
            sign: sign,
            isDefeated: false,
            isRule: isRule,
        });
    }
    // console.log("Change");
    for (const node of defeatedRuleNodeLs) {
        // console.log("node:", node);
        isRule = node[0] === "R";
        nodeLabel = isRule ? node.substring(5) : node;
        // console.log("nodeLabel (before):", nodeLabel);
        sign = nodeLabel[0] !== "-";
        nodeLabel = sign ? nodeLabel : nodeLabel.substring(1);
        // console.log("nodeLabel (after):", nodeLabel);
        if (G.nodes().includes(nodeLabel)) {
            G.nodes(true)[G.nodes().indexOf(nodeLabel)][1].isDefeated = true;
            continue;
        }
        G.addNode(nodeLabel, data = {
            sign: sign,
            isDefeated: true,
            isRule: isRule,
        });
    }
    for (const node of dilemmas.nodes) {
        if (!G.nodes().includes(node)) {
            G.addNode(node, data = {
                sign: true,
                isDefeated: true,
                isRule: true,
            });
        }
    }
    for (const node of dilemmas.factNodes) {
        sign = node[0] !== "-";
        nodeLabel = sign ? node : node.substring(1);
        console.log("nodeLabel:", nodeLabel);
        if (!G.nodes().includes(nodeLabel)) {
            G.addNode(nodeLabel, data = {
                sign: sign,
                isDefeated: false,
                isRule: false,
            });
        }
    }
    let edgeStart, edgeEnd;
    for (const edge of edgesLs) {
        edgeStart = edge[0][0] === "R" ? edge[0].substring(5) : edge[0];
        edgeEnd = edge[1][0] === "R" ? edge[1].substring(5) : edge[1];
        sign = edgeStart[0] !== "-" && edgeEnd[0] !== "-";
        edgeStart = edgeStart[0] === "-" ? edgeStart.substring(1) : edgeStart;
        edgeEnd = edgeEnd[0] === "-" ? edgeEnd.substring(1) : edgeEnd;
        G.addEdge(edgeStart, edgeEnd, data = {
            sign: sign,
            isDefeated: false,
        });
    }
    for (const edge of defeatedEdgesLs) {
        edgeStart = edge[0][0] === "R" ? edge[0].substring(5) : edge[0];
        edgeEnd = edge[1][0] === "R" ? edge[1].substring(5) : edge[1];
        sign = edgeStart[0] !== "-" && edgeEnd[0] !== "-";
        edgeStart = edgeStart[0] === "-" ? edgeStart.substring(1) : edgeStart;
        edgeEnd = edgeEnd[0] === "-" ? edgeEnd.substring(1) : edgeEnd;
        G.addEdge(edgeStart, edgeEnd, data = {
            sign: sign,
            isDefeated: true,
        });
    }
    for (const edge of dilemmas.edges) {
        G.addEdge(edge[0], edge[1], data = {
            sign: undefined, // TODO irrelevant?
            isDefeated: true, // TODO irrelevant?
            isDilemma: true,
        });
        G.addEdge(edge[1], edge[0], data = {
            sign: undefined, // TODO irrelevant?
            isDefeated: true, // TODO irrelevant?
            isDilemma: true,
        });
    }
    for (const edge of dilemmas.factEdges) {
        edgeStart = edge[0];
        edgeEnd = edge[1];
        sign = edgeStart[0] !== "-" && edgeEnd[0] !== "-";
        edgeStart = edgeStart[0] === "-" ? edgeStart.substring(1) : edgeStart;
        edgeEnd = edgeEnd[0] === "-" ? edgeEnd.substring(1) : edgeEnd;
        G.addEdge(edgeStart, edgeEnd, data = {
            sign: sign,
            isDefeated: true,
            isDilemma: false,
        });
    }
    // console.log("edges:", G.edges(), G.edges(true));
    let i;
    for (const edge of defeatingRules) {
        i = edgeIncludes(G.edges(), edge);
        // console.log(i);
        if (i >= 0) {
            // console.log("here", G.edges(true)[i]);
            G.edges(true)[i][2]["isDefeating"] = true;
            continue;
        }
        G.addEdge(edge[0], edge[1], data = {
            sign: true, // TODO is this relevant?
            isDefeated: true, // TODO is this relevant?
            isDilemma: false,
            isDefeating: true,
        });
    }
    jsnx.draw(G, {
        element: "#canvas",
        withLabels: true,
        nodeShape: "rect",
        nodeAttr: graphStyle.nodeAttr,
        weighted: false,
        stickyDrag: true,
        edgeStyle: {
            "stroke-width": graphStyle.strokeWidth,
            "fill": graphStyle.edgeColor,
            "opacity": graphStyle.graphOpacity,
        },
        nodeStyle: {
            "fill": "#ffffff",
            "opacity": graphStyle.graphOpacity,
        },
        edgeOffset: graphStyle.edgeOffset,
    });
    // console.log(document.getElementById("canvas").outerHTML);
    const plot = document.getElementsByClassName("jsnx")[0];
    // console.log("plot", plot);
    setTimeout(() => {
        const gRects = document.getElementById("gc").getClientRects();
        const lRects = document.getElementById("graph-label").getClientRects();
        // console.log(lRects);
        plot.setAttribute("width", gRects[0].width - 20);
        plot.setAttribute("height", gRects[0].height - lRects[0].height);
        plot.setAttribute("opacity", "1");
    }, 0);
}

function stringifyLiteral(literal) {
    return `${literal["sign"] ? "" : "-"}${literal["name"]}`;
}

// Style

const graphStyle = {
    nodeShape: (d) => {
        if (d.data.isRule) {
            return "rect";
        }
        return "circle";
    },
    graphOpacity: (d) => {
        if (d.data.isDefeated) {
            return styles.opacity.defeatedOpacity;
        }
        return 1.0;
    },
    edgeColor: (d) => {
        if (d.data.isDilemma) {
            return styles.colors.edges.dilemma;
        } else if (d.data.isDefeating) {
            return styles.colors.edges.defeating;
        } else if (!d.data.sign) {
            return styles.colors.edges.negative;
        }
        return styles.colors.edges.positive;
    },
    strokeWidth: (d) => {
        if (d.data.isDilemma) {
            return 2.5;
        }
        return 5;
    },
    edgeOffset: 20,
    nodeAttr: {
        height: (d) => {return 30},
        width: (d) => {return 30},
        x: (d) => {return -15},
        y: (d) => {return -15},
        rx: (d) => {return d.data.isRule ? 5 : 20},
        ry: (d) => {return d.data.isRule ? 5 : 20},
    }
}

// UTILS

function isSubset(X, Y) { // true if x is subset of y.
    for (const x of X) {
        if (!Y.includes(x)) { // this may need deeper equalities.
            return false;
        }
    }
    return true;
}

// Main

function testGraph() {
    const parsedLogs = prepareVis(DATA);
    // console.log(parsedLogs);
    // debugger;
    layerAssign(parsedLogs[0], parsedLogs[1], parsedLogs[2], parsedLogs[3]);
    // console.log(parsedLogs);
    visPrudens(parsedLogs[3], parsedLogs[4], parsedLogs[5], parsedLogs[6], parsedLogs[7], parsedLogs[8]);
}