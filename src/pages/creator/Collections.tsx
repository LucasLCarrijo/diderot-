import { useState } from "react";
import { Plus, MoreVertical, FolderOpen, Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Collections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // First get the profile ID
  const { data: profile } = useQuery({
    queryKey: ["profile-for-collections", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: collections, isLoading } = useQuery({
    queryKey: ["creator-collections", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("creator_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Get product count for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", collection.id);
          
          return {
            ...collection,
            product_count: count || 0,
          };
        })
      );

      return collectionsWithCounts;
    },
    enabled: !!profile?.id,
  });

  const deleteCollection = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-collections"] });
      toast.success("Coleção excluída com sucesso");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir coleção");
    },
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCollection.mutate(deleteId);
    }
  };

  return (
    <CreatorLayout
      title="Minhas Coleções"
      description="Organize seus produtos em coleções temáticas"
      actions={
        <Button asChild>
          <Link to="/creator/collections/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Coleção
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full rounded-t-lg" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {collections.map((collection) => (
              <Card key={collection.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <Link to={`/c/${collection.id}`}>
                  <div className="h-40 bg-muted flex items-center justify-center relative">
                    {collection.thumbnail_url ? (
                      <img
                        src={collection.thumbnail_url}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`/c/${collection.id}`} className="hover:underline">
                        <h3 className="font-semibold text-foreground truncate">{collection.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {collection.product_count} {collection.product_count === 1 ? "produto" : "produtos"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link to={`/c/${collection.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Ver coleção
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/creator/collections/${collection.id}/edit`} className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(collection.id)} 
                          className="text-destructive focus:text-destructive flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <CardTitle className="mb-2">Nenhuma coleção ainda</CardTitle>
              <p className="text-muted-foreground text-center mb-4">
                Crie coleções para organizar seus produtos por tema ou ocasião.
              </p>
              <Button asChild>
                <Link to="/creator/collections/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira coleção
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta coleção? Esta ação não pode ser desfeita.
              Os produtos associados não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCollection.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
}
