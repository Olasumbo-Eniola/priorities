import { Icon } from "../ui/app-icon";

export type ReviewEntry = {
  id: string;
  title: string;
  done: string;
  blocker: string;
};

function ReflectionNote({
  label,
  text,
  empty,
}: {
  label: string;
  text: string;
  empty: string;
}) {
  return (
    <div className="history-note">
      <h5>{label}</h5>
      <p className={text ? undefined : "history-note-empty"}>{text || empty}</p>
    </div>
  );
}

export function ReviewHistoryCard({
  date,
  complete,
  reflection,
  takeForward,
  entries,
  taskOnly = false,
  loading,
  error,
}: {
  date: string;
  complete: boolean;
  reflection: string;
  takeForward: string;
  entries: ReviewEntry[];
  taskOnly?: boolean;
  loading?: boolean;
  error?: boolean;
}) {
  const day = new Date(`${date}T12:00:00`);
  return (
    <details className="review-history-day">
      <summary className="history-heading">
        <span className="history-date-icon">
          <Icon name="calendar" size={20} />
        </span>
        <span className="history-date">
          <time dateTime={date}>
            {day.toLocaleDateString(undefined, { dateStyle: "long" })}
          </time>
          <span>
            {day.toLocaleDateString(undefined, { weekday: "long" })} · Daily
            review
          </span>
        </span>
        <span
          className={`history-status ${complete ? "is-complete" : "is-draft"}`}
        >
          {complete && <Icon name="check" size={13} />}
          {complete ? "Completed" : "Draft"}
        </span>
        <span className="history-chevron">
          <Icon name="arrow" size={17} />
        </span>
      </summary>
      <div className="history-content">
        {!taskOnly && (reflection || takeForward) && (
          <section className="history-day-notes" aria-label="Day reflection">
            <ReflectionNote
              label="Your day"
              text={reflection}
              empty="No reflection recorded."
            />
            <ReflectionNote
              label="Carrying into tomorrow"
              text={takeForward}
              empty="No note recorded."
            />
          </section>
        )}
        <section className="history-task-section" aria-label="Task reflections">
          <div className="history-section-heading">
            <h4>Task reflections</h4>
            {!loading && !error && <span>{entries.length}</span>}
          </div>
          {error ? (
            <p role="alert" className="history-message">
              Couldn’t load these reflections.
            </p>
          ) : loading ? (
            <p className="history-message" role="status">
              Loading task reflections…
            </p>
          ) : !entries.length ? (
            <p className="history-message">No task reflections recorded.</p>
          ) : (
            entries.map((entry) => (
              <article className="history-task" key={entry.id}>
                <h4>
                  <Icon name="file" size={17} />
                  {entry.title}
                </h4>
                <div className="history-task-notes">
                  <ReflectionNote
                    label="Moved forward?"
                    text={entry.done}
                    empty="No note recorded."
                  />
                  <ReflectionNote
                    label="Blockers"
                    text={entry.blocker}
                    empty="None recorded."
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </details>
  );
}
