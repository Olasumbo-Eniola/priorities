import {
  inPeriod,
  periods,
  progress,
  status,
  isGeneral,
  withStatus,
  type Period,
  type Task,
} from "../../task-model";
import { StatusSelect } from "./status-select";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";
import { LabelChips } from "./task-labels";
import type { TaskLabel } from "../../label-model";

export function TaskList({
  tasks,
  labels,
  now,
  onOpen,
  onUpdate,
  onAddTask,
  onDelete,
  filter = null,
  general = false,
}: {
  tasks: Task[];
  labels: TaskLabel[];
  now: Date;
  onOpen: (id: string) => void;
  onUpdate: (task: Task) => void;
  onAddTask: (period: Period) => void;
  onDelete: (task: Task) => void;
  filter?: Period | null;
  general?: boolean;
}) {
  return (
    <div className="period-list">
      {(general ? ["day" as Period] : filter ? [filter] : Object.keys(periods) as Period[]).map((period) => {
        const items = tasks.filter((task) => general ? isGeneral(task, now) : inPeriod(task, period, now));
        return (
          <details className="period-list-group" key={period} open>
            <summary>
              <span className={`period-list-label period-list-${period}`}>
                <span aria-hidden="true" />
                {general ? "General" : periods[period]}
              </span>
              <span className="period-list-count">{items.length}</span>
              <span className="period-list-chevron" aria-hidden="true">
                <Icon name="chevron" size={16} />
              </span>
              <Button
                variant="icon"
                className="period-list-add"
                aria-label={`Add task to ${general ? "General" : periods[period]}`}
                title={`Add task to ${general ? "General" : periods[period]}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAddTask(period);
                }}
              >
                <Icon name="plus" size={18} />
              </Button>
            </summary>
            <div
              className="period-list-scroll"
              tabIndex={0}
              role="region"
              aria-label={`${periods[period]} tasks`}
            >
              <table className="period-list-table">
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Task name</th>
                    <th scope="col">Labels</th>
                    <th scope="col">Checklist</th>
                    <th scope="col">Progress</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((task) => {
                    const isComplete = status(task) === "Completed";
                    return (
                      <tr className={`priority-row priority-row-${task.priority}`} title={`${task.priority} priority`} key={task.id} onClick={() => onOpen(task.id)}>
                        <td>
                          <div className="list-task-name">
                          <input type="checkbox" checked={isComplete} aria-label={`Complete ${task.title}`} onClick={event => event.stopPropagation()} onChange={event => onUpdate(withStatus(task, event.target.checked ? "Completed" : "In progress"))} />
                          <button
                            className="period-list-task"
                            aria-label={`${task.title}, ${task.priority} priority`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpen(task.id);
                            }}
                          >
                            <span>{task.title}</span>
                          </button>
                          </div>
                        </td>
                        <td>
                          <LabelChips selected={task.labels ?? []} labels={labels} />
                        </td>
                        <td>
                          <span className="period-list-checklist">
                            {task.checklist.filter(item => item.done).length}/{task.checklist.length}
                          </span>
                        </td>
                        <td>
                          <span className="period-list-progress">
                            {Math.round(progress(task))}%
                          </span>
                        </td>
                        <td>
                          <span className="period-list-deadline">
                            {task.deadline
                              ? new Date(
                                  `${task.deadline}T12:00:00`,
                                ).toLocaleDateString("en", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "No deadline"}
                          </span>
                        </td>
                        <td><StatusSelect task={task} onUpdate={onUpdate} /></td>
                        <td><div className="task-row-actions">
                          <Button variant="icon" className="task-delete" title="Delete task" aria-label={`Delete ${task.title}`} onClick={event => { event.stopPropagation(); onDelete(task); }}><Icon name="trash" size={16} /></Button>
                        </div></td>
                      </tr>
                    );
                  })}
                  {!items.length && (
                    <tr>
                      <td colSpan={7} className="period-list-empty">
                        No priorities in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
}
