"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { completeReview, uncompleteReview, deleteTopic, restoreTopic, updateTopic } from "@/app/actions";
import { useToast } from "@/components/Toast";
import TopicDetail from "@/components/TopicDetail";
import {
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  dayNumber,
  formatDay,
  formatMonthTitle,
  formatShort,
  formatWeekTitle,
  isSameMonth,
  isToday,
  monthMatrix,
  todayISO,
  weekDays,
  type ISODate,
} from "@/lib/dates";
import type { TopicVM, ReviewVM } from "@/lib/revision-types";

type Props = { topics: TopicVM[]; reviews: ReviewVM[] };
type Mode = "month" | "week";

function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/not signed in/i.test(msg)) return "Please sign in again.";
  return "Something went wrong. Please try again.";
}

export default function RevisionCalendar({ topics, reviews }: Props) {
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [selected, setSelected] = useState<ISODate>(todayISO());
  const [detailTopicId, setDetailTopicId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const today = todayISO();
  const cellRefs = useRef(new Map<ISODate, HTMLButtonElement>());
  const keyboardNav = useRef(false);

  const topicsByDay = useMemo(() => {
    const m = new Map<ISODate, TopicVM[]>();
    for (const t of topics) (m.get(t.loggedOn) ?? m.set(t.loggedOn, []).get(t.loggedOn)!).push(t);
    return m;
  }, [topics]);

  const reviewsByDay = useMemo(() => {
    const m = new Map<ISODate, ReviewVM[]>();
    for (const r of reviews) (m.get(r.dueOn) ?? m.set(r.dueOn, []).get(r.dueOn)!).push(r);
    return m;
  }, [reviews]);

  const reviewsByTopic = useMemo(() => {
    const m = new Map<string, ReviewVM[]>();
    for (const r of reviews) (m.get(r.topicId) ?? m.set(r.topicId, []).get(r.topicId)!).push(r);
    return m;
  }, [reviews]);

  const grid: ISODate[][] = mode === "month" ? monthMatrix(anchor) : [weekDays(anchor)];
  const flatDays = grid.flat();

  const move = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? addMonths(a, dir) : addDays(a, dir * 7)));

  const title = mode === "month" ? formatMonthTitle(anchor) : formatWeekTitle(anchor);

  const dueCount = (iso: ISODate) =>
    (reviewsByDay.get(iso) ?? []).filter((r) => !r.completed).length;
  const isOverdueDay = (iso: ISODate) => iso < today && dueCount(iso) > 0;

  const selectedTopics = topicsByDay.get(selected) ?? [];
  const selectedReviews = reviewsByDay.get(selected) ?? [];

  // Derive the open topic from props (not stored state) so the panel reflects
  // edits after the page revalidates.
  const detailTopic = detailTopicId ? topics.find((t) => t.id === detailTopicId) ?? null : null;

  // Keep the focused cell in sync after keyboard navigation moves the selection.
  useEffect(() => {
    if (!keyboardNav.current) return;
    keyboardNav.current = false;
    cellRefs.current.get(selected)?.focus();
  }, [selected]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: mode === "month" ? -7 : 0,
      ArrowDown: mode === "month" ? 7 : 0,
    };
    if (!(e.key in deltas)) return;
    const d = deltas[e.key];
    if (d === 0) return;
    e.preventDefault();
    const next = addDays(selected, d);
    keyboardNav.current = true;
    setSelected(next);
    // Scroll the calendar to the period that contains the new selection.
    if (mode === "month" && !isSameMonth(next, anchor)) setAnchor(next);
    else if (mode === "week" && !weekDays(anchor).includes(next)) setAnchor(next);
  };

  const toggleReview = (r: ReviewVM) =>
    startTransition(async () => {
      try {
        if (r.completed) await uncompleteReview(r.id);
        else await completeReview(r.id);
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });

  const removeTopic = (topic: TopicVM) => {
    const completedIntervals = (reviewsByTopic.get(topic.id) ?? [])
      .filter((r) => r.completed)
      .map((r) => r.intervalIndex);
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
                    completedIntervals,
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

  const saveTopic = (topic: TopicVM, fields: { title: string; notes: string }) =>
    startTransition(async () => {
      try {
        await updateTopic({ id: topic.id, title: fields.title, notes: fields.notes || null });
        toast({ message: "Topic updated.", variant: "success" });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });

  return (
    <section className="cal">
      <div className="cal-toolbar">
        <div className="cal-modes">
          <button className={`seg ${mode === "week" ? "active" : ""}`} onClick={() => setMode("week")}>Week</button>
          <button className={`seg ${mode === "month" ? "active" : ""}`} onClick={() => setMode("month")}>Month</button>
        </div>
        <div className="cal-nav">
          <button className="nav-sm" onClick={() => move(-1)} aria-label="Previous">‹</button>
          <span className="cal-title">{title}</span>
          <button className="nav-sm" onClick={() => move(1)} aria-label="Next">›</button>
          <button className="today-btn" onClick={() => { setAnchor(today); setSelected(today); }}>Today</button>
        </div>
      </div>

      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div
        className={`cal-grid ${mode}`}
        role="grid"
        aria-label="Revision calendar"
        onKeyDown={onGridKeyDown}
      >
        {flatDays.map((iso) => {
          const logged = topicsByDay.get(iso)?.length ?? 0;
          const due = dueCount(iso);
          const dim = mode === "month" && !isSameMonth(iso, anchor);
          const isSelected = selected === iso;
          return (
            <button
              key={iso}
              ref={(el) => {
                if (el) cellRefs.current.set(iso, el);
                else cellRefs.current.delete(iso);
              }}
              role="gridcell"
              aria-label={`${formatDay(iso)}${logged ? `, ${logged} logged` : ""}${due ? `, ${due} due` : ""}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className={[
                "cal-cell",
                dim ? "dim" : "",
                isToday(iso) ? "today" : "",
                isSelected ? "selected" : "",
                isOverdueDay(iso) ? "overdue" : "",
              ].join(" ")}
              onClick={() => setSelected(iso)}
            >
              <span className="cell-num">{dayNumber(iso)}</span>
              <span className="cell-badges">
                {logged > 0 && <span className="badge logged" title={`${logged} logged`}>{logged}</span>}
                {due > 0 && <span className="badge due" title={`${due} due`}>{due}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact agenda list — only shown on narrow screens (CSS-toggled). It
          surfaces just the days that have activity so phones avoid the grid. */}
      <ul className="cal-agenda" aria-label="Days with activity this period">
        {flatDays
          .filter((iso) => (topicsByDay.get(iso)?.length ?? 0) > 0 || dueCount(iso) > 0)
          .map((iso) => {
            const logged = topicsByDay.get(iso)?.length ?? 0;
            const due = dueCount(iso);
            return (
              <li key={iso}>
                <button
                  className={`agenda-row ${selected === iso ? "selected" : ""} ${isOverdueDay(iso) ? "overdue" : ""}`}
                  onClick={() => setSelected(iso)}
                >
                  <span className="agenda-date">
                    {formatShort(iso)}
                    {isToday(iso) && <span className="agenda-today">today</span>}
                  </span>
                  <span className="cell-badges">
                    {logged > 0 && <span className="badge logged">{logged}</span>}
                    {due > 0 && <span className="badge due">{due}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        {flatDays.every((iso) => (topicsByDay.get(iso)?.length ?? 0) === 0 && dueCount(iso) === 0) && (
          <li className="agenda-empty muted">Nothing scheduled this {mode}.</li>
        )}
      </ul>

      <div className={`day-detail${pending ? " is-pending" : ""}`}>
        <h3>{formatDay(selected)}</h3>

        <div className="dd-block">
          <h4>Due for revision</h4>
          {selectedReviews.length === 0 ? (
            <p className="muted">No reviews due.</p>
          ) : (
            <ul className="dd-reviews">
              {selectedReviews.map((r) => {
                const overdue = !r.completed && r.dueOn < today;
                return (
                  <li key={r.id} className={overdue ? "is-overdue" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={r.completed}
                        disabled={pending}
                        onChange={() => toggleReview(r)}
                      />
                      <span className={r.completed ? "done" : ""}>{r.topicTitle}</span>
                    </label>
                    {overdue && <span className="overdue-tag">overdue</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dd-block">
          <h4>Logged this day</h4>
          {selectedTopics.length === 0 ? (
            <p className="muted">Nothing logged.</p>
          ) : (
            <ul className="dd-topics">
              {selectedTopics.map((t) => (
                <li key={t.id}>
                  <button
                    className="dd-topic-open"
                    onClick={() => setDetailTopicId(t.id)}
                    aria-label={`View details for ${t.title}`}
                  >
                    <span className="log-title-txt">{t.title}</span>
                    {t.notes && <span className="log-notes-txt">{t.notes}</span>}
                  </button>
                  <button
                    className="del-btn"
                    onClick={() => removeTopic(t)}
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
      </div>

      {detailTopic && (
        <TopicDetail
          topic={detailTopic}
          reviews={reviewsByTopic.get(detailTopic.id) ?? []}
          pending={pending}
          onClose={() => setDetailTopicId(null)}
          onToggleReview={toggleReview}
          onDelete={removeTopic}
          onSave={saveTopic}
        />
      )}
    </section>
  );
}
