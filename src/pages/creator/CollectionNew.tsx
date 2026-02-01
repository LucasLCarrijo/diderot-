import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FolderPlus } from "lucide-react";

export default function CollectionNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const createCollection = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Não autenticado");
      if (!name.trim()) throw new Error("Nome da coleção é obrigatório");

      // Get user's profile id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from("collections")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
          creator_id: profile.id,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator-collections"] });
      toast.success("Coleção criada com sucesso!");
      // Redirect to the collection page
      navigate(`/c/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar coleção");
    },
  });

  const canSubmit = name.trim().length >= 2;

  return (
    <CreatorLayout title="Nova Coleção">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/creator/collections")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Criar Coleção
            </CardTitle>
            <CardDescription>
              Organize seus produtos em coleções temáticas para facilitar a descoberta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Capa da coleção (opcional)</Label>
              <ImageUploader
                value={thumbnailUrl || ""}
                onChange={(url) => setThumbnailUrl(url || null)}
                aspectRatio="video"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da coleção *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Looks de Verão, Favoritos de Skincare..."
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{name.length}/100 caracteres</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o tema dessa coleção..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{description.length}/500 caracteres</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/creator/collections")}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createCollection.mutate()}
                disabled={!canSubmit || createCollection.isPending}
              >
                {createCollection.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar coleção"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
