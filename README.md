# Pathfinding Visualizer

A comprehensive interactive web application built with Next.js, React, and TypeScript to visualize various pathfinding algorithms. The application allows users to experiment with graph algorithms on a 2D grid and view real-world scaling of Dijkstra's algorithm on an interactive map.

## Core Features

### Interactive Grid
The core of the visualizer is a responsive 2D grid acting as an unweighted graph where each cell represents a node, and orthogonal movement between cells carries a movement cost of 1.
- **Start and Target Nodes**: Place these markers to designate the beginning and end points of the traversal.
- **Map Editing (Walls)**: Draw impenetrable barriers by clicking or dragging across the grid. The pathfinding algorithms are required to route around these obstacles. If completely blocked, the system accurately reports that no path could be found.

### Multiple Algorithms Supported
Users can select from four distinct pathfinding algorithms from the dropdown menu to see how they differ in exploration patterns and path optimality:

1. **Dijkstra's Algorithm**: The foundational pathfinding algorithm. It explores all possible paths mathematically radiating outwards to guarantee the absolute shortest route.
2. **Breadth-First Search (BFS)**: A fundamental traversal that expands level-by-level. On an unweighted grid, BFS also guarantees the shortest path and is generally faster to compute as it requires no complex weight-priority processing.
3. **Depth-First Search (DFS)**: A traversal that plunges as deep as possible into open paths before backtracking. It does not guarantee optimal paths and typically creates winding, erratic lines, making it unsuitable for real route planning, but great for exhaustive traversal.
4. **Bellman-Ford (via SPFA)**: An algorithm designed to handle negative weight edges. In this unweighted environment, it operates similarly to standard algorithms but uses a continuous edge-relaxation technique on nodes.

### Utility Controls
- **Clear**: Removes color-coded explored and path nodes, preserving the grid walls and target nodes for rerunning against the same maze.
- **Maze Generation**: Instantly scaffolds a randomized scattering of obstacles across the board.
- **Demo Setup**: Offers a quick default configuration to test animations immediately.
- **Reset**: Wipes the entire grid, resetting all state back to blank defaults.

### Performance Analytics and Feedback
As the algorithm runs, the application displays live statistics:
- **Execution Time**: How long the computation logic took before the animation runs.
- **Nodes Explored**: Reflects how aggressively the algorithm had to search before finding the target.
- **Path Length**: Measures the distance of the final optimal path (displayed as 0 if the path is fully barricaded).
- A centralized status segment explicitly states whether the system is ready, running, or has successfully found a path (or if it failed to find one due to blockages).

### Real-World Geographic Visualization
Via the designated Map view, users can interact with a geographic visualization utilizing OSRM (Open Source Routing Machine). By designating points on an actual interactive map, the application computes valid driving routes and plots them, illustrating how node-based pathfinding concepts scale to massive real-world road networks.

## Setup and Installation

1. Install dependencies:
   `ash
   npm install
   `

2. Run the development server:
   `ash
   npm run dev
   `

3. Open the browser and navigate to http://localhost:3000 to interact with the visualizer.
