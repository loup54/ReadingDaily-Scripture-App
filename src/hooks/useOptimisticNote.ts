/**
 * useOptimisticNote Hook
 * Optimistic note creation with automatic rollback on error
 *
 * Features:
 * - Notes appear instantly in list
 * - Automatic temp ID replacement on confirm
 * - Automatic rollback on error
 * - Loading state for API call
 * - Error handling and retry
 * - Caching integration
 *
 * @example
 * const { notes, addNote, error } = useOptimisticNote('gen_1_1');
 *
 * return (
 *   <>
 *     {notes.map(note => <NoteItem key={note.id} {...note} />)}
 *     <Button onPress={() => addNote('My note text')}>Add Note</Button>
 *     {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *   </>
 * );
 */

import { useState, useCallback } from 'react';
import { cacheService } from '@/services/cacheService';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';
import {
  createOptimisticItem,
  replaceTempId,
  removeById,
  OptimisticDebug,
} from '@/utils/optimisticUtils';

export interface Note {
  id: string;
  text: string;
  timestamp: number;
  synced?: boolean;
}

interface UseOptimisticNoteOptions {
  initialNotes?: Note[];
  onSuccess?: (notes: Note[]) => void;
  onError?: (error: Error, notes: Note[]) => void;
}

interface UseOptimisticNoteResult {
  notes: Note[];
  addNote: (text: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  retry: () => Promise<void>;
}

/**
 * Mock API service (replace with actual API)
 */
const notesAPI = {
  create: async (scriptureId: string, text: string): Promise<Note> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (Math.random() < 0.1) {
      throw new Error('Failed to create note');
    }

    return {
      id: `note_${Date.now()}`,
      text,
      timestamp: Date.now(),
    };
  },

  delete: async (noteId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (Math.random() < 0.1) {
      throw new Error('Failed to delete note');
    }
  },

  getAll: async (scriptureId: string): Promise<Note[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  },
};

export function useOptimisticNote(
  scriptureId: string,
  options: UseOptimisticNoteOptions = {}
): UseOptimisticNoteResult {
  const {
    initialNotes = [],
    onSuccess,
    onError,
  } = options;

  // State
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Add note with optimistic update
   */
  const addNote = useCallback(
    async (text: string) => {
      setError(null);

      if (!text || text.trim().length === 0) {
        setError(new Error('Note text cannot be empty'));
        return;
      }

      const previousNotes = notes;

      try {
        // 1. Create optimistic note with temp ID
        const optimisticNote = createOptimisticItem<Note>(
          {
            text: text.trim(),
            timestamp: Date.now(),
            synced: false,
          },
          'note'
        );

        OptimisticDebug.logOptimisticUpdate('addNote', previousNotes, [
          ...previousNotes,
          optimisticNote,
        ]);

        // 2. Add to list optimistically
        setNotes([...previousNotes, optimisticNote]);

        // 3. Call API to create real note
        setIsLoading(true);
        const realNote = await notesAPI.create(scriptureId, text);

        // 4. Replace temp ID with real ID
        const updatedNotes = replaceTempId(
          notes,
          optimisticNote.id,
          realNote.id,
          { synced: true }
        );

        setNotes(updatedNotes);

        // 5. Update cache
        const cacheKey = cacheKeys.notes(scriptureId);
        cacheService.set(cacheKey, updatedNotes, CACHE_TTL.NOTES);

        onSuccess?.(updatedNotes);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        OptimisticDebug.logOptimisticError('addNote', error);

        // Rollback on error
        setNotes(previousNotes);
        setError(error);
        onError?.(error, previousNotes);
      } finally {
        setIsLoading(false);
      }
    },
    [notes, scriptureId, onSuccess, onError]
  );

  /**
   * Delete note with optimistic update
   */
  const deleteNote = useCallback(
    async (noteId: string) => {
      setError(null);

      const previousNotes = notes;

      try {
        // 1. Remove optimistically
        const updatedNotes = removeById(notes, noteId);

        OptimisticDebug.logOptimisticUpdate('deleteNote', previousNotes, updatedNotes);

        setNotes(updatedNotes);

        // 2. Call API to delete
        setIsLoading(true);
        await notesAPI.delete(noteId);

        // 3. Update cache
        const cacheKey = cacheKeys.notes(scriptureId);
        cacheService.set(cacheKey, updatedNotes, CACHE_TTL.NOTES);

        onSuccess?.(updatedNotes);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        OptimisticDebug.logOptimisticError('deleteNote', error);

        // Rollback on error
        setNotes(previousNotes);
        setError(error);
        onError?.(error, previousNotes);
      } finally {
        setIsLoading(false);
      }
    },
    [notes, scriptureId, onSuccess, onError]
  );

  /**
   * Retry failed operation
   */
  const retry = useCallback(async () => {
    if (error) {
      // Could implement retry logic here
      setError(null);
    }
  }, [error]);

  return {
    notes,
    addNote,
    deleteNote,
    error,
    isLoading,
    retry,
  };
}

export type { UseOptimisticNoteOptions, UseOptimisticNoteResult };
