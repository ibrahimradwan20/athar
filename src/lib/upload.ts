import { createClient } from "@/lib/supabase/client";

export async function uploadImage(
  file: File,
  bucket: "avatars" | "campaign-images",
  path: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  if (file.size > 5 * 1024 * 1024) return { url: null, error: "حجم الصورة يجب أن يكون أقل من 5MB" };
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
    return { url: null, error: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP" };
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true, cacheControl: "3600", contentType: file.type,
  });

  if (error) {
    if (error.message?.includes("Bucket not found"))
      return { url: null, error: "Storage bucket غير موجود — شغّل fix_registration.sql في Supabase" };
    if (error.message?.includes("not authorized") || error.message?.includes("policy"))
      return { url: null, error: "خطأ في الصلاحيات — شغّل fix_registration.sql في Supabase" };
    return { url: null, error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: publicUrl, error: null };
}

export async function removeImage(
  bucket: "avatars" | "campaign-images",
  path: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return { error: null };
}
