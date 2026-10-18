export type Period = "day" | "week" | "month";
export type Priority = "urgent" | "high" | "medium" | "low";
export const taskStatuses = [
  "Not started",
  "In progress",
  "Blocked",
  "Completed",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export type ReviewNote = { done: string; blocker: string };
export type ReviewNotes = Record<string, ReviewNote>;

export type Task = {
  id: string;
  title: string;
  description: string;
  labels?: import("./label-model").LabelColor[];
  priority: Priority;
  deadline: string;
  placements: { period: Period; date: string }[];
  blocked: boolean;
  completed: boolean;
  selectedStatus?: TaskStatus;
  checklist: { id: string; title: string; note: string; done: boolean }[];
  attachments: {
    id: string;
    name: string;
    size: string;
    url?: string;
    kind?: "file" | "link";
  }[];
  comments: { id: string; text: string }[];
};

export const periods: Record<Period, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
};

export function createTaskDraft(
  period: Period,
  now: Date,
  general = false,
): Task {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    labels: [],
    priority: "medium",
    deadline: "",
    placements: general ? [] : [{ period, date: periodKey(period, now) }],
    blocked: false,
    completed: false,
    checklist: [],
    attachments: [],
    comments: [],
  };
}

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function periodKey(period: Period, date: Date) {
  const copy = new Date(date);
  if (period === "week")
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  if (period === "month") copy.setDate(1);
  return dateKey(copy);
}

export function progress(task: Task) {
  if (task.selectedStatus === "Completed") return 100;
  return task.checklist.length
    ? (task.checklist.filter((i) => i.done).length / task.checklist.length) *
        100
    : task.completed
      ? 100
      : 0;
}

export function taskCompletionRate(tasks: Task[]) {
  return tasks.length
    ? Math.round(
        tasks.reduce((total, task) => total + progress(task), 0) /
          tasks.length,
      )
    : null;
}
export function dueLabel(task: Task, now: Date) {
  if (!task.deadline) return "Added manually";
  if (task.deadline === dateKey(now)) return "Today";
  return new Date(`${task.deadline}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function status(task: Task) {
  if (task.selectedStatus) return task.selectedStatus;
  return progress(task) === 100
    ? "Completed"
    : task.blocked
      ? "Blocked"
      : progress(task) > 0
        ? "In progress"
        : "Not started";
}

export function inPeriod(task: Task, period: Period, now: Date) {
  if (
    task.placements.some(
      (p) => p.period === period && p.date === periodKey(period, now),
    )
  )
    return true;
  if (!task.deadline) return false;
  const [year, month, day] = task.deadline.split("-").map(Number);
  const daysUntil =
    (Date.UTC(year, month - 1, day) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
    86400000;
  if (period === "day")
    return (
      (daysUntil >= 0 && daysUntil <= 3) ||
      (task.deadline < dateKey(now) && status(task) !== "Completed")
    );
  if (period === "week" && daysUntil >= 0 && daysUntil <= 7) return true;
  return (
    periodKey(period, new Date(task.deadline + "T12:00:00")) ===
    periodKey(period, now)
  );
}

export function isGeneral(task: Task, now: Date) {
  return !(Object.keys(periods) as Period[]).some((period) =>
    inPeriod(task, period, now),
  );
}

export function withStatus(task: Task, selectedStatus: TaskStatus): Task {
  return {
    ...task,
    selectedStatus,
    completed: selectedStatus === "Completed",
    blocked: selectedStatus === "Blocked",
  };
}
