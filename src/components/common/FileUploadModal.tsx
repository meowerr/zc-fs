import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModalShell } from './ModalShell';
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

  const modalFooter = (
    <div className="flex items-center justify-end gap-2">
      <GhostButton size="sm" onClick={onClose} disabled={isUploading}>
        Cancel
      </GhostButton>
      <GlossyButton
        size="sm"
        variant="primary"
        disabled={!selectedFile || isUploading}
        onClick={handleUpload}
        icon={<CheckCircle2 className="w-4 h-4" />}
      >
        {isUploading ? 'Transferring...' : 'Attach File'}
      </GlossyButton>
    </div>
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Upload Telemetry File"
      footer={modalFooter}
      maxWidth="md:max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono flex items-center gap-2">
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
                ? 'border-accent-cyan bg-accent-cyan/5'
                : 'border-cyber-border hover:border-accent-cyan/60 bg-cyber-surface'
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

          <div className="w-12 h-12 mx-auto rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
            {selectedFile ? <FileText className="w-6 h-6 text-accent-cyan" /> : <UploadCloud className="w-6 h-6" />}
          </div>

          <div>
            <div className="font-sans font-bold text-sm text-cyber-primary truncate">
              {selectedFile ? selectedFile.name : 'Click to select CAD model or document'}
            </div>
            <p className="text-label font-mono text-cyber-muted">
              {selectedFile ? `${fileSizeMb} MB selected` : 'STEP, IGES, PDF, ZIP, code, or images (25 MB max)'}
            </p>
          </div>
        </div>

        {/* File Quota Telemetry Gauge */}
        {selectedFile && (
          <div className="space-y-1.5 p-3 rounded-xl bg-cyber-surface-elevated border border-cyber-border">
            <div className="flex items-center justify-between text-label font-mono">
              <span className="text-cyber-muted">Quota Usage:</span>
              <span className="font-bold text-accent-cyan">
                {fileSizeMb} MB / 25 MB max
              </span>
            </div>
            <SegmentedGauge value={sizePercentage} totalSegments={10} showPercent={false} accentColor="#00D9FF" />
          </div>
        )}

        {/* Upload Progress Bar (when active) */}
        {isUploading && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyber-secondary">Uploading to Supabase Storage...</span>
              <span className="text-accent-cyan font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-cyber-surface overflow-hidden border border-cyber-border">
              <div
                className="h-full bg-accent-cyan transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
