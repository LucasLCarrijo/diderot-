import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  title: string;
  image_url?: string | null;
  affiliate_url: string;
  price?: number | null;
  currency?: string;
  categories?: string[];
  slug?: string | null;
}

interface ProductsGridProps {
  products: Product[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-sans font-medium mb-1">Nenhum produto ainda</h3>
        <p className="text-muted-foreground text-sm">Este creator ainda não adicionou produtos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
