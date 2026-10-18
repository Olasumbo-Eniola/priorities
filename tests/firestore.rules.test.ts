import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";

let environment: RulesTestEnvironment;

const validTask = () => ({
  title: "Finish the dashboard",
  description: "Connect the important pieces.",
  priority: "high",
  deadline: null,
  placements: { day: "2026-10-17" },
  blocked: false,
  completed: false,
  checklistTotal: 0,
  checklistCompleted: 0,
  commentCount: 0,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "misplaced-priorities",
    firestore: {
      rules: await readFile("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterEach(() => environment.clearFirestore());
afterAll(() => environment.cleanup());

describe("Firestore ownership rules", () => {
  it("allows reversible task deletion only by the owner", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const path = "users/alice/tasks/deletable";
    await assertSucceeds(setDoc(doc(alice, path), validTask()));
    await assertSucceeds(updateDoc(doc(alice, path), { deletedAt: Timestamp.now() }));
    await assertSucceeds(updateDoc(doc(alice, path), { deletedAt: null }));
    await assertFails(updateDoc(doc(alice, path), { deletedAt: "invalid" }));
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(updateDoc(doc(bob, path), { deletedAt: Timestamp.now() }));
  });

  it("stores multiple labels and accepts existing tasks without labels", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    const task = doc(db, "users/alice/tasks/labeled-task");
    await assertSucceeds(setDoc(task, validTask()));
    await assertSucceeds(updateDoc(task, { labels: ["green", "blue"] }));
    await assertFails(updateDoc(task, { labels: ["unknown"] }));
    await assertFails(updateDoc(task, { labels: ["green", "green"] }));
    await assertFails(updateDoc(task, { labels: "green" }));
  });

  it("allows owned label renames and rejects invalid or cross-user edits", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const path = "users/alice/labels/green";
    await assertSucceeds(setDoc(doc(alice, path), { name: "Personal" }));
    await assertSucceeds(setDoc(doc(alice, path), { name: "Applications" }));
    await assertFails(setDoc(doc(alice, path), { name: "" }));
    await assertFails(setDoc(doc(alice, path), { name: "x".repeat(41) }));
    await assertFails(setDoc(doc(alice, "users/alice/labels/unknown"), { name: "Other" }));
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, path)));
    await assertFails(setDoc(doc(bob, path), { name: "Changed" }));
  });

  it("saves owned web links and rejects unsafe URLs and other users", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const path = "users/alice/tasks/task-1/links/link-1";
    const link = { name: "Reference", url: "https://example.com", createdAt: Timestamp.now() };
    await assertSucceeds(setDoc(doc(alice, path), link));
    await assertFails(setDoc(doc(alice, "users/alice/tasks/task-1/links/unsafe"), { ...link, url: "javascript:alert(1)" }));
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, path)));
    await assertFails(setDoc(doc(bob, path), link));
  });

  it("accepts day reflections but rejects oversized text and other users", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const review = doc(alice, "users/alice/reviews/2026-10-17");
    const data = { localDate: "2026-10-17", timezone: "Africa/Lagos", completedAt: null, updatedAt: Timestamp.now(), reflection: "A good day", takeForward: "Make room to rest" };
    await assertSucceeds(setDoc(review, data));
    await assertFails(updateDoc(review, { reflection: "x".repeat(5001) }));
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, "users/alice/reviews/2026-10-17")));
    await assertFails(setDoc(doc(bob, "users/alice/reviews/2026-10-17"), data));
  });

  it("allows a signed-in user to create and read their own task", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    const task = doc(alice, "users/alice/tasks/task-1");
    await assertSucceeds(setDoc(task, validTask()));
    await assertSucceeds(getDoc(task));
  });

  it("prevents another user from reading someone else's task", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users/alice/tasks/task-1"),
        validTask(),
      );
    });
    const bob = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, "users/alice/tasks/task-1")));
  });

  it("rejects invalid task fields", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(alice, "users/alice/tasks/task-1"), {
        ...validTask(),
        priority: "someday",
      }),
    );
  });

  it("prevents creation metadata from being changed", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users/alice/tasks/task-1"),
        validTask(),
      );
    });
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(
      updateDoc(doc(alice, "users/alice/tasks/task-1"), {
        createdAt: Timestamp.now(),
      }),
    );
  });
});
