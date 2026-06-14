import { useEffect, useRef } from 'react';
import { useFocus, useFocusActions } from '@/stores/use-focus-store';
import { useActivityActions } from '@/stores/use-activity-store';
import { useToast } from '@/stores/use-toast-store';
import { useTaskStore } from '@/stores/use-task-store';

export function useSessionContinuity() {
  const { dailyAnchor, anchorCompleted, deepWorkMode, activeTaskId } = useFocus();
  const { checkNewDay, resetDaily, setDeepWorkMode } = useFocusActions();
  const tasks = useTaskStore((state) => state.tasks);
  const { logActivity } = useActivityActions();
  const addToast = useToast();
  const hasAnnouncedResume = useRef(false);

  useEffect(() => {
    const isNewDay = checkNewDay();

    if (isNewDay) {
      hasAnnouncedResume.current = false;

      if (dailyAnchor) {
        logActivity(
          'mindset_reflection',
          `Yesterday's anchor — "${dailyAnchor}" — was ${anchorCompleted ? 'complete' : 'left open'}.`,
          { type: 'daily_summary', anchor: dailyAnchor, completed: anchorCompleted }
        );

        addToast(
          anchorCompleted
            ? "Yesterday's anchor was complete. A fresh day."
            : "A new day — your anchor is clear.",
          "info"
        );
      }
      
      resetDaily();
      setDeepWorkMode(false);
    } else if (!hasAnnouncedResume.current) {
      if (deepWorkMode) {
        addToast("Deep work is still running.", "info");
        hasAnnouncedResume.current = true;
      } else if (activeTaskId) {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask && !activeTask.completed) {
          addToast(`Back to: ${activeTask.title}`, "info");
          hasAnnouncedResume.current = true;
        }
      }
    }
  }, [
    activeTaskId, 
    addToast, 
    anchorCompleted, 
    checkNewDay, 
    dailyAnchor, 
    deepWorkMode, 
    logActivity, 
    resetDaily, 
    setDeepWorkMode, 
    tasks
  ]); 
}
