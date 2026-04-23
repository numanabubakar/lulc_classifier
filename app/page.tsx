'use client';

import { useState } from 'react';
import {
  DatasetSelector,
  type DatasetType,
  type ClassificationMode,
} from '@/components/DatasetSelector';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { NeuralNetworkLoader } from '@/components/NeuralNetworkLoader';
import { PredictionResults, type PredictionResult } from '@/components/PredictionResults';
import { TechnicalSpecs } from '@/components/TechnicalSpecs';
import { LulcChatbot } from '@/components/LulcChatbot';
import { Satellite, Zap, RotateCcw } from 'lucide-react';

// ── Backend URLs (mirrors mobile lulcService.ts) ──────────────────────────
const BACKEND_URL = 'https://lulc-recognition-lulc-backend.hf.space';
const MULTI_LABEL_URL = 'https://lulc-recognition-amsi-net.hf.space';

export default function Dashboard() {
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('eurosat');
  const [classificationMode, setClassificationMode] = useState<ClassificationMode>('single');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const handleImageSelected = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) { setError('Please upload an image first'); return; }
    setIsLoading(true);
    setError(null);

    try {
      const isMulti = selectedDataset === 'mlrsnet' && classificationMode === 'multi';
      let data: PredictionResult;

      if (isMulti) {
        const b64 = await fileToBase64(selectedFile);
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 60000);
        const res = await fetch(`${MULTI_LABEL_URL}/predict_mobile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Request-Source': 'LulcWebApp' },
          body: JSON.stringify({ image_b64: b64, model_type: selectedDataset, classification_mode: 'multi' }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error: ${res.status}`); }
        const raw = await res.json();
        data = {
          predicted_labels: raw.predicted_labels ?? [],
          uncertainty: raw.uncertainty,
          classification_mode: 'multi',
          all_predictions: raw.top_predictions
            ? raw.top_predictions.map((p: { label: string; confidence: number }, i: number) => ({ class_index: i, class_label: p.label, confidence: p.confidence }))
            : [],
          explainability_maps: raw.explainability_maps ?? {},
          inference_time_ms: raw.inference_latency_ms ?? raw.inference_time_ms ?? 0,
          model_type: raw.model_type ?? selectedDataset,
          image_info: raw.image_info ?? { width: 0, height: 0, format: 'jpeg' },
          prediction_id: `multi-${Date.now()}`,
        };
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('model_type', selectedDataset);
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(`${BACKEND_URL}/predict`, { method: 'POST', body: formData, signal: controller.signal });
        clearTimeout(tid);
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error: ${res.status}`); }
        const raw = await res.json();
        data = { ...raw, classification_mode: 'single', prediction_id: `single-${Date.now()}` };
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null); setPreview(null); setResult(null); setError(null);
    setUploadKey(p => p + 1);
  };

  const isMulti = selectedDataset === 'mlrsnet' && classificationMode === 'multi';
  const hasInput = !!preview;
  const hasResult = !!result && !isLoading;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="header-glow-line sticky top-0 z-40 bg-[#060918]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/30">
                <Satellite className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold gradient-text tracking-tight">
                  LULC Classifier
                </h1>
                <p className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                  Remote Sensing · Deep Learning
                </p>
              </div>
            </div>

            {/* Right badges */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              <span className="px-2.5 py-1 rounded-full glass text-indigo-300 text-[11px] font-semibold">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Two-column layout on lg+ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT PANEL — Controls ──────────────────────────────────────── */}
          <aside className="lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col gap-5 float-in">

            {/* Image Upload Card */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Satellite Image
                </p>
              </div>
              <ImageUploadZone key={uploadKey} onImageSelected={handleImageSelected} disabled={isLoading} />
            </div>

            {/* Dataset + Mode Card */}
            <div className="glass rounded-2xl p-5 float-in float-in-delay-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Model Configuration
                </p>
              </div>
              <DatasetSelector
                selectedDataset={selectedDataset}
                onDatasetChange={(d) => { setSelectedDataset(d); setResult(null); }}
                classificationMode={classificationMode}
                onModeChange={(m) => { setClassificationMode(m); setResult(null); }}
              />
            </div>

            {/* Classify Button */}
            {hasInput && !hasResult && (
              <button
                onClick={handlePredict}
                disabled={isLoading}
                className="btn-shimmer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 float-in float-in-delay-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Classifying…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {isMulti ? 'Run Multi-Label Classification' : 'Run Classification'}
                  </>
                )}
              </button>
            )}

            {/* Reset Button (shown after result) */}
            {hasResult && (
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl glass border border-indigo-500/20 text-slate-300 hover:text-white hover:border-indigo-500/50 font-semibold text-sm flex items-center justify-center gap-2 transition-all float-in"
              >
                <RotateCcw className="w-4 h-4" />
                New Classification
              </button>
            )}

            {/* Technical Specs — left panel, desktop only */}
            {(hasInput || hasResult) && (
              <div className="hidden lg:block float-in float-in-delay-3">
                <TechnicalSpecs />
              </div>
            )}
          </aside>

          {/* ── RIGHT PANEL — Results / Placeholder ───────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Error */}
            {error && (
              <div className="glass rounded-2xl p-4 border border-red-500/30 bg-red-500/5 float-in">
                <p className="text-sm text-red-300 flex items-center gap-2">
                  <span className="text-red-400">⚠</span>
                  {error}
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="glass rounded-2xl p-8 float-in">
                <NeuralNetworkLoader />
              </div>
            )}

            {/* Results */}
            {hasResult && (
              <div className="float-in">
                <PredictionResults result={result!} />
              </div>
            )}

            {/* Placeholder — no image yet */}
            {!hasInput && !isLoading && (
              <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center p-10 text-center min-h-[420px] bg-dot-grid float-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center mb-5 glow-indigo">
                  <Satellite className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Ready to Classify
                </h2>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                  Upload a satellite or aerial image on the left, select a dataset, and run inference to see results here.
                </p>

                {/* Step indicators */}
                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs text-left">
                  {[
                    { n: '1', label: 'Upload a satellite image', done: false },
                    { n: '2', label: 'Select dataset & mode', done: false },
                    { n: '3', label: 'Run classification', done: false },
                  ].map(step => (
                    <div key={step.n} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-400 flex-shrink-0">
                        {step.n}
                      </div>
                      <span className="text-sm text-slate-500">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder — image uploaded, waiting for classify */}
            {hasInput && !isLoading && !hasResult && (
              <div className="glass rounded-2xl flex items-center justify-center min-h-[280px] bg-dot-grid float-in">
                <div className="text-center px-6 py-10">
                  <div className="text-4xl mb-3">🛰️</div>
                  <p className="text-slate-400 text-sm font-medium">
                    Image ready — click <span className="text-indigo-300 font-bold">Run Classification</span> to analyse
                  </p>
                </div>
              </div>
            )}

            {/* Technical Specs — below results on mobile */}
            {(hasInput || hasResult) && (
              <div className="lg:hidden mt-2">
                <TechnicalSpecs />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-indigo-500/10 py-5 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>
            <span className="gradient-text font-semibold">LULC Classifier</span>
            {' — '}Built by Khadijah Shabbir &amp; Numan Abubakar
          </p>
          <div className="flex items-center gap-4">
            <span>EuroSAT · MLRSNet · PatternNet</span>
            <span className="text-indigo-500/60">|</span>
            <span>AMFRNet · AMSI-Net</span>
          </div>
        </div>
      </footer>

      {/* ── Chatbot ────────────────────────────────────────────────────────── */}
      <LulcChatbot currentResult={result} />
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
