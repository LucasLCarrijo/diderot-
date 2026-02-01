import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/hooks/useCollection";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FolderOpen } from "lucide-react";

export default function CollectionEdit() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: collection, isLoading } = useCollection(id || "");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync form with collection data
  useEffect(() => {
    if (collection && !isInitialized) {
      setName(collection.name || "");
      setDescription(collection.description || "");
      setThumbnailUrl(collection.thumbnail_url || null);
      setIsInitialized(true);
    }
  }, [collection, isInitialized]);

  const updateCollection = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id) throw new Error("Não autenticado");
      if (!name.trim()) throw new Error("Nome da coleção é obrigatório");

      const { error } = await supabase
        .from("collections")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["creator-collections"] });
      toast.success("Coleção atualizada com sucesso!");
      navigate(`/c/${id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar coleção");
    },
  });

  if (isLoading) {
    return (
      <CreatorLayout title="Editar Coleção">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </CreatorLayout>
    );
  }

  if (!collection) {
    return (
      <CreatorLayout title="Coleção não encontrada">
        <div className="max-w-2xl mx-auto text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-medium mb-2">Coleção não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            Esta coleção não existe ou você não tem permissão para editá-la.
          </p>
          <Button onClick={() => navigate("/creator/collections")}>
            Voltar para coleções
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  const canSubmit = name.trim().length >= 2;

  return (
    <CreatorLayout title="Editar Coleção">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/c/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Editar Coleção
            </CardTitle>
            <CardDescription>
              Atualize as informações da sua coleção.
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
                onClick={() => navigate(`/c/${id}`)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateCollection.mutate()}
                disabled={!canSubmit || updateCollection.isPending}
              >
                {updateCollection.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
