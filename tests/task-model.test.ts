import { describe, expect, it } from "vitest";
import { createTaskDraft, taskCompletionRate, inPeriod, isGeneral, status, withStatus, type Task } from "../app/task-model";

function task(id: string, completed: boolean): Task {
  return {
    id,
    title: `Task ${id}`,
    description: "",
    priority: "medium",
    deadline: "",
    placements: [],
    blocked: false,
    completed,
    checklist: [],
    attachments: [],
    comments: [],
  };
}

describe("task completion rate", () => {
  it("creates drawer-ready tasks in the selected priority period", () => {
    const now = new Date(2026, 9, 18, 12);
    const draft = createTaskDraft("week", now);

    expect(draft.title).toBe("");
    expect(draft.placements).toEqual([
      { period: "week", date: "2026-10-12" },
    ]);
    expect(createTaskDraft("day", now, true).placements).toEqual([]);
  });

  it("includes three and seven day deadlines across calendar boundaries", () => {
    const now = new Date(2026, 0, 30, 12);
    const due = (deadline: string) => ({ ...task("a", false), deadline });
    expect(inPeriod(due("2026-02-02"), "day", now)).toBe(true);
    expect(inPeriod(due("2026-02-03"), "day", now)).toBe(false);
    expect(inPeriod(due("2026-02-06"), "week", now)).toBe(true);
    expect(isGeneral(due("2026-02-07"), now)).toBe(true);
    expect(inPeriod(due("2026-01-29"), "day", now)).toBe(true);
  });
  it("preserves checklist work when completing and reopening from the list", () => {
    const original = { ...task("a", false), checklist: [{ id: "step", title: "Step", note: "", done: false }] };
    const completed = withStatus(original, "Completed");
    expect(status(completed)).toBe("Completed");
    expect(completed.checklist).toEqual(original.checklist);
    expect(status(withStatus(completed, "In progress"))).toBe("In progress");
  });
  it("rounds one completed task out of six to 17%", () => {
    const tasks = Array.from({ length: 6 }, (_, index) =>
      task(String(index), index === 0),
    );

    expect(taskCompletionRate(tasks)).toBe(17);
  });

  it("includes partial checklist progress before a task is complete", () => {
    const partial = {
      ...task("partial", false),
      checklist: [
        { id: "one", title: "One", note: "", done: true },
        { id: "two", title: "Two", note: "", done: false },
      ],
    };

    expect(taskCompletionRate([partial, task("not-started", false)])).toBe(25);
  });
});
