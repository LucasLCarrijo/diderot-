import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorLayout } from "@/components/layout/CreatorLayout";
import { ImageUploader, MultiImageUploader } from "@/components/ui/ImageUploader";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCreateProduct, ProductFormData } from "@/hooks/useCreatorProducts";
import { useCreatorLimits } from "@/hooks/useCreatorLimits";
import { productSchema, productBasicSchema, productMonetizationSchema, productImagesSchema, ProductData, PRODUCT_CATEGORIES, MONETIZATION_TYPES } from "@/lib/validations/product";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Básico", description: "Informações principais" },
  { id: 2, title: "Monetização", description: "Como você ganha" },
  { id: 3, title: "Imagens", description: "Fotos do produto" },
  { id: 4, title: "Revisar", description: "Confirme os dados" },
];

export default function ProductNew() {
  const { loading } = useRequireAuth("creator");
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { productLimit, hasCreatorPro } = useCreatorLimits();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      store: "",
      categories: [],
      monetization_type: "affiliate",
      affiliate_url: "",
      coupon_code: "",
      price: undefined,
      currency: "BRL",
      description: "",
      image_url: "",
      additional_images: [],
      is_published: true,
      status: "published",
    },
  });

  const watchedValues = watch();
  const monetizationType = watch("monetization_type");

  // Load draft from localStorage with validation
  useEffect(() => {
    const draft = localStorage.getItem("product-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        
        // Validate with basic schema (partial for drafts - using merged schemas without refine)
        const draftSchema = productBasicSchema.merge(productMonetizationSchema).merge(productImagesSchema).extend({
          is_published: z.boolean().optional(),
          status: z.enum(["published", "draft", "archived"]).optional(),
        }).partial();
        
        const validated = draftSchema.safeParse(parsed);
        
        if (validated.success) {
          Object.keys(validated.data).forEach((key) => {
            const value = validated.data[key as keyof typeof validated.data];
            if (value !== undefined) {
              setValue(key as keyof ProductData, value);
            }
          });
        } else {
          console.warn("Invalid product draft data, clearing:", validated.error);
          localStorage.removeItem("product-draft");
        }
      } catch (error) {
        console.error("Error loading product draft:", error);
        localStorage.removeItem("product-draft");
      }
    }
  }, [setValue]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem("product-draft", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return trigger(["title", "store", "categories", "monetization_type"]);
      case 2:
        return trigger(["affiliate_url", "coupon_code", "price", "description"]);
      case 3:
        return true; // Images are optional
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ProductData) => {
    // Check product limit before creating
    if (!productLimit.allowed) {
      toast.error('Você atingiu o limite de produtos do plano gratuito. Faça upgrade para Creator Pro!');
      navigate('/creator/pricing');
      return;
    }

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
      status: data.status,
    };

    createProduct.mutate(formData, {
      onSuccess: () => {
        localStorage.removeItem("product-draft");
        navigate("/creator/shop");
      },
    });
  };

  const saveDraft = () => {
    const formData: ProductFormData = {
      title: watchedValues.title || "Rascunho",
      store: watchedValues.store || "",
      categories: watchedValues.categories || [],
      monetization_type: watchedValues.monetization_type,
      affiliate_url: watchedValues.affiliate_url || undefined,
      status: "draft",
      is_published: false,
    };

    createProduct.mutate(formData, {
      onSuccess: () => {
        localStorage.removeItem("product-draft");
        navigate("/creator/shop");
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <CreatorLayout
      title="Novo Produto"
      description="Adicione um novo produto à sua loja"
      actions={
        <Button variant="outline" onClick={() => navigate("/creator/shop")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      }
    >
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="hidden sm:block ml-3">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "hidden sm:block w-16 h-0.5 mx-4",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Produto *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Tênis Nike Air Max 90"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="store">Loja / Marca *</Label>
                <Input
                  id="store"
                  placeholder="Ex: Nike, Amazon, Shein..."
                  {...register("store")}
                />
                {errors.store && (
                  <p className="text-sm text-destructive">{errors.store.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categorias *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                <Label>Tipo de Monetização *</Label>
                <Controller
                  name="monetization_type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3"
                    >
                      {MONETIZATION_TYPES.map((type) => (
                        <div
                          key={type.value}
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                            field.value === type.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <RadioGroupItem value={type.value} id={type.value} />
                          <div>
                            <label htmlFor={type.value} className="font-medium cursor-pointer">
                              {type.label}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Monetization */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Monetização</CardTitle>
              <CardDescription>Configure como você vai ganhar com este produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {monetizationType !== "recommendation" && (
                <div className="space-y-2">
                  <Label htmlFor="affiliate_url">URL de Afiliado *</Label>
                  <Input
                    id="affiliate_url"
                    placeholder="https://..."
                    {...register("affiliate_url")}
                  />
                  {errors.affiliate_url && (
                    <p className="text-sm text-destructive">{errors.affiliate_url.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Cole o link de afiliado da loja parceira
                  </p>
                </div>
              )}

              {monetizationType === "coupon" && (
                <div className="space-y-2">
                  <Label htmlFor="coupon_code">Código do Cupom</Label>
                  <Input
                    id="coupon_code"
                    placeholder="DESCONTO10"
                    {...register("coupon_code")}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (opcional)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="99.90"
                    {...register("price")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Input
                    id="currency"
                    placeholder="BRL"
                    {...register("currency")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o produto, por que você recomenda, dicas de uso..."
                  rows={5}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Máximo 1000 caracteres. Suporta markdown.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>Adicione fotos do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Imagem Principal</Label>
                <Controller
                  name="image_url"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      aspectRatio="square"
                      className="max-w-md"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 800x800px. Máximo 10MB.
                </p>
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
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Revisar Produto</CardTitle>
              <CardDescription>Confira os dados antes de publicar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium">Preview</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <div className="aspect-square bg-secondary">
                      {watchedValues.image_url ? (
                        <img
                          src={watchedValues.image_url}
                          alt={watchedValues.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{watchedValues.title || "Título do produto"}</h3>
                      <p className="text-sm text-muted-foreground">{watchedValues.store}</p>
                      {watchedValues.price && (
                        <p className="font-semibold mt-2">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: watchedValues.currency || "BRL",
                          }).format(watchedValues.price)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                  <h4 className="font-medium">Resumo</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-muted-foreground">Título</dt>
                      <dd className="font-medium">{watchedValues.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Loja</dt>
                      <dd>{watchedValues.store}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Categorias</dt>
                      <dd>{watchedValues.categories?.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Tipo</dt>
                      <dd className="capitalize">{watchedValues.monetization_type}</dd>
                    </div>
                    {watchedValues.affiliate_url && (
                      <div>
                        <dt className="text-sm text-muted-foreground">URL</dt>
                        <dd className="text-sm break-all">{watchedValues.affiliate_url}</dd>
                      </div>
                    )}
                    {watchedValues.coupon_code && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Cupom</dt>
                        <dd className="font-mono">{watchedValues.coupon_code}</dd>
                      </div>
                    )}
                    {watchedValues.description && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Descrição</dt>
                        <dd className="text-sm">{watchedValues.description}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep === STEPS.length ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={createProduct.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Publicando..." : "Publicar Produto"}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </CreatorLayout>
  );
}
