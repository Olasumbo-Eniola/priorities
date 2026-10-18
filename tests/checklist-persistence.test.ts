import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../app/task-model";

const batch = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn(), update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../app/firebase-client", () => ({ db: {} }));
vi.mock("firebase/firestore", async importOriginal => ({
  ...await importOriginal<typeof import("firebase/firestore")>(),
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  writeBatch: () => batch,
}));
import { persistTaskChange } from "../app/firebase-data";

const task: Task = {
  id: "task", title: "Task", description: "", priority: "medium", deadline: "", placements: [], blocked: false, completed: false,
  checklist: [{ id: "one", title: "First", note: "Keep context", done: true }, { id: "two", title: "Second", note: "", done: false }],
  attachments: [], comments: [],
};
beforeEach(() => vi.clearAllMocks());
describe("checklist persistence", () => {
  it("deletes the item and updates positions and counters in one batch", async () => {
    await persistTaskChange("owner", task, { ...task, checklist: [task.checklist[1]] });
    expect(batch.delete).toHaveBeenCalledWith("users/owner/tasks/task/checklistItems/one");
    expect(batch.set).toHaveBeenCalledWith("users/owner/tasks/task/checklistItems/two", expect.objectContaining({ position: 0 }), { merge: true });
    expect(batch.update).toHaveBeenCalledWith("users/owner/tasks/task", expect.objectContaining({ checklistTotal: 1, checklistCompleted: 0 }));
    expect(batch.commit).toHaveBeenCalledOnce();
  });
  it("commits deletion even when no checklist items remain", async () => {
    await persistTaskChange("owner", task, { ...task, checklist: [] });
    expect(batch.delete).toHaveBeenCalledTimes(2);
    expect(batch.update).toHaveBeenCalledWith("users/owner/tasks/task", expect.objectContaining({ checklistTotal: 0, checklistCompleted: 0 }));
    expect(batch.commit).toHaveBeenCalledOnce();
  });
  it("renames an item without losing its note or completion", async () => {
    await persistTaskChange("owner", task, { ...task, checklist: [{ ...task.checklist[0], title: "Renamed" }, task.checklist[1]] });
    expect(batch.set).toHaveBeenCalledWith("users/owner/tasks/task/checklistItems/one", expect.objectContaining({ title: "Renamed", note: "Keep context", done: true }), { merge: true });
    expect(batch.delete).not.toHaveBeenCalled();
  });
});
