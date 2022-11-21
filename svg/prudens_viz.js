function layerAssign(ruleNodeLs, ruleBody, ruleHead, nodeLayer) {
    let ruleId, ruleBodyLiterals, assignedNodes, layerInfo, i;
    // console.log("rnls:", ruleNodeLs);
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
        layerAssign(ruleNodeLs, ruleBody, ruleHead, nodeLayer); // FIXME Where is ruleHead used?
    } else {
        // console.log(nodeLayer);
        return nodeLayer;
    }
}

function prepareVis(data) {
    const context = [];
    const nodeLayer = {};
    // console.log(data);
    for (const contInfo of data["context"]) {
        context.push(contInfo["name"]);
        nodeLayer[contInfo[["name"]]] = 0;
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
    let ruleId, ruleBodyLiterals, edge, ruleHeadLiterals;
    for (let i = 0; i < ruleNodeLs.length + defeatedRuleNodeLs; i++) {
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
                edge = defeatedEdgesLs[j = edgesLs.length];
            }
            if (ruleId === edge[1]) {
                ruleBodyLiterals.push(edge[0]);
            }
            if (ruleId === edge[0]) {
                ruleHeadLiterals = edge[1];
            }
        }
        ruleBody[ruleId] = ruleBodyLiterals;
        ruleHead[ruleId] = ruleHeadLiterals;
    }
    return [ruleNodeLs.concat(defeatedRuleNodeLs), ruleBody, ruleHead, nodeLayer, edgesLs, defeatedRuleNodeLs, defeatedEdgesLs];
}

function visPrudens(nodeLayer, edgesLs, defeatedRuleNodeLs, defeatedEdgesLs) {
    console.log(nodeLayer);
    // debugger;
    const G = new jsnx.DiGraph(); // ? rankdir = "LR"
    for (const node of Object.keys(nodeLayer)) {
        if (node[0] === "R") {
            G.addNode(node.substring(5));
        } else {
            G.addNode(node);
            // if (node[0] === "-") {
            //     G.addNode(node.substring(1));
            // } else {
            //     G.addNode(node);
            // }
        }
    }
    for (const node of defeatedRuleNodeLs) {
        if (node[0] === "R") {
            G.addNode(node.substring(5));
        } else {
            G.addNode(node);
            // if (node[0] === "-") {
            //     G.addNode(node.substring(1));
            // } else {
            //     G.addNode(node);
            // }
        }
    }
    console.log(edgesLs);
    // debugger;
    for (const edge of edgesLs) {
        console.log(edge);
        G.addEdge(edge[0][0] === "R" ? edge[0].substring(5) : edge[0], edge[1][0] === "R" ? edge[1].substring(5) : edge[1]);
        // if (edge[1][0] === "R") {
        //     G.addEdge
        //     if (edge[0][0] === "-") {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     } else {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     }
        // } else {
        //     if (edge[1][0] === "-") {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     } else {
        //         G.addEdge(edge[1].substring(5), edge[0]); // TODO Styling
        //     }
        // }
    }
    for (const edge in defeatedEdgesLs) {
        G.addEdge(edge[0][0] === "R" ? edge[0].substring(5) : edge[0], edge[1][0] === "R" ? edge[1].substring(5) : edge[1]);
        // if (edge[1][0] === "R") {
        //     if (edge[0][0] === "-") {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     } else {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     }
        // } else {
        //     if (edge[1][0] === "-") {
        //         G.addEdge(edge[0], edge[1].substring(5)); // TODO Styling
        //     } else {
        //         G.addEdge(edge[1].substring(5), edge[0]); // TODO Styling
        //     }
        // }
    }
    console.log(G);
    // document.getElementById("graph-container").innerHTML = document.getElementById("canvas").outerHTML;
    // const A = jsnx.nxagraph.toAgraph(G);
    // console.log(A);
    // let nodeLs;
    // console.log(nodeLayer);
    // for (const layerId of Object.values(nodeLayer)) { // TODO Might contain duplicates?
    //     console.log(layerId);
    //     // nodeLs = [];
    //     for (const node in nodeLayer) {
    //         if (node === layerId) {
    //             G.addNode(node);
    //             // nodeLs.push(node);
    //         }
    //     }
    // }
    jsnx.draw(G, {
        element: "#canvas",
        withLabels: true,
        nodeAttr: {
            "r": 20,
        },
        weighted: false,
        edgeStyle: {
            "stroke-width": 5,
            },
        nodeStyle: {
            fill: "#ffeeee",
        }
        });
    // console.log(document.getElementById("canvas").outerHTML);
    const plot = document.getElementsByClassName("jsnx")[0];
    // console.log("plot", plot);
    setTimeout(() => {
        plot.setAttribute("width", "1000");
        plot.setAttribute("height", "1000");
        plot.setAttribute("opacity", "1");
    }, 0);
    // document.getElementById("graph-container").innerHTML = document.getElementById("canvas").outerHTML;
    // const A = jsnx.nxagraph.toAgraph(G);
    // console.log(A);
    // let nodeLs;
    // for (const layerId of nodeLayer) { // TODO Might contain duplicates?
    //     nodeLs = [];
    //     for (const node in nodeLayer) {
    //         if (node === layerId) {
    //             nodeLs.push(node);
    //         }
    //     }
    //     // A.addSubgraph(nodeLs); // ? rank = "same";
    // }
    // A.draw("file.svg", {prog: "dot"});
}

function stringifyLiteral(literal) {
    return `${literal["sign"] ? "" : "-"}${literal["name"]}`;
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
    console.log(parsedLogs);
    // debugger;
    layerAssign(parsedLogs[0], parsedLogs[1], parsedLogs[2], parsedLogs[3]);
    console.log(parsedLogs);
    visPrudens(parsedLogs[3], parsedLogs[4], parsedLogs[5], parsedLogs[6]);
}