import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Pin {
  id: string;
  x: number;
  y: number;
  productId: string;
  label?: string;
  product?: {
    id: string;
    title: string;
    image_url: string | null;
    price: number | null;
    currency: string | null;
    slug: string | null;
    store: string | null;
  };
}

export interface Post {
  id: string;
  creator_id: string;
  image_url: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  pins?: Pin[];
}

export interface PostWithCreator extends Post {
  creator: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
}

export interface PostFormData {
  image_url: string;
  title?: string;
  content?: string;
  pins: Omit<Pin, 'id' | 'product'>[];
}

// Helper to get profile ID
async function getProfileId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id || null;
}

// Fetch my posts
export function useMyPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const profileId = await getProfileId(user.id);
      if (!profileId) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_products (
            id,
            x,
            y,
            label,
            product_id,
            products (
              id,
              title,
              image_url,
              price,
              currency,
              slug,
              store
            )
          )
        `)
        .eq('creator_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform post_products to pins format
      return posts.map(post => ({
        ...post,
        pins: post.post_products?.map((pp: any) => ({
          id: pp.id,
          x: pp.x || 0.5,
          y: pp.y || 0.5,
          label: pp.label,
          productId: pp.product_id,
          product: pp.products
        })) || []
      }));
    },
    enabled: !!user?.id,
  });
}

// Fetch single post by ID
export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_creator_id_fkey (
            id,
            name,
            username,
            avatar_url,
            is_verified
          ),
          post_products (
            id,
            x,
            y,
            label,
            product_id,
            products (
              id,
              title,
              image_url,
              price,
              currency,
              slug,
              store,
              affiliate_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        creator: data.profiles,
        pins: data.post_products?.map((pp: any) => ({
          id: pp.id,
          x: pp.x || 0.5,
          y: pp.y || 0.5,
          label: pp.label,
          productId: pp.product_id,
          product: pp.products
        })) || []
      } as PostWithCreator;
    },
    enabled: !!id,
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: PostFormData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const profileId = await getProfileId(user.id);
      if (!profileId) throw new Error('Profile not found');

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          creator_id: profileId,
          image_url: data.image_url,
          title: data.title || null,
          content: data.content || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create pins (post_products)
      if (data.pins.length > 0) {
        const pinsData = data.pins.map(pin => ({
          post_id: post.id,
          product_id: pin.productId,
          x: pin.x,
          y: pin.y,
          label: pin.label || null,
        }));

        const { error: pinsError } = await supabase
          .from('post_products')
          .insert(pinsData);

        if (pinsError) throw pinsError;
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      toast.success('Post criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error('Erro ao criar post');
    },
  });
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PostFormData }) => {
      // Update post
      const { error: postError } = await supabase
        .from('posts')
        .update({
          image_url: data.image_url,
          title: data.title || null,
          content: data.content || null,
        })
        .eq('id', id);

      if (postError) throw postError;

      // Delete existing pins
      const { error: deleteError } = await supabase
        .from('post_products')
        .delete()
        .eq('post_id', id);

      if (deleteError) throw deleteError;

      // Create new pins
      if (data.pins.length > 0) {
        const pinsData = data.pins.map(pin => ({
          post_id: id,
          product_id: pin.productId,
          x: pin.x,
          y: pin.y,
          label: pin.label || null,
        }));

        const { error: pinsError } = await supabase
          .from('post_products')
          .insert(pinsData);

        if (pinsError) throw pinsError;
      }

      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      toast.success('Post atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating post:', error);
      toast.error('Erro ao atualizar post');
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete pins first (cascade should handle this, but being explicit)
      await supabase
        .from('post_products')
        .delete()
        .eq('post_id', id);

      // Delete post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      toast.success('Post deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      toast.error('Erro ao deletar post');
    },
  });
}
