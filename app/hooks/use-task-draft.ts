import { useCallback, useRef, useState } from "react";
import type { Task } from "../task-model";

export function useTaskDraft({
  createTask,
  updateTask,
  showToast,
}: {
  createTask: (task: Task) => Promise<boolean>;
  updateTask: (task: Task) => void;
  showToast: (message: string) => void;
}) {
  const [draftTask, setDraftTask] = useState<Task | null>(null);
  const draftRef = useRef<Task | null>(null);
  const creatingIdsRef = useRef(new Set<string>());

  const persistDraft = useCallback(
    async (taskToCreate: Task) => {
      if (creatingIdsRef.current.has(taskToCreate.id)) return;
      creatingIdsRef.current.add(taskToCreate.id);

      const created = await createTask(taskToCreate);
      creatingIdsRef.current.delete(taskToCreate.id);
      if (!created) {
        return;
      }

      const latestDraft = draftRef.current;
      if (latestDraft?.id === taskToCreate.id) {
        draftRef.current = null;
        setDraftTask(null);
        if (latestDraft !== taskToCreate) {
          updateTask({ ...latestDraft, title: latestDraft.title.trim() });
        }
      }
      showToast("Priority created.");
    },
    [createTask, showToast, updateTask],
  );

  const beginDraft = useCallback((task: Task) => {
    draftRef.current = task;
    setDraftTask(task);
  }, []);

  const updateOpenTask = useCallback(
    (nextTask: Task) => {
      if (draftRef.current?.id !== nextTask.id) {
        updateTask(nextTask);
        return;
      }

      draftRef.current = nextTask;
      setDraftTask(nextTask);
      const title = nextTask.title.trim();
      if (title && !creatingIdsRef.current.has(nextTask.id)) {
        void persistDraft({ ...nextTask, title });
      }
    },
    [persistDraft, updateTask],
  );

  const closeDraft = useCallback(
    (closedTask: Task) => {
      if (draftRef.current?.id !== closedTask.id) return;

      const title = closedTask.title.trim();
      if (title) {
        updateOpenTask({ ...closedTask, title });
        return;
      }

      draftRef.current = null;
      setDraftTask(null);
      showToast("Draft discarded — add a title to save a task.");
    },
    [showToast, updateOpenTask],
  );

  return {
    draftTask,
    beginDraft,
    updateOpenTask,
    closeDraft,
  };
}
