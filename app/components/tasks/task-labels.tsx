import { useState } from "react";
import type { LabelColor, TaskLabel } from "../../label-model";
import { Icon } from "../ui/app-icon";
import { InlineText } from "../ui/inline-text";
import "../../styles/labels.css";

export function LabelChips({ selected, labels }: { selected: string[]; labels: TaskLabel[] }) {
  const active = labels.filter(label => selected.includes(label.id));
  return <span className="label-chips">{active.length ? active.map(label =>
    <span key={label.id} className={`task-label label-${label.id}`}>{label.name}</span>,
  ) : <span className="labels-empty">—</span>}</span>;
}

function LabelOption({ label, checked, onToggle, onRename }: {
  label: TaskLabel;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onRename: (id: LabelColor, name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  return <div className="label-option">
      <div className="label-option-value">
        <input type="checkbox" aria-label={label.name} checked={checked} onChange={event => onToggle(event.target.checked)} />
        <span className={`task-label label-${label.id}`}>
          <InlineText value={label.name} editing={editing} label={`Rename ${label.name} label`} maxLength={40}
            onEnd={() => setEditing(false)} onSave={name => onRename(label.id, name)} />
        </span>
      </div>
      <button type="button" className="label-edit-button" aria-label={`Rename ${label.name} label`}
        title="Edit label name" onClick={() => setEditing(true)}>
        <Icon name="pencil" size={17} />
      </button>
  </div>;
}

export function LabelPicker({ selected, labels, onChange, onRename }: {
  selected: string[];
  labels: TaskLabel[];
  onChange: (ids: LabelColor[]) => void;
  onRename: (id: LabelColor, name: string) => Promise<void>;
}) {
  return <div className="label-picker">
    <LabelChips selected={selected} labels={labels} />
    <details className="label-options">
      <summary>Choose labels</summary>
      <p>Choose more than one. Renaming a label updates it on every task.</p>
      {labels.map(label => <LabelOption key={label.id} label={label} checked={selected.includes(label.id)} onRename={onRename}
        onToggle={checked => onChange(labels.filter(item => item.id === label.id ? checked : selected.includes(item.id)).map(item => item.id))} />)}
    </details>
  </div>;
}
