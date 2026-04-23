'use client';

export type DatasetType = 'eurosat' | 'mlrsnet' | 'patternnet';
export type ClassificationMode = 'single' | 'multi';

interface DatasetSelectorProps {
  selectedDataset: DatasetType;
  onDatasetChange: (dataset: DatasetType) => void;
  classificationMode: ClassificationMode;
  onModeChange: (mode: ClassificationMode) => void;
}

const datasets = [
  {
    id: 'eurosat' as DatasetType,
    name: 'EuroSAT',
    classes: 10,
    description: 'European satellite imagery',
  },
  {
    id: 'mlrsnet' as DatasetType,
    name: 'MLRSNet',
    classes: 46,
    description: 'Multi-spectral remote sensing',
  },
  {
    id: 'patternnet' as DatasetType,
    name: 'PatternNet',
    classes: 38,
    description: 'High-resolution benchmark',
  },
];

export function DatasetSelector({
  selectedDataset,
  onDatasetChange,
  classificationMode,
  onModeChange,
}: DatasetSelectorProps) {
  const selected = datasets.find((d) => d.id === selectedDataset) || datasets[0];

  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-xs uppercase tracking-wider text-slate-400">
        Benchmark Dataset
      </label>

      <select
        value={selectedDataset}
        onChange={(e) => {
          onDatasetChange(e.target.value as DatasetType);
          // Reset to single label when switching away from mlrsnet
          if (e.target.value !== 'mlrsnet') {
            onModeChange('single');
          }
        }}
        className="w-full p-2.5 sm:p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
      >
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.name} — {dataset.classes} classes
          </option>
        ))}
      </select>

      <p className="text-xs text-slate-500">{selected.description}</p>

      {/* Classification Mode — only for MLRSNet */}
      {selectedDataset === 'mlrsnet' && (
        <div className="mt-1 rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Classification Mode
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Single Label option */}
            <button
              type="button"
              onClick={() => onModeChange('single')}
              className={`group relative flex flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left transition-all border ${
                classificationMode === 'single'
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-sm shadow-indigo-900/40'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base">🎯</span>
                <span
                  className={`text-sm font-bold transition-colors ${
                    classificationMode === 'single' ? 'text-indigo-200' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  Single Label
                </span>
                {classificationMode === 'single' && (
                  <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 leading-snug">
                AMFRNet · top-1 class
              </span>
            </button>

            {/* Multi Label option */}
            <button
              type="button"
              onClick={() => onModeChange('multi')}
              className={`group relative flex flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left transition-all border ${
                classificationMode === 'multi'
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-sm shadow-indigo-900/40'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base">🧠</span>
                <span
                  className={`text-sm font-bold transition-colors ${
                    classificationMode === 'multi' ? 'text-indigo-200' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  Multi Label
                </span>
                {classificationMode === 'multi' && (
                  <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 leading-snug">
                AMSI-Net · all classes
              </span>
            </button>
          </div>

          {/* Context hint */}
          <p className={`text-[11px] leading-relaxed transition-colors ${
            classificationMode === 'multi' ? 'text-indigo-400/80' : 'text-slate-500'
          }`}>
            {classificationMode === 'multi'
              ? '⚡ AMSI-Net detects multiple land-cover classes simultaneously with uncertainty scoring.'
              : '🎯 AMFRNet returns the single most likely land-cover class with a confidence score.'}
          </p>
        </div>
      )}
    </div>
  );
}
