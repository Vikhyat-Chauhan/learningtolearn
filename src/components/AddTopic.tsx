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
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(panelRef, true);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // True once the user has typed anything worth protecting from an accidental
  // dismissal.
  const isDirty = title.trim() !== "" || notes.trim() !== "";

  // Grow the notes textarea to fit its content: reset to auto so it can shrink,
  // then size to the scroll height.
  const autoGrow = () => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    onSubmit({ title: t, notes: notes.trim() });
  };

  // Guard dismissals: if there's unsaved input, ask before closing.
  const requestClose = () => {
    if (isDirty && !pending) setShowConfirm(true);
    else onClose();
  };

  // Focus the title field on open and wire up Esc handling. While the confirm
  // popup is open, Esc dismisses the popup ("keep editing") rather than the panel.
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showConfirm) setShowConfirm(false);
      else requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, showConfirm, isDirty, pending]);

  // Set the initial textarea height for any prefilled notes.
  useEffect(() => {
    autoGrow();
  }, []);

  // Move focus to the safe choice when the confirm popup opens.
  useEffect(() => {
    if (showConfirm) keepEditingRef.current?.focus();
  }, [showConfirm]);

  const ladderPreview = reviewLadder.map((d) => formatShort(addDays(day, d))).join(", ");

  return (
    <div className="td-overlay" onClick={requestClose}>
      <div
        ref={panelRef}
        className="td-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Add topic covered on ${formatDay(day)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="td-close" aria-label="Close" onClick={requestClose}>
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
            <textarea
              id="add-notes"
              ref={notesRef}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                autoGrow();
              }}
              placeholder="A line to jog your memory later"
              autoComplete="off"
              rows={1}
            />
          </div>
          <div className="td-edit-actions">
            <button className="log-submit" type="submit" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : "Add"}
            </button>
            <button className="btn-cancel" type="button" onClick={requestClose} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>

        <p className="ladder-hint">
          Reviews will surface on <strong>{ladderPreview}</strong>.
        </p>

        {showConfirm && (
          <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
            <div
              className="confirm-box"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="add-confirm-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="add-confirm-title" className="confirm-title">
                Discard this topic?
              </h3>
              <p className="confirm-text">
                You&apos;ve started filling this in. If you leave now, your topic and
                notes won&apos;t be saved.
              </p>
              <div className="confirm-actions">
                <button
                  ref={keepEditingRef}
                  className="btn-cancel"
                  type="button"
                  onClick={() => setShowConfirm(false)}
                >
                  Keep editing
                </button>
                <button className="confirm-discard" type="button" onClick={onClose}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
