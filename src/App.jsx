import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Moon, Plus, Shuffle, Sun, Trash2, Upload } from 'lucide-react';
import Controls from './components/Controls';
import ExplanationPanel from './components/ExplanationPanel';
import GraphCanvas from './components/GraphCanvas';
import { generateDijkstraSteps } from './algorithms/dijkstra';
import {
  createEdgeId,
  getNodeIds,
  parseEdgeText,
  parseNonNegativeWeight,
  randomGraph,
  sampleGraph,
  validateGraphWeights,
} from './utils/graphHelpers';

const initialText = sampleGraph.edges.map((edge) => `${edge.source} ${edge.target} ${edge.weight}`).join('\n');

export default function App() {
  const [graph, setGraph] = useState(sampleGraph);
  const [edgeText, setEdgeText] = useState(initialText);
  const [startNode, setStartNode] = useState('A');
  const [targetNode, setTargetNode] = useState('E');
  const [newNodeId, setNewNodeId] = useState('');
  const [edgeForm, setEdgeForm] = useState({ source: 'A', target: 'B', weight: 1 });
  const [selectedElement, setSelectedElement] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(850);
  const [isDark, setIsDark] = useState(false);
  const [importError, setImportError] = useState('');

  const nodeIds = useMemo(() => getNodeIds(graph), [graph]);
  const currentStep = steps[stepIndex];

  const generateSteps = useCallback(() => {
    const generated = generateDijkstraSteps(graph, startNode, targetNode);
    setSteps(generated);
    setStepIndex(0);
    return generated;
  }, [graph, startNode, targetNode]);

  useEffect(() => {
    if (!nodeIds.includes(startNode)) {
      setStartNode(nodeIds[0] || '');
    }
    if (!nodeIds.includes(targetNode)) {
      setTargetNode(nodeIds[nodeIds.length - 1] || '');
    }
    if (!nodeIds.includes(edgeForm.source) || !nodeIds.includes(edgeForm.target)) {
      setEdgeForm((current) => ({ ...current, source: nodeIds[0] || '', target: nodeIds[1] || nodeIds[0] || '' }));
    }
  }, [edgeForm.source, edgeForm.target, nodeIds, startNode, targetNode]);

  useEffect(() => {
    if (!isPlaying || !steps.length) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setStepIndex((index) => {
        if (index >= steps.length - 1) {
          setIsPlaying(false);
          return index;
        }

        return index + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  const updateGraph = (updater) => {
    setGraph((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setEdgeText(next.edges.map((edge) => `${edge.source} ${edge.target} ${edge.weight}`).join('\n'));
      return next;
    });
    setSteps([]);
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleAddNode = () => {
    const id = newNodeId.trim().toUpperCase();
    if (!id || nodeIds.includes(id)) {
      return;
    }

    updateGraph((current) => ({
      ...current,
      nodes: [...current.nodes, { id, label: id }],
    }));
    setNewNodeId('');
  };

  const handleAddEdge = () => {
    if (!edgeForm.source || !edgeForm.target) {
      return;
    }

    let weight;
    try {
      weight = parseNonNegativeWeight(edgeForm.weight, 'Edge weight');
      setImportError('');
    } catch (error) {
      setImportError(error.message);
      return;
    }

    updateGraph((current) => ({
      ...current,
      edges: [
        ...current.edges,
        {
          id: createEdgeId(edgeForm.source, edgeForm.target, current.edges),
          source: edgeForm.source,
          target: edgeForm.target,
          weight,
        },
      ],
    }));
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) {
      return;
    }

    updateGraph((current) => {
      if (selectedElement.type === 'node') {
        return {
          nodes: current.nodes.filter((node) => node.id !== selectedElement.id),
          edges: current.edges.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id),
        };
      }

      return {
        ...current,
        edges: current.edges.filter((edge) => edge.id !== selectedElement.id),
      };
    });
    setSelectedElement(null);
  };

  const handleApplyText = () => {
    try {
      const parsed = parseEdgeText(edgeText);
      setImportError('');
      updateGraph(parsed);
    } catch (error) {
      setImportError(error.message);
    }
  };

  const handleNodePositionChange = (nodeId, position) => {
    setGraph((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
    }));
  };

  const handleStart = () => {
    const generated = steps.length ? steps : generateSteps();
    if (generated.length || steps.length) {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
    if (!steps.length) {
      generateSteps();
    }
  };

  const handleNext = () => {
    const generated = steps.length ? steps : generateSteps();
    setIsPlaying(false);
    setStepIndex((index) => Math.min(index + 1, generated.length - 1));
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleRandomGraph = () => {
    const nextGraph = randomGraph();
    updateGraph(nextGraph);
    setStartNode(nextGraph.nodes[0]?.id || '');
    setTargetNode(nextGraph.nodes[nextGraph.nodes.length - 1]?.id || '');
  };

  const handleExport = () => {
    const encoded = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(graph, null, 2))}`;
    const link = document.createElement('a');
    link.href = encoded;
    link.download = 'dijkstra-graph.json';
    link.click();
  };

  const handleImportJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    file.text().then((contents) => {
      try {
        const parsed = JSON.parse(contents);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          throw new Error('JSON must include nodes and edges arrays.');
        }
        const validated = validateGraphWeights(parsed);
        setImportError('');
        updateGraph(validated);
      } catch (error) {
        setImportError(error.message);
      }
    });
  };

  return (
    <main className={isDark ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-100 text-slate-950'}>
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4 lg:p-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal lg:text-3xl">Graph Algorithm Visualizer</h1>
            <p className={isDark ? 'mt-1 text-sm text-slate-300' : 'mt-1 text-sm text-slate-600'}>
              Dijkstra&apos;s Algorithm, generated as discrete simulation states before playback.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={startNode}
              onChange={(event) => setStartNode(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              {nodeIds.map((node) => (
                <option key={node}>{node}</option>
              ))}
            </select>
            <select
              value={targetNode}
              onChange={(event) => setTargetNode(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              {nodeIds.map((node) => (
                <option key={node}>{node}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => generateSteps()}
              className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Generate Steps
            </button>
            <button
              type="button"
              onClick={() => setIsDark((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_380px]">
          <aside className="flex min-h-0 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-panel">
            <div>
              <h2 className="text-base font-semibold">Graph Builder</h2>
              <p className="mt-1 text-sm text-slate-500">Directed weighted edges are used for the simulation.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Add node
                <div className="mt-1 flex gap-2">
                  <input
                    value={newNodeId}
                    onChange={(event) => setNewNodeId(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddNode()}
                    className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm"
                    placeholder="F"
                  />
                  <button
                    type="button"
                    onClick={handleAddNode}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white"
                    aria-label="Add node"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={edgeForm.source}
                  onChange={(event) => setEdgeForm((current) => ({ ...current, source: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 px-2 text-sm"
                >
                  {nodeIds.map((node) => (
                    <option key={node}>{node}</option>
                  ))}
                </select>
                <select
                  value={edgeForm.target}
                  onChange={(event) => setEdgeForm((current) => ({ ...current, target: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 px-2 text-sm"
                >
                  {nodeIds.map((node) => (
                    <option key={node}>{node}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={edgeForm.weight}
                  onChange={(event) => setEdgeForm((current) => ({ ...current, weight: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  aria-label="Edge weight"
                />
                <button
                  type="button"
                  onClick={handleAddEdge}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Edge
                </button>
              </div>

              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={!selectedElement}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} />
                Delete selected
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="edgeText">
                Text input
              </label>
              <textarea
                id="edgeText"
                value={edgeText}
                onChange={(event) => setEdgeText(event.target.value)}
                className="h-36 w-full resize-none rounded-md border border-slate-300 p-3 font-mono text-sm leading-5"
                spellCheck="false"
              />
              {importError && <p className="text-sm text-red-600">{importError}</p>}
              <button
                type="button"
                onClick={handleApplyText}
                className="h-10 w-full rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply text graph
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleRandomGraph}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                aria-label="Random graph"
              >
                <Shuffle size={17} />
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                aria-label="Export graph JSON"
              >
                <Download size={17} />
              </button>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100" aria-label="Import graph JSON">
                <Upload size={17} />
                <input type="file" accept="application/json" className="hidden" onChange={handleImportJson} />
              </label>
            </div>
          </aside>

          <GraphCanvas
            graph={graph}
            step={currentStep}
            onNodePositionChange={handleNodePositionChange}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
          />

          <ExplanationPanel step={currentStep} stepIndex={stepIndex} totalSteps={steps.length} />
        </section>

        <Controls
          isPlaying={isPlaying}
          onStart={handleStart}
          onPause={() => setIsPlaying(false)}
          onReset={handleReset}
          onNext={handleNext}
          onPrevious={handlePrevious}
          speed={speed}
          onSpeedChange={setSpeed}
          stepIndex={stepIndex}
          totalSteps={steps.length}
        />
      </div>
    </main>
  );
}
