import { supabase } from "@/lib/supabase";

export function useUploadFile() {
  return async (file: File): Promise<{ url: string; path: string }> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error("Not authenticated");
    const rawExt = file.name.split(".").pop()?.toLowerCase();
    const ext = rawExt && /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
    const path = `${authData.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("creator-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("creator-media").getPublicUrl(path);
    return { url: data.publicUrl, path };
  };
}
