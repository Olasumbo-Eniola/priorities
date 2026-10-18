import type { TaskLabel } from "../../label-model";
import {
  inPeriod,
  isGeneral,
  periods,
  type Period,
  type Task,
} from "../../task-model";
import { TaskCard } from "./task-card";
import "../../styles/card-groups.css";

export function TaskCardGroups({
  tasks,
  labels,
  now,
  onOpen,
  filter = null,
  general = false,
}: {
  tasks: Task[];
  labels: TaskLabel[];
  now: Date;
  onOpen: (id: string) => void;
  filter?: Period | null;
  general?: boolean;
}) {
  const groupPeriods: Period[] = general
    ? ["day"]
    : filter
      ? [filter]
      : (Object.keys(periods) as Period[]);

  return (
    <div className="period-card-groups">
      {groupPeriods.map((period) => {
        const items = tasks.filter((task) =>
          general ? isGeneral(task, now) : inPeriod(task, period, now),
        );
        const groupName = general ? "General" : periods[period];

        return (
          <section className="period-card-section" key={period}>
            <h3 className={`period-list-label period-list-${period}`}>
              <span aria-hidden="true" />
              {groupName}
            </h3>
            <div className="task-grid">
              {items.map((task) => (
                <TaskCard
                  labels={labels}
                  key={task.id}
                  task={task}
                  now={now}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
