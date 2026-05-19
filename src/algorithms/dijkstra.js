import { buildAdjacencyList, getNodeIds } from '../utils/graphHelpers';

const INF = Number.POSITIVE_INFINITY;

const formatDistance = (value) => (value === INF ? 'Infinity' : value);

const cloneDistances = (distances) =>
  Object.fromEntries(Object.entries(distances).map(([node, value]) => [node, formatDistance(value)]));

const queueSnapshot = (queue) =>
  [...queue]
    .sort((a, b) => a.distance - b.distance || a.node.localeCompare(b.node))
    .map(({ node, distance }) => [node, formatDistance(distance)]);

const buildPathEdges = (previous, targetNode) => {
  const edges = [];
  let cursor = targetNode;

  while (previous[cursor]) {
    edges.unshift([previous[cursor], cursor]);
    cursor = previous[cursor];
  }

  return edges;
};

export function generateDijkstraSteps(graph, startNode, targetNode) {
  const nodes = getNodeIds(graph);

  if (!nodes.length || !startNode || !nodes.includes(startNode)) {
    return [];
  }

  const adjacency = buildAdjacencyList(graph);
  const distances = Object.fromEntries(nodes.map((node) => [node, INF]));
  const previous = {};
  const visited = new Set();
  const queue = [{ node: startNode, distance: 0 }];
  const steps = [];

  distances[startNode] = 0;

  steps.push({
    type: 'init',
    currentNode: startNode,
    visited: [],
    distances: cloneDistances(distances),
    currentEdge: null,
    updatedNode: startNode,
    explanation: `Initialize every distance to Infinity, then set ${startNode} to 0 because it is the starting node.`,
    selectionReason: `${startNode} is selected first because its temporary distance is 0.`,
    relaxation: null,
    priorityQueue: queueSnapshot(queue),
    finalPathEdges: [],
  });

  while (queue.length) {
    queue.sort((a, b) => a.distance - b.distance || a.node.localeCompare(b.node));
    const { node: currentNode, distance } = queue.shift();

    if (visited.has(currentNode)) {
      continue;
    }

    if (distance > distances[currentNode]) {
      continue;
    }

    steps.push({
      type: 'select',
      currentNode,
      visited: [...visited],
      distances: cloneDistances(distances),
      currentEdge: null,
      updatedNode: null,
      explanation: `${currentNode} is now the current node. Dijkstra always chooses the unvisited node with the smallest known temporary distance.`,
      selectionReason: `Among the priority queue entries, ${currentNode} has the minimum distance (${formatDistance(distances[currentNode])}).`,
      relaxation: null,
      priorityQueue: queueSnapshot(queue),
      finalPathEdges: [],
    });

    for (const edge of adjacency[currentNode] || []) {
      if (visited.has(edge.to)) {
        steps.push({
          type: 'skip',
          currentNode,
          visited: [...visited],
          distances: cloneDistances(distances),
          currentEdge: [edge.from, edge.to],
          updatedNode: null,
          explanation: `${edge.to} is already visited, so the edge ${edge.from} -> ${edge.to} cannot improve the final distance.`,
          selectionReason: `${currentNode} is still being processed.`,
          relaxation: {
            node: edge.to,
            before: formatDistance(distances[edge.to]),
            candidate: formatDistance(distances[currentNode] + edge.weight),
            expression: `dist[${edge.to}] = min(${formatDistance(distances[edge.to])}, ${formatDistance(distances[currentNode])} + ${edge.weight})`,
            result: formatDistance(distances[edge.to]),
            improved: false,
          },
          priorityQueue: queueSnapshot(queue),
          finalPathEdges: [],
        });
        continue;
      }

      const candidate = distances[currentNode] + edge.weight;
      const before = distances[edge.to];
      const improved = candidate < before;

      if (improved) {
        distances[edge.to] = candidate;
        previous[edge.to] = currentNode;
        queue.push({ node: edge.to, distance: candidate });
      }

      steps.push({
        type: improved ? 'relax' : 'no-update',
        currentNode,
        visited: [...visited],
        distances: cloneDistances(distances),
        currentEdge: [edge.from, edge.to],
        updatedNode: improved ? edge.to : null,
        explanation: improved
          ? `Updated distance of ${edge.to} because ${formatDistance(distances[currentNode])} + ${edge.weight} is less than ${formatDistance(before)}.`
          : `No update for ${edge.to}; the existing distance ${formatDistance(before)} is already better than or equal to ${candidate}.`,
        selectionReason: `${currentNode} is still being processed, so each outgoing edge is checked once.`,
        relaxation: {
          node: edge.to,
          before: formatDistance(before),
          candidate: formatDistance(candidate),
          expression: `dist[${edge.to}] = min(${formatDistance(before)}, ${formatDistance(distances[currentNode])} + ${edge.weight})`,
          result: formatDistance(distances[edge.to]),
          improved,
        },
        priorityQueue: queueSnapshot(queue),
        finalPathEdges: [],
      });
    }

    visited.add(currentNode);

    steps.push({
      type: 'visit',
      currentNode,
      visited: [...visited],
      distances: cloneDistances(distances),
      currentEdge: null,
      updatedNode: null,
      explanation: `${currentNode} is marked visited. Its shortest distance is final.`,
      selectionReason: `All outgoing edges from ${currentNode} have been considered.`,
      relaxation: null,
      priorityQueue: queueSnapshot(queue),
      finalPathEdges: [],
    });

    if (targetNode && currentNode === targetNode) {
      break;
    }
  }

  const finalTarget = targetNode || nodes.find((node) => node !== startNode && previous[node]) || startNode;
  const finalPathEdges = buildPathEdges(previous, finalTarget);

  steps.push({
    type: 'complete',
    currentNode: null,
    visited: [...visited],
    distances: cloneDistances(distances),
    currentEdge: null,
    updatedNode: null,
    explanation: finalPathEdges.length
      ? `Simulation complete. The highlighted red edges show the shortest path to ${finalTarget}.`
      : 'Simulation complete. No red path is shown because no target path was discovered.',
    selectionReason: 'The priority queue is empty or the selected target has been finalized.',
    relaxation: null,
    priorityQueue: [],
    finalPathEdges,
    previous,
  });

  return steps;
}
