import {
  dateKey,
  dueLabel,
  progress,
  status,
  type Task,
} from "../../task-model";
import { Icon } from "../ui/app-icon";
import { TaskProgress } from "./task-progress";
import { LabelChips } from "./task-labels";
import type { TaskLabel } from "../../label-model";

export function TaskCard({
  task,
  labels,
  now,
  onOpen,
}: {
  task: Task;
  labels: TaskLabel[];
  now: Date;
  onOpen: (id: string) => void;
}) {
  const taskProgress = progress(task);
  const taskStatus = status(task);

  return (
    <button
      className={`task-card ${taskStatus === "Completed" ? "complete-card" : ""}`}
      aria-label={`Open ${task.title}`}
      onClick={() => onOpen(task.id)}
    >
      <div className="card-top">
        <span className={`priority ${task.priority}`}>
          <i />
          {task.priority}
        </span>
      </div>
      <h3>{task.title}</h3>
      {!!task.labels?.length && <LabelChips selected={task.labels} labels={labels} />}
      <div className="card-status">
        <span
          className={`status ${taskStatus.toLowerCase().replaceAll(" ", "-")}`}
        >
          <i />
          {taskStatus}
        </span>
        {task.deadline &&
          task.deadline < dateKey(now) &&
          taskStatus !== "Completed" && <span className="overdue">Overdue</span>}
      </div>
      <div className="card-progress">
        <span>Progress</span>
        <strong>{Math.round(taskProgress)}%</strong>
      </div>
      <TaskProgress task={task} />
      <footer>
        <span>
          <Icon name="calendar" size={14} />
          {dueLabel(task, now)}
        </span>
        <div>
          {task.checklist.length > 0 && (
            <span>
              <Icon name="check" size={14} />
              {task.checklist.filter((item) => item.done).length}/
              {task.checklist.length}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span>
              <Icon name="clip" size={14} />
              {task.attachments.length}
            </span>
          )}
          {task.comments.length > 0 && (
            <span>
              <Icon name="chat" size={14} />
              {task.comments.length}
            </span>
          )}
        </div>
      </footer>
    </button>
  );
}
