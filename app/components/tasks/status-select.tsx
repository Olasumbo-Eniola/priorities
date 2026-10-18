import { status, taskStatuses, withStatus, type Task, type TaskStatus } from "../../task-model";
import { Select } from "../ui/select";

export function StatusSelect({ task, onUpdate }: { task: Task; onUpdate: (task: Task) => void }) {
  return <Select aria-label={`Status for ${task.title}`} className="status-select" value={status(task)} options={taskStatuses.map(value => ({ value, label: value }))} onClick={event => event.stopPropagation()} onChange={event => onUpdate(withStatus(task, event.target.value as TaskStatus))} />;
}
