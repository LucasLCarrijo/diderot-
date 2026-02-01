import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreatorLayout } from '@/components/layout/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { PinEditor, Pin } from '@/components/posts/PinEditor';
import { ProductSelectorModal } from '@/components/posts/ProductSelectorModal';
import { PostPreviewModal } from '@/components/posts/PostPreviewModal';
import { PostLimitBanner } from '@/components/posts/PostLimitBanner';
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
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  MapPin, 
  MessageSquare, 
  Eye,
  Save,
  Check,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useCreatePost, useMyPosts } from '@/hooks/usePosts';
import { usePostDraft, PostDraft } from '@/hooks/usePostDraft';
import { useCreatorLimits } from '@/hooks/useCreatorLimits';
import { Product } from '@/hooks/useCreatorProducts';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Imagem', icon: Upload },
  { id: 2, title: 'Pins', icon: MapPin },
  { id: 3, title: 'Legenda', icon: MessageSquare },
  { id: 4, title: 'Preview', icon: Eye },
];

const MAX_CONTENT_LENGTH = 2000;
const MAX_PINS = 20;

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function PostNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useCreatorProfile(user?.id);
  const { postLimit, hasCreatorPro } = useCreatorLimits();
  const createPost = useCreatePost();
  const { data: myPosts } = useMyPosts();
  const { 
    hasDraft, 
    lastSaved, 
    getDraft, 
    saveDraft, 
    clearDraft, 
    setupAutoSave,
    saveOnLeave,
  } = usePostDraft();

  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [pendingPinPosition, setPendingPinPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // Use real limits from subscription
  const canCreatePost = postLimit.allowed;

  const progress = (currentStep / STEPS.length) * 100;

  // Get draft data function
  const getDraftData = useCallback(() => ({
    imageUrl,
    title,
    content,
    pins,
  }), [imageUrl, title, content, pins]);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft) {
      setShowDraftDialog(true);
    }
  }, [hasDraft]);

  // Setup auto-save
  useEffect(() => {
    const cleanup = setupAutoSave(getDraftData, true);
    return cleanup;
  }, [setupAutoSave, getDraftData]);

  // Save on leave
  useEffect(() => {
    const cleanup = saveOnLeave(getDraftData);
    return cleanup;
  }, [saveOnLeave, getDraftData]);

  const handleRestoreDraft = useCallback(() => {
    const draft = getDraft();
    if (draft) {
      setImageUrl(draft.imageUrl);
      setTitle(draft.title);
      setContent(draft.content);
      setPins(draft.pins);
      toast.success('Rascunho restaurado');
    }
    setShowDraftDialog(false);
  }, [getDraft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftDialog(false);
  }, [clearDraft]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!imageUrl;
      case 2:
        return true; // Pins are optional
      case 3:
        return true; // Content is optional
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, imageUrl]);

  const handleAddPin = useCallback((x: number, y: number) => {
    if (pins.length >= MAX_PINS) {
      toast.error(`Máximo de ${MAX_PINS} pins por post`);
      return;
    }
    setPendingPinPosition({ x, y });
    setEditingPinId(null);
    setShowProductSelector(true);
  }, [pins.length]);

  const handleEditPin = useCallback((pinId: string) => {
    const pin = pins.find(p => p.id === pinId);
    if (pin) {
      setEditingPinId(pinId);
      setShowProductSelector(true);
    }
  }, [pins]);

  const handleSelectProduct = useCallback((product: Product) => {
    if (editingPinId) {
      // Editing existing pin
      setPins(prev => prev.map(pin =>
        pin.id === editingPinId
          ? {
              ...pin,
              productId: product.id,
              product: {
                id: product.id,
                title: product.title,
                image_url: product.image_url,
                price: product.price,
                currency: product.currency,
              },
            }
          : pin
      ));
      setEditingPinId(null);
      toast.success('Produto atualizado!');
    } else if (pendingPinPosition) {
      // Adding new pin
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
    }
  }, [pendingPinPosition, editingPinId]);

  const handlePublish = useCallback(async () => {
    if (!imageUrl) {
      toast.error('Selecione uma imagem');
      return;
    }

    if (!canCreatePost) {
      toast.error('Limite de posts diários atingido. Faça upgrade para Creator Pro!');
      navigate('/creator/pricing');
      return;
    }

    try {
      await createPost.mutateAsync({
        image_url: imageUrl,
        title: title || undefined,
        content: content || undefined,
        pins: pins.map(pin => ({
          x: pin.x,
          y: pin.y,
          productId: pin.productId,
          label: pin.label,
        })),
      });
      clearDraft();
      navigate('/creator/posts');
    } catch (error) {
      // Error handled by mutation
    }
  }, [imageUrl, title, content, pins, createPost, navigate, clearDraft, canCreatePost]);

  const handleSaveDraft = useCallback(() => {
    saveDraft(getDraftData());
  }, [saveDraft, getDraftData]);

  return (
    <CreatorLayout title="Novo Post">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/creator/posts')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para posts
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Criar novo post</h1>
              <p className="text-muted-foreground">
                Compartilhe produtos com sua audiência
              </p>
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Post limit banner */}
        <PostLimitBanner
          currentCount={postLimit.current}
          maxCount={postLimit.max}
          isPro={hasCreatorPro}
          className="mb-6"
        />

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-colors',
                    isActive && 'text-primary',
                    isCompleted && 'text-primary',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'border-muted'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Upload Image */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Upload da imagem</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione uma imagem para o seu post. Formatos aceitos: JPG, PNG, WebP (máx. 10MB)
                  </p>
                </div>

                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  bucket="post-images"
                  folder={user?.id}
                  maxSize={10}
                  className="min-h-[400px]"
                />
              </div>
            )}

            {/* Step 2: Add Pins */}
            {currentStep === 2 && imageUrl && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Adicionar produtos</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique na imagem para marcar produtos. Arraste os pins para reposicioná-los.
                  </p>
                </div>

                <PinEditor
                  imageUrl={imageUrl}
                  pins={pins}
                  onPinsChange={setPins}
                  onAddPin={handleAddPin}
                  onEditPin={handleEditPin}
                  maxPins={MAX_PINS}
                  editable
                  showSidebar
                />
              </div>
            )}

            {/* Step 3: Caption */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Legenda</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione uma descrição para o seu post (opcional)
                  </p>
                </div>

                <div className="space-y-4">
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
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        Dica: Use hashtags para alcançar mais pessoas
                      </p>
                      <p className={cn(
                        'text-xs',
                        content.length > MAX_CONTENT_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {content.length}/{MAX_CONTENT_LENGTH}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview mini */}
                {(title || content) && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardDescription>Preview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {title && <p className="font-medium">{title}</p>}
                      {content && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                          {content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 4 && imageUrl && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Preview final</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Revise como seu post ficará para seus seguidores
                  </p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Imagem</p>
                      <p className="text-xs text-muted-foreground">Carregada ✓</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MapPin className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Pins</p>
                      <p className="text-xs text-muted-foreground">
                        {pins.length} {pins.length === 1 ? 'produto' : 'produtos'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Legenda</p>
                      <p className="text-xs text-muted-foreground">
                        {content.length > 0 ? `${content.length} caracteres` : 'Não adicionada'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Mini preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-auto"
                    />
                    {pins.map((pin, index) => (
                      <div
                        key={pin.id}
                        className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${pin.x * 100}%`,
                          top: `${pin.y * 100}%`,
                        }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <div>
                    {title && <h3 className="font-medium mb-2">{title}</h3>}
                    {content && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {content}
                      </p>
                    )}
                    {pins.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Produtos:</p>
                        <div className="space-y-2">
                          {pins.slice(0, 3).map((pin, index) => (
                            <div key={pin.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="w-5 h-5 flex items-center justify-center p-0">
                                {index + 1}
                              </Badge>
                              <span className="text-sm">{pin.product?.title}</span>
                            </div>
                          ))}
                          {pins.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              + {pins.length - 3} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver preview completo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Salvar rascunho
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={createPost.isPending || !canCreatePost}
              >
                {createPost.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        open={showProductSelector}
        onOpenChange={(open) => {
          setShowProductSelector(open);
          if (!open) {
            setPendingPinPosition(null);
            setEditingPinId(null);
          }
        }}
        onSelectProduct={handleSelectProduct}
        selectedProductIds={pins.map(p => p.productId)}
        disabledProductIds={editingPinId ? [] : pins.map(p => p.productId)}
      />

      {/* Preview Modal */}
      {imageUrl && (
        <PostPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          imageUrl={imageUrl}
          content={content}
          pins={pins}
          creator={profile ? {
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : undefined}
          onBack={() => setShowPreview(false)}
          onPublish={handlePublish}
          isPublishing={createPost.isPending}
        />
      )}

      {/* Draft restore dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Rascunho encontrado
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem um rascunho de post salvo. Deseja restaurá-lo ou começar um novo post?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Descartar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Restaurar rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
}
