import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { ImageUploader, MultiImageUploader } from "@/components/ui/ImageUploader";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useProduct, useUpdateProduct, useDeleteProduct, ProductFormData } from "@/hooks/useCreatorProducts";
import { productSchema, ProductData, PRODUCT_CATEGORIES, MONETIZATION_TYPES } from "@/lib/validations/product";
import { cn } from "@/lib/utils";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const { loading: authLoading } = useRequireAuth("creator");
  const navigate = useNavigate();
  
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
  });

  const monetizationType = watch("monetization_type");
  const isPublished = watch("is_published");

  // Load product data into form
  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        store: product.store || "",
        categories: product.categories || [],
        monetization_type: (product.monetization_type as "affiliate" | "coupon" | "recommendation") || "affiliate",
        affiliate_url: product.affiliate_url || "",
        coupon_code: product.coupon_code || "",
        price: product.price || undefined,
        currency: product.currency || "BRL",
        description: product.description || "",
        image_url: product.image_url || "",
        additional_images: product.additional_images || [],
        is_published: product.is_published ?? true,
        status: (product.status as "published" | "draft" | "archived") || "published",
      });
    }
  }, [product, reset]);

  const onSubmit = (data: ProductData) => {
    if (!id) return;

    const formData: ProductFormData = {
      title: data.title,
      store: data.store,
      categories: data.categories,
      monetization_type: data.monetization_type,
      affiliate_url: data.affiliate_url || undefined,
      coupon_code: data.coupon_code || undefined,
      price: data.price,
      currency: data.currency,
      description: data.description || undefined,
      image_url: data.image_url || undefined,
      additional_images: data.additional_images,
      is_published: data.is_published,
      status: data.is_published ? "published" : "draft",
    };

    updateProduct.mutate({ id, data: formData }, {
      onSuccess: () => {
        navigate("/creator/shop");
      },
    });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProduct.mutate(id, {
      onSuccess: () => {
        navigate("/creator/shop");
      },
    });
    setShowDeleteDialog(false);
  };

  if (authLoading || isLoading) {
    return (
      <CreatorLayout title="Editar Produto" description="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </CreatorLayout>
    );
  }

  if (!product) {
    return (
      <CreatorLayout title="Produto não encontrado" description="Este produto não existe ou foi removido">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Produto não encontrado</p>
          <Button onClick={() => navigate("/creator/shop")}>
            Voltar para Minha Loja
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout
      title="Editar Produto"
      description={product.title}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/creator/shop")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Arquivar
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="store">Loja / Marca *</Label>
              <Input id="store" {...register("store")} />
              {errors.store && (
                <p className="text-sm text-destructive">{errors.store.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categorias *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={field.value?.includes(category)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category]);
                              } else {
                                field.onChange(current.filter((c) => c !== category));
                              }
                            }}
                          />
                          <label htmlFor={category} className="text-sm cursor-pointer">
                            {category}
                          </label>
                        </div>
                      ))}
                    </>
                  )}
                />
              </div>
              {errors.categories && (
                <p className="text-sm text-destructive">{errors.categories.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Tipo de Monetização</Label>
              <Controller
                name="monetization_type"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid sm:grid-cols-3 gap-3"
                  >
                    {MONETIZATION_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer",
                          field.value === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <RadioGroupItem value={type.value} id={`edit-${type.value}`} />
                        <label htmlFor={`edit-${type.value}`} className="text-sm font-medium cursor-pointer">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monetization */}
        <Card>
          <CardHeader>
            <CardTitle>Monetização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monetizationType !== "recommendation" && (
              <div className="space-y-2">
                <Label htmlFor="affiliate_url">URL de Afiliado *</Label>
                <Input id="affiliate_url" {...register("affiliate_url")} />
                {errors.affiliate_url && (
                  <p className="text-sm text-destructive">{errors.affiliate_url.message}</p>
                )}
              </div>
            )}

            {monetizationType === "coupon" && (
              <div className="space-y-2">
                <Label htmlFor="coupon_code">Código do Cupom</Label>
                <Input id="coupon_code" {...register("coupon_code")} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input id="price" type="number" step="0.01" {...register("price")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Input id="currency" {...register("currency")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={5} {...register("description")} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem Principal</Label>
              <Controller
                name="image_url"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    value={field.value}
                    onChange={field.onChange}
                    className="max-w-md"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagens Adicionais</Label>
              <Controller
                name="additional_images"
                control={control}
                render={({ field }) => (
                  <MultiImageUploader
                    values={field.value || []}
                    onChange={field.onChange}
                    maxImages={5}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_published">Publicado</Label>
                <p className="text-sm text-muted-foreground">
                  Produtos publicados aparecem no seu perfil público
                </p>
              </div>
              <Controller
                name="is_published"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_published"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/creator/shop")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!isDirty || updateProduct.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateProduct.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto será arquivado e não aparecerá mais no seu perfil público.
              Você pode restaurá-lo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatorLayout>
  );
}
