const displayValue = (value) => (value === 'Infinity' ? '∞' : value);

export default function DistanceTable({ distances = {}, currentNode, updatedNode }) {
  const entries = Object.entries(distances);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Node</th>
            <th className="px-3 py-2">Distance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {entries.map(([node, distance]) => (
            <tr
              key={node}
              className={
                node === updatedNode
                  ? 'bg-blue-50 text-blue-900'
                  : node === currentNode
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-slate-700'
              }
            >
              <td className="px-3 py-2 font-semibold">{node}</td>
              <td className="px-3 py-2 font-mono">{displayValue(distance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
