"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useToast } from "@/components/Toast";
import { updateReviewLadder } from "@/app/actions";
import { MAX_DAY, MAX_RUNGS, validateLadder } from "@/lib/spacing";
import { addDays, formatShort, todayISO } from "@/lib/dates";

type Props = {
  /** The user's current ladder (day offsets). */
  reviewLadder: number[];
  onClose: () => void;
  /** Called with the saved ladder so the parent can update its live copy. */
  onSaved: (ladder: number[]) => void;
};

// Modal editor for the user's forgetting-curve ladder. Each row is one review
// interval (in days). Values can be edited, added, or removed; the schedule is
// previewed from today. Saving persists via updateReviewLadder. Mirrors
// TopicDetail's overlay shell for a consistent look, focus trap, and Esc-to-close.
export default function SettingsModal({ reviewLadder, onClose, onSaved }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(panelRef, true);
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  // Edit as strings so a field can be momentarily empty while typing.
  const [rows, setRows] = useState<string[]>(() => reviewLadder.map(String));

  const today = todayISO();

  // Validate on every change; `error` drives the inline message + Save disabled.
  const { error, parsed } = useMemo(() => {
    const nums = rows.map((r) => Number(r.trim()));
    if (rows.some((r) => r.trim() === "")) {
      return { error: "Fill in every interval.", parsed: null as number[] | null };
    }
    try {
      return { error: null as string | null, parsed: validateLadder(nums) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid intervals.", parsed: null };
    }
  }, [rows]);

  const unchanged =
    !!parsed &&
    parsed.length === reviewLadder.length &&
    parsed.every((n, i) => n === reviewLadder[i]);

  const setRow = (i: number, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? value : r)));

  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const addRow = () =>
    setRows((rs) => {
      const last = Number(rs[rs.length - 1]);
      const next = Number.isFinite(last) ? Math.min(last + 1, MAX_DAY) : 1;
      return [...rs, String(next)];
    });

  const save = () => {
    if (!parsed || unchanged) return;
    startTransition(async () => {
      try {
        await updateReviewLadder(parsed);
        onSaved(parsed);
        toast({ message: "Forgetting curve updated.", variant: "success" });
        onClose();
      } catch (err) {
        toast({
          message: err instanceof Error ? err.message : "Couldn't save. Please try again.",
          variant: "error",
        });
      }
    });
  };

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
        aria-label="Forgetting curve settings"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="td-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="eyebrow">Settings</div>
        <h3 className="td-title">Forgetting curve</h3>
        <p className="td-notes">
          Days after a topic is covered when it resurfaces for review. Changes apply to
          topics you log from now on — already-scheduled reviews stay put.
        </p>

        <h4 className="td-section">Review intervals</h4>
        <ul className="curve-rows">
          {rows.map((value, i) => (
            <li key={i} className="curve-row">
              <span className="curve-label">Day</span>
              <input
                className="curve-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DAY}
                value={value}
                onChange={(e) => setRow(i, e.target.value)}
                aria-label={`Interval ${i + 1}, in days`}
              />
              <span className="curve-preview">
                {value.trim() !== "" && Number.isFinite(Number(value))
                  ? formatShort(addDays(today, Number(value)))
                  : "—"}
              </span>
              <button
                className="curve-remove"
                onClick={() => removeRow(i)}
                disabled={pending || rows.length <= 1}
                aria-label={`Remove interval ${i + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <button
          className="curve-add"
          onClick={addRow}
          disabled={pending || rows.length >= MAX_RUNGS}
        >
          + Add interval
        </button>

        {error && <p className="curve-error" role="alert">{error}</p>}

        <div className="td-edit-actions">
          <button className="log-submit" onClick={save} disabled={pending || !parsed || unchanged}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={pending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
