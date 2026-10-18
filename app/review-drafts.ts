import type { ReviewNote, ReviewNotes } from "./task-model";

/** Protect local text from stale snapshots and keep each entry's writes in order. */
export class ReviewDrafts {
  private drafts: ReviewNotes = {};
  private pending = new Map<string, Promise<void>>();
  private failed = new Map<string, () => Promise<void>>();
  private latest = new Map<string, () => Promise<void>>();

  merge(saved: ReviewNotes): ReviewNotes {
    for (const [key, draft] of Object.entries(this.drafts)) {
      if (
        !this.pending.has(key) &&
        !this.failed.has(key) &&
        saved[key]?.done === draft.done &&
        saved[key]?.blocker === draft.blocker
      ) {
        delete this.drafts[key];
      }
    }
    return { ...saved, ...this.drafts };
  }

  save(
    key: string,
    value: ReviewNote,
    write: () => Promise<void>,
  ): Promise<void> {
    this.drafts[key] = { ...value };
    this.latest.set(key, write);
    const previous = this.pending.get(key) ?? Promise.resolve();
    const next = previous
      .catch(() => {})
      .then(() => {
        // Skip obsolete keystrokes instead of sending a transaction for each one.
        if (this.latest.get(key) !== write) return;
        return write();
      })
      .then(
        () => {
          this.failed.delete(key);
        },
        (error) => {
          this.failed.set(key, write);
          throw error;
        },
      );
    this.pending.set(key, next);
    const cleanup = () => {
      if (this.pending.get(key) === next) this.pending.delete(key);
    };
    void next.then(cleanup, cleanup);
    return next;
  }

  async flush(): Promise<void> {
    // Wait for all entries, including ones whose earlier writes failed.
    await Promise.allSettled([...this.pending.values()]);
    await Promise.all(
      [...this.failed].map(([key, write]) =>
        this.save(key, this.drafts[key], write),
      ),
    );
  }
}

/** Firestore can wait indefinitely offline; let the UI recover without losing drafts. */
export async function withSaveTimeout<T>(
  promise: Promise<T>,
  milliseconds = 15000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Saving is taking too long. Check your connection and retry. Your text is still here; pending saves may sync when you reconnect.",
              ),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
