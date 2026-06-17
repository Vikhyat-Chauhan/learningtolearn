"use client";

import { useState, useTransition } from "react";
import { logTopic, deleteTopic, restoreTopic, updateTopic } from "@/app/actions";
import { useToast } from "@/components/Toast";
import { REVIEW_LADDER } from "@/lib/spacing";
import { addDays, formatShort, todayISO, type ISODate } from "@/lib/dates";
import type { TopicVM } from "@/lib/revision-types";

// Turn an unknown thrown value into a user-facing message, calling out auth.
function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/not signed in/i.test(msg)) return "Please sign in again.";
  return "Something went wrong. Please try again.";
}

type Props = { topics: TopicVM[] };

// Form for logging a topic on a given day, plus a list of what's already logged
// for the selected date with a delete affordance.
export default function TopicLogger({ topics }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loggedOn, setLoggedOn] = useState<ISODate>(todayISO());
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Inline edit state for an existing logged row.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const beginEdit = (topic: TopicVM) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditNotes(topic.notes ?? "");
  };

  const saveEdit = (id: string) => {
    const t = editTitle.trim();
    if (!t || pending) return;
    startTransition(async () => {
      try {
        await updateTopic({ id, title: t, notes: editNotes.trim() || null });
        setEditingId(null);
        toast({ message: "Topic updated.", variant: "success" });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });
  };

  const onDate = topics.filter((t) => t.loggedOn === loggedOn);
  const ladderPreview = REVIEW_LADDER.map((d) => formatShort(addDays(loggedOn, d))).join(", ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    startTransition(async () => {
      try {
        await logTopic({ title: t, notes: notes.trim() || undefined, loggedOn });
        setTitle("");
        setNotes("");
        toast({ message: `“${t}” logged — first review ${formatShort(addDays(loggedOn, REVIEW_LADDER[0]))}.`, variant: "success" });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });
  };

  const remove = (topic: TopicVM) => {
    startTransition(async () => {
      try {
        await deleteTopic(topic.id);
        toast({
          message: `“${topic.title}” deleted.`,
          variant: "info",
          action: {
            label: "Undo",
            onClick: () =>
              startTransition(async () => {
                try {
                  await restoreTopic({
                    title: topic.title,
                    notes: topic.notes,
                    loggedOn: topic.loggedOn,
                  });
                } catch (err) {
                  toast({ message: errorMessage(err), variant: "error" });
                }
              }),
          },
        });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
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
            {onDate.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="log-edit-row">
                  <div className="field">
                    <label htmlFor={`edit-title-${t.id}`}>Topic</label>
                    <input
                      id={`edit-title-${t.id}`}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`edit-notes-${t.id}`}>Notes <span className="opt">(optional)</span></label>
                    <input
                      id={`edit-notes-${t.id}`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="A line to jog your memory later"
                      autoComplete="off"
                    />
                  </div>
                  <div className="log-edit-actions">
                    <button
                      className="log-submit"
                      onClick={() => saveEdit(t.id)}
                      disabled={pending || !editTitle.trim()}
                    >
                      {pending ? "Saving…" : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingId(null)} disabled={pending}>
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li key={t.id}>
                  <div>
                    <span className="log-title-txt">{t.title}</span>
                    {t.notes && <span className="log-notes-txt">{t.notes}</span>}
                  </div>
                  <div className="log-row-actions">
                    <button
                      className="edit-btn"
                      onClick={() => beginEdit(t)}
                      disabled={pending}
                      aria-label={`Edit ${t.title}`}
                    >
                      Edit
                    </button>
                    <button
                      className="del-btn"
                      onClick={() => remove(t)}
                      disabled={pending}
                      aria-label={`Delete ${t.title}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
