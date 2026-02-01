import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product, ProductFormData } from "@/hooks/useCreatorProducts";

const productSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  affiliate_url: z.string().url("URL de afiliado inválida"),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().default("BRL"),
  categories: z.string().optional(),
  is_published: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

export function ProductForm({ open, onOpenChange, product, onSubmit, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          title: product.title,
          description: product.description || "",
          image_url: product.image_url || "",
          affiliate_url: product.affiliate_url,
          price: product.price || undefined,
          currency: product.currency || "BRL",
          categories: product.categories?.join(", ") || "",
          is_published: product.is_published ?? true,
        }
      : {
          title: "",
          description: "",
          image_url: "",
          affiliate_url: "",
          currency: "BRL",
          is_published: true,
        },
  });

  const isPublished = watch("is_published");

  const handleFormSubmit = (values: ProductFormValues) => {
    const formData: ProductFormData = {
      title: values.title,
      description: values.description || undefined,
      image_url: values.image_url || undefined,
      affiliate_url: values.affiliate_url,
      price: values.price,
      currency: values.currency,
      categories: values.categories
        ? values.categories.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined,
      is_published: values.is_published,
    };
    onSubmit(formData);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nome do produto"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate_url">Link de Afiliado *</Label>
            <Input
              id="affiliate_url"
              placeholder="https://..."
              {...register("affiliate_url")}
            />
            {errors.affiliate_url && (
              <p className="text-sm text-destructive">{errors.affiliate_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL da Imagem</Label>
            <Input
              id="image_url"
              placeholder="https://..."
              {...register("image_url")}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
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
            <Label htmlFor="categories">Categorias</Label>
            <Input
              id="categories"
              placeholder="Moda, Acessórios, Beleza"
              {...register("categories")}
            />
            <p className="text-xs text-muted-foreground">
              Separe as categorias por vírgula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do produto..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_published">Publicado</Label>
              <p className="text-xs text-muted-foreground">
                Produtos publicados aparecem no seu perfil
              </p>
            </div>
            <Switch
              id="is_published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("is_published", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : product ? "Salvar" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
