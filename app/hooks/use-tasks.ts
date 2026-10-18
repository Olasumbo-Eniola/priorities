import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createTask as createTaskRecord,
  persistTaskChange,
  setTaskDeleted,
  subscribeTaskDetails,
  subscribeTasks,
} from "../firebase-data";
import type { Task } from "../task-model";

export function useTasks(
  uid: string,
  selectedTaskId: string | null,
  reportDataError: (message: string) => void,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const detailedTasks = useRef(new Set<string>());
  const deletingIdsRef = useRef(new Set<string>());

  useEffect(
    () =>
      subscribeTasks(
        uid,
        (nextTasks) => {
          setTasks((current) => {
            const existing = new Map(current.map((task) => [task.id, task]));
            const mergedTasks = nextTasks.map((task) => {
              const previous = existing.get(task.id);
              if (!previous) return task;
              return {
                ...task,
                attachments: previous.attachments,
                ...(detailedTasks.current.has(task.id)
                  ? {
                      checklist: previous.checklist,
                      comments: previous.comments,
                    }
                  : {}),
              };
            });
            tasksRef.current = mergedTasks;
            return mergedTasks;
          });
          setLoaded(true);
          reportDataError("");
        },
        () => {
          setLoaded(true);
          reportDataError(
            "We couldn’t reach your saved priorities. Check that Firestore is created and its rules are deployed.",
          );
        },
      ),
    [reportDataError, uid],
  );

  useEffect(() => {
    if (!selectedTaskId) return;
    return subscribeTaskDetails(
      uid,
      selectedTaskId,
      (details) => {
        detailedTasks.current.add(selectedTaskId);
        setTasks((current) => {
          const mergedTasks = current.map((task) =>
            task.id === selectedTaskId
              ? {
                  ...task,
                  ...details,
                  attachments: details.attachments
                    ? [
                        ...task.attachments.filter(
                          (item) => item.kind !== "link",
                        ),
                        ...details.attachments,
                      ]
                    : task.attachments,
                }
              : task,
          );
          tasksRef.current = mergedTasks;
          return mergedTasks;
        });
      },
      () =>
        reportDataError(
          "The task details couldn’t be loaded. Check your Firestore connection and try again.",
        ),
    );
  }, [reportDataError, selectedTaskId, uid]);

  const updateTask = useCallback(
    (nextTask: Task) => {
      const previous = tasksRef.current.find(
        (task) => task.id === nextTask.id,
      );
      const nextTasks = tasksRef.current.map((task) =>
        task.id === nextTask.id ? nextTask : task,
      );
      tasksRef.current = nextTasks;
      setTasks(nextTasks);
      if (previous) {
        void persistTaskChange(uid, previous, nextTask).catch(() =>
          reportDataError(
            "That change wasn’t saved. Your edit is still visible so you can try again.",
          ),
        );
      }
    },
    [reportDataError, uid],
  );

  const createTask = useCallback(
    async (task: Task) => {
      const previousTasks = tasksRef.current;
      const optimisticTasks = [
        task,
        ...previousTasks.filter((item) => item.id !== task.id),
      ];
      tasksRef.current = optimisticTasks;
      setTasks(optimisticTasks);
      try {
        await createTaskRecord(uid, task);
        return true;
      } catch {
        const rolledBackTasks = tasksRef.current.filter(
          (item) => item.id !== task.id,
        );
        tasksRef.current = rolledBackTasks;
        setTasks(rolledBackTasks);
        reportDataError(
          "The task couldn’t be created. Check your Firestore connection and try again.",
        );
        return false;
      }
    },
    [reportDataError, uid],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      if (deletingIdsRef.current.has(task.id)) return false;
      deletingIdsRef.current.add(task.id);
      setDeletingIds((current) => [...current, task.id]);
      try {
        await setTaskDeleted(uid, task.id, true);
        setDeletedTasks((current) => [
          ...current.filter((item) => item.id !== task.id),
          task,
        ]);
        return true;
      } catch {
        reportDataError("The task couldn’t be deleted. Please try again.");
        return false;
      } finally {
        deletingIdsRef.current.delete(task.id);
        setDeletingIds((current) =>
          current.filter((taskId) => taskId !== task.id),
        );
      }
    },
    [reportDataError, uid],
  );

  const restoreTask = useCallback(
    async (task: Task) => {
      try {
        await setTaskDeleted(uid, task.id, false);
        setDeletedTasks((current) =>
          current.filter((item) => item.id !== task.id),
        );
      } catch {
        reportDataError("The task couldn’t be restored. Please try again.");
      }
    },
    [reportDataError, uid],
  );

  const dismissDeletedTask = useCallback((taskId: string) => {
    setDeletedTasks((current) =>
      current.filter((item) => item.id !== taskId),
    );
  }, []);

  return {
    tasks,
    loaded,
    updateTask,
    createTask,
    deleteTask,
    restoreTask,
    deletedTasks,
    deletingIds,
    dismissDeletedTask,
  };
}
