import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Eye, MousePointerClick, ExternalLink, Lock, Globe, Star,
  FolderOpen, User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CollectionData {
  id: string;
  name: string;
  thumbnail_url: string;
  description?: string;
  creator: {
    name: string;
    username: string;
    avatar: string;
    type: "creator" | "follower";
  };
  products: Array<{
    id: string;
    title: string;
    image_url: string;
    clicks: number;
  }>;
  is_public: boolean;
  views: number;
  is_featured: boolean;
  created_at: string;
}

interface CollectionPreviewModalProps {
  collection: CollectionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFeatured?: (id: string, featured: boolean) => void;
}

export function CollectionPreviewModal({ collection, open, onOpenChange, onToggleFeatured }: CollectionPreviewModalProps) {
  if (!collection) return null;

  // Mock data for views over time
  const viewsOverTime = [
    { date: "Sem 1", views: Math.floor(Math.random() * 200) + 50 },
    { date: "Sem 2", views: Math.floor(Math.random() * 200) + 50 },
    { date: "Sem 3", views: Math.floor(Math.random() * 200) + 50 },
    { date: "Sem 4", views: Math.floor(Math.random() * 200) + 50 },
  ];

  const totalClicks = collection.products.reduce((sum, p) => sum + p.clicks, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5" />
            {collection.name}
            {collection.is_featured && (
              <Badge className="bg-amber-500/10 text-amber-500 border-0">
                <Star className="h-3 w-3 mr-1" />
                Destacada
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <img 
              src={collection.thumbnail_url} 
              alt="" 
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={collection.creator.avatar} />
                  <AvatarFallback>{collection.creator.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{collection.creator.name}</p>
                  <p className="text-xs text-muted-foreground">@{collection.creator.username}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {collection.creator.type === "creator" ? (
                    <>
                      <Star className="h-3 w-3 mr-1" />
                      Creator
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Follower
                    </>
                  )}
                </Badge>
              </div>
              
              {collection.description && (
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              )}

              <div className="flex items-center gap-4 mt-3">
                <Badge variant={collection.is_public ? "secondary" : "outline"}>
                  {collection.is_public ? (
                    <><Globe className="h-3 w-3 mr-1" /> Pública</>
                  ) : (
                    <><Lock className="h-3 w-3 mr-1" /> Privada</>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Criada em {format(new Date(collection.created_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{collection.products.length}</p>
                <p className="text-sm text-muted-foreground">Produtos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{collection.views.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MousePointerClick className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Clicks nos Produtos</p>
              </CardContent>
            </Card>
          </div>

          {/* Views Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Views ao longo do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div>
            <h4 className="font-medium mb-3">Produtos da Coleção</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {collection.products.map((product) => (
                <div key={product.id} className="group relative">
                  <img 
                    src={product.image_url} 
                    alt="" 
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-2">
                    <div className="text-white text-xs">
                      <p className="font-medium truncate">{product.title}</p>
                      <p className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {product.clicks} clicks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch 
                id="featured"
                checked={collection.is_featured}
                onCheckedChange={(checked) => onToggleFeatured?.(collection.id, checked)}
              />
              <Label htmlFor="featured" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Destacar na Homepage
              </Label>
            </div>

            <Button variant="outline" asChild>
              <a href={`/c/${collection.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Site
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
