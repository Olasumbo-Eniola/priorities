import { useRef, useState } from "react";
import "../../styles/inline-text.css";

type Props = {
  value: string;
  editing: boolean;
  label: string;
  maxLength: number;
  className?: string;
  onSave: (value: string) => void | Promise<void>;
  onEnd: () => void;
};

function Editor({ value, label, maxLength, onSave, onEnd }: Props) {
  const stopped = useRef(false);
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save(value: string) {
    if (stopped.current || pending.current) return;
    if (!value.trim()) { setError("Enter a name."); return; }
    pending.current = true;
    setSaving(true); setError("");
    try {
      await onSave(value.trim());
      stopped.current = true;
      onEnd();
    } catch { setError("Couldn’t save. Press Enter to retry."); }
    finally { pending.current = false; setSaving(false); }
  }
  return <>
    <textarea autoFocus aria-label={label} aria-invalid={Boolean(error)} aria-busy={saving}
      className="inline-text-input" defaultValue={value} maxLength={maxLength} readOnly={saving} rows={1}
      onChange={() => setError("")}
      onBlur={event => void save(event.currentTarget.value)}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); void save(event.currentTarget.value); }
        if (event.key === "Escape") {
          event.preventDefault(); event.stopPropagation();
          if (!pending.current) { stopped.current = true; onEnd(); }
        }
      }} />
    {error && <span className="inline-text-error" role="alert">{error}</span>}
  </>;
}

/** Keep the original text in flow so editing never changes the row's geometry. */
export function InlineText(props: Props) {
  return <span className={`inline-text ${props.className ?? ""}${props.editing ? " is-editing" : ""}`}>
    <span className="inline-text-measure" aria-hidden={props.editing || undefined}>{props.value}</span>
    {props.editing && <Editor {...props} />}
  </span>;
}
