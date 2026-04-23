'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadZoneProps {
  onImageSelected: (file: File, preview: string) => void;
  disabled?: boolean;
}

export function ImageUploadZone({ onImageSelected, disabled = false }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const processFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Please upload a JPEG or PNG image');
      return;
    }
    const sizeKB = (file.size / 1024).toFixed(0);
    const sizeMB = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      setFileName(file.name);
      setFileSize(sizeMB);
      onImageSelected(file, url);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative group overflow-hidden rounded-xl cursor-pointer transition-all duration-300
            border-2 border-dashed
            ${isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          {/* Dot grid texture */}
          <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500/40 rounded-tl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500/40 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500/40 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500/40 rounded-br" />

          <div className="relative flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
            {/* Upload icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragging
                ? 'bg-indigo-500/30 glow-indigo scale-110'
                : 'bg-indigo-600/15 group-hover:bg-indigo-600/25 group-hover:scale-105'
            }`}>
              <UploadCloud className={`w-7 h-7 transition-colors ${isDragging ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                {isDragging ? 'Drop it here!' : 'Drop your image here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                or <span className="text-indigo-400 font-medium">browse files</span>
              </p>
            </div>

            <div className="flex items-center gap-3 mt-1">
              {['JPEG', 'PNG'].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-800/60 border border-slate-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 bg-[#0a101f]">
          {/* Image preview */}
          <div className="relative h-52 w-full">
            <Image src={preview} alt="Preview" fill className="object-contain" />
            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(6,9,24,0.7)] pointer-events-none" />
          </div>

          {/* Controls overlay */}
          <div className="absolute top-2 right-2">
            <button
              onClick={clearImage}
              disabled={disabled}
              className="w-8 h-8 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all flex items-center justify-center"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File info bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-indigo-500/15 bg-[#0d1425]/80">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-slate-400 truncate flex-1 font-medium">{fileName}</p>
            <span className="text-[10px] text-slate-600 flex-shrink-0">{fileSize}</span>
          </div>
        </div>
      )}
    </div>
  );
}
