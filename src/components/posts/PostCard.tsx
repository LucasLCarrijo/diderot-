import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreVertical, 
  Edit, 
  Eye, 
  Trash2, 
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, Pin } from '@/hooks/usePosts';

interface PostCardProps {
  post: Post & { pins?: Pin[] };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  const pinCount = post.pins?.length || 0;
  const truncatedContent = post.content 
    ? post.content.length > 100 
      ? post.content.slice(0, 100) + '...' 
      : post.content
    : null;

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={post.image_url}
            alt={post.title || 'Post'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Pin indicators */}
          {post.pins && post.pins.length > 0 && (
            <>
              {post.pins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="absolute w-5 h-5 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center text-[10px] font-bold transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pin.x * 100}%`,
                    top: `${pin.y * 100}%`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </>
          )}

          {/* Pin count badge */}
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 left-2 gap-1"
          >
            <MapPin className="w-3 h-3" />
            {pinCount} {pinCount === 1 ? 'produto' : 'produtos'}
          </Badge>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/posts/${post.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver post
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/posts/${post.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir em nova aba
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <CardContent className="p-3">
          {post.title && (
            <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
          )}
          {truncatedContent && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {truncatedContent}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(post.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
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
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
