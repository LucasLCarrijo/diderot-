import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AvatarUploadButtonProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUploadButton({ 
  currentAvatarUrl, 
  userName = "U",
  onUploadComplete 
}: AvatarUploadButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      
      onUploadComplete(urlWithCacheBuster);
      toast.success("Avatar atualizado com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className="h-24 w-24 cursor-pointer" onClick={() => setIsOpen(true)}>
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => setIsOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar foto de perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={preview || currentAvatarUrl || undefined} />
                  <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                </Avatar>
                {preview && (
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!preview ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => inputRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Selecionar imagem
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => inputRef.current?.click()}
                  >
                    Trocar
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
