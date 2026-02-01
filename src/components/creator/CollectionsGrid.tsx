import { CollectionCard } from "./CollectionCard";

interface Collection {
  id: string;
  name: string;
  thumbnail_url?: string | null;
  updated_at: string;
  product_count?: number;
}

interface CollectionsGridProps {
  collections: Collection[];
}

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 className="text-lg font-sans font-medium mb-1">Nenhuma coleção criada</h3>
        <p className="text-muted-foreground text-sm">Este creator ainda não organizou produtos em coleções.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
