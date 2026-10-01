import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  CheckSquare, 
  Users, 
  MessageSquare, 
  FileText, 
  CornerDownLeft,
  FileCode
} from 'lucide-react';
import { Task, Profile, Channel, DocumentItem } from '../../lib/database.types';

interface SearchResultItem {
  id: string;
  category: 'task' | 'person' | 'channel' | 'document';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  original: Task | Profile | Channel | DocumentItem;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  tasks: Task[];
  profiles: Profile[];
  channels: Channel[];
  documents?: DocumentItem[];
  onSelectTask: (task: Task) => void;
  onSelectProfile: (profile: Profile) => void;
  onSelectChannel: (channel: Channel) => void;
  onSelectDocument?: (doc: DocumentItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  tasks,
  profiles,
  channels,
  documents = [],
  onSelectTask,
  onSelectProfile,
  onSelectChannel,
  onSelectDocument,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'tasks' | 'people' | 'channels' | 'documents'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Aggregate results across authorized data
  const results = useMemo<SearchResultItem[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const items: SearchResultItem[] = [];

    // 1. Search Tasks
    if (activeCategory === 'all' || activeCategory === 'tasks') {
      tasks.forEach((t) => {
        // Enforce sub-team boundary for non-admins
        if (currentUser.role !== 'admin' && t.group_id !== currentUser.group_id) {
          return;
        }

        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchType = t.task_type.toLowerCase().includes(q);
        const matchPriority = t.priority.toLowerCase().includes(q);

        if (matchTitle || matchDesc || matchType || matchPriority) {
          items.push({
            id: `task-${t.id}`,
            category: 'task',
            title: t.title,
            subtitle: `${t.task_type.toUpperCase()} • Priority: ${t.priority.toUpperCase()} • Status: ${t.status.toUpperCase()}`,
            badge: t.status.toUpperCase(),
            badgeColor: t.status === 'approved' ? '#10E57A' : t.status === 'in_progress' ? '#FF6A00' : '#00D9FF',
            original: t,
          });
        }
      });
    }

    // 2. Search Profiles / Personnel
    if (activeCategory === 'all' || activeCategory === 'people') {
      profiles.forEach((p) => {
        const matchName = p.full_name?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        const matchRole = p.role?.toLowerCase().includes(q);

        if (matchName || matchEmail || matchRole) {
          items.push({
            id: `person-${p.id}`,
            category: 'person',
            title: p.full_name,
            subtitle: `${p.email} • Role: ${p.role.toUpperCase()}`,
            badge: p.role.toUpperCase(),
            badgeColor: p.role === 'admin' ? '#00D9FF' : p.role === 'head' ? '#FF6A00' : '#10E57A',
            original: p,
          });
        }
      });
    }

    // 3. Search Channels & Comms
    if (activeCategory === 'all' || activeCategory === 'channels') {
      channels.forEach((c) => {
        const matchName = c.name.toLowerCase().includes(q);
        const matchSlug = c.slug.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);

        if (matchName || matchSlug || matchDesc) {
          items.push({
            id: `channel-${c.id}`,
            category: 'channel',
            title: `#${c.name}`,
            subtitle: c.description || `Slug: ${c.slug}`,
            badge: c.channel_type.toUpperCase(),
            badgeColor: '#2F6BFF',
            original: c,
          });
        }
      });
    }

    // 4. Search Documents
    if (activeCategory === 'all' || activeCategory === 'documents') {
      documents.forEach((d) => {
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchDesc = d.description?.toLowerCase().includes(q);
        const matchFile = d.file_name.toLowerCase().includes(q);
        const matchCat = d.category.toLowerCase().includes(q);

        if (matchTitle || matchDesc || matchFile || matchCat) {
          items.push({
            id: `doc-${d.id}`,
            category: 'document',
            title: d.title,
            subtitle: `${d.file_name} • ${d.category.toUpperCase()} • ${d.version}`,
            badge: d.category.toUpperCase(),
            badgeColor: '#FFD43B',
            original: d,
          });
        }
      });
    }

    return items.slice(0, 15);
  }, [query, activeCategory, tasks, profiles, channels, documents]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.category === 'task') {
      onSelectTask(item.original as Task);
    } else if (item.category === 'person') {
      onSelectProfile(item.original as Profile);
    } else if (item.category === 'channel') {
      onSelectChannel(item.original as Channel);
    } else if (item.category === 'document' && onSelectDocument) {
      onSelectDocument(item.original as DocumentItem);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-cyber-surface-elevated border border-cyber-border-strong shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-cyber-border bg-cyber-bg-alt">
          <Search className="w-5 h-5 text-accent-cyan shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search deliverables, engineers, comms..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-cyber-primary placeholder:text-cyber-muted focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-cyber-muted hover:text-cyber-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border font-mono text-[10px] text-cyber-muted">
            ESC to close
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-cyber-border/60 bg-cyber-surface text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-accent-cyan text-black font-bold'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory('tasks')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'tasks'
                ? 'bg-accent-cyan text-black font-bold'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            Deliverables
          </button>
          <button
            onClick={() => setActiveCategory('people')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'people'
                ? 'bg-accent-cyan text-black font-bold'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <Users className="w-3 h-3" />
            Personnel
          </button>
          <button
            onClick={() => setActiveCategory('channels')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'channels'
                ? 'bg-accent-cyan text-black font-bold'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Comms
          </button>
          <button
            onClick={() => setActiveCategory('documents')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'documents'
                ? 'bg-accent-cyan text-black font-bold'
                : 'text-cyber-muted hover:text-cyber-primary'
            }`}
          >
            <FileText className="w-3 h-3" />
            Documents
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs font-mono text-cyber-muted">
              Start typing to search cross-subteam deliverables, personnel, and telemetry channels.
              <div className="mt-2 text-[10px] text-cyber-secondary flex items-center justify-center gap-3">
                <span><kbd className="px-1 py-0.5 rounded bg-cyber-bg border border-cyber-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-cyber-bg border border-cyber-border">↓</kbd> to navigate</span>
                <span><kbd className="px-1 py-0.5 rounded bg-cyber-bg border border-cyber-border">↵</kbd> to select</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-cyber-muted">
              No telemetry records found matching <span className="text-cyber-primary">"{query}"</span>.
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3
                    ${
                      isSelected
                        ? 'bg-cyber-surface-hover border border-accent-cyan/50 shadow-cyber-sm'
                        : 'bg-transparent border border-transparent hover:bg-cyber-surface/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cyber-bg-alt border border-cyber-border shrink-0">
                      {item.category === 'task' && <CheckSquare className="w-4 h-4 text-accent-cyan" />}
                      {item.category === 'person' && <Users className="w-4 h-4 text-accent-lime" />}
                      {item.category === 'channel' && <MessageSquare className="w-4 h-4 text-accent-orange" />}
                      {item.category === 'document' && <FileCode className="w-4 h-4 text-accent-yellow" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-cyber-primary truncate">
                        {item.title}
                      </div>
                      <div className="font-mono text-[11px] text-cyber-secondary truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
                        style={{
                          backgroundColor: `${item.badgeColor || '#00D9FF'}15`,
                          borderColor: `${item.badgeColor || '#00D9FF'}40`,
                          color: item.badgeColor || '#00D9FF',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-cyber-bg-alt border-t border-cyber-border text-[10px] font-mono text-cyber-muted flex items-center justify-between">
          <span>Formula Student Command Telemetry</span>
          <span>{results.length} result(s)</span>
        </div>
      </div>
    </div>
  );
};
