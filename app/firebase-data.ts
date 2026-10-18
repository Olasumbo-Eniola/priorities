import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  runTransaction,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { progress, type ReviewNotes, type Task } from "./task-model";

const tasksPath = (uid: string) => collection(db, "users", uid, "tasks");
const taskPath = (uid: string, taskId: string) =>
  doc(db, "users", uid, "tasks", taskId);

function summaryItems(taskId: string, total = 0, completed = 0) {
  return Array.from({ length: total }, (_, index) => ({
    id: `${taskId}-summary-${index}`,
    title: "",
    note: "",
    done: index < completed,
  }));
}

function summaryComments(taskId: string, count = 0) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${taskId}-comment-summary-${index}`,
    text: "",
  }));
}

function mapTask(id: string, data: DocumentData): Task {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    labels: data.labels ?? [],
    priority: data.priority ?? "medium",
    deadline: data.deadline ?? "",
    placements: Object.entries(data.placements ?? {}).map(([period, date]) => ({
      period: period as "day" | "week" | "month",
      date: String(date),
    })),
    blocked: Boolean(data.blocked),
    completed: Boolean(data.completed),
    selectedStatus: data.selectedStatus,
    checklist: summaryItems(
      id,
      Number(data.checklistTotal ?? 0),
      Number(data.checklistCompleted ?? 0),
    ),
    attachments: [],
    comments: summaryComments(id, Number(data.commentCount ?? 0)),
  };
}

function placementsMap(task: Task) {
  return Object.fromEntries(
    task.placements.map(({ period, date }) => [period, date]),
  );
}

export async function ensureUserProfile(user: User) {
  const profileRef = doc(db, "users", user.uid);
  const profile = {
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "You",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    reviewTime: "20:00",
    updatedAt: serverTimestamp(),
  };
  if ((await getDoc(profileRef)).exists()) {
    await updateDoc(profileRef, profile);
  } else {
    await setDoc(profileRef, { ...profile, createdAt: serverTimestamp() });
  }
}

export function subscribeTasks(
  uid: string,
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void,
) {
  const taskQuery = query(tasksPath(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    taskQuery,
    (snapshot) =>
      onTasks(snapshot.docs.filter(snapshot => !snapshot.data().deletedAt).map((snapshot) => mapTask(snapshot.id, snapshot.data()))),
    onError,
  );
}

export function subscribeTaskDetails(
  uid: string,
  taskId: string,
  onDetails: (details: Pick<Task, "checklist" | "comments"> & { attachments?: Task["attachments"] }) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  let checklist: Task["checklist"] = [];
  let comments: Task["comments"] = [];
  const emit = () => onDetails({ checklist, comments });
  const stopChecklist = onSnapshot(
    query(
      collection(db, "users", uid, "tasks", taskId, "checklistItems"),
      orderBy("position", "asc"),
    ),
    (snapshot) => {
      checklist = snapshot.docs.map((item) => ({
        id: item.id,
        title: String(item.data().title ?? ""),
        note: String(item.data().note ?? ""),
        done: Boolean(item.data().done),
      }));
      emit();
    },
    onError,
  );
  const stopComments = onSnapshot(
    query(
      collection(db, "users", uid, "tasks", taskId, "comments"),
      orderBy("createdAt", "asc"),
    ),
    (snapshot) => {
      comments = snapshot.docs.map((comment) => ({
        id: comment.id,
        text: String(comment.data().text ?? ""),
      }));
      emit();
    },
    onError,
  );
  const stopLinks = onSnapshot(collection(db, "users", uid, "tasks", taskId, "links"), snapshot => {
    onDetails({ checklist, comments, attachments: snapshot.docs.map(link => ({
      id: link.id, kind: "link", name: String(link.data().name), url: String(link.data().url), size: "Link",
    })) });
  }, onError);
  return () => {
    stopChecklist();
    stopComments();
    stopLinks();
  };
}

export async function setTaskDeleted(uid: string, taskId: string, deleted: boolean) {
  await updateDoc(taskPath(uid, taskId), {
    deletedAt: deleted ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function createTask(uid: string, task: Task) {
  const taskRef = doc(tasksPath(uid), task.id);
  const batch = writeBatch(db);
  batch.set(taskRef, {
    title: task.title,
    description: task.description,
    labels: task.labels ?? [],
    priority: task.priority,
    deadline: task.deadline || null,
    placements: placementsMap(task),
    blocked: task.blocked,
    completed: task.completed,
    checklistTotal: task.checklist.length,
    checklistCompleted: task.checklist.filter((item) => item.done).length,
    commentCount: task.comments.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  task.checklist.forEach((item, position) => {
    batch.set(doc(taskRef, "checklistItems", item.id), {
      title: item.title,
      note: item.note,
      done: item.done,
      position,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  task.comments.forEach((comment) => {
    batch.set(doc(taskRef, "comments", comment.id), {
      text: comment.text,
      createdAt: serverTimestamp(),
    });
  });
  task.attachments
    .filter((attachment) => attachment.kind === "link" && attachment.url)
    .forEach((attachment) => {
      batch.set(doc(taskRef, "links", attachment.id), {
        name: attachment.name,
        url: attachment.url,
        createdAt: serverTimestamp(),
      });
    });
  await batch.commit();
}

export async function persistTaskChange(
  uid: string,
  previous: Task,
  next: Task,
) {
  const taskRef = taskPath(uid, next.id);
  const batch = writeBatch(db);
  const taskUpdates: Record<string, unknown> = {};
  const previousLinks = previous.attachments.filter(item => item.kind === "link");
  const nextLinks = next.attachments.filter(item => item.kind === "link");
  const addedLinks = nextLinks.filter(item => !previousLinks.some(old => old.id === item.id));
  const removedLinks = previousLinks.filter(item => !nextLinks.some(next => next.id === item.id));
  addedLinks.forEach(link => batch.set(doc(taskRef, "links", link.id), { name: link.name, url: link.url, createdAt: serverTimestamp() }));
  removedLinks.forEach(link => batch.delete(doc(taskRef, "links", link.id)));
  const fieldsChanged =
    previous.title !== next.title ||
    previous.description !== next.description ||
    JSON.stringify(previous.labels ?? []) !== JSON.stringify(next.labels ?? []) ||
    previous.priority !== next.priority ||
    previous.deadline !== next.deadline ||
    previous.blocked !== next.blocked ||
    previous.completed !== next.completed ||
    previous.selectedStatus !== next.selectedStatus ||
    JSON.stringify(previous.placements) !== JSON.stringify(next.placements);

  if (fieldsChanged) {
    Object.assign(taskUpdates, {
      title: next.title,
      description: next.description,
      labels: next.labels ?? [],
      priority: next.priority,
      deadline: next.deadline || null,
      placements: placementsMap(next),
      blocked: next.blocked,
      completed: next.completed,
      ...(next.selectedStatus ? { selectedStatus: next.selectedStatus } : {}),
      updatedAt: serverTimestamp(),
    });
  }

  const previousItems = new Map(previous.checklist.map((item) => [item.id, item]));
  const removedItems = previous.checklist.filter(item => !next.checklist.some(candidate => candidate.id === item.id));
  removedItems.forEach(item => batch.delete(doc(db, "users", uid, "tasks", next.id, "checklistItems", item.id)));
  const changedItems = next.checklist.filter((item, position) => {
    const old = previousItems.get(item.id);
    return !old || old.title !== item.title || old.note !== item.note || old.done !== item.done || previous.checklist.findIndex(candidate => candidate.id === item.id) !== position;
  });
  changedItems.forEach((item) => {
    batch.set(
      doc(db, "users", uid, "tasks", next.id, "checklistItems", item.id),
      {
        title: item.title,
        note: item.note,
        done: item.done,
        position: next.checklist.findIndex((candidate) => candidate.id === item.id),
        updatedAt: serverTimestamp(),
        ...(!previousItems.has(item.id) ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true },
    );
  });
  if (
    changedItems.length ||
    previous.checklist.length !== next.checklist.length
  ) {
    Object.assign(taskUpdates, {
      checklistTotal: next.checklist.length,
      checklistCompleted: next.checklist.filter((item) => item.done).length,
      completed: next.selectedStatus ? next.selectedStatus === "Completed" : next.checklist.length ? progress(next) === 100 : next.completed,
      updatedAt: serverTimestamp(),
    });
  }

  const previousComments = new Set(previous.comments.map((comment) => comment.id));
  const newComments = next.comments.filter((comment) => !previousComments.has(comment.id));
  newComments.forEach((comment) => {
    batch.set(
      doc(db, "users", uid, "tasks", next.id, "comments", comment.id),
      { text: comment.text, createdAt: serverTimestamp() },
    );
  });
  if (newComments.length) {
    Object.assign(taskUpdates, {
      commentCount: next.comments.length,
      updatedAt: serverTimestamp(),
    });
  }

  if (fieldsChanged || changedItems.length || removedItems.length || newComments.length || addedLinks.length || removedLinks.length) {
    if (Object.keys(taskUpdates).length) batch.update(taskRef, taskUpdates);
    await batch.commit();
  }
}

export function subscribeReview(
  uid: string,
  localDate: string,
  onReview: (reviewed: boolean, notes: ReviewNotes, confirmed: boolean) => void,
  onError: (error: Error) => void,
) {
  let reviewed = false;
  let notes: ReviewNotes = {};
  let overall = { done: "", blocker: "" };
  let reviewLoaded = false;
  let entriesLoaded = false;
  let confirmed = false;
  const emit = () => {
    if (reviewLoaded && entriesLoaded) onReview(reviewed, { ...notes, [`${localDate}-overall`]: overall }, confirmed);
  };
  const reviewRef = doc(db, "users", uid, "reviews", localDate);
  const stopReview = onSnapshot(
    reviewRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      confirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
      // An estimated timestamp also suppresses reminders during completion writes.
      reviewed = Boolean(snapshot.data({ serverTimestamps: "estimate" })?.completedAt);
      overall = { done: String(snapshot.data()?.reflection ?? ""), blocker: String(snapshot.data()?.takeForward ?? "") };
      reviewLoaded = true;
      emit();
    },
    onError,
  );
  const stopEntries = onSnapshot(
    collection(reviewRef, "entries"),
    (snapshot) => {
      entriesLoaded = true;
      notes = Object.fromEntries(
        snapshot.docs.map((entry) => [
          `${localDate}-${entry.id}`,
          {
            done: String(entry.data().movedForward ?? ""),
            blocker: String(entry.data().blocker ?? ""),
          },
        ]),
      );
      emit();
    },
    onError,
  );
  return () => {
    stopReview();
    stopEntries();
  };
}

export async function saveReviewEntry(
  uid: string,
  localDate: string,
  task: Task,
  value: { done: string; blocker: string },
) {
  const reviewRef = doc(db, "users", uid, "reviews", localDate);
  await runTransaction(db, async transaction => {
    const review = await transaction.get(reviewRef);
    if (!review.exists()) transaction.set(reviewRef, { localDate, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, completedAt: null, updatedAt: serverTimestamp() });
    transaction.set(doc(reviewRef, "entries", task.id),
    {
      taskId: task.id,
      taskTitle: task.title,
      progressPercent: Math.round(progress(task)),
      movedForward: value.done,
      blocker: value.blocker,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  });
}

export async function saveReviewReflection(uid: string, localDate: string, value: { done: string; blocker: string }) {
  const reviewRef = doc(db, "users", uid, "reviews", localDate);
  await runTransaction(db, async transaction => {
    const review = await transaction.get(reviewRef);
    transaction.set(reviewRef, {
      ...(!review.exists() ? { localDate, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, completedAt: null } : {}),
      reflection: value.done,
      takeForward: value.blocker,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function completeReview(
  uid: string,
  localDate: string,
  timezone: string,
) {
  await setDoc(
    doc(db, "users", uid, "reviews", localDate),
    {
      localDate,
      timezone,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
