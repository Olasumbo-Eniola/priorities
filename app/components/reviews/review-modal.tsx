"use client";

import { useState } from "react";
import {
  dateKey,
  progress,
  type ReviewNote,
  type ReviewNotes,
  type Task,
} from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";
import { Modal } from "../ui/modal";

export function ReviewModal({
  tasks,
  notes,
  now,
  completing = false,
  error,
  onReflectionChange,
  onNoteChange,
  onComplete,
  onClose,
}: {
  tasks: Task[];
  notes: ReviewNotes;
  now: Date;
  completing?: boolean;
  error?: string;
  onReflectionChange: (value: ReviewNote) => void;
  onNoteChange: (task: Task, value: ReviewNote) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const reviewDate = dateKey(now);
  const [step, setStep] = useState<"day" | "tasks">("day");
  const reflection = notes[`${reviewDate}-overall`] ?? { done: "", blocker: "" };

  return (
    <Modal label="Review today" onClose={onClose}>
      <div className="modal-header">
        <div>
          <p className="eyebrow">{step === "day" ? "Step 1 of 2 · Your day" : "Step 2 of 2 · Your tasks"}</p>
          <h2>{step === "day" ? "How did today go?" : "Let’s reflect on your tasks"}</h2>
          <p>{step === "day" ? "Take a moment to reflect beyond your checklist." : "Notice your progress, even the small things."}</p>
        </div>
        <Button variant="icon" aria-label="Close review" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </div>
      <div className="review-items">
        {step === "day" ? <section>
          <label>How did today feel? What went well or felt difficult?
            <textarea rows={5} maxLength={5000} disabled={completing} value={reflection.done}
              onChange={event => onReflectionChange({ ...reflection, done: event.target.value })}
              placeholder="There’s more to your day than what you checked off…" />
          </label>
          <label>What would you like to carry into tomorrow?
            <textarea rows={3} maxLength={5000} disabled={completing} value={reflection.blocker}
              onChange={event => onReflectionChange({ ...reflection, blocker: event.target.value })}
              placeholder="A lesson, a small change, or something to make room for…" />
          </label>
        </section> : tasks.map((task) => {
          const key = `${reviewDate}-${task.id}`;
          const note = notes[key] ?? { done: "", blocker: "" };
          return (
            <section key={task.id}>
              <h3>
                {task.title}
                <span>{Math.round(progress(task))}%</span>
              </h3>
              <label>
                What moved forward?
                <textarea
                  rows={2}
                  maxLength={2000}
                  disabled={completing}
                  value={note.done}
                  onChange={(event) =>
                    onNoteChange(task, { ...note, done: event.target.value })
                  }
                  placeholder="What did you get done?"
                />
              </label>
              <label>
                Any blockers?
                <textarea
                  rows={2}
                  maxLength={2000}
                  disabled={completing}
                  value={note.blocker}
                  onChange={(event) =>
                    onNoteChange(task, { ...note, blocker: event.target.value })
                  }
                  placeholder="What got in the way?"
                />
              </label>
            </section>
          );
        })}
        {step === "tasks" && !tasks.length && <p>No tasks to review today. You can still save your daily reflection.</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          Finish later
        </Button>
        {step === "tasks" && <Button variant="secondary" disabled={completing} onClick={() => setStep("day")}>Back</Button>}
        {step === "day" ? <Button variant="primary" onClick={() => setStep("tasks")}>Next: your tasks</Button> : <Button variant="primary" onClick={onComplete} disabled={completing}>
          {completing ? "Saving review…" : "Complete review"}
          <Icon name="check" size={16} />
        </Button>}
      </div>
    </Modal>
  );
}
