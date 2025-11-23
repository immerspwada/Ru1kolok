import { createClient } from '@/lib/supabase/client';
import { DocumentType } from '@/types/database.types';
import { validateFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './validation';

const BUCKET_NAME = 'membership-documents';

/**
 * Upload document to Supabase Storage
 * Path format: {userId}/{documentType}_{timestamp}.{ext}
 */
export async function uploadDocument(
  file: File,
  userId: string,
  documentType: DocumentType
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: 'ไม่สามารถอัปโหลดไฟล์ได้' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload document error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปโหลด' };
  }
}

/**
 * Delete document from storage
 */
export async function deleteDocument(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Extract path from full URL if needed
    const filePath = path.includes(BUCKET_NAME)
      ? path.split(`${BUCKET_NAME}/`)[1]
      : path;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: 'ไม่สามารถลบไฟล์ได้' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบไฟล์' };
  }
}

/**
 * Get signed URL for private document access
 * Valid for 1 hour
 */
export async function getDocumentUrl(
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Extract path from full URL if needed
    const filePath = path.includes(BUCKET_NAME)
      ? path.split(`${BUCKET_NAME}/`)[1]
      : path;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) {
      console.error('Get signed URL error:', error);
      return { success: false, error: 'ไม่สามารถสร้าง URL ได้' };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Get document URL error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้าง URL' };
  }
}

/**
 * Upload multiple documents at once
 */
export async function uploadMultipleDocuments(
  files: { file: File; type: DocumentType }[],
  userId: string
): Promise<{
  success: boolean;
  results: Array<{
    type: DocumentType;
    url?: string;
    error?: string;
  }>;
}> {
  const results = await Promise.all(
    files.map(async ({ file, type }) => {
      const result = await uploadDocument(file, userId, type);
      return {
        type,
        url: result.url,
        error: result.error,
      };
    })
  );

  const allSuccess = results.every((r) => r.url);

  return {
    success: allSuccess,
    results,
  };
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * Check if file size is within limit
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}
