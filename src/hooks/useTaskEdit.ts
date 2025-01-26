import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Todo } from '../types';

interface SaveResult {
  success: boolean;
  data?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

export function useTaskEdit(selectedTask: Todo | null) {
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setEditedDescription(selectedTask.description || "");
      setError(null);
    }
  }, [selectedTask]);

  const saveDescription = async (taskId: string): Promise<SaveResult> => {
    setIsSaving(true);
    setError(null);

    try {
      console.log('Saving description:', { taskId, description: editedDescription });
      
      const { data, error: updateError } = await supabase
        .from('aiswsc_tasks')
        .update({
          description: editedDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating task:', updateError);
        throw updateError;
      }

      console.log('Description saved successfully:', data);
      return { success: true, data: editedDescription };
    } catch (err) {
      console.error('Save error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save description';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<DeleteResult> => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('aiswsc_tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('Error deleting task:', deleteError);
        throw deleteError;
      }

      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    editedDescription,
    setEditedDescription,
    isSaving,
    error,
    saveDescription,
    deleteTask,
    hasChanges: selectedTask ? editedDescription !== selectedTask.description : false
  };
}
