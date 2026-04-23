'use client';

export function TechnicalSpecs() {
  const specs = [
    { label: 'Architecture', value: 'AMFRNet', details: 'Attention Multi-scale Feature Recognition Network' },
    { label: 'Parameters', value: '~365K', details: 'Total trainable parameters in the model' },
    { label: 'FLOPs', value: '~106M', details: 'Floating point operations per inference' },
    { label: 'Input Size', value: '224×224', details: 'Standard remote sensing image resolution' },
    { label: 'Normalization', value: 'ImageNet', details: 'RGB normalization (μ=[0.485, 0.456, 0.406], σ=[0.229, 0.224, 0.225])' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-600 to-slate-800" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Technical Specifications
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:border-indigo-500/20 transition-colors group"
            title={spec.details}
          >
            <p className="text-[11px] text-slate-600 group-hover:text-slate-500 transition-colors truncate">
              {spec.label}
            </p>
            <p className="text-[11px] font-bold font-mono text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0">
              {spec.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
