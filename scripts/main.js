let LOGS = [];
let DATA;
let currentIndex = 0;
let done = false;
let initialized = false;

let loaded = false;

let policyEditor;
let contextEditor;
let consoleEditor;

/* CodeMirror Container */

function initializeEditors() {
    if (loaded) {
        return;
    }
    if (!loaded) {
        loaded = true;
    }
    console.log("reload");
    let policyContainer = document.getElementById("policy-container");
    let contextContainer = document.getElementById("context-container");
    let consoleContainer = document.getElementById("console-container");

    policyEditor = CodeMirror(policyContainer, {
        lineNumbers: true,
        tabSize: 2,
        gutter: true,
        value: '@Knowledge\n',
        theme: "default",
        mode: "simplemode",
    });
    policyEditor.setValue(`@Knowledge
R1 :: a, b implies x;
R2 :: x implies z | 0;
R3 :: a, x implies -z | 1;
R4 :: a, b implies y | 0;
R5 :: a implies -y | 0;`);

    policyEditor.setSize(400, 300);

    contextEditor = CodeMirror(contextContainer, {
        lineNumbers: true,
        tabSize: 2,
        gutter: true,
        theme: "default",
        mode: "simplemode",
    });
    contextEditor.setValue("a; b;");

    contextEditor.setSize(400, 50);

    consoleEditor = CodeMirror(consoleContainer, { // TODO Change that to some textarea or so?
        lineNumbers: true,
        tabSize: 2,
        gutter: true,
        theme: "default",
        readOnly: true,
    });

    consoleEditor.setSize(400, 300);
    consoleEditor.setValue("~$ ");
}

function onLoad() {
    initializeEditors();
    // window.removeEventListener("load", onLoad, false);
}

window.addEventListener("load", onLoad, false);

/* Graph animation */

function updateGraphPlot(event) {
    console.log("update");
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
            DATA = JSON.parse(jsonLogs);
        }
    } else {
        alert("Wrong logs type. Please upload JSON file.");
    }
    // console.log(LOGS);
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

function updateConsole() {
    document.getElementById("");
}

function proceed() {
    if (!initialized) {
        consoleOutput();
        initialized = true;
    }
    if (LOGS.length === 0) {
        alert("Empty LOGS, please verify that you have uploaded a logs file!");
        return;
    }
    if (LOGS.length - 1 === currentIndex) {
        alert("Finished resoning!");
        done = true;
        currentIndex = 0;
        fadeOutGraph();
        initialized = false;
        return;
    }
    document.getElementById("gc").scrollIntoView({behavior: "smooth", block: "end"});
    done = false;
    const currentLogs = LOGS[currentIndex];
    const graphChildren = document.getElementById("graph0").childNodes;
    let edge, title, endEdgeRE, normalizedFact, unfadedFacts = [];
    console.log("++++++++++++++++++");
    for (const fact in currentLogs) {
        for (const rule of currentLogs[fact]) {
            edge = rule + "-&gt;" + (fact[0] === "-" ? fact.substring(1) : fact);
            // console.log(fact, rule, edge);
            endEdgeRE = RegExp(`\.+\-\&gt;` + rule);
            for (const g of graphChildren) {
                if (g.nodeName === "g") {
                    title = g.childNodes[1].innerHTML;
                    normalizedFact = (fact[0] === "-") ? fact.substring(1) : fact;
                    if (title === normalizedFact || title === rule || title === edge || endEdgeRE.test(title)) {
                        console.log("unfade:", title);
                        unfadedFacts.push(title);
                        if (g.classList.contains("faded")) {
                            g.classList.remove("faded");
                        }
                    } else if (!unfadedFacts.includes(title)) {
                        console.log("fade:", title);
                        if (!g.classList.contains("faded")) {
                            g.classList.add("faded");
                        }
                    }
                }
            }
        }
    }
    currentIndex++;
}

/* Prudens */

function deduce() {
    const kbObject = kbParser();
    if (kbObject["type"] === "error") {
        return "ERROR: " + kbObject["name"] + ":\n" + kbObject["message"];
    }
    const warnings = kbObject["warnings"];
    const contextObject = contextParser();
    if (contextObject["type"] === "error") {
        return "ERROR: " + contextObject["name"] + ":\n" + contextObject["message"];
    }
    // console.log(kbObject);
    // console.log(contextObject); // TODO fix some context parsing issue (in propositional cases it includes the semicolon into the name of the prop)
    const output = forwardChaining(kbObject, contextObject["context"]);
    // console.log(output);
    const inferences = output["facts"];
    const graph = output["graph"];
    // console.log("Inferences:");
    // console.log(inferences);
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
  }

function kbParser() {
    const kbAll = policyEditor.getValue();
    return parseKB(kbAll);
}
  
function contextParser() {
    const context = contextEditor.getValue();
    const contextList = parseContext(context);
    if (contextList["type"] === "error") {
        return contextList;
    }
    return contextList;
}
  
function compile() {
    let newText;
    const output = deduce();
    const outputObject = output["outputObject"];
    LOGS = parseLogs(outputObject);
    DATA = outputObject;
    newText = output["outputString"];
    const previous = consoleEditor.getValue();
    consoleEditor.setValue(previous + newText + "\n~$");
    testGraph();
}