import cytoscape from 'cytoscape';
import { useEffect, useMemo, useRef } from 'react';
import { toCytoscapeElements } from '../utils/graphHelpers';

const edgeKey = ([source, target]) => `${source}->${target}`;

const stylesheet = [
  {
    selector: 'node',
    style: {
      'background-color': '#f8fafc',
      'border-color': '#64748b',
      'border-width': 2,
      color: '#0f172a',
      label: 'data(label)',
      'font-size': 14,
      'font-weight': 700,
      height: 42,
      width: 42,
      'text-valign': 'center',
      'text-halign': 'center',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 3,
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-size': 12,
      'font-weight': 700,
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.9,
      'text-background-padding': 3,
      color: '#334155',
    },
  },
  {
    selector: '.current',
    style: {
      'background-color': '#facc15',
      'border-color': '#a16207',
      'border-width': 4,
    },
  },
  {
    selector: '.visited',
    style: {
      'background-color': '#22c55e',
      'border-color': '#15803d',
      color: '#052e16',
    },
  },
  {
    selector: '.updated',
    style: {
      'background-color': '#bfdbfe',
      'border-color': '#2563eb',
      'border-width': 4,
    },
  },
  {
    selector: '.current-edge',
    style: {
      width: 6,
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      color: '#1d4ed8',
      'z-index': 10,
    },
  },
  {
    selector: '.final-path',
    style: {
      width: 7,
      'line-color': '#ef4444',
      'target-arrow-color': '#ef4444',
      color: '#b91c1c',
      'z-index': 20,
    },
  },
];

export default function GraphCanvas({ graph, step, onNodePositionChange, selectedElement, onSelectElement }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const onSelectElementRef = useRef(onSelectElement);
  const onNodePositionChangeRef = useRef(onNodePositionChange);
  const elements = useMemo(() => toCytoscapeElements(graph), [graph]);

  useEffect(() => {
    onSelectElementRef.current = onSelectElement;
    onNodePositionChangeRef.current = onNodePositionChange;
  }, [onNodePositionChange, onSelectElement]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: stylesheet,
      layout: { name: 'grid', animate: false },
      minZoom: 0.35,
      maxZoom: 2,
    });

    cyRef.current = cy;

    cy.on('tap', 'node, edge', (event) => {
      const item = event.target;
      onSelectElementRef.current(item.isNode() ? { type: 'node', id: item.id() } : { type: 'edge', id: item.id() });
    });

    cy.on('tap', (event) => {
      if (event.target === cy) {
        onSelectElementRef.current(null);
      }
    });

    cy.on('dragfree', 'node', (event) => {
      const node = event.target;
      onNodePositionChangeRef.current(node.id(), node.position());
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.json({ elements });
    cy.layout({ name: graph.nodes.some((node) => node.position) ? 'preset' : 'cose', animate: true, padding: 48 }).run();
  }, [elements, graph.nodes]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.elements().removeClass('current visited updated current-edge final-path selected');

    step?.visited?.forEach((nodeId) => cy.getElementById(nodeId).addClass('visited'));
    if (step?.currentNode) {
      cy.getElementById(step.currentNode).addClass('current');
    }
    if (step?.updatedNode) {
      cy.getElementById(step.updatedNode).addClass('updated');
    }

    const currentEdge = step?.currentEdge ? edgeKey(step.currentEdge) : null;
    graph.edges.forEach((edge) => {
      const cyEdge = cy.getElementById(edge.id);
      if (currentEdge === edgeKey([edge.source, edge.target])) {
        cyEdge.addClass('current-edge');
        cyEdge.animate({ style: { width: 9 } }, { duration: 180 }).animate({ style: { width: 6 } }, { duration: 240 });
      }
    });

    step?.finalPathEdges?.forEach(([source, target]) => {
      const match = graph.edges.find((edge) => edge.source === source && edge.target === target);
      if (match) {
        cy.getElementById(match.id).addClass('final-path');
      }
    });
  }, [graph.edges, step]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.elements().style('overlay-opacity', 0);
    if (selectedElement) {
      cy.getElementById(selectedElement.id).style({
        'overlay-color': '#0f172a',
        'overlay-opacity': 0.12,
        'overlay-padding': 8,
      });
    }
  }, [selectedElement]);

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">Current</span>
        <span className="rounded-md bg-green-100 px-2 py-1 text-green-900">Visited</span>
        <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-900">Checking edge</span>
        <span className="rounded-md bg-red-100 px-2 py-1 text-red-900">Shortest path</span>
      </div>
    </div>
  );
}
