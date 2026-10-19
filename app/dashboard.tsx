"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import Link from "next/link";
import "./styles/list-view.css";
import "./styles/navigation.css";
import { ReviewModal } from "./components/reviews/review-modal";
import { ReviewHistory } from "./components/reviews/review-history";
import { TaskCardGroups } from "./components/tasks/task-card-groups";
import { TaskDrawer } from "./components/tasks/task-drawer";
import { DeleteTaskModal } from "./components/tasks/delete-task-modal";
import { TaskList } from "./components/tasks/task-list";
import { Button } from "./components/ui/button";
import { Icon } from "./components/ui/app-icon";
import { useCurrentTime } from "./hooks/use-current-time";
import { useDailyReview } from "./hooks/use-daily-review";
import { useLabels } from "./hooks/use-labels";
import { useMobileLayout } from "./hooks/use-mobile-layout";
import { useTaskDraft } from "./hooks/use-task-draft";
import { useTasks } from "./hooks/use-tasks";
import { useToast } from "./hooks/use-toast";
import {
  createTaskDraft,
  inPeriod,
  isGeneral,
  periods,
  status,
  taskCompletionRate,
  type Period,
  type Task,
} from "./task-model";

export default function Dashboard({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  const now = useCurrentTime();
  const mobileLayout = useMobileLayout();
  const [dataError, setDataError] = useState("");
  const [periodFilter, setPeriodFilter] = useState<Period | null>(null);
  const [section, setSection] = useState<"priorities" | "general" | "reviews">(
    "priorities",
  );
  const [view, setView] = useState<"cards" | "list">("list");
  const activeView = mobileLayout ? "cards" : view;
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingTaskDelete, setPendingTaskDelete] = useState<Task | null>(null);
  const { toast, showToast } = useToast();
  const { labels, renameTaskLabel } = useLabels(user.uid, setDataError);
  const {
    tasks,
    loaded: tasksLoaded,
    updateTask,
    createTask,
    deleteTask,
    restoreTask,
    deletedTasks,
    deletingIds,
    dismissDeletedTask,
  } = useTasks(user.uid, selected, setDataError);
  const { draftTask, beginDraft, updateOpenTask, closeDraft } = useTaskDraft({
    createTask,
    updateTask,
    showToast,
  });
  const dailyReview = useDailyReview({
    uid: user.uid,
    now,
    reportDataError: setDataError,
    showToast,
  });

  if (!tasksLoaded)
    return <div className="loading">Getting your priorities ready…</div>;
  const byPeriod = (p: Period) => tasks.filter((t) => inPeriod(t, p, now));
  const allPriorities = tasks.filter((task) =>
    (Object.keys(periods) as Period[]).some((p) => inPeriod(task, p, now)),
  );
  const generalTasks = tasks.filter((task) => isGeneral(task, now));

  const visible =
    section === "general"
      ? generalTasks
      : periodFilter
        ? byPeriod(periodFilter)
        : allPriorities;
  const displayedTasks = visible;
  const done = displayedTasks.filter((t) => status(t) === "Completed").length;
  const task =
    draftTask?.id === selected
      ? draftTask
      : tasks.find((candidate) => candidate.id === selected);
  const taskIsDraft = Boolean(task && draftTask?.id === task.id);
  const openNewTask = (targetPeriod = periodFilter ?? "day") => {
    const draft = createTaskDraft(targetPeriod, now, section === "general");
    beginDraft(draft);
    setSelected(draft.id);
  };

  const closeTaskDrawer = (closedTask: Task) => {
    setSelected(null);
    closeDraft(closedTask);
  };

  return (
    <div className="app-shell with-navigation">
      <nav
        id="workspace-navigation"
        className={`workspace-nav ${navigationOpen ? "is-open" : ""}`}
        aria-label="Workspace"
      >
        <div className="workspace-nav-header">
          <Link
            className="brand sidebar-brand"
            href="/"
            aria-label="Priorities home"
          >
            <span className="brand-symbol">
              <Icon name="check" size={20} />
            </span>
            priorities<span className="brand-period">.</span>
          </Link>
          <Button
            variant="icon"
            className="workspace-nav-close"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          >
            <Icon name="close" size={19} />
          </Button>
        </div>
        <div className="workspace-nav-links">
          {(["priorities", "general", "reviews"] as const).map((item) => (
            <Button
              key={item}
              aria-current={section === item ? "page" : undefined}
              onClick={() => {
                setSection(item);
                if (item === "priorities") setPeriodFilter(null);
                setNavigationOpen(false);
              }}
            >
              {item === "priorities"
                ? "Priorities"
                : item === "general"
                  ? "General"
                  : "Review history"}
              {item !== "reviews" && (
                <span>
                  {item === "priorities"
                    ? allPriorities.length
                    : generalTasks.length}
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="workspace-account">
          <div className="workspace-user">
            <span className="avatar small">
              {(user.email?.[0] ?? "P").toUpperCase()}
            </span>
            <span>{user.email ?? "Signed-in account"}</span>
          </div>
          <Button
            className="workspace-sign-out"
            onClick={() => void onSignOut()}
          >
            <Icon name="logout" size={16} />
            Sign out
          </Button>
        </div>
      </nav>
      {navigationOpen && (
        <button
          className="workspace-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setNavigationOpen(false)}
        />
      )}
      <main>
        <header className="mobile-navigation">
          <Button
            variant="icon"
            className="mobile-navigation-toggle"
            aria-label="Open navigation"
            aria-controls="workspace-navigation"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(true)}
          >
            <Icon name="menu" size={21} />
          </Button>
          <Link
            className="brand mobile-brand"
            href="/"
            aria-label="Priorities home"
          >
            <span className="brand-symbol">
              <Icon name="check" size={18} />
            </span>
            priorities<span className="brand-period">.</span>
          </Link>
        </header>
        <div className="content">
          {dataError && (
            <div className="data-alert" role="alert">
              <span>{dataError}</span>
              <button
                onClick={() => setDataError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
          <section className="page-heading">
            <div>
              <p className="date-heading">
                <Icon name="sun" size={15} />
                {now.toLocaleDateString("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1>Misplaced them again?</h1>
            </div>
            <div className="page-actions">
              <Button variant="primary" onClick={() => openNewTask()}>
                <Icon name="plus" />
                New task
              </Button>
              <Button
                variant="secondary"
                className={`review-trigger ${dailyReview.isDue ? "review-due" : ""}`}
                onClick={dailyReview.openReview}
              >
                <Icon name="moon" />
                {dailyReview.isComplete ? "Review complete" : "Review today"}
                {dailyReview.isDue && (
                  <span
                    className="review-due-dot"
                    aria-label="Time to review"
                  />
                )}
              </Button>
            </div>
          </section>
          {section === "reviews" ? (
            <section>
              <h2>Review history</h2>
              <p className="subtle">
                Look back at what moved forward and what got in the way.
              </p>
              <ReviewHistory uid={user.uid} />
            </section>
          ) : (
            <>
              {section === "priorities" && (
                <section className="summaries" aria-label="Progress overview">
                  {[
                    { key: "all" as const, label: "All", items: allPriorities },
                    ...(Object.keys(periods) as Period[]).map((period) => ({
                      key: period,
                      label: periods[period],
                      items: byPeriod(period),
                    })),
                  ].map(({ key, label, items }) => {
                    const p = key === "all" ? null : key,
                      value = taskCompletionRate(items),
                      completedCount = items.filter(
                        (task) => status(task) === "Completed",
                      ).length;
                    return (
                      <button
                        key={key}
                        onClick={() => setPeriodFilter(p)}
                        className={`summary ${periodFilter === p ? "chosen" : ""}`}
                      >
                        <div className="summary-title">
                          <span className={`summary-icon ${key}`}>
                            <Icon
                              name={
                                key === "all"
                                  ? "grid"
                                  : key === "day"
                                    ? "sun"
                                    : "calendar"
                              }
                            />
                          </span>
                          <strong>{label}</strong>
                          <Icon name="arrow" size={16} />
                        </div>
                        <div className="summary-progress">
                          <span
                            className="summary-ring"
                            aria-label={`${value ?? 0}% average progress`}
                            style={{
                              background: `conic-gradient(var(--color-text-secondary) ${value ?? 0}%, var(--color-border-subtle) 0)`,
                            }}
                          >
                            <strong>
                              {value === null ? "—" : value}
                              <small>{value !== null ? "%" : ""}</small>
                            </strong>
                          </span>
                          {!mobileLayout && (
                            <span className="summary-complete-count">
                              {completedCount} of {items.length} complete
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </section>
              )}
              <section className="tasks-section">
                <div className="list-heading">
                  <div>
                    <h2>
                      {section === "general"
                        ? "General"
                        : periodFilter === "day"
                          ? "Today’s priorities"
                          : periodFilter === "week"
                            ? "This week’s priorities"
                            : periodFilter === "month"
                              ? "This month’s priorities"
                              : "All priorities"}
                      <span>{displayedTasks.length}</span>
                    </h2>
                  </div>
                  {!mobileLayout && (
                    <div className="list-controls">
                      <div
                        className="view-toggle"
                        data-view={view}
                        role="group"
                        aria-label="Task layout"
                      >
                        {(["list", "cards"] as const).map((viewOption) => (
                          <button
                            key={viewOption}
                            aria-pressed={view === viewOption}
                            title={
                              viewOption === "cards" ? "Card view" : "List view"
                            }
                            onClick={() => setView(viewOption)}
                          >
                            <Icon
                              name={viewOption === "cards" ? "grid" : "list"}
                              size={16}
                            />
                            <span>
                              {viewOption === "cards" ? "Cards" : "List"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {activeView === "list" ? (
                  <TaskList
                    onDelete={setPendingTaskDelete}
                    tasks={tasks}
                    labels={labels}
                    now={now}
                    onOpen={setSelected}
                    onUpdate={updateTask}
                    onAddTask={openNewTask}
                    general={section === "general"}
                    filter={section === "priorities" ? periodFilter : null}
                  />
                ) : (
                  <TaskCardGroups
                    tasks={tasks}
                    labels={labels}
                    now={now}
                    onOpen={setSelected}
                    general={section === "general"}
                    filter={section === "priorities" ? periodFilter : null}
                  />
                )}
                <div className="list-footer">
                  <span>
                    <span className="tiny-dot" />
                    {done} completed · {displayedTasks.length - done} still in
                    motion
                  </span>
                  <span>Small steps count.</span>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      {task && (
        <TaskDrawer
          onDelete={setPendingTaskDelete}
          labels={labels}
          onRenameLabel={renameTaskLabel}
          uid={user.uid}
          key={task.id}
          task={task}
          draft={taskIsDraft}
          now={now}
          onUpdate={updateOpenTask}
          onClose={closeTaskDrawer}
        />
      )}
      {pendingTaskDelete && (
        <DeleteTaskModal
          task={pendingTaskDelete}
          deleting={deletingIds.includes(pendingTaskDelete.id)}
          onClose={() => setPendingTaskDelete(null)}
          onConfirm={() => {
            const target = pendingTaskDelete;
            void deleteTask(target).then((deleted) => {
              if (!deleted) return;
              setPendingTaskDelete(null);
              if (selected === target.id) setSelected(null);
            });
          }}
        />
      )}
      {dailyReview.isOpen && (
        <ReviewModal
          tasks={byPeriod("day")}
          notes={dailyReview.notes}
          now={now}
          completing={dailyReview.isCompleting}
          error={dailyReview.error}
          onReflectionChange={dailyReview.changeReflection}
          onClose={dailyReview.closeReview}
          onNoteChange={dailyReview.changeTaskNote}
          onComplete={() => void dailyReview.finishReview()}
        />
      )}
      {deletedTasks.length > 0 && (
        <div className="deleted-task-notice" role="status">
          {deletedTasks.map((deleted) => (
            <div key={deleted.id}>
              <span>Deleted “{deleted.title}”</span>
              <Button
                variant="secondary"
                onClick={() => void restoreTask(deleted)}
              >
                Undo
              </Button>
              <Button
                variant="icon"
                aria-label={`Dismiss deletion notice for ${deleted.title}`}
                onClick={() => dismissDeletedTask(deleted.id)}
              >
                <Icon name="close" size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
        </div>
      )}
    </div>
  );
}
