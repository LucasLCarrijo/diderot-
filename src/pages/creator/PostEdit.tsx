import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreatorLayout } from '@/components/layout/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { PinEditor, Pin } from '@/components/posts/PinEditor';
import { ProductSelectorModal } from '@/components/posts/ProductSelectorModal';
import { 
  ArrowLeft, 
  Save,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePost, useUpdatePost, useDeletePost } from '@/hooks/usePosts';
import { Product } from '@/hooks/useCreatorProducts';
import { toast } from 'sonner';

const MAX_CONTENT_LENGTH = 2000;
const MAX_PINS = 20;

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function PostEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const { data: post, isLoading } = usePost(id);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [pendingPinPosition, setPendingPinPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load post data
  useEffect(() => {
    if (post) {
      setImageUrl(post.image_url);
      setTitle(post.title || '');
      setContent(post.content || '');
      setPins(post.pins || []);
    }
  }, [post]);

  // Track changes
  useEffect(() => {
    if (!post) return;
    const changed = 
      imageUrl !== post.image_url ||
      title !== (post.title || '') ||
      content !== (post.content || '') ||
      JSON.stringify(pins) !== JSON.stringify(post.pins || []);
    setHasChanges(changed);
  }, [post, imageUrl, title, content, pins]);

  const handleAddPin = useCallback((x: number, y: number) => {
    if (pins.length >= MAX_PINS) {
      toast.error(`Máximo de ${MAX_PINS} pins por post`);
      return;
    }
    setPendingPinPosition({ x, y });
    setShowProductSelector(true);
  }, [pins.length]);

  const handleSelectProduct = useCallback((product: Product) => {
    if (!pendingPinPosition) return;

    const newPin: Pin = {
      id: generateId(),
      x: pendingPinPosition.x,
      y: pendingPinPosition.y,
      productId: product.id,
      product: {
        id: product.id,
        title: product.title,
        image_url: product.image_url,
        price: product.price,
        currency: product.currency,
      },
    };

    setPins(prev => [...prev, newPin]);
    setPendingPinPosition(null);
    toast.success('Produto adicionado!');
  }, [pendingPinPosition]);

  const handleSave = useCallback(async () => {
    if (!id || !imageUrl) {
      toast.error('Dados inválidos');
      return;
    }

    try {
      await updatePost.mutateAsync({
        id,
        data: {
          image_url: imageUrl,
          title: title || undefined,
          content: content || undefined,
          pins: pins.map(pin => ({
            x: pin.x,
            y: pin.y,
            productId: pin.productId,
            label: pin.label,
          })),
        },
      });
      navigate('/creator/posts');
    } catch (error) {
      // Error handled by mutation
    }
  }, [id, imageUrl, title, content, pins, updatePost, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;

    try {
      await deletePost.mutateAsync(id);
      navigate('/creator/posts');
    } catch (error) {
      // Error handled by mutation
    }
  }, [id, deletePost, navigate]);

  if (isLoading) {
    return (
      <CreatorLayout title="Editar Post">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CreatorLayout>
    );
  }

  if (!post) {
    return (
      <CreatorLayout title="Post não encontrado">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Post não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Este post pode ter sido deletado ou você não tem permissão para editá-lo.
          </p>
          <Button onClick={() => navigate('/creator/posts')}>
            Voltar para posts
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Editar Post">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator/posts')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para posts
            </Button>

            <h1 className="text-2xl font-bold">Editar post</h1>
            <p className="text-muted-foreground">
              Atualize as informações do seu post
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image & Pins */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Imagem</h3>
                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  bucket="post-images"
                  folder={user?.id}
                  maxSize={10}
                  className="min-h-[300px]"
                />
              </CardContent>
            </Card>

            {imageUrl && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Pins de produtos</h3>
                  <PinEditor
                    imageUrl={imageUrl}
                    pins={pins}
                    onPinsChange={setPins}
                    onAddPin={handleAddPin}
                    maxPins={MAX_PINS}
                    editable
                  />

                  {pins.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique para remover
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pins.map((pin, index) => (
                          <Badge
                            key={pin.id}
                            variant="secondary"
                            className="gap-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              setPins(prev => prev.filter(p => p.id !== pin.id));
                            }}
                          >
                            {index + 1}. {pin.product?.title || 'Produto'}
                            <span className="text-xs">×</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título (opcional)</label>
                  <Input
                    placeholder="Ex: Look do dia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Escreva algo sobre este post..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={MAX_CONTENT_LENGTH}
                    rows={8}
                    className="resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <p className={cn(
                      'text-xs',
                      content.length > MAX_CONTENT_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {content.length}/{MAX_CONTENT_LENGTH}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/creator/posts')}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!hasChanges || updatePost.isPending}
              >
                {updatePost.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        open={showProductSelector}
        onOpenChange={(open) => {
          setShowProductSelector(open);
          if (!open) setPendingPinPosition(null);
        }}
        onSelectProduct={handleSelectProduct}
        selectedProductIds={pins.map(p => p.productId)}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O post e todos os pins serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
}
