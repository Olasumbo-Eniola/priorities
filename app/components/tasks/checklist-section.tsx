"use client";

import { useState } from "react";
import type { Task } from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";
import { InlineText } from "../ui/inline-text";
import "../../styles/checklist.css";

export function ChecklistSection({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: (task: Task) => void;
}) {
  const [step, setStep] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className="drawer-section">
      <h3>
        Checklist{" "}
        <span>
          {task.checklist.filter((item) => item.done).length}/
          {task.checklist.length}
        </span>
      </h3>
      {task.checklist.map((item) => (
        <div className="checklist-item" key={item.id}>
          <div className="checklist-item-heading">
            <input
              type="checkbox"
              aria-label={`Complete ${item.title}`}
              checked={item.done}
              onChange={() =>
                onUpdate({
                  ...task,
                  checklist: task.checklist.map((candidate) =>
                    candidate.id === item.id
                      ? { ...candidate, done: !candidate.done }
                      : candidate,
                  ),
                })
              }
            />
          <InlineText className={`checklist-title${item.done ? " checked" : ""}`} value={item.title}
            editing={editing === item.id} label="Checklist item title" maxLength={300} onEnd={() => setEditing(null)}
            onSave={title => onUpdate({ ...task, checklist: task.checklist.map(candidate => candidate.id === item.id ? { ...candidate, title } : candidate) })} />
          <div className="checklist-item-actions">
            <Button variant="icon" aria-label={`Edit checklist item ${item.title}`} title="Edit checklist item" onClick={() => setEditing(item.id)}><Icon name="pencil" size={15} /></Button>
            <Button variant="icon" className="task-delete" aria-label={`Delete checklist item ${item.title}`} title="Delete checklist item" onClick={() => {
              onUpdate({ ...task, checklist: task.checklist.filter(candidate => candidate.id !== item.id) });
              if (editing === item.id) setEditing(null);
            }}><Icon name="trash" size={15} /></Button>
          </div>
          </div>
          <details>
            <summary>{item.note ? "View note" : "Add a note"}</summary>
            <textarea
              aria-label={`Note for ${item.title}`}
              rows={2}
              maxLength={2000}
              value={item.note}
              onChange={(event) =>
                onUpdate({
                  ...task,
                  checklist: task.checklist.map((candidate) =>
                    candidate.id === item.id
                      ? { ...candidate, note: event.target.value }
                      : candidate,
                  ),
                })
              }
            />
          </details>
        </div>
      ))}
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!step.trim()) return;
          onUpdate({
            ...task,
            checklist: [
              ...task.checklist,
              {
                id: crypto.randomUUID(),
                title: step.trim(),
                note: "",
                done: false,
              },
            ],
          });
          setStep("");
        }}
      >
        <input
          aria-label="New checklist item"
          maxLength={300}
          placeholder="Add a checklist item…"
          value={step}
          onChange={(event) => setStep(event.target.value)}
        />
        <Button
          variant="icon"
          type="submit"
          aria-label="Add checklist item"
        >
          <Icon name="plus" />
        </Button>
      </form>
    </section>
  );
}
