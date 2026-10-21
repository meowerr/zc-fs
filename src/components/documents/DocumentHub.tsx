import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  FileCode, 
  Box, 
  BookOpen, 
  Activity, 
  Layers,
  X,
  FileSpreadsheet,
  Sliders
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { PageHeader } from '../common/PageHeader';
import { GlossyButton } from '../common/GlossyButton';
import { GhostButton } from '../common/GhostButton';
import { ChromeAvatar } from '../common/ChromeAvatar';
import { EmptyState } from '../common/EmptyState';
import { ModalShell } from '../common/ModalShell';
import { SkeletonCard } from '../common/SkeletonCard';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { DocumentItem, DocumentCategory, Profile, Group } from '../../lib/database.types';
import { SUB_TEAMS, triggerHaptic } from '../../lib/constants';

interface DocumentHubProps {
  currentUser: Profile;
  documents: DocumentItem[];
  groups?: Group[];
  loading: boolean;
  onRefresh?: () => Promise<void> | void;
  onUploadDocument: (params: {
    file: File;
    title: string;
    description?: string;
    category: DocumentCategory;
    groupId: string | null;
  }) => Promise<any>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: any }> = {
  spec: { label: 'SPEC', color: '#00D9FF', icon: FileText },
  cad: { label: 'CAD', color: '#FF4FA3', icon: Box },
  rulebook: { label: 'RULES', color: '#FFD43B', icon: BookOpen },
  telemetry: { label: 'TELEM', color: '#10E57A', icon: Activity },
  report: { label: 'REPORT', color: '#A855F7', icon: FileSpreadsheet },
};
const DEFAULT_CAT_META = { label: 'DOC', color: '#737D89', icon: FileCode };

const CATEGORIES = [
  { id: 'all', label: 'All Docs', icon: Layers, color: '#00D9FF' },
  { id: 'spec', label: 'Specifications', icon: FileText, color: '#00D9FF' },
  { id: 'cad', label: 'CAD & Models', icon: Box, color: '#FF4FA3' },
  { id: 'rulebook', label: 'Rulebooks & SES', icon: BookOpen, color: '#FFD43B' },
  { id: 'telemetry', label: 'Telemetry & Logs', icon: Activity, color: '#10E57A' },
  { id: 'report', label: 'Engineering Reports', icon: FileSpreadsheet, color: '#A855F7' },
];

export const DocumentHub: React.FC<DocumentHubProps> = ({
  currentUser,
  documents,
  groups = [],
  loading,
  onRefresh,
  onUploadDocument,
  onDeleteDocument,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedDocToDelete, setSelectedDocToDelete] = useState<DocumentItem | null>(null);
  const isPulling = usePullToRefresh(onRefresh);
  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedGroup !== 'all' ? 1 : 0);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('spec');
  const [uploadGroupId, setUploadGroupId] = useState<string>(currentUser.role === 'admin' ? '' : (currentUser.group_id || ''));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser.role !== 'admin' && currentUser.group_id) {
      setUploadGroupId(currentUser.group_id);
    }
  }, [currentUser.role, currentUser.group_id]);

  const effectiveGroups = groups.length > 0 ? groups : SUB_TEAMS;

  const formatFileSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`;

  const getCategoryMeta = (cat: string) => CATEGORY_META[cat] || DEFAULT_CAT_META;

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }

      // Group filter
      if (selectedGroup !== 'all') {
        if (selectedGroup === 'club') {
          if (doc.group_id !== null) return false;
        } else if (doc.group_id !== selectedGroup) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchDesc = doc.description?.toLowerCase().includes(q);
        const matchFile = doc.file_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchFile) return false;
      }

      return true;
    });
  }, [documents, selectedCategory, selectedGroup, searchQuery]);

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    // Role-based group validation
    if (currentUser.role === 'member' && !currentUser.group_id) {
      setUploadError('You must be assigned to an active sub-team by a Club Admin to upload engineering assets.');
      return;
    }

    const effectiveGroupId = currentUser.role === 'member'
      ? (currentUser.group_id || null)
      : (uploadGroupId ? uploadGroupId : null);

    try {
      setIsUploading(true);
      setUploadError(null);
      await onUploadDocument({
        file: uploadFile,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
        category: uploadCategory,
        groupId: effectiveGroupId,
      });

      // Reset and close
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Upload failed';
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates')) {
        setUploadError('Security policy restriction: You can only upload assets within your assigned sub-team repository.');
      } else {
        setUploadError(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Can Delete Document check
  const canDeleteDoc = (doc: DocumentItem) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.id === doc.uploader_id) return true;
    if (currentUser.role === 'head' && doc.group_id === currentUser.group_id) return true;
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header telemetry HUD */}
      <PageHeader
        title="Engineering Document Hub"
        eyebrow="Formula Student Repository"
        description="Centralized engineering repository for Formula Student design specifications, CAD solids, Formula SAE rulebooks, and telemetry acquisitions."
        actions={
          <GlossyButton
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </GlossyButton>
        }
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="-mx-3.5 px-3.5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 mask-fade-edges">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  shrink-0 snap-start flex items-center gap-2 min-h-[44px] px-4 rounded-lg text-label font-mono transition-all cursor-pointer border
                  ${
                    isActive
                      ? 'bg-cyber-surface-elevated text-cyber-primary border-accent-cyan shadow-[0_0_8px_rgba(0,217,255,0.2)] font-bold'
                      : 'bg-cyber-surface/60 text-cyber-muted border-cyber-border hover:text-cyber-primary hover:border-cyber-border-strong'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Toolbar (Single Row) */}
        <div className="flex gap-2 sm:hidden">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 rounded-lg text-base font-sans bg-cyber-surface border border-cyber-border text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="tap-target relative px-3 rounded-lg border border-cyber-border bg-cyber-surface text-cyber-secondary flex items-center justify-center cursor-pointer"
            aria-label="Filter documents"
          >
            <Sliders className="w-5 h-5 text-accent-cyan" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-cyan text-black text-[12px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Search & Team Filter Row */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by title, file name, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary placeholder:text-cyber-muted focus:outline-none focus:border-accent-cyan/60 transition-colors"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan/60 transition-colors font-mono cursor-pointer"
            >
              <option value="all">Scope: All Sub-Teams & Club</option>
              <option value="club">Scope: Club-Wide General</option>
              {effectiveGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  Scope: {g.name.replace(/^Technical - |^Operations - /, '')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid / List */}
      {isPulling && (
        <div className="py-2 text-center text-xs font-mono text-accent-cyan animate-pulse">
          Refreshing engineering repository…
        </div>
      )}
      {loading ? (
        <SkeletonCard count={3} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          illustration="telemetry"
          title="No Engineering Assets Found"
          description={
            searchQuery || selectedCategory !== 'all' || selectedGroup !== 'all'
              ? 'No documents matched your current search filters.'
              : 'The repository is currently empty. Upload technical specs, CAD files, or rulebooks to begin building the team knowledge base.'
          }
          actionLabel="Upload First Asset"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const catMeta = getCategoryMeta(doc.category);
            const CatIcon = catMeta.icon;
            const assignedGroup = effectiveGroups.find((g) => g.id === doc.group_id);
            const teamName = assignedGroup ? assignedGroup.name.replace(/^Technical - |^Operations - /, '') : 'Club-Wide';
            const canDelete = canDeleteDoc(doc);

            return (
              <GlassCard
                key={doc.id}
                variant="elevated"
                className="p-4 border-cyber-border-strong hover:border-accent-cyan/50 active:bg-cyber-surface-hover active:scale-[0.99] transition-all flex flex-col justify-between group space-y-3"
              >
                <div>
                  {/* Card Header: Category & Team Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label font-mono uppercase tracking-wider"
                      style={{
                        backgroundColor: `${catMeta.color}15`,
                        color: catMeta.color,
                        border: `1px solid ${catMeta.color}40`,
                      }}
                    >
                      <CatIcon className="w-3 h-3" />
                      {catMeta.label}
                    </span>

                    <span className="hidden sm:inline-block font-mono text-label px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-secondary truncate max-w-[130px]">
                      {teamName}
                    </span>
                  </div>

                  {/* Document Title */}
                  <h3 className="font-sans font-semibold text-base text-cyber-primary group-hover:text-accent-cyan transition-colors line-clamp-1">
                    {doc.title}
                  </h3>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-sm text-cyber-secondary mt-1 font-sans line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* File Metadata telemetry bar */}
                  <div className="mt-3 p-2 rounded-lg bg-cyber-bg/80 border border-cyber-border/70 flex items-center justify-between text-label font-mono">
                    <span className="text-cyber-primary truncate max-w-[180px]" title={doc.file_name}>
                      {doc.file_name}
                    </span>
                    <span className="text-cyber-muted shrink-0 pl-2">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>
                </div>

                {/* Footer: Uploader & Action Buttons */}
                <div className="pt-2 border-t border-cyber-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChromeAvatar
                      name={doc.uploader?.full_name || 'ZC Engineer'}
                      size="sm"
                    />
                    <div className="text-label font-mono text-cyber-muted">
                      <div className="text-cyber-secondary font-sans truncate max-w-[90px]">
                        {doc.uploader?.full_name || 'Engineer'}
                      </div>
                      <div>{new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canDelete && (
                      <button
                        onClick={() => setSelectedDocToDelete(doc)}
                        className="p-1.5 rounded-lg text-cyber-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.file_name}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan text-xs font-mono transition-all cursor-pointer"
                      title="Download or open asset"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard
            variant="elevated"
            className="w-full max-w-lg p-5 sm:p-6 border-cyber-border-strong shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-cyber-primary">
                    Upload Engineering Asset
                  </h3>
                  <span className="font-mono text-label text-cyber-muted uppercase tracking-wider">
                    Formula Student Knowledge Repository
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-cyber-surface-hover text-cyber-muted hover:text-cyber-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-mono">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* File input */}
              <div>
                <label className="block text-xs font-mono text-cyber-secondary mb-1">
                  FILE ATTACHMENT * (CAD, PDF, Code, Telemetry, Max 25 MB)
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-cyber-primary file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-medium file:bg-accent-cyan/20 file:text-accent-cyan hover:file:bg-accent-cyan/30 cursor-pointer bg-cyber-surface p-2 rounded-lg border border-cyber-border"
                />
                {uploadFile && (
                  <div className="mt-1 text-label font-mono text-accent-cyan">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-mono text-cyber-secondary mb-1">
                  DOCUMENT TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aerodynamics Front Wing Specification 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan/60 font-sans"
                />
              </div>

              {/* Category & Group Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-cyber-secondary mb-1">
                    CATEGORY *
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 text-xs bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan/60 font-mono cursor-pointer"
                  >
                    <option value="spec">Specification</option>
                    <option value="cad">CAD / Solid Model</option>
                    <option value="rulebook">Rulebook / SES</option>
                    <option value="telemetry">Telemetry Dataset</option>
                    <option value="report">Engineering Report</option>
                    <option value="other">General Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyber-secondary mb-1">
                    SUB-TEAM SCOPE
                  </label>
                  <select
                    value={uploadGroupId}
                    onChange={(e) => setUploadGroupId(e.target.value)}
                    disabled={currentUser.role === 'member'}
                    className="w-full px-3 py-2 text-xs bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan/60 font-mono disabled:opacity-60 cursor-pointer"
                  >
                    {currentUser.role === 'admin' && (
                      <option value="">Club-Wide (All Sub-Teams)</option>
                    )}
                    {effectiveGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name.replace(/^Technical - |^Operations - /, '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-cyber-secondary mb-1">
                  DESCRIPTION & REVISION NOTES (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide context, revision number, boundary conditions..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-cyber-surface border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan/60 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-cyber-border flex justify-end gap-2">
                <GhostButton size="sm" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </GhostButton>
                <GlossyButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUploading}
                  className="flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Commit to Archive'}</span>
                </GlossyButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Document Upload */}
      <button
        onClick={() => {
          triggerHaptic(8);
          setIsUploadModalOpen(true);
        }}
        className="md:hidden fixed right-4 z-30 w-14 h-14 rounded-2xl bg-accent-cyan text-black shadow-glow-cyan bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        aria-label="Upload document"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* Delete Confirmation Modal */}
      {selectedDocToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard
            variant="elevated"
            className="w-full max-w-md p-5 border-accent-red/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-accent-red">
              <div className="p-2 rounded-lg bg-accent-red/10 border border-accent-red/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-cyber-primary">
                Delete Asset from Archive?
              </h3>
            </div>

            <p className="text-xs text-cyber-secondary leading-relaxed font-sans">
              Are you sure you want to delete <strong className="text-cyber-primary font-mono">{selectedDocToDelete.title}</strong>? This action will remove the record and permanently purge the file from telemetry storage.
            </p>

            <div className="pt-2 border-t border-cyber-border flex justify-end gap-2">
              <GhostButton size="sm" onClick={() => setSelectedDocToDelete(null)}>
                Cancel
              </GhostButton>
              <GlossyButton
                variant="danger"
                size="sm"
                onClick={async () => {
                  await onDeleteDocument(selectedDocToDelete.id);
                  setSelectedDocToDelete(null);
                }}
              >
                Confirm Delete
              </GlossyButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <ModalShell
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Documents"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <GhostButton
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedGroup('all');
                setIsFilterSheetOpen(false);
              }}
            >
              Reset
            </GhostButton>
            <GlossyButton
              variant="primary"
              size="sm"
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Apply Filters
            </GlossyButton>
          </div>
        }
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-label font-mono uppercase text-cyber-muted mb-1.5">
              Sub-Team Scope
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full min-h-[44px] py-2 px-3 text-base bg-cyber-bg-alt border border-cyber-border rounded-lg text-cyber-primary focus:outline-none focus:border-accent-cyan transition-colors font-mono cursor-pointer"
            >
              <option value="all">Scope: All Sub-Teams & Club</option>
              <option value="club">Scope: Club-Wide General</option>
              {effectiveGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  Scope: {g.name.replace(/^Technical - |^Operations - /, '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-label font-mono uppercase text-cyber-muted mb-1.5">
              Document Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-mono font-medium uppercase border text-left transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-accent-cyan text-black border-accent-cyan font-bold'
                      : 'bg-cyber-surface-elevated text-cyber-secondary border-cyber-border'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5 shrink-0" style={{ color: selectedCategory === cat.id ? '#000000' : cat.color }} />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
