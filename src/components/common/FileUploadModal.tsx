import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { GlossyButton } from './GlossyButton';
import { GhostButton } from './GhostButton';
import { SegmentedGauge } from './SegmentedGauge';
import { uploadFile, validateFile, MAX_FILE_SIZE_BYTES, UploadResult } from '../../lib/storage';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: UploadResult) => void;
  bucket?: 'task-attachments' | 'chat-media';
  folder?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  bucket = 'task-attachments',
  folder = 'general',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    try {
      setUploadProgress(60);
      const result = await uploadFile(selectedFile, bucket, folder);
      setUploadProgress(100);

      setTimeout(() => {
        onUploadComplete(result);
        onClose();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const fileSizeBytes = selectedFile?.size || 0;
  const fileSizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  const sizePercentage = Math.min(100, Math.round((fileSizeBytes / MAX_FILE_SIZE_BYTES) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <GlassCard variant="elevated" className="w-full max-w-md p-6 border-telemetry-blue/40 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-chrome-300/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-telemetry-blue" />
            <h3 className="font-display font-bold text-base text-chrome-900 dark:text-white uppercase tracking-wider">
              Upload Telemetry File
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-chrome-900/60 dark:text-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-telemetry-red/10 border border-telemetry-red/40 text-telemetry-red text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Target Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2
            ${
              selectedFile
                ? 'border-telemetry-aqua bg-telemetry-aqua/5'
                : 'border-chrome-300 dark:border-white/20 hover:border-telemetry-blue bg-black/5 dark:bg-white/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.zip,.step,.stp,.iges,.igs,.cad,.sldprt,.sldasm,.png,.jpg,.jpeg,.svg,.csv,.xlsx,.m,.py,.c,.cpp,.txt"
          />

          <div className="w-12 h-12 mx-auto rounded-full bg-telemetry-blue/15 text-telemetry-blue flex items-center justify-center">
            {selectedFile ? <FileText className="w-6 h-6 text-telemetry-aqua" /> : <UploadCloud className="w-6 h-6" />}
          </div>

          <div>
            <div className="font-sans font-bold text-sm text-chrome-900 dark:text-white truncate">
              {selectedFile ? selectedFile.name : 'Click to select CAD model or document'}
            </div>
            <p className="text-[11px] font-mono text-chrome-900/60 dark:text-white/50">
              {selectedFile ? `${fileSizeMb} MB selected` : 'STEP, IGES, PDF, ZIP, code, or images (25 MB max)'}
            </p>
          </div>
        </div>

        {/* File Quota Telemetry Gauge */}
        {selectedFile && (
          <div className="space-y-1.5 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-chrome-300/40 dark:border-white/10">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-chrome-900/60 dark:text-white/50">Quota Usage:</span>
              <span className="font-bold text-telemetry-blue dark:text-telemetry-aqua">
                {fileSizeMb} MB / 25 MB max
              </span>
            </div>
            <SegmentedGauge value={sizePercentage} totalSegments={10} showPercent={false} />
          </div>
        )}

        {/* Upload Progress Bar (when active) */}
        {isUploading && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-chrome-900/70 dark:text-white/70">Uploading to Supabase Storage...</span>
              <span className="text-telemetry-blue font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-telemetry-blue to-telemetry-aqua transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-chrome-300/40 dark:border-white/10">
          <GhostButton size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </GhostButton>
          <GlossyButton
            size="sm"
            variant="holo"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isUploading ? 'Transferring...' : 'Attach File'}
          </GlossyButton>
        </div>
      </GlassCard>
    </div>
  );
};
