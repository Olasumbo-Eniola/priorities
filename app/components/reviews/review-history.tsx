"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase-client";
import { ReviewHistoryCard, type ReviewEntry } from "./review-history-card";
import "../../styles/review-history.css";

function ReviewDay({ uid, date, complete, taskId, reflection, takeForward }: { uid: string; date: string; complete: boolean; taskId?: string; reflection: string; takeForward: string }) {
  const [entries, setEntries] = useState<ReviewEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => onSnapshot(collection(db, "users", uid, "reviews", date, "entries"), snapshot => {
    setEntries(snapshot.docs.map(entry => ({ id: entry.id, title: String(entry.data().taskTitle), done: String(entry.data().movedForward ?? ""), blocker: String(entry.data().blocker ?? "") })));
  }, () => setError(true)), [uid, date]);
  const visible = (entries ?? []).filter(entry => !taskId || entry.id === taskId);
  if (taskId && entries && !visible.length && !error) return null;
  return <ReviewHistoryCard date={date} complete={complete} reflection={reflection} takeForward={takeForward}
    entries={visible} taskOnly={Boolean(taskId)} loading={entries === null} error={error} />;
}

export function ReviewHistory({ uid, taskId }: { uid: string; taskId?: string }) {
  const [days, setDays] = useState<{ date: string; complete: boolean; reflection: string; takeForward: string }[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, "users", uid, "reviews"), orderBy("localDate", "desc")), snapshot => {
    setDays(snapshot.docs.map(day => ({ date: day.id, complete: Boolean(day.data().completedAt), reflection: String(day.data().reflection ?? ""), takeForward: String(day.data().takeForward ?? "") })));
  }, () => setError(true)), [uid]);
  if (error) return <p role="alert">Review history couldn’t be loaded. Please check your connection.</p>;
  if (!days) return <p>Loading reflections…</p>;
  return <div className={`review-history${taskId ? " review-history-compact" : ""}`}>
    {taskId && <p className="subtle">Recorded reflections for this task appear below.</p>}
    {!days.length && <p>No reviews yet. Your daily reflections will appear here.</p>}
    {days.map(day => <ReviewDay key={day.date} uid={uid} {...day} taskId={taskId} />)}
  </div>;
}
