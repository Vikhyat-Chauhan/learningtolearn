"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { daysBetween, formatDay, todayISO } from "@/lib/dates";
import type { TopicVM, ReviewVM } from "@/lib/revision-types";
import TagInput from "@/components/TagInput";

type Props = {
  topic: TopicVM;
  /** All reviews for this topic, in ladder order. */
  reviews: ReviewVM[];
  /** Previously-used tags across all topics, for autosuggest in the edit form. */
  tagSuggestions: string[];
  pending: boolean;
  onClose: () => void;
  onToggleReview: (r: ReviewVM) => void;
  onDelete: (topic: TopicVM) => void;
  onSave: (topic: TopicVM, fields: { title: string; notes: string; tags: string[] }) => void;
};

// A slide-in panel showing one topic's full revision timeline: when it was
// covered and each rung of the spaced-repetition ladder with its status. Doubles
// as a single place to tick reviews off or delete the topic.
export default function TopicDetail({
  topic,
  reviews,
  tagSuggestions,
  pending,
  onClose,
  onToggleReview,
  onDelete,
  onSave,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);
  const editNotesRef = useRef<HTMLTextAreaElement>(null);
  useFocusTrap(panelRef, true);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editNotes, setEditNotes] = useState(topic.notes ?? "");
  const [editTags, setEditTags] = useState<string[]>(topic.tags);

  const today = todayISO();

  // Grow the notes textarea to fit its content: reset to auto so it can shrink,
  // then size to the scroll height.
  const autoGrow = () => {
    const el = editNotesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const startEdit = () => {
    setEditTitle(topic.title);
    setEditNotes(topic.notes ?? "");
    setEditTags(topic.tags);
    setEditing(true);
  };

  const saveEdit = () => {
    const title = editTitle.trim();
    if (!title) return;
    onSave(topic, { title, notes: editNotes.trim(), tags: editTags });
    setEditing(false);
  };

  // Focus the title field when the edit form opens, and size the notes textarea
  // to fit any prefilled notes (it only mounts once editing is true).
  useEffect(() => {
    if (editing) {
      editTitleRef.current?.focus();
      autoGrow();
    }
  }, [editing]);

  // Show one row per review rung. Each topic carries its own materialized reviews,
  // so the day-offset is derived from this review's own due date relative to when
  // the topic was covered — not a global ladder (which the user may have since
  // changed). Order by interval index, the rung order at log time.
  const ordered = [...reviews]
    .sort((a, b) => a.intervalIndex - b.intervalIndex)
    .map((review) => ({
      offset: daysBetween(topic.loggedOn, review.dueOn),
      idx: review.intervalIndex,
      review,
    }));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="td-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="td-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Topic: ${topic.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="td-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="eyebrow">Topic</div>
        {editing ? (
          <div className="td-edit">
            <div className="field">
              <label htmlFor="td-edit-title">Topic</label>
              <input
                id="td-edit-title"
                ref={editTitleRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="td-edit-notes">Notes <span className="opt">(optional)</span></label>
              <textarea
                id="td-edit-notes"
                ref={editNotesRef}
                value={editNotes}
                onChange={(e) => {
                  setEditNotes(e.target.value);
                  autoGrow();
                }}
                placeholder="A line to jog your memory later"
                autoComplete="off"
                rows={1}
              />
            </div>
            <div className="field">
              <label htmlFor="td-edit-tags">Tags <span className="opt">(optional)</span></label>
              <TagInput
                id="td-edit-tags"
                value={editTags}
                onChange={setEditTags}
                suggestions={tagSuggestions}
                placeholder="e.g. Statistics, Exam prep"
              />
            </div>
            <div className="td-edit-actions">
              <button className="log-submit" onClick={saveEdit} disabled={pending || !editTitle.trim()}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button className="btn-cancel" onClick={() => setEditing(false)} disabled={pending}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="td-title-row">
              <h3 className="td-title">{topic.title}</h3>
              <button className="td-edit-btn" onClick={startEdit} disabled={pending}>
                Edit
              </button>
            </div>
            {topic.notes && <p className="td-notes">{topic.notes}</p>}
            {topic.tags.length > 0 && (
              <ul className="tag-list">
                {topic.tags.map((tag) => (
                  <li key={tag} className="tag-pill">{tag}</li>
                ))}
              </ul>
            )}
          </>
        )}
        <p className="td-meta">Covered on {formatDay(topic.loggedOn)}</p>

        <h4 className="td-section">Revision timeline</h4>
        <ol className="td-ladder">
          {ordered.map(({ offset, idx, review }) => {
            const done = review?.completed ?? false;
            const overdue = !!review && !done && review.dueOn < today;
            const status = done ? "done" : overdue ? "overdue" : "upcoming";
            return (
              <li key={idx} className={`td-rung ${status}`}>
                <label className="td-rung-main">
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={pending || !review}
                    onChange={() => review && onToggleReview(review)}
                  />
                  <span className="td-rung-day">+{offset}d</span>
                  <span className="td-rung-date">
                    {review ? formatDay(review.dueOn) : "—"}
                  </span>
                </label>
                <span className={`td-rung-status ${status}`}>{status}</span>
              </li>
            );
          })}
        </ol>

        <button
          className="td-delete"
          disabled={pending}
          onClick={() => {
            onDelete(topic);
            onClose();
          }}
        >
          Delete topic
        </button>
      </div>
    </div>
  );
}
