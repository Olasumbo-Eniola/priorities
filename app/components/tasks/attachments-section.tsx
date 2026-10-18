import { useState } from "react";
import "../../styles/attachments.css";
import type { Task } from "../../task-model";
import { Button } from "../ui/button";
import { Icon } from "../ui/app-icon";

export function AttachmentsSection({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: (task: Task) => void;
}) {
  const [addingLink, setAddingLink] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="drawer-section">
      <h3>
        Attachments
        <div className="attachment-actions">
        <Button variant="plain" onClick={() => setAddingLink(!addingLink)} aria-expanded={addingLink}>
          <Icon name="link" size={14} /> Add link
        </Button>
        </div>
      </h3>
      {addingLink && <form className="attachment-link-form" onSubmit={event => {
        event.preventDefault();
        try {
          const parsed = new URL(url.trim());
          if (!["https:", "http:"].includes(parsed.protocol) || parsed.href.length > 2048) throw new Error();
          onUpdate({ ...task, attachments: [...task.attachments, {
            id: crypto.randomUUID(), kind: "link", name: name.trim() || parsed.hostname,
            url: parsed.href, size: "Link",
          }] });
          setUrl(""); setName(""); setError(""); setAddingLink(false);
        } catch { setError("Enter a valid link starting with https:// or http://."); }
      }}>
        <label>URL<input type="url" required autoFocus value={url} maxLength={2048} placeholder="https://example.com" onChange={event => setUrl(event.target.value)} /></label>
        <label>Title (optional)<input value={name} maxLength={160} placeholder="Give this link a name" onChange={event => setName(event.target.value)} /></label>
        {error && <p role="alert">{error}</p>}
        <div><Button variant="secondary" onClick={() => { setAddingLink(false); setError(""); }}>Cancel</Button><Button variant="primary" type="submit">Add link</Button></div>
      </form>}
      <div className="attachment-chips">
        {task.attachments.filter(file => file.kind === "link" && file.url).map((file) => (
          <div className="attachment-link-chip" key={file.id}>
            <Icon name="link" size={13} />
            <a href={file.url} target="_blank" rel="noopener noreferrer" title={file.url}>
              {file.name}
            </a>
            <Button
              variant="icon"
              className="attachment-chip-remove"
              aria-label={`Remove ${file.name}`}
              onClick={() => {
                onUpdate({
                  ...task,
                  attachments: task.attachments.filter(
                    (attachment) => attachment.id !== file.id,
                  ),
                });
              }}
            >
              <Icon name="close" size={13} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
