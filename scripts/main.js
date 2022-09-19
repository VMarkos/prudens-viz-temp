let LOGS = [];
let currentIndex = 0;
let done = false;

function updateGraph(event) {
    this.readSVGGraph(event.target);
}

async function readSVGGraph(inputGraph) {
    const fileTypes = ["svg"];
    if (inputGraph.files && inputGraph.files[0]) {
        const extension = inputGraph.files[0].name.split(".").pop().toLowerCase();
        const isValidExtension = fileTypes.indexOf(extension) > -1;
        if (isValidExtension) {
            const svg = await inputGraph.files[0].text();
            document.getElementById("graph-container").innerHTML = svg;
        }
        fadeOutGraph();
    } else {
        alert("Wrong image type. Please upload an SVG image.");
    }
}

function fadeOutGraph() {
    const graph = document.getElementById("graph0"); // TODO There might be cases where the graph is not named graph0, right?
    const graphChildren = graph.childNodes;
    for (const child of graphChildren) {
        if (child.nodeName === "g") {
            child.classList.add("faded");
        }
    }
}

function updateLogs(event) {
    loadLogs(event.target);
}

async function loadLogs(logs) {
    const fileTypes = ["json"];
    if (logs.files && logs.files[0]) {
        const extension = logs.files[0].name.split(".").pop().toLowerCase();
        const isValidExtension = fileTypes.indexOf(extension) > -1;
        if (isValidExtension) {
            const jsonLogs = await logs.files[0].text();
            LOGS = parseLogs(JSON.parse(jsonLogs));
        }
    } else {
        alert("Wrong logs type. Please upload JSON file.");
    }
    console.log(LOGS);
}

function parseLogs(jsonLogs) {
    const logsArray = jsonLogs["logs"];
    const parsedLogs = [];
    let graph, facts, currentGraph, rules;
    for (const item of logsArray) {
        currentGraph = {};
        graph = item["graph"];
        facts = Object.keys(graph);
        for (const fact of facts) {
            rules = filterRules(graph[fact]);
            currentGraph[fact] = rules;
        }
        parsedLogs.push(currentGraph);
    }
    return parsedLogs;
}

function filterRules(rules) {
    const filteredRules = [];
    for (const rule of rules) {
        if (rule["name"][0] !== "\$") {
            filteredRules.push(rule["name"]);
        }
    }
    return (filteredRules.length > 0) ? filteredRules : ["\$"];
}

function proceed() {
    if (LOGS.length === 0) {
        alert("Empty LOGS, please verify that you have uploaded a logs file!");
        return;
    }
    if (LOGS.length - 1 === currentIndex) {
        alert("Finished resoning!");
        done = true;
        currentIndex = 0;
        fadeOutGraph();
        return;
    }
    const currentLogs = LOGS[currentIndex];
    const graphChildren = document.getElementById("graph0").childNodes;
    let edge, title, endEdgeRE, normalizedFact;
    for (const fact in currentLogs) {
        for (const rule of currentLogs[fact]) {
            edge = rule + "-&gt;" + (fact[0] === "-" ? fact.substring(1) : fact);
            console.log(fact, rule, edge);
            endEdgeRE = RegExp(`\.+\-\&gt;` + rule);
            for (const g of graphChildren) {
                if (g.nodeName === "g") {
                    title = g.childNodes[1].innerHTML;
                    normalizedFact = (fact[0] === "-") ? fact.substring(1) : fact;
                    if (title === normalizedFact || title === rule || title === edge || endEdgeRE.test(title)) {
                        if (g.classList.contains("faded")) {
                            g.classList.remove("faded");
                        }
                    }
                }
            }
        }
    }
    currentIndex++;
}