import DistanceTable from './DistanceTable';

const displayValue = (value) => (value === 'Infinity' ? '∞' : value);

export default function ExplanationPanel({ step, stepIndex, totalSteps }) {
  if (!step) {
    return (
      <aside className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <p className="text-sm text-slate-500">Build a graph and press Start to generate the Dijkstra walkthrough.</p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Dijkstra Walkthrough</h2>
      </div>

      <div className="rounded-lg bg-slate-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Node</p>
        <p className="mt-1 text-3xl font-semibold text-slate-950">{step.currentNode || 'Complete'}</p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-950">Why was it selected?</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{step.selectionReason}</p>
      </section>

      {step.relaxation && (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-950">Relaxation</h3>
          <p className="mt-2 font-mono text-sm text-blue-950">{step.relaxation.expression.replaceAll('Infinity', '∞')}</p>
          <p className="mt-2 font-mono text-sm text-blue-900">
            dist[{step.relaxation.node}] = {displayValue(step.relaxation.result)}
          </p>
          <p className="mt-2 text-sm text-blue-800">
            {step.relaxation.improved ? 'This improves the shortest known distance.' : 'The current distance stays unchanged.'}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-950">Explanation</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{step.explanation}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-950">Priority Queue</h3>
        <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {step.priorityQueue.length ? (
            step.priorityQueue.map(([node, distance], index) => (
              <span key={`${node}-${distance}-${index}`} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {node}: <span className="font-mono">{displayValue(distance)}</span>
              </span>
            ))
          ) : (
            <span className="px-2 py-2 text-sm text-slate-500">Empty</span>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-950">Distances</h3>
        <DistanceTable distances={step.distances} currentNode={step.currentNode} updatedNode={step.updatedNode} />
      </section>
    </aside>
  );
}
