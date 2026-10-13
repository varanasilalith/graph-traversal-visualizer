# Graph Traversal Visualizer

An interactive web application that visualizes graph traversal algorithms, **Breadth-First Search (BFS)** and **Depth-First Search (DFS)**. It helps users understand how graph nodes are visited step by step through an interactive visual representation.

## 🚀 Features

- **Graph Input:** Enter graph nodes and edges to create a graph.
- **Graph Visualization:** Display nodes and connections visually.
- **BFS Traversal:** Explore nodes level by level using Breadth-First Search.
- **DFS Traversal:** Explore as deeply as possible along a path before backtracking using Depth-First Search.
- **Starting Node Selection:** Choose the node from which traversal begins.
- **Step-by-Step Execution:** Control traversal using Start, Pause, and Next Step buttons.
- **Reset Functionality:** Reset the traversal and run the algorithm again.
- **Traversal Results:** Display the order in which nodes are visited.
- **Responsive Design:** Use the application on desktop and smaller screens.
- **Interactive Interface:** A dark-themed interface designed for clarity and ease of use.

## 🛠️ Technologies Used

- **HTML5** — Structures the web application.
- **CSS3** — Provides styling, layout, colors, and responsive design.
- **JavaScript** — Implements graph creation, visualization, and traversal algorithms.

## 📁 Project Structure

```text
Graph-Traversal-Visualizer/
│
├── index.html      # Main HTML page
├── style.css       # Styling and responsive layout
├── script.js       # Graph logic and traversal algorithms
└── README.md       # Project documentation
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
```

Replace `<your-repository-url>` with your Git repository URL.

### 2. Open the project folder

```bash
cd Graph-Traversal-Visualizer
```

### 3. Run the application

Open `index.html` in your web browser.

You can also open the project folder in Visual Studio Code and use the **Live Server** extension to run the application locally.

No additional dependencies or package installation are required for the basic HTML, CSS, and JavaScript version.

## 📖 How to Use

1. Open the Graph Traversal Visualizer in your browser.
2. Enter the graph nodes and their connections in the graph input section.
3. Generate or display the graph.
4. Select the traversal algorithm:
   - **BFS:** Breadth-First Search.
   - **DFS:** Depth-First Search.
5. Select a starting node.
6. Click **Start** to begin the traversal.
7. Use **Pause** to pause the animation.
8. Use **Next Step** to advance the traversal one step at a time.
9. Observe the highlighted nodes and edges.
10. Check the traversal results to see the visiting order.
11. Click **Reset** to run another traversal.

*Note: The exact input format and control behavior depend on the implementation in `script.js`.*

## 🧠 Algorithms Explained

### Breadth-First Search (BFS)

BFS explores a graph level by level. It visits neighboring nodes before moving to nodes farther away from the starting node.

**Data structure:** Queue (FIFO — First In, First Out).

**Time complexity:** \(O(V + E)\)

**Space complexity:** \(O(V)\)

### Depth-First Search (DFS)

DFS explores a path as deeply as possible before backtracking to explore other paths.

**Data structure:** Stack or recursion.

**Time complexity:** \(O(V + E)\)

**Space complexity:** \(O(V)\)

Here, \(V\) represents the number of vertices (nodes), and \(E\) represents the number of edges.



## 🎯 Project Objectives

- Understand graph data structures and traversal algorithms.
- Visualize BFS and DFS execution interactively.
- Learn how queues and stacks are used in graph traversal.
- Explore how graph connectivity and cycles affect traversal.
- Provide an accessible tool for students learning data structures and algorithms.

## 🔮 Future Improvements

- Add support for weighted graphs.
- Allow users to create graphs by clicking and dragging nodes.
- Add directed-edge arrows.
- Display traversal order and distance levels.
- Show the queue state during BFS and stack state during DFS.
- Add shortest-path visualization using BFS for unweighted graphs.
- Support exporting graph visualizations.
- Add more algorithms, such as Dijkstra's algorithm and A* search.


