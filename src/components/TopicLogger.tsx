"use client";

import { useState, useTransition } from "react";
import { logTopic, deleteTopic } from "@/app/actions";
import { REVIEW_LADDER } from "@/lib/spacing";
import { addDays, formatShort, todayISO, type ISODate } from "@/lib/dates";
import type { TopicVM } from "@/lib/revision-types";

type Props = { topics: TopicVM[] };

// Form for logging a topic on a given day, plus a list of what's already logged
// for the selected date with a delete affordance.
export default function TopicLogger({ topics }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loggedOn, setLoggedOn] = useState<ISODate>(todayISO());
  const [pending, startTransition] = useTransition();

  const onDate = topics.filter((t) => t.loggedOn === loggedOn);
  const ladderPreview = REVIEW_LADDER.map((d) => formatShort(addDays(loggedOn, d))).join(", ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    startTransition(async () => {
      await logTopic({ title: t, notes: notes.trim() || undefined, loggedOn });
      setTitle("");
      setNotes("");
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteTopic(id);
    });
  };

  return (
    <section className="logger">
      <form className="log-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="log-title">Topic</label>
          <input
            id="log-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bayes' theorem"
            autoComplete="off"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="log-notes">Notes <span className="opt">(optional)</span></label>
          <input
            id="log-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="A line to jog your memory later"
            autoComplete="off"
          />
        </div>
        <div className="field field-date">
          <label htmlFor="log-date">Covered on</label>
          <input
            id="log-date"
            type="date"
            value={loggedOn}
            max={todayISO()}
            onChange={(e) => setLoggedOn(e.target.value || todayISO())}
          />
        </div>
        <button className="log-submit" type="submit" disabled={pending || !title.trim()}>
          {pending ? "Saving…" : "Log topic"}
        </button>
      </form>

      <p className="ladder-hint">
        Reviews will surface on <strong>{ladderPreview}</strong>.
      </p>

      <div className="log-list">
        <h3>Logged on {formatShort(loggedOn)}</h3>
        {onDate.length === 0 ? (
          <p className="muted">Nothing logged for this day yet.</p>
        ) : (
          <ul>
            {onDate.map((t) => (
              <li key={t.id}>
                <div>
                  <span className="log-title-txt">{t.title}</span>
                  {t.notes && <span className="log-notes-txt">{t.notes}</span>}
                </div>
                <button
                  className="del-btn"
                  onClick={() => remove(t.id)}
                  disabled={pending}
                  aria-label={`Delete ${t.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
