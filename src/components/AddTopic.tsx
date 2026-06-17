"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { addDays, formatDay, formatShort, type ISODate } from "@/lib/dates";

type Props = {
  /** The day the topic will be logged against (the selected calendar cell). */
  day: ISODate;
  /** The user's current review ladder, for the schedule preview. */
  reviewLadder: number[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (fields: { title: string; notes: string }) => void;
};

// A slide-in panel for logging a new topic against the selected calendar day.
// Mirrors TopicDetail's overlay shell so it shares the look, focus trap, and
// Esc-to-close behaviour.
export default function AddTopic({ day, reviewLadder, pending, onClose, onSubmit }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  useFocusTrap(panelRef, true);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    onSubmit({ title: t, notes: notes.trim() });
  };

  // Focus the title field on open and wire up Esc-to-close.
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ladderPreview = reviewLadder.map((d) => formatShort(addDays(day, d))).join(", ");

  return (
    <div className="td-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="td-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Add topic covered on ${formatDay(day)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="td-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="eyebrow">Add topic</div>
        <p className="td-meta">Covered on {formatDay(day)}</p>

        <form className="td-edit" onSubmit={submit}>
          <div className="field">
            <label htmlFor="add-title">Topic</label>
            <input
              id="add-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bayes' theorem"
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="add-notes">Notes <span className="opt">(optional)</span></label>
            <input
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="A line to jog your memory later"
              autoComplete="off"
            />
          </div>
          <div className="td-edit-actions">
            <button className="log-submit" type="submit" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : "Add"}
            </button>
            <button className="btn-cancel" type="button" onClick={onClose} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>

        <p className="ladder-hint">
          Reviews will surface on <strong>{ladderPreview}</strong>.
        </p>
      </div>
    </div>
  );
}
