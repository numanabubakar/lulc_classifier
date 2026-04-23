'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export interface ClassPrediction {
  class_index: number;
  class_label: string;
  confidence: number;
}

export interface PredictionResult {
  predicted_class?: string;
  class_index?: number;
  confidence?: number;
  predicted_labels?: string[];
  uncertainty?: number;
  classification_mode?: 'single' | 'multi';
  all_predictions: ClassPrediction[];
  explainability_maps?: Record<string, string>;
  inference_time_ms: number;
  model_type: string;
  image_info: { width: number; height: number; format: string };
  prediction_id?: string;
}

interface PredictionResultsProps {
  result: PredictionResult;
}

// Label chip colors (cycles through for multi-label)
const CHIP_COLORS = [
  'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
  'bg-violet-500/15 border-violet-500/40 text-violet-300',
  'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
  'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  'bg-amber-500/15 border-amber-500/40 text-amber-300',
];

export function PredictionResults({ result }: PredictionResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const isMulti = result.classification_mode === 'multi';
  const labels = isMulti ? (result.predicted_labels ?? []) : [result.predicted_class ?? 'Unknown'];
  const confidencePct = Math.round((result.confidence ?? 0) * 100);
  const modelName = result.model_type.toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── Primary Result Card ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Success icon */}
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Mode label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isMulti ? 'Multi-Label Detection' : 'Primary Classification'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isMulti
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                  : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
              }`}>
                {isMulti ? 'AMSI-Net' : 'AMFRNet'}
              </span>
            </div>

            {/* Label chips */}
            <div className="flex flex-wrap gap-2">
              {labels.map((label, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                    CHIP_COLORS[idx % CHIP_COLORS.length]
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Class index (single only) */}
            {!isMulti && result.class_index !== undefined && (
              <p className="mt-2 text-xs text-slate-600">
                Class Index:{' '}
                <span className="font-mono text-indigo-400">{result.class_index}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Confidence Gauge (single-label only) ─────────────────────────── */}
      {!isMulti && result.confidence !== undefined && (
        <div className="glass rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
            Confidence Score
          </p>
          <div className="flex items-center gap-6">
            {/* Radial gauge with glow */}
            <div className="relative flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                {/* Track */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(30,41,80,0.8)" strokeWidth="10" />
                {/* Glow layer */}
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="rgba(99,102,241,0.15)" strokeWidth="14"
                  strokeDasharray={`${(confidencePct / 100) * 314} 314`}
                  strokeLinecap="round"
                />
                {/* Main progress */}
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#cg)" strokeWidth="10"
                  strokeDasharray={`${(confidencePct / 100) * 314} 314`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black gradient-text">{confidencePct}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Probability</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-700"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <p className="text-right text-[11px] font-mono text-slate-500 mt-1">
                  {result.confidence!.toFixed(4)}
                </p>
              </div>

              {/* Interpretation */}
              <div className={`rounded-lg px-3 py-2 text-xs font-medium border ${
                confidencePct >= 80
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : confidencePct >= 50
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}>
                {confidencePct >= 80 ? '✓ High confidence prediction'
                  : confidencePct >= 50 ? '◐ Moderate confidence'
                  : '⚠ Low confidence — verify result'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── XAI Maps ─────────────────────────────────────────────────────── */}
      {result.explainability_maps && Object.keys(result.explainability_maps).length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
            Visual Explanations — XAI Maps
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(result.explainability_maps).map(([mapName, b64Str]) => (
              <div key={mapName} className="rounded-xl overflow-hidden border border-slate-700/60 bg-[#060918]">
                <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/40">
                  <p className="text-xs font-semibold text-slate-400">{mapName}</p>
                </div>
                <div className="p-2 flex items-center justify-center bg-[#06091880]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b64Str}
                    alt={mapName}
                    className="max-w-[200px] max-h-[200px] w-full h-auto object-contain rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Class Probabilities (collapsible) ────────────────────────── */}
      {result.all_predictions && result.all_predictions.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <button
            className="w-full flex items-center justify-between mb-2 group"
            onClick={() => setShowAll(v => !v)}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              All Class Probabilities
            </p>
            <span className="text-slate-600 group-hover:text-indigo-400 transition-colors">
              {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {/* Always show top 5, expand to all */}
          <div className="space-y-2.5 mt-3">
            {(showAll ? result.all_predictions : result.all_predictions.slice(0, 5)).map((pred, idx) => {
              const pct = (pred.confidence * 100).toFixed(1);
              const isTop = idx === 0;
              return (
                <div key={pred.class_index} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-600 w-5 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className={`text-xs flex-1 truncate ${isTop ? 'text-indigo-300 font-semibold' : 'text-slate-400'}`}>
                    {pred.class_label}
                  </span>
                  <div className="hidden sm:flex items-center gap-2 w-1/3">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-gradient-to-r from-indigo-500 to-violet-400' : 'bg-slate-600'}`}
                        style={{ width: `${pred.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono w-11 text-right flex-shrink-0 ${isTop ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {!showAll && result.all_predictions.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 w-full text-center text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors py-1"
            >
              Show {result.all_predictions.length - 5} more
            </button>
          )}
        </div>
      )}

      {/* ── Performance Metrics ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          Performance Metrics
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: isMulti ? 'Latency' : 'Inference Time',
              value: `${result.inference_time_ms.toFixed(1)}ms`,
              mono: true,
              accent: 'text-cyan-300',
            },
            { label: 'Model', value: modelName, mono: false, accent: 'text-indigo-300' },
            ...(isMulti && result.uncertainty !== undefined
              ? [{ label: 'Uncertainty', value: result.uncertainty.toFixed(4), mono: true, accent: 'text-violet-300' }]
              : []),
            {
              label: 'Resolution',
              value: `${result.image_info.width}×${result.image_info.height}`,
              mono: true,
              accent: 'text-slate-300',
            },
            { label: 'Format', value: result.image_info.format.toUpperCase(), mono: false, accent: 'text-slate-400' },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3">
              <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
              <p className={`text-sm font-bold truncate ${m.mono ? 'font-mono' : ''} ${m.accent}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
