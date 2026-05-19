export const sampleGraph = {
  nodes: [
    { id: 'A', label: 'A', position: { x: 80, y: 120 } },
    { id: 'B', label: 'B', position: { x: 300, y: 80 } },
    { id: 'C', label: 'C', position: { x: 220, y: 260 } },
    { id: 'D', label: 'D', position: { x: 520, y: 190 } },
    { id: 'E', label: 'E', position: { x: 680, y: 90 } },
  ],
  edges: [
    { id: 'A-B', source: 'A', target: 'B', weight: 4 },
    { id: 'A-C', source: 'A', target: 'C', weight: 2 },
    { id: 'C-B', source: 'C', target: 'B', weight: 1 },
    { id: 'B-D', source: 'B', target: 'D', weight: 5 },
    { id: 'C-D', source: 'C', target: 'D', weight: 8 },
    { id: 'D-E', source: 'D', target: 'E', weight: 3 },
    { id: 'B-E', source: 'B', target: 'E', weight: 10 },
  ],
};

export const getNodeIds = (graph) => graph.nodes.map((node) => node.id);

export const createEdgeId = (source, target, existingEdges = []) => {
  const base = `${source}-${target}`;
  let id = base;
  let index = 2;

  while (existingEdges.some((edge) => edge.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
};

export const buildAdjacencyList = (graph) => {
  const adjacency = Object.fromEntries(graph.nodes.map((node) => [node.id, []]));

  graph.edges.forEach((edge) => {
    if (!adjacency[edge.source]) {
      adjacency[edge.source] = [];
    }

    adjacency[edge.source].push({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      weight: Number(edge.weight),
    });
  });

  return adjacency;
};

export const parseEdgeText = (value) => {
  const edges = [];
  const nodes = new Set();

  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const [source, target, weightValue] = line.split(/\s+/);
      const weight = Number(weightValue);

      if (!source || !target || Number.isNaN(weight)) {
        throw new Error(`Line ${index + 1} should look like: A B 4`);
      }

      nodes.add(source);
      nodes.add(target);
      edges.push({
        id: createEdgeId(source, target, edges),
        source,
        target,
        weight,
      });
    });

  return {
    nodes: [...nodes].sort().map((id) => ({ id, label: id })),
    edges,
  };
};

export const toCytoscapeElements = (graph) => [
  ...graph.nodes.map((node) => ({
    data: { id: node.id, label: node.label || node.id },
    position: node.position,
  })),
  ...graph.edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: String(edge.weight),
      weight: edge.weight,
    },
  })),
];

export const randomGraph = () => {
  const nodes = ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => ({ id, label: id }));
  const candidates = [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['C', 'E'],
    ['D', 'E'],
    ['D', 'F'],
    ['E', 'F'],
    ['B', 'E'],
  ];

  const edges = candidates
    .filter(() => Math.random() > 0.28)
    .map(([source, target], index) => ({
      id: `${source}-${target}-${index}`,
      source,
      target,
      weight: Math.floor(Math.random() * 9) + 1,
    }));

  return { nodes, edges: edges.length ? edges : sampleGraph.edges };
};
