import { supabase, isLiveSupabaseConfigured } from './supabase';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (safely beneath 50MB free-tier limit)

export const ALLOWED_EXTENSIONS = [
  'pdf', 'zip', 'step', 'stp', 'iges', 'igs', 'cad', 'sldprt', 'sldasm',
  'png', 'jpg', 'jpeg', 'svg', 'csv', 'xlsx', 'm', 'py', 'c', 'cpp', 'txt'
];

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 25 MB quota limit.`
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is not supported. Supported types: CAD (step, stp, iges), PDF, ZIP, code (m, py, c), images, CSV.`
    };
  }

  return { valid: true };
}

export async function uploadFile(
  file: File,
  bucket: 'task-attachments' | 'chat-media' = 'task-attachments',
  folder = 'general'
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;

  if (!isLiveSupabaseConfigured) {
    // In demo mode, create an object URL or data URL
    const demoUrl = URL.createObjectURL(file);
    return {
      url: demoUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}
