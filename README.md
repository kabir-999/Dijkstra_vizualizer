# Graph Algorithm Visualizer

An interactive React teaching app for Dijkstra's Algorithm. The simulator creates a complete array of algorithm states first, then plays those states step by step with Cytoscape.js graph highlights and an educational explanation panel.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Features

- Add, edit through text, and delete directed weighted graph elements
- Import graph edges using `A B 4` line format
- Draggable Cytoscape.js graph with automatic layout
- Precomputed Dijkstra simulation states
- Current node, visited nodes, active edge, and final path highlights
- Distance table, priority queue view, relaxation explanation, and playback controls
- Random graph generation, JSON import/export, dark mode toggle, and responsive layout

## Project Structure

```text
src/
├── algorithms/
│   └── dijkstra.js
├── components/
│   ├── Controls.jsx
│   ├── DistanceTable.jsx
│   ├── ExplanationPanel.jsx
│   └── GraphCanvas.jsx
├── utils/
│   └── graphHelpers.js
├── App.jsx
├── main.jsx
└── styles.css
```
