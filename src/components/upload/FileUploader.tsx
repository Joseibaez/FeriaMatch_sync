import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, FileText, Loader2, Camera, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  userId: string;
  bucket: "public-files" | "secure-documents";
  folder: "avatars" | "logos" | "cvs";
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  variant?: "avatar" | "logo" | "document";
  label?: string;
}

export const FileUploader = ({
  userId,
  bucket,
  folder,
  currentUrl,
  onUploadComplete,
  accept = "image/*",
  maxSize = 5,
  variant = "document",
  label = "Subir archivo",
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`El archivo es muy grande. Máximo ${maxSize}MB`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName(file.name);
    }

    // Upload file
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${folder}/${Date.now()}.${fileExt}`;

      // Delete old file if exists
      if (currentUrl) {
        const oldPath = currentUrl.split("/").slice(-3).join("/");
        await supabase.storage.from(bucket).remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL for public bucket, or store file path for private
      let url: string;
      if (bucket === "public-files") {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        url = urlData.publicUrl;
      } else {
        // For secure documents, store the file path instead of a signed URL
        // Signed URLs will be generated on-demand with short expiry
        url = filePath;
      }

      onUploadComplete(url);
      toast.success("Archivo subido correctamente");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error al subir el archivo");
      setPreview(currentUrl || null);
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;

    try {
      const path = currentUrl.split("/").slice(-3).join("/");
      await supabase.storage.from(bucket).remove([path]);
      setPreview(null);
      setFileName(null);
      onUploadComplete("");
      toast.success("Archivo eliminado");
    } catch (error) {
      toast.error("Error al eliminar el archivo");
    }
  };

  // Avatar variant
  if (variant === "avatar" || variant === "logo") {
    const size = variant === "avatar" ? "h-24 w-24" : "h-20 w-20";
    const iconSize = variant === "avatar" ? "h-6 w-6" : "h-5 w-5";

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <Avatar className={cn(size, "border-2 border-border")}>
            <AvatarImage src={preview || undefined} alt="Preview" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {variant === "avatar" ? (
                <Camera className={iconSize} />
              ) : (
                <Upload className={iconSize} />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Overlay on hover */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full",
              "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
              "cursor-pointer"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Remove button */}
          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground text-center">
          {label} • Máx {maxSize}MB
        </p>
      </div>
    );
  }

  // Document variant (for CVs)
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview || fileName ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {fileName || "Documento actual"}
                </p>
                <Badge variant="secondary" className="text-xs gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  Subido
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Cambiar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">
                Arrastra o haz clic para seleccionar • Máx {maxSize}MB
              </p>
            </div>
          </button>
        )}
      </div>

      {currentUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(currentUrl, "_blank")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver documento actual
        </Button>
      )}
    </div>
  );
};
