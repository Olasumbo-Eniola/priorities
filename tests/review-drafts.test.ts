import { describe, expect, it, vi } from "vitest";
import { ReviewDrafts, withSaveTimeout } from "../app/review-drafts";

const key = "2026-10-17-task";
const note = (done: string) => ({ done, blocker: "A blocker" });

describe("review drafts", () => {
  it("keeps typed text through empty and stale Firebase snapshots", async () => {
    const drafts = new ReviewDrafts();
    await drafts.save(key, note("My new text"), async () => {});
    expect(drafts.merge({})[key]).toEqual(note("My new text"));
    expect(drafts.merge({ [key]: note("My") })[key]).toEqual(note("My new text"));
    // Once acknowledged, updates from other sessions can be received again.
    drafts.merge({ [key]: note("My new text") });
    expect(drafts.merge({ [key]: note("Another session") })[key].done).toBe("Another session");
  });

  it("orders rapid writes and waits for the latest text before completing", async () => {
    const drafts = new ReviewDrafts();
    let release!: () => void;
    const firstWrite = new Promise<void>(resolve => { release = resolve; });
    const latest = vi.fn(async () => {});
    const first = drafts.save(key, note("a"), () => firstWrite);
    await Promise.resolve();
    await Promise.resolve();
    const second = drafts.save(key, note("abc"), latest);
    const complete = vi.fn();
    const flush = drafts.flush().then(complete);
    await Promise.resolve();
    expect(latest).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(drafts.merge({ [key]: note("a") })[key].done).toBe("abc");
    release();
    await Promise.all([first, second, flush]);
    expect(latest).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
  });

  it("retains failed drafts and retries them when completing", async () => {
    const drafts = new ReviewDrafts();
    const write = vi.fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce();
    await expect(drafts.save(key, note("Keep me"), write)).rejects.toThrow("offline");
    expect(drafts.merge({})[key].done).toBe("Keep me");
    await drafts.flush();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("does not complete when retrying still fails", async () => {
    const drafts = new ReviewDrafts();
    const write = async () => { throw new Error("offline"); };
    await expect(drafts.save(key, note("Keep me"), write)).rejects.toThrow();
    await expect(drafts.flush()).rejects.toThrow("offline");
    expect(drafts.merge({})[key].done).toBe("Keep me");
  });

  it("skips outdated keystrokes instead of saving every intermediate value", async () => {
    const drafts = new ReviewDrafts();
    const writes = Array.from({ length: 100 }, () => vi.fn(async () => {}));
    await Promise.all(writes.map((write, index) => drafts.save(key, note(String(index)), write)));
    expect(writes.slice(0, -1).every(write => write.mock.calls.length === 0)).toBe(true);
    expect(writes[99]).toHaveBeenCalledOnce();
  });

  it("returns control if Firebase never acknowledges a save", async () => {
    vi.useFakeTimers();
    try {
      const result = withSaveTimeout(new Promise<void>(() => {}));
      const assertion = expect(result).rejects.toThrow("Your text is still here");
      await vi.advanceTimersByTimeAsync(15000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
