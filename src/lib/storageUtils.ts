import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a short-lived signed URL for secure documents.
 * This should be used on-demand when displaying CVs or other private documents.
 * 
 * @param storedPath - The file path stored in the database (e.g., "userId/cvs/filename.pdf")
 * @param bucket - The storage bucket name
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 * @returns The signed URL or null if generation fails
 */
export const generateSignedUrl = async (
  storedPath: string | null | undefined,
  bucket: string = "secure-documents",
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  if (!storedPath) return null;

  // If it's already a full URL (legacy data), return as-is
  // This handles backward compatibility with existing 1-year URLs
  if (storedPath.startsWith("http")) {
    return storedPath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storedPath, expiresIn);

    if (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
};

/**
 * Extracts the file path from a storage URL or returns the path if already a path.
 * Useful for migrating from URL storage to path storage.
 */
export const extractFilePath = (urlOrPath: string | null | undefined): string | null => {
  if (!urlOrPath) return null;
  
  // If it's already a path (not a URL), return as-is
  if (!urlOrPath.startsWith("http")) {
    return urlOrPath;
  }

  // Extract path from signed URL
  // URLs look like: https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=xxx
  try {
    const url = new URL(urlOrPath);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    
    // Also handle public URLs
    const publicMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    if (publicMatch) {
      return decodeURIComponent(publicMatch[1]);
    }
  } catch {
    // Not a valid URL, return as-is
  }

  return urlOrPath;
};
