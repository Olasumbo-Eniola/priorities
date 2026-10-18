import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  completeReview,
  saveReviewEntry,
  saveReviewReflection,
  subscribeReview,
} from "../firebase-data";
import { ReviewDrafts, withSaveTimeout } from "../review-drafts";
import {
  dateKey,
  type ReviewNote,
  type ReviewNotes,
  type Task,
} from "../task-model";

export function useDailyReview({
  uid,
  now,
  reportDataError,
  showToast,
}: {
  uid: string;
  now: Date;
  reportDataError: (message: string) => void;
  showToast: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviewedDate, setReviewedDate] = useState("");
  const [loadedDate, setLoadedDate] = useState("");
  const [notes, setNotes] = useState<ReviewNotes>({});
  const [drafts] = useState(() => new ReviewDrafts());
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const promptedDate = useRef("");
  const automaticReviewDate = useRef("");
  const reviewDate = dateKey(now);

  useEffect(
    () =>
      subscribeReview(
        uid,
        reviewDate,
        (isReviewed, savedNotes, confirmed) => {
          setReviewedDate(isReviewed ? reviewDate : "");
          setLoadedDate(confirmed ? reviewDate : "");
          if (
            confirmed &&
            isReviewed &&
            automaticReviewDate.current === reviewDate
          ) {
            automaticReviewDate.current = "";
            setIsOpen(false);
          }
          setNotes(drafts.merge(savedNotes));
        },
        () =>
          reportDataError(
            "Your daily review couldn’t be loaded. Check your Firestore connection and try again.",
          ),
      ),
    [drafts, reportDataError, reviewDate, uid],
  );

  useEffect(() => {
    if (
      loadedDate === reviewDate &&
      now.getHours() >= 20 &&
      reviewedDate !== reviewDate &&
      promptedDate.current !== reviewDate
    ) {
      promptedDate.current = reviewDate;
      automaticReviewDate.current = reviewDate;
      setIsOpen(true);
    }
  }, [loadedDate, now, reviewDate, reviewedDate]);

  const openReview = useCallback(() => {
    automaticReviewDate.current = "";
    setIsOpen(true);
  }, []);

  const closeReview = useCallback(() => {
    automaticReviewDate.current = "";
    setIsOpen(false);
  }, []);

  const changeReflection = useCallback(
    (value: ReviewNote) => {
      const key = `${reviewDate}-overall`;
      setNotes((current) => ({ ...current, [key]: value }));
      setError("");
      void drafts
        .save(key, value, () =>
          saveReviewReflection(uid, reviewDate, value),
        )
        .catch(() =>
          setError(
            "Your reflection couldn’t be saved. Your text is still here. Complete review will retry.",
          ),
        );
    },
    [drafts, reviewDate, uid],
  );

  const changeTaskNote = useCallback(
    (task: Task, value: ReviewNote) => {
      const key = `${reviewDate}-${task.id}`;
      setNotes((current) => ({ ...current, [key]: value }));
      void drafts
        .save(key, value, () => saveReviewEntry(uid, reviewDate, task, value))
        .catch(() =>
          setError(
            "That review note wasn’t saved. Your text is still here so you can try again.",
          ),
        );
    },
    [drafts, reviewDate, uid],
  );

  const finishReview = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setError("");
    try {
      await withSaveTimeout(drafts.flush());
      await withSaveTimeout(
        completeReview(
          uid,
          reviewDate,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
      );
      setReviewedDate(reviewDate);
      setIsOpen(false);
      showToast("Your reflection is saved.");
    } catch (completionError: unknown) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : "Your review couldn’t be completed. Your text is still here. Check your connection and try again.",
      );
    } finally {
      setIsCompleting(false);
    }
  }, [drafts, isCompleting, reviewDate, showToast, uid]);

  return {
    isOpen,
    isDue: now.getHours() >= 20 && reviewedDate !== reviewDate,
    isComplete: reviewedDate === reviewDate,
    notes,
    isCompleting,
    error,
    openReview,
    closeReview,
    changeReflection,
    changeTaskNote,
    finishReview,
  };
}
