import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase-client";
import { defaultLabels, type LabelColor, type TaskLabel } from "./label-model";

export function subscribeLabels(
  uid: string,
  onLabels: (labels: TaskLabel[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "labels"),
    (snapshot) => {
      const names = new Map(
        snapshot.docs.map((label) => [label.id, String(label.data().name)]),
      );
      onLabels(
        defaultLabels.map((label) => ({
          ...label,
          name: names.get(label.id) ?? label.name,
        })),
      );
    },
    onError,
  );
}

export async function renameLabel(uid: string, id: LabelColor, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40)
    throw new Error("Use a label name between 1 and 40 characters.");
  await setDoc(doc(db, "users", uid, "labels", id), { name: trimmed });
}
