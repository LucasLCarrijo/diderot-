import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreatorLayout } from '@/components/layout/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/posts/PostCard';
import { PostFilters, PostFiltersState } from '@/components/posts/PostFilters';
import { PostLimitBanner } from '@/components/posts/PostLimitBanner';
import { Plus, Image, MapPin, LayoutGrid, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyPosts, useDeletePost, Post, Pin } from '@/hooks/usePosts';
import { useMyProducts } from '@/hooks/useCreatorProducts';

const FREE_POST_LIMIT = 10;
const PRO_POST_LIMIT = 50;

export default function Posts() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useMyPosts();
  const { data: products } = useMyProducts({});
  const deletePost = useDeletePost();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<PostFiltersState>({
    search: '',
    productId: null,
    sortBy: 'recent',
    dateFrom: null,
    dateTo: null,
  });

  // Check for post limits
  const isPro = false; // TODO: Check from subscription
  const postLimit = isPro ? PRO_POST_LIMIT : FREE_POST_LIMIT;
  const todayPostCount = useMemo(() => {
    if (!posts) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return posts.filter(post => new Date(post.created_at) >= today).length;
  }, [posts]);
  const canCreatePost = todayPostCount < postLimit;

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    let result = [...posts];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(post =>
        post.content?.toLowerCase().includes(search) ||
        post.title?.toLowerCase().includes(search)
      );
    }

    // Product filter
    if (filters.productId) {
      result = result.filter(post =>
        post.pins?.some(pin => pin.productId === filters.productId)
      );
    }

    // Date filters
    if (filters.dateFrom) {
      result = result.filter(post =>
        new Date(post.created_at) >= filters.dateFrom!
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(post =>
        new Date(post.created_at) <= endDate
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most_pins':
        result.sort((a, b) => (b.pins?.length || 0) - (a.pins?.length || 0));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [posts, filters]);

  const handleEdit = (postId: string) => {
    navigate(`/creator/posts/${postId}/edit`);
  };

  const handleDelete = async (postId: string) => {
    await deletePost.mutateAsync(postId);
  };

  const totalPins = posts?.reduce((acc, post) => acc + (post.pins?.length || 0), 0) || 0;

  return (
    <CreatorLayout title="Posts">
      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <div className="w-64 shrink-0 hidden lg:block">
          <PostFilters
            filters={filters}
            onFiltersChange={setFilters}
            products={products || []}
            totalResults={filteredPosts.length}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Meus Posts</h1>
              <p className="text-muted-foreground">
                Gerencie seus posts visuais com produtos
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                onClick={() => navigate('/creator/posts/new')}
                disabled={!canCreatePost}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Post
              </Button>
            </div>
          </div>

          {/* Post limit banner */}
          <PostLimitBanner
            currentCount={todayPostCount}
            maxCount={postLimit}
            isPro={isPro}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{posts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Posts criados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPins}</p>
                  <p className="text-sm text-muted-foreground">Produtos marcados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Em breve</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">-</p>
                  <p className="text-sm text-muted-foreground">Visualizações</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Grid/List */}
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
                : 'space-y-4'
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
                : 'space-y-4'
            )}>
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={() => handleEdit(post.id)}
                  onDelete={() => handleDelete(post.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {posts && posts.length > 0 
                    ? 'Nenhum post encontrado'
                    : 'Nenhum post ainda'
                  }
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  {posts && posts.length > 0
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie seu primeiro post visual e marque produtos para seus seguidores descobrirem'
                  }
                </p>
                {(!posts || posts.length === 0) && (
                  <Button onClick={() => navigate('/creator/posts/new')} disabled={!canCreatePost}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
}
