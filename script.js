// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const nodesInput = document.getElementById("nodesInput");
const edgesInput = document.getElementById("edgesInput");
const createGraphBtn = document.getElementById("createGraphBtn");

const algorithmSelect = document.getElementById("algorithm");
const startNodeSelect = document.getElementById("startNode");

const graphContainer = document.getElementById("graph");
const inputMessage = document.getElementById("inputMessage");
const statusElement = document.getElementById("status");
const traversalOrderElement = document.getElementById("traversalOrder");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const resetBtn = document.getElementById("resetBtn");


// ==========================================
// 2. GRAPH DATA AND TRAVERSAL STATE
// ==========================================

let nodes = [];
let edges = [];
let adjacencyList = new Map();

let positions = new Map();
let traversalSteps = [];
let traversalIndex = 0;
let visitedNodes = new Set();

let animationTimer = null;
let isRunning = false;
let currentNode = null;

const NODE_RADIUS = 23;
const NODE_SPACING_X = 100;
const NODE_SPACING_Y = 100;
const GRAPH_PADDING = 60;
const ANIMATION_SPEED = 800;


// ==========================================
// 3. CREATE THE GRAPH
// ==========================================

function createGraph() {
    stopAnimation();

    const parsedNodes = nodesInput.value
        .split(",")
        .map(node => node.trim())
        .filter(Boolean);

    const uniqueNodes = [...new Set(parsedNodes)];

    if (uniqueNodes.length === 0) {
        showMessage("Please enter at least one node.", true);
        return;
    }

    const parsedEdges = [];
    const errors = [];

    const rawEdges = edgesInput.value
        .split(",")
        .map(edge => edge.trim())
        .filter(Boolean);

    for (const rawEdge of rawEdges) {
        const parts = rawEdge.split("-").map(part => part.trim());

        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            errors.push(`Invalid edge: ${rawEdge}`);
            continue;
        }

        const [from, to] = parts;

        if (!uniqueNodes.includes(from) || !uniqueNodes.includes(to)) {
            errors.push(`Edge ${rawEdge} uses a node not in the node list.`);
            continue;
        }

        if (from === to) {
            errors.push(`Self-connections are not supported: ${rawEdge}`);
            continue;
        }

        const alreadyExists = parsedEdges.some(edge =>
            (edge.from === from && edge.to === to) ||
            (edge.from === to && edge.to === from)
        );

        if (!alreadyExists) {
            parsedEdges.push({ from, to });
        }
    }

    if (errors.length > 0) {
        showMessage(errors.join(" "), true);
        return;
    }

    nodes = uniqueNodes;
    edges = parsedEdges;

    adjacencyList = new Map();

    nodes.forEach(node => adjacencyList.set(node, []));

    edges.forEach(({ from, to }) => {
        adjacencyList.get(from).push(to);
        adjacencyList.get(to).push(from);
    });

    // Keep neighbor order consistent with the user's node list.
    for (const node of nodes) {
        adjacencyList.get(node).sort(
            (a, b) => nodes.indexOf(a) - nodes.indexOf(b)
        );
    }

    updateStartNodeOptions();

    resetTraversal();
    calculateLayerPositions();
    renderGraph();

    showMessage(
        `Graph created successfully: ${nodes.length} nodes and ${edges.length} edges.`,
        false
    );
}


// ==========================================
// 4. UPDATE STARTING NODE OPTIONS
// ==========================================

function updateStartNodeOptions() {
    const previousSelection = startNodeSelect.value;

    startNodeSelect.innerHTML = "";

    nodes.forEach(node => {
        const option = document.createElement("option");
        option.value = node;
        option.textContent = node;
        startNodeSelect.appendChild(option);
    });

    if (nodes.includes(previousSelection)) {
        startNodeSelect.value = previousSelection;
    } else if (nodes.length > 0) {
        startNodeSelect.value = nodes[0];
    }
}


// ==========================================
// 5. CALCULATE BFS LAYER POSITIONS
// ==========================================

function calculateLayerPositions() {
    positions.clear();

    if (nodes.length === 0) return;

    const root = startNodeSelect.value || nodes[0];

    const levels = new Map();
    const visited = new Set();
    const queue = [root];

    levels.set(root, 0);
    visited.add(root);

    // Find each node's distance from the starting node.
    while (queue.length > 0) {
        const node = queue.shift();

        for (const neighbor of adjacencyList.get(node) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                levels.set(neighbor, levels.get(node) + 1);
                queue.push(neighbor);
            }
        }
    }

    // Put disconnected nodes into additional layers.
    let nextLevel = Math.max(0, ...levels.values()) + 1;

    for (const node of nodes) {
        if (!levels.has(node)) {
            const componentQueue = [node];
            levels.set(node, nextLevel);
            visited.add(node);

            while (componentQueue.length > 0) {
                const current = componentQueue.shift();

                for (const neighbor of adjacencyList.get(current) || []) {
                    if (!levels.has(neighbor)) {
                        levels.set(neighbor, nextLevel);
                        visited.add(neighbor);
                        componentQueue.push(neighbor);
                    }
                }
            }

            nextLevel = Math.max(...levels.values()) + 1;
        }
    }

    const layers = new Map();

    nodes.forEach(node => {
        const level = levels.get(node);

        if (!layers.has(level)) {
            layers.set(level, []);
        }

        layers.get(level).push(node);
    });

    // Initial ordering follows the user's node list.
    const sortedLevels = [...layers.keys()].sort((a, b) => a - b);

    // Barycentric ordering: attempt to reduce crossings.
    for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < sortedLevels.length; i++) {
            const currentLayer = layers.get(sortedLevels[i]);
            const previousLayer = layers.get(sortedLevels[i - 1]);

            const previousIndex = new Map(
                previousLayer.map((node, index) => [node, index])
            );

            currentLayer.sort((a, b) => {
                const averageIndex = node => {
                    const connected = (adjacencyList.get(node) || [])
                        .filter(neighbor => previousIndex.has(neighbor));

                    if (connected.length === 0) {
                        return previousLayer.length / 2;
                    }

                    return connected.reduce(
                        (sum, neighbor) => sum + previousIndex.get(neighbor),
                        0
                    ) / connected.length;
                };

                return averageIndex(a) - averageIndex(b);
            });
        }
    }

    // Position each layer horizontally and each level vertically.
    const graphWidth = graphContainer.clientWidth || 900;

    const maxNodesInLayer = Math.max(
        1,
        ...[...layers.values()].map(layer => layer.length)
    );

    const contentWidth = Math.max(
        graphWidth,
        maxNodesInLayer * NODE_SPACING_X + GRAPH_PADDING * 2
    );

    const maxLevel = Math.max(...levels.values());
    const contentHeight = Math.max(
        graphContainer.clientHeight,
        (maxLevel + 1) * NODE_SPACING_Y + GRAPH_PADDING * 2
    );

    graphContainer.style.minWidth = `${Math.min(contentWidth, 20000)}px`;
    graphContainer.style.minHeight = `${Math.min(contentHeight, 20000)}px`;

    for (const level of sortedLevels) {
        const layer = layers.get(level);

        const spacing = Math.max(
            NODE_SPACING_X,
            (contentWidth - GRAPH_PADDING * 2) / Math.max(layer.length, 1)
        );

        const layerWidth = spacing * layer.length;
        const startX = (contentWidth - layerWidth) / 2 + spacing / 2;

        layer.forEach((node, index) => {
            positions.set(node, {
                x: startX + index * spacing,
                y: GRAPH_PADDING + level * NODE_SPACING_Y
            });
        });
    }

    // A selected root should be at the top of its own component.
    // Isolated components are placed below the root component.
}


// ==========================================
// 6. RENDER GRAPH NODES AND EDGES
// ==========================================

function renderGraph() {
    graphContainer.innerHTML = "";

    if (nodes.length === 0) {
        const placeholder = document.createElement("p");
        placeholder.className = "graph-placeholder";
        placeholder.textContent = "Your graph will appear here.";
        graphContainer.appendChild(placeholder);
        return;
    }

    // Draw edges first so nodes appear above them.
    edges.forEach(({ from, to }) => {
        const start = positions.get(from);
        const end = positions.get(to);

        if (!start || !end) return;

        const edgeElement = document.createElement("div");
        edgeElement.className = "edge";
        edgeElement.dataset.from = from;
        edgeElement.dataset.to = to;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        edgeElement.style.width = `${length}px`;
        edgeElement.style.left = `${start.x}px`;
        edgeElement.style.top = `${start.y}px`;
        edgeElement.style.transform = `rotate(${angle}deg)`;

        graphContainer.appendChild(edgeElement);
    });

    // Draw nodes.
    nodes.forEach(node => {
        const position = positions.get(node);
        if (!position) return;

        const nodeElement = document.createElement("div");
        nodeElement.className = "node";
        nodeElement.dataset.node = node;
        nodeElement.textContent = node;

        nodeElement.style.left = `${position.x}px`;
        nodeElement.style.top = `${position.y}px`;
        nodeElement.title = `Node ${node}`;

        graphContainer.appendChild(nodeElement);
    });

    updateNodeStyles();
}


// ==========================================
// 7. PREPARE BFS OR DFS TRAVERSAL
// ==========================================

function prepareTraversal() {
    const startNode = startNodeSelect.value;
    const algorithm = algorithmSelect.value;

    if (!startNode || !adjacencyList.has(startNode)) {
        showMessage("Please select a valid starting node.", true);
        return false;
    }

    traversalSteps = [];

    if (algorithm === "bfs") {
        runBFS(startNode);
    } else {
        runDFS(startNode);
    }

    // Traverse other disconnected components afterward.
    for (const node of nodes) {
        if (!traversalSteps.includes(node)) {
            const alreadyScheduled = new Set(traversalSteps);

            if (!alreadyScheduled.has(node)) {
                if (algorithm === "bfs") {
                    appendBFSComponent(node);
                } else {
                    appendDFSComponent(node);
                }
            }
        }
    }

    traversalIndex = 0;
    visitedNodes.clear();
    currentNode = null;

    renderTraversalOrder();
    updateNodeStyles();

    return true;
}


// ==========================================
// 8. BREADTH-FIRST SEARCH
// ==========================================

function runBFS(startNode) {
    const queue = [startNode];
    const visited = new Set([startNode]);

    while (queue.length > 0) {
        const node = queue.shift();
        traversalSteps.push(node);

        for (const neighbor of adjacencyList.get(node) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
}

function appendBFSComponent(startNode) {
    const queue = [startNode];
    const visited = new Set(traversalSteps);

    visited.add(startNode);

    while (queue.length > 0) {
        const node = queue.shift();
        traversalSteps.push(node);

        for (const neighbor of adjacencyList.get(node) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
}


// ==========================================
// 9. DEPTH-FIRST SEARCH
// ==========================================

function runDFS(startNode) {
    const visited = new Set();

    function visit(node) {
        visited.add(node);
        traversalSteps.push(node);

        for (const neighbor of adjacencyList.get(node) || []) {
            if (!visited.has(neighbor)) {
                visit(neighbor);
            }
        }
    }

    visit(startNode);
}

function appendDFSComponent(startNode) {
    const visited = new Set(traversalSteps);

    function visit(node) {
        if (visited.has(node)) return;

        visited.add(node);
        traversalSteps.push(node);

        for (const neighbor of adjacencyList.get(node) || []) {
            if (!visited.has(neighbor)) {
                visit(neighbor);
            }
        }
    }

    visit(startNode);
}


// ==========================================
// 10. START TRAVERSAL
// ==========================================

function startTraversal() {
    if (isRunning) return;

    // Prepare a fresh traversal when necessary.
    if (
        traversalSteps.length === 0 ||
        traversalIndex >= traversalSteps.length
    ) {
        if (!prepareTraversal()) return;
    }

    isRunning = true;

    statusElement.textContent =
        `${algorithmSelect.value.toUpperCase()} traversal running...`;

    processNextStep();

    if (traversalIndex < traversalSteps.length) {
        animationTimer = setInterval(
            processNextStep,
            ANIMATION_SPEED
        );
    }
}


// ==========================================
// 11. PROCESS NEXT STEP
// ==========================================

function processNextStep() {
    if (traversalIndex >= traversalSteps.length) {
        stopAnimation();

        statusElement.textContent = "Traversal completed!";
        currentNode = null;
        updateNodeStyles();
        renderTraversalOrder();

        return;
    }

    currentNode = traversalSteps[traversalIndex];

    visitedNodes.add(currentNode);
    traversalIndex++;

    updateNodeStyles();
    renderTraversalOrder();

    statusElement.textContent =
        `Visiting node ${currentNode} (${traversalIndex} of ${traversalSteps.length}).`;

    if (traversalIndex >= traversalSteps.length) {
        stopAnimation();

        statusElement.textContent = "Traversal completed!";
        currentNode = null;
        updateNodeStyles();
    }
}


// ==========================================
// 12. PAUSE ANIMATION
// ==========================================

function pauseTraversal() {
    stopAnimation();

    if (traversalIndex > 0 && traversalIndex < traversalSteps.length) {
        statusElement.textContent = "Traversal paused.";
    }
}


// ==========================================
// 13. NEXT STEP BUTTON
// ==========================================

function nextStep() {
    stopAnimation();

    if (traversalSteps.length === 0) {
        if (!prepareTraversal()) return;
    }

    if (traversalIndex >= traversalSteps.length) {
        statusElement.textContent = "Traversal already completed.";
        return;
    }

    isRunning = false;
    processNextStep();
}


// ==========================================
// 14. RESET TRAVERSAL
// ==========================================

function resetTraversal() {
    stopAnimation();

    traversalSteps = [];
    traversalIndex = 0;
    visitedNodes.clear();
    currentNode = null;

    renderTraversalOrder();
    updateNodeStyles();

    statusElement.textContent = "Ready to start traversal.";
}


// ==========================================
// 15. STOP ANIMATION
// ==========================================

function stopAnimation() {
    if (animationTimer !== null) {
        clearInterval(animationTimer);
        animationTimer = null;
    }

    isRunning = false;
}


// ==========================================
// 16. UPDATE NODE COLORS
// ==========================================

function updateNodeStyles() {
    graphContainer.querySelectorAll(".node").forEach(element => {
        const node = element.dataset.node;

        element.classList.remove("visited", "current");

        if (visitedNodes.has(node)) {
            element.classList.add("visited");
        }

        if (node === currentNode) {
            element.classList.remove("visited");
            element.classList.add("current");
        }
    });
}


// ==========================================
// 17. SHOW TRAVERSAL ORDER
// ==========================================

function renderTraversalOrder() {
    traversalOrderElement.innerHTML = "";

    if (visitedNodes.size === 0) {
        const empty = document.createElement("span");
        empty.className = "empty-result";
        empty.textContent = "No nodes visited yet.";
        traversalOrderElement.appendChild(empty);
        return;
    }

    traversalSteps.slice(0, traversalIndex).forEach(node => {
        const item = document.createElement("span");
        item.className = "node-item";
        item.textContent = node;
        traversalOrderElement.appendChild(item);
    });
}


// ==========================================
// 18. SHOW INPUT MESSAGES
// ==========================================

function showMessage(message, isError) {
    inputMessage.textContent = message;

    inputMessage.style.color = isError
        ? "#fb7185"
        : "#34d399";
}


// ==========================================
// 19. EVENT LISTENERS
// ==========================================

createGraphBtn.addEventListener("click", createGraph);

startBtn.addEventListener("click", startTraversal);

pauseBtn.addEventListener("click", pauseTraversal);

nextStepBtn.addEventListener("click", nextStep);

resetBtn.addEventListener("click", resetTraversal);


// Recalculate the layout if the starting node changes.
startNodeSelect.addEventListener("change", () => {
    stopAnimation();
    resetTraversal();
    calculateLayerPositions();
    renderGraph();
});

// Changing the algorithm resets traversal progress.
algorithmSelect.addEventListener("change", resetTraversal);
// ==========================================
// 20. INITIALIZE THE APP
// ==========================================
createGraph();
