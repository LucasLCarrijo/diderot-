import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Pin } from '@/components/posts/PinEditor';

export interface PostDraft {
  imageUrl: string | null;
  title: string;
  content: string;
  pins: Pin[];
  savedAt: string;
}

// Zod schema for validating post drafts
const pinSchema = z.object({
  productId: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string().optional(),
});

const postDraftSchema = z.object({
  imageUrl: z.string().url().nullable(),
  title: z.string().max(100),
  content: z.string().max(2000),
  pins: z.array(pinSchema),
  savedAt: z.string(),
});

const DRAFT_KEY = 'post-draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function usePostDraft() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    setHasDraft(!!draft);
  }, []);

  // Get saved draft with validation
  const getDraft = useCallback((): PostDraft | null => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        
        // Validate with Zod schema
        const validated = postDraftSchema.safeParse(parsed);
        
        if (validated.success) {
          return validated.data as PostDraft;
        } else {
          console.warn('Invalid post draft data, clearing:', validated.error);
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (error) {
      console.error('Error reading draft:', error);
      localStorage.removeItem(DRAFT_KEY);
    }
    return null;
  }, []);

  // Save draft
  const saveDraft = useCallback((data: Omit<PostDraft, 'savedAt'>, showToast = true) => {
    try {
      const draft: PostDraft = {
        ...data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
      setHasDraft(true);
      if (showToast) {
        toast.success('Rascunho salvo', {
          description: `Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Erro ao salvar rascunho');
    }
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  // Setup auto-save
  const setupAutoSave = useCallback((
    getData: () => Omit<PostDraft, 'savedAt'>,
    enabled = true
  ) => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    if (!enabled) return;

    // Setup new timer
    autoSaveTimerRef.current = setInterval(() => {
      const data = getData();
      // Only save if there's something to save
      if (data.imageUrl || data.content || data.pins.length > 0) {
        saveDraft(data, false); // Don't show toast for auto-save
      }
    }, AUTO_SAVE_INTERVAL);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveDraft]);

  // Save on page leave
  const saveOnLeave = useCallback((getData: () => Omit<PostDraft, 'savedAt'>) => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const data = getData();
      if (data.imageUrl || data.content || data.pins.length > 0) {
        saveDraft(data, false);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  return {
    hasDraft,
    lastSaved,
    getDraft,
    saveDraft,
    clearDraft,
    setupAutoSave,
    saveOnLeave,
  };
}
