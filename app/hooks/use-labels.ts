import { useCallback, useEffect, useState } from "react";
import { renameLabel, subscribeLabels } from "../label-data";
import { defaultLabels, type LabelColor } from "../label-model";

export function useLabels(
  uid: string,
  reportDataError: (message: string) => void,
) {
  const [labels, setLabels] = useState(defaultLabels);

  useEffect(
    () =>
      subscribeLabels(uid, setLabels, () =>
        reportDataError(
          "Your labels couldn’t be loaded. Check your connection and try again.",
        ),
      ),
    [reportDataError, uid],
  );

  const renameTaskLabel = useCallback(
    (id: LabelColor, name: string) => renameLabel(uid, id, name),
    [uid],
  );

  return { labels, renameTaskLabel };
}
