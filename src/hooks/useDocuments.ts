import { useState, useEffect, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';
import { DocumentItem, DocumentCategory, Profile } from '../lib/database.types';
import { uploadFile } from '../lib/storage';

export function useDocuments(currentUser: Profile | null) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load documents visible to user via RLS
  const loadDocuments = useCallback(async () => {
    if (!currentUser || currentUser.status !== 'approved') {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!isLiveSupabaseConfigured) {
        // Local fallback if offline
        const local = localStorage.getItem('zcfs_documents');
        if (local) {
          try {
            setDocuments(JSON.parse(local));
          } catch {
            setDocuments([]);
          }
        }
        setLoading(false);
        return;
      }

      // Query documents table with joined profiles and groups
      const { data, error: docErr } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:profiles!documents_uploader_id_fkey(id, full_name, email, role, avatar_url),
          group:groups!documents_group_id_fkey(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (docErr) {
        // If foreign key naming differs, fallback to standard select
        const { data: fallbackData, error: fbErr } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (fbErr) {
          // If table not in schema cache, load from local storage
          const local = localStorage.getItem('zcfs_documents');
          if (local) {
            try {
              setDocuments(JSON.parse(local));
            } catch {
              setDocuments([]);
            }
          } else {
            setDocuments([]);
          }
          return;
        }
        setDocuments(fallbackData || []);
      } else {
        setDocuments(data || []);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Error loading engineering documents');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !currentUser || currentUser.status !== 'approved') return;

    const channel = supabase
      .channel('public:documents_telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        loadDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadDocuments]);

  // Upload Document
  const uploadDocument = async (params: {
    file: File;
    title: string;
    description?: string;
    category: DocumentCategory;
    groupId: string | null; // null = Club-wide
  }) => {
    if (!currentUser) throw new Error('Authentication required');

    // Comply with storage RLS: split_part(name, '/', 1) = public.get_auth_group()::text
    const targetFolder = currentUser.role === 'admin'
      ? (params.groupId || 'club-wide')
      : (currentUser.group_id || params.groupId || 'club-wide');
    const folder = `${targetFolder}/documents`;
    const uploadResult = await uploadFile(params.file, 'task-attachments', folder);

    if (!isLiveSupabaseConfigured) {
      const mockDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: params.title,
        description: params.description || null,
        category: params.category,
        file_name: params.file.name,
        file_type: params.file.type || params.file.name.split('.').pop() || 'unknown',
        file_size: params.file.size,
        file_url: uploadResult.url,
        version: 'v1.0',
        group_id: params.groupId,
        uploader_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploader: currentUser,
      };
      setDocuments((prev) => [mockDoc, ...prev]);
      localStorage.setItem('zcfs_documents', JSON.stringify([mockDoc, ...documents]));
      return mockDoc;
    }

    const { data: newDoc, error: insertErr } = await supabase
      .from('documents')
      .insert({
        title: params.title,
        description: params.description || null,
        category: params.category,
        file_name: params.file.name,
        file_type: params.file.type || params.file.name.split('.').pop() || 'unknown',
        file_size: params.file.size,
        file_url: uploadResult.url,
        version: 'v1.0',
        group_id: params.groupId,
        uploader_id: currentUser.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.warn('Documents table insert notice (saving to local store fallback):', insertErr.message);
      const fallbackDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: params.title,
        description: params.description || null,
        category: params.category,
        file_name: params.file.name,
        file_type: params.file.type || params.file.name.split('.').pop() || 'unknown',
        file_size: params.file.size,
        file_url: uploadResult.url,
        version: 'v1.0',
        group_id: params.groupId,
        uploader_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploader: currentUser,
      };
      setDocuments((prev) => [fallbackDoc, ...prev]);
      const existing = localStorage.getItem('zcfs_documents');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('zcfs_documents', JSON.stringify([fallbackDoc, ...list]));
      return fallbackDoc;
    }

    // Record activity log
    try {
      await supabase.from('activity_logs').insert({
        actor_id: currentUser.id,
        action: 'document_uploaded',
        entity_type: 'document',
        entity_id: newDoc.id,
        group_id: params.groupId,
        details: {
          title: params.title,
          category: params.category,
          file_name: params.file.name,
          file_size: params.file.size,
        },
      });
    } catch (e) {
      console.warn('Activity log record warning:', e);
    }

    await loadDocuments();
    return newDoc;
  };

  // Delete Document
  const deleteDocument = async (docId: string) => {
    if (!currentUser) throw new Error('Authentication required');

    const targetDoc = documents.find((d) => d.id === docId);

    if (isLiveSupabaseConfigured) {
      try {
        await supabase
          .from('documents')
          .delete()
          .eq('id', docId);
      } catch (e) {
        console.warn('Delete documents notice:', e);
      }
    }

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    const existing = localStorage.getItem('zcfs_documents');
    if (existing) {
      try {
        const list = JSON.parse(existing);
        localStorage.setItem('zcfs_documents', JSON.stringify(list.filter((d: any) => d.id !== docId)));
      } catch {
        // ignore
      }
    }

    // Record activity log
    if (targetDoc) {
      try {
        await supabase.from('activity_logs').insert({
          actor_id: currentUser.id,
          action: 'document_deleted',
          entity_type: 'document',
          entity_id: docId,
          group_id: targetDoc.group_id,
          details: {
            title: targetDoc.title,
            file_name: targetDoc.file_name,
          },
        });
      } catch (e) {
        console.warn('Activity log record warning:', e);
      }
    }

    await loadDocuments();
  };

  return {
    documents,
    loading,
    error,
    refreshDocuments: loadDocuments,
    uploadDocument,
    deleteDocument,
  };
}
