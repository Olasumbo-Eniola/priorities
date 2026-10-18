import { progress, type Task } from "../../task-model";

export function TaskProgress({ task }: { task: Task }) {
  const value = progress(task);
  const completedSteps = task.checklist.filter((item) => item.done).length;
  const tone =
    value === 100 ? "green" : task.blocked || value === 0 ? "red" : "amber";
  const segments = task.checklist.length
    ? task.checklist.map((item, index) => ({
        id: item.id,
        done: index < completedSteps,
      }))
    : [{ id: task.id, done: task.completed }];

  return (
    <div
      className={`segments tone-${tone}`}
      role="progressbar"
      aria-label={
        task.checklist.length
          ? `${completedSteps} of ${task.checklist.length} checklist items completed`
          : "Task completion"
      }
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {segments.map((segment) => (
        <span key={segment.id} className={segment.done ? "filled" : ""} />
      ))}
    </div>
  );
}
