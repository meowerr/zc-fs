import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { GlossyButton } from './GlossyButton';
import { GhostButton } from './GhostButton';
import { SegmentedGauge } from './SegmentedGauge';
import { Modal, ModalCloseButton } from './Modal';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const safeClose = () => {
    if (!isUploading) onClose();
  };

  const selectFile = (file?: File) => {
    setError(null);
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
    <Modal onClose={safeClose} labelledBy="file-upload-title">
      <GlassCard variant="elevated" cornerMark={false} className="w-full max-w-md p-5 sm:p-6 rounded-b-none sm:rounded-b-xl border-cyber-border-strong shadow-cyber-elevated space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" aria-hidden="true">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 id="file-upload-title" className="font-display font-bold text-base text-cyber-primary tracking-wide">
              Attach a file
            </h3>
          </div>
          <ModalCloseButton onClick={safeClose} disabled={isUploading}>
            <X className="w-4 h-4" aria-hidden="true" />
          </ModalCloseButton>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          id="file-upload-input"
          type="file"
          onChange={(e) => selectFile(e.target.files?.[0])}
          className="sr-only"
          tabIndex={-1}
          accept=".pdf,.zip,.step,.stp,.iges,.igs,.cad,.sldprt,.sldasm,.png,.jpg,.jpeg,.svg,.csv,.xlsx,.m,.py,.c,.cpp,.txt"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            selectFile(e.dataTransfer.files?.[0]);
          }}
          className={`
            w-full p-6 rounded-xl border-2 border-dashed transition-colors duration-fast cursor-pointer text-center flex flex-col items-center gap-2
            ${
              isDragging || selectedFile
                ? 'border-accent-cyan bg-accent-cyan/5'
                : 'border-cyber-border hover:border-accent-cyan/60 bg-cyber-surface'
            }
          `}
        >
          <span className="w-12 h-12 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center" aria-hidden="true">
            {selectedFile ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
          </span>
          <span className="block max-w-full font-sans font-bold text-sm text-cyber-primary truncate">
            {selectedFile ? selectedFile.name : isDragging ? 'Drop to attach' : 'Drop a file here or browse'}
          </span>
          <span className="block text-xs text-cyber-muted">
            {selectedFile ? `${fileSizeMb} MB · click to choose a different file` : 'STEP, IGES, PDF, ZIP, code or images · 25 MB max'}
          </span>
        </button>

        {/* File Quota Telemetry Gauge */}
        {selectedFile && (
          <div className="space-y-1.5 p-3 rounded-xl bg-cyber-surface border border-cyber-border">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyber-muted">Quota Usage:</span>
              <span className="font-bold text-accent-cyan">
                {fileSizeMb} MB / 25 MB max
              </span>
            </div>
            <SegmentedGauge value={sizePercentage} totalSegments={10} showPercent={false} accentColor="var(--accent-cyan)" />
          </div>
        )}

        {/* Upload Progress Bar (when active) */}
        {isUploading && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyber-secondary">Uploading…</span>
              <span className="text-accent-cyan font-bold">{uploadProgress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
              className="w-full h-2 rounded-full bg-cyber-surface overflow-hidden border border-cyber-border"
            >
              <div
                className="h-full bg-accent-cyan transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyber-border">
          <GhostButton size="sm" onClick={safeClose} disabled={isUploading}>
            Cancel
          </GhostButton>
          <GlossyButton
            size="sm"
            variant="primary"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isUploading ? 'Uploading…' : 'Attach file'}
          </GlossyButton>
        </div>
      </GlassCard>
    </Modal>
  );
};
