"use client";

import type { Task } from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";
import { Modal } from "../ui/modal";

export function DeleteTaskModal({ task, deleting, onConfirm, onClose }: {
  task: Task;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return <Modal label={`Delete ${task.title}`} onClose={deleting ? () => {} : onClose}>
    <div className="modal-header">
      <div>
        <p className="eyebrow">Delete task</p>
        <h2>Delete “{task.title}”?</h2>
        <p>This removes the task and its checklist from your priorities. You can undo it immediately afterward.</p>
      </div>
      <Button variant="icon" aria-label="Cancel task deletion" disabled={deleting} onClick={onClose}><Icon name="close" /></Button>
    </div>
    <div className="modal-footer">
      <Button variant="secondary" disabled={deleting} onClick={onClose}>Cancel</Button>
      <Button variant="primary" className="task-delete-confirm-button" disabled={deleting} onClick={onConfirm}>
        <Icon name="trash" size={16} />{deleting ? "Deleting…" : "Delete task"}
      </Button>
    </div>
  </Modal>;
}
