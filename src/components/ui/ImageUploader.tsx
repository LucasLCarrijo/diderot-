import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  maxSize?: number; // in MB
  aspectRatio?: "square" | "video" | "free";
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  bucket = "product-images",
  folder,
  maxSize = 10,
  aspectRatio = "square",
  className,
  disabled,
}: ImageUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer upload");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename with user-id-based folder for security
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      // Always use user.id as first folder segment for storage RLS policies
      const userFolder = folder ? `${user.id}/${folder}` : user.id;
      const filePath = `${userFolder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  }, [user, bucket, folder, maxSize, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, isUploading, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    free: "min-h-[200px]",
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer overflow-hidden",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        aspectClasses[aspectRatio],
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />

      {value ? (
        // Image preview
        <div className="relative h-full w-full">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        // Upload prompt
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-secondary mb-3">
                {isDragging ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium mb-1">
                {isDragging ? "Solte a imagem aqui" : "Clique ou arraste uma imagem"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou WEBP (máx. {maxSize}MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Multi-image uploader
interface MultiImageUploaderProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucket?: string;
  folder?: string;
  maxSize?: number;
  disabled?: boolean;
}

export function MultiImageUploader({
  values = [],
  onChange,
  maxImages = 5,
  bucket = "product-images",
  folder,
  maxSize = 10,
  disabled,
}: MultiImageUploaderProps) {
  const handleAdd = (url: string) => {
    if (values.length < maxImages) {
      onChange([...values, url]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        
        {values.length < maxImages && !disabled && (
          <ImageUploader
            value=""
            onChange={handleAdd}
            bucket={bucket}
            folder={folder}
            maxSize={maxSize}
            aspectRatio="square"
            className="!min-h-0"
          />
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {values.length}/{maxImages} imagens adicionais
      </p>
    </div>
  );
}
