import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

export default function Controls({
  isPlaying,
  onStart,
  onPause,
  onReset,
  onNext,
  onPrevious,
  speed,
  onSpeedChange,
  stepIndex,
  totalSteps,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-panel lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={isPlaying ? onPause : onStart}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <SkipBack size={18} />
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <SkipForward size={18} />
          Next
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-sm font-medium text-slate-600">
          Step <span className="font-semibold text-slate-950">{totalSteps ? stepIndex + 1 : 0}</span> / {totalSteps}
        </div>
        <label className="flex min-w-64 items-center gap-3 text-sm font-medium text-slate-600">
          Speed
          <input
            type="range"
            min="250"
            max="1800"
            step="50"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="w-full accent-blue-600"
          />
          <span className="w-16 text-right font-mono text-xs">{speed}ms</span>
        </label>
      </div>
    </div>
  );
}
