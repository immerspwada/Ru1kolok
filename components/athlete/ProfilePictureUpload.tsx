'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';

interface ProfilePictureUploadProps {
  userId: string;
  currentPictureUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export function ProfilePictureUpload({
  userId,
  currentPictureUrl,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPictureUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
        variant: 'error',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: 'ไฟล์ใหญ่เกินไป',
        description: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB',
        variant: 'error',
      });
      return;
    }

    setUploading(true);

    try {
      // Create file path: userId/profile-picture.ext
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile-picture.${fileExt}`;

      // Delete old file if exists
      if (currentPictureUrl) {
        const oldPath = currentPictureUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('profile-pictures').remove([oldPath]);
      }

      // Upload new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadSuccess?.(publicUrl);

      addToast({
        title: 'อัปโหลดสำเร็จ',
        description: 'รูปโปรไฟล์ของคุณถูกอัปเดตแล้ว',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปโหลดรูปภาพได้',
        variant: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentPictureUrl) return;

    setUploading(true);

    try {
      // Delete file from storage
      const filePath = currentPictureUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('profile-pictures').remove([filePath]);

      // Update profile in database
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('id', userId);

      if (error) throw error;

      setPreviewUrl(null);
      onUploadSuccess?.(null as any);

      addToast({
        title: 'ลบสำเร็จ',
        description: 'รูปโปรไฟล์ถูกลบแล้ว',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบรูปภาพได้',
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Remove Button */}
        {previewUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
            title="ลบรูปโปรไฟล์"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              {previewUrl ? 'เปลี่ยนรูปโปรไฟล์' : 'อัปโหลดรูปโปรไฟล์'}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          รองรับไฟล์ JPG, PNG (สูงสุด 5MB)
        </p>
      </div>
    </div>
  );
}
