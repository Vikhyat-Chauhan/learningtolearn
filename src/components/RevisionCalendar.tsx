"use client";

import { useMemo, useState, useTransition } from "react";
import { completeReview, uncompleteReview, deleteTopic } from "@/app/actions";
import {
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  dayNumber,
  formatDay,
  formatMonthTitle,
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

export default function RevisionCalendar({ topics, reviews }: Props) {
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [selected, setSelected] = useState<ISODate>(todayISO());
  const [pending, startTransition] = useTransition();

  const today = todayISO();

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

  const grid: ISODate[][] = mode === "month" ? monthMatrix(anchor) : [weekDays(anchor)];

  const move = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? addMonths(a, dir) : addDays(a, dir * 7)));

  const title = mode === "month" ? formatMonthTitle(anchor) : formatWeekTitle(anchor);

  const dueCount = (iso: ISODate) =>
    (reviewsByDay.get(iso) ?? []).filter((r) => !r.completed).length;
  const isOverdueDay = (iso: ISODate) => iso < today && dueCount(iso) > 0;

  const selectedTopics = topicsByDay.get(selected) ?? [];
  const selectedReviews = reviewsByDay.get(selected) ?? [];

  const toggleReview = (r: ReviewVM) =>
    startTransition(async () => {
      if (r.completed) await uncompleteReview(r.id);
      else await completeReview(r.id);
    });

  const removeTopic = (id: string) =>
    startTransition(async () => {
      await deleteTopic(id);
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

      <div className="cal-weekdays">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className={`cal-grid ${mode}`}>
        {grid.flat().map((iso) => {
          const logged = topicsByDay.get(iso)?.length ?? 0;
          const due = dueCount(iso);
          const dim = mode === "month" && !isSameMonth(iso, anchor);
          return (
            <button
              key={iso}
              className={[
                "cal-cell",
                dim ? "dim" : "",
                isToday(iso) ? "today" : "",
                selected === iso ? "selected" : "",
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

      <div className="day-detail">
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
                  <div>
                    <span className="log-title-txt">{t.title}</span>
                    {t.notes && <span className="log-notes-txt">{t.notes}</span>}
                  </div>
                  <button
                    className="del-btn"
                    onClick={() => removeTopic(t.id)}
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
    </section>
  );
}
