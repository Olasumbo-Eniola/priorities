"use client";

import { useState } from "react";
import type { Task } from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";

export function CommentsSection({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: (task: Task) => void;
}) {
  const [comment, setComment] = useState("");

  return (
    <section className="drawer-section">
      <h3>
        Comments <span>{task.comments.length + (task.description ? 1 : 0)}</span>
      </h3>
      {task.description && <div className="comment"><span className="avatar small">S</span><div><strong>Earlier task note</strong><p>{task.description}</p></div></div>}
      {task.comments.map((item) => (
        <div className="comment" key={item.id}>
          <span className="avatar small">S</span>
          <div>
            <strong>You</strong>
            <p>{item.text}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!comment.trim()) return;
          onUpdate({
            ...task,
            comments: [
              ...task.comments,
              { id: crypto.randomUUID(), text: comment.trim() },
            ],
          });
          setComment("");
        }}
      >
        <textarea
          aria-label="New comment"
          placeholder="Leave a note for yourself…"
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <Button
          variant="secondary"
          type="submit"
          className="comment-submit"
        >
          Add comment
          <Icon name="arrow" size={15} />
        </Button>
      </form>
    </section>
  );
}
