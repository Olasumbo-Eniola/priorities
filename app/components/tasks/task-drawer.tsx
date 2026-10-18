"use client";

import { useEffect, useState } from "react";
import {
  periodKey,
  periods,
  progress,
  withStatus,
  status,
  type Period,
  type Priority,
  type Task,
} from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";
import { AppDrawer, AppDrawerClose } from "../ui/drawer";
import { Select } from "../ui/select";
import { AttachmentsSection } from "./attachments-section";
import { ChecklistSection } from "./checklist-section";
import { CommentsSection } from "./comments-section";
import { TaskProgress } from "./task-progress";
import { StatusSelect } from "./status-select";
import { ReviewHistory } from "../reviews/review-history";
import { LabelPicker } from "./task-labels";
import type { LabelColor, TaskLabel } from "../../label-model";

const priorityOptions = ["urgent", "high", "medium", "low"].map((value) => ({
  value: value as Priority,
  label: value,
}));

export function TaskDrawer({
  task,
  now,
  onUpdate,
  onClose,
  uid,
  labels,
  onRenameLabel,
  onDelete,
  draft = false,
}: {
  task: Task;
  draft?: boolean;
  now: Date;
  onUpdate: (task: Task) => void;
  onClose: (task: Task) => void;
  uid: string;
  labels: TaskLabel[];
  onRenameLabel: (id: LabelColor, name: string) => Promise<void>;
  onDelete: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    if (title === task.title || !title.trim()) return;
    const timer = setTimeout(
      () => onUpdate({ ...task, title: title.trim() }),
      500,
    );
    return () => clearTimeout(timer);
  }, [onUpdate, task, title]);

  const closeDrawer = () => {
    const trimmedTitle = title.trim();
    const nextTask =
      trimmedTitle && trimmedTitle !== task.title
        ? { ...task, title: trimmedTitle }
        : task;
    if (nextTask !== task) onUpdate(nextTask);
    onClose(nextTask);
  };

  return (
    <AppDrawer label={task.title || "New task"} onClose={closeDrawer}>
      <div className="drawer-top">
        <span>
          <Icon name="file" size={16} />
          Task details
        </span>
        <AppDrawerClose>
          <Button variant="icon" aria-label="Close task">
            <Icon name="close" />
          </Button>
        </AppDrawerClose>
      </div>
      <div className="drawer-content">
        <span className={`priority ${task.priority}`}>
          <i />
          {task.priority}
        </span>
        <input
          className="title-input"
          aria-label="Task name"
          autoFocus={draft}
          maxLength={160}
          placeholder="Task title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            const trimmedTitle = title.trim();
            if (trimmedTitle && trimmedTitle !== task.title) {
              onUpdate({ ...task, title: trimmedTitle });
            }
          }}
        />
        <p className={`subtle${draft && !title.trim() ? " title-required" : ""}`}>
          {draft
            ? "Add a title to save this task. Other details are optional."
            : "Edit the name and details below. Changes save automatically."}
        </p>
        <div className="properties">
          <label>
            <span>
              <Icon name="flag" size={16} />
              Priority
            </span>
            <Select
              value={task.priority}
              options={priorityOptions}
              onChange={(event) =>
                onUpdate({
                  ...task,
                  priority: event.target.value as Priority,
                })
              }
            />
          </label>
          <label>
            <span>
              <Icon name="calendar" size={16} />
              Deadline
            </span>
            <input
              type="date"
              value={task.deadline}
              onChange={(event) =>
                onUpdate({ ...task, deadline: event.target.value })
              }
            />
          </label>
          <div>
            <span>
              <Icon name="grid" size={16} />
              Status
            </span>
            <StatusSelect task={task} onUpdate={onUpdate} />
          </div>
        </div>
        <section className="drawer-section">
          <h3>Labels</h3>
          <LabelPicker labels={labels} selected={task.labels ?? []} onRename={onRenameLabel}
            onChange={selected => onUpdate({ ...task, labels: selected })} />
        </section>
        <div className="drawer-progress">
          <span>Overall progress</span>
          <strong>{Math.round(progress(task))}%</strong>
          <TaskProgress task={task} />
        </div>
        <div className="task-actions">
          <Button
            variant="secondary"
            disabled={status(task) === "Completed"}
            onClick={() => onUpdate(withStatus(task, task.blocked ? "In progress" : "Blocked"))}
          >
            {task.blocked ? "Clear blocker" : "Mark blocked"}
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onUpdate(withStatus(task, status(task) === "Completed" ? "In progress" : "Completed"))
            }
          >
            <Icon name="check" size={16} />
            {status(task) === "Completed"
              ? "Reopen task"
              : "Mark complete"}
          </Button>
        </div>
        <section className="drawer-section">
          <h3>Priority placement</h3>
          <div className="placement-row">
            {(Object.keys(periods) as Period[]).map((period) => {
              const hasPlacement = task.placements.some(
                (placement) =>
                  placement.period === period &&
                  placement.date === periodKey(period, now),
              );
              return (
                <label key={period}>
                  <input
                    type="checkbox"
                    checked={hasPlacement}
                    onChange={() =>
                      onUpdate({
                        ...task,
                        placements: hasPlacement
                          ? task.placements.filter(
                              (placement) =>
                                !(
                                  placement.period === period &&
                                  placement.date === periodKey(period, now)
                                ),
                            )
                          : [
                              ...task.placements,
                              {
                                period,
                                date: periodKey(period, now),
                              },
                            ],
                      })
                    }
                  />
                  {periods[period]}
                </label>
              );
            })}
          </div>
        </section>
        <ChecklistSection task={task} onUpdate={onUpdate} />
        <AttachmentsSection task={task} onUpdate={onUpdate} />
        <CommentsSection task={task} onUpdate={onUpdate} />
        {!draft && (
          <>
            <section className="drawer-section"><h3>Past reflections</h3><ReviewHistory uid={uid} taskId={task.id} /></section>
            <section className="drawer-section">
              <Button variant="secondary" className="task-delete" onClick={() => onDelete(task)}><Icon name="trash" size={16} />Delete task</Button>
            </section>
          </>
        )}
      </div>
    </AppDrawer>
  );
}
