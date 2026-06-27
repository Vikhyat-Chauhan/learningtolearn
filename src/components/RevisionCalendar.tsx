"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { completeReview, uncompleteReview, deleteTopic, restoreTopic, updateTopic, logTopic } from "@/app/actions";
import { useToast } from "@/components/Toast";
import TopicDetail from "@/components/TopicDetail";
import AddTopic from "@/components/AddTopic";
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

type Props = {
  topics: TopicVM[];
  reviews: ReviewVM[];
  reviewLadder: number[];
  surface?: "today" | "calendar";
};
type Mode = "month" | "week";

function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/not signed in/i.test(msg)) return "Please sign in again.";
  return "Something went wrong. Please try again.";
}

export default function RevisionCalendar({ topics, reviews, reviewLadder, surface = "calendar" }: Props) {
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [selected, setSelected] = useState<ISODate>(todayISO());
  const [detailTopicId, setDetailTopicId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Tags currently selected in the filter bar (lowercased for case-insensitive
  // matching). Empty = no filter, show everything.
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const today = todayISO();
  const cellRefs = useRef(new Map<ISODate, HTMLButtonElement>());
  const keyboardNav = useRef(false);

  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);

  // The distinct set of tags in use, for the filter bar and form autosuggest.
  // Deduped case-insensitively (first-seen casing wins), sorted alphabetically.
  const allTags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of topics)
      for (const tag of t.tags) {
        const key = tag.toLowerCase();
        if (!seen.has(key)) seen.set(key, tag);
      }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [topics]);

  // A topic passes the filter if no tags are selected, or it carries any active tag.
  const tagMatch = (t: TopicVM) =>
    activeTags.size === 0 || t.tags.some((tag) => activeTags.has(tag.toLowerCase()));

  // Source data narrowed by the active tag filter. Reviews inherit their topic's
  // match so the calendar badges and day-detail lists stay consistent.
  const filteredTopics = useMemo(
    () => topics.filter(tagMatch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topics, activeTags],
  );
  const filteredReviews = useMemo(
    () => {
      if (activeTags.size === 0) return reviews;
      return reviews.filter((r) => {
        const t = topicById.get(r.topicId);
        return t ? tagMatch(t) : false;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviews, topicById, activeTags],
  );

  const topicsByDay = useMemo(() => {
    const m = new Map<ISODate, TopicVM[]>();
    for (const t of filteredTopics) (m.get(t.loggedOn) ?? m.set(t.loggedOn, []).get(t.loggedOn)!).push(t);
    return m;
  }, [filteredTopics]);

  const reviewsByDay = useMemo(() => {
    const m = new Map<ISODate, ReviewVM[]>();
    for (const r of filteredReviews) (m.get(r.dueOn) ?? m.set(r.dueOn, []).get(r.dueOn)!).push(r);
    return m;
  }, [filteredReviews]);

  // Keyed off the full review set (not the filter) — the detail panel and undo
  // need a topic's complete ladder regardless of what's currently filtered.
  const reviewsByTopic = useMemo(() => {
    const m = new Map<string, ReviewVM[]>();
    for (const r of reviews) (m.get(r.topicId) ?? m.set(r.topicId, []).get(r.topicId)!).push(r);
    return m;
  }, [reviews]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) => {
      const key = tag.toLowerCase();
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const grid: ISODate[][] = mode === "month" ? monthMatrix(anchor) : [weekDays(anchor)];
  const flatDays = grid.flat();

  const move = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? addMonths(a, dir) : addDays(a, dir * 7)));

  const title = mode === "month" ? formatMonthTitle(anchor) : formatWeekTitle(anchor);

  const dueCount = (iso: ISODate) =>
    (reviewsByDay.get(iso) ?? []).filter((r) => !r.completed).length;
  const isOverdueDay = (iso: ISODate) => iso < today && dueCount(iso) > 0;

  const selectedTopics = topicsByDay.get(selected) ?? [];
  const selectedReviews = [...(reviewsByDay.get(selected) ?? [])].sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );

  // Derive the open topic from props (not stored state) so the panel reflects
  // edits after the page revalidates.
  const detailTopic = detailTopicId ? topics.find((t) => t.id === detailTopicId) ?? null : null;

  // The Today surface has no grid — pin the selection to today so adds/edits and
  // the day detail always target the current day.
  useEffect(() => {
    if (surface === "today") {
      setSelected(today);
      setAnchor(today);
    }
  }, [surface, today]);

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
                    tags: topic.tags,
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

  const saveTopic = (topic: TopicVM, fields: { title: string; notes: string; tags: string[] }) =>
    startTransition(async () => {
      try {
        await updateTopic({ id: topic.id, title: fields.title, notes: fields.notes || null, tags: fields.tags });
        toast({ message: "Topic updated.", variant: "success" });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });

  const addTopic = (fields: { title: string; notes: string; tags: string[] }) =>
    startTransition(async () => {
      try {
        await logTopic({ title: fields.title, notes: fields.notes || undefined, tags: fields.tags, loggedOn: selected });
        setAdding(false);
        toast({
          message: `“${fields.title}” logged — first review ${formatShort(addDays(selected, reviewLadder[0]))}.`,
          variant: "success",
        });
      } catch (err) {
        toast({ message: errorMessage(err), variant: "error" });
      }
    });

  return (
    <section className={`cal ${surface === "today" ? "cal-today" : ""}`}>
      {surface === "calendar" && (
        <>
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
        </>
      )}

      {allTags.length > 0 && (
        <div className="tag-filter" role="group" aria-label="Filter by tag">
          {allTags.map((tag) => {
            const on = activeTags.has(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                className={`tag-filter-chip ${on ? "active" : ""}`}
                aria-pressed={on}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            );
          })}
          {activeTags.size > 0 && (
            <button type="button" className="tag-filter-clear" onClick={() => setActiveTags(new Set())}>
              Clear
            </button>
          )}
        </div>
      )}

      <div className={`day-detail${pending ? " is-pending" : ""}`}>
        <h3>{isToday(selected) ? `Today · ${formatShort(selected)}` : formatDay(selected)}</h3>

        <div className="dd-block">
          <h4>Due for revision</h4>
          {selectedReviews.length === 0 ? (
            <p className="muted">No reviews due.</p>
          ) : (
            <ul className="dd-topics">
              {selectedReviews.map((r) => {
                const overdue = !r.completed && r.dueOn < today;
                const topic = topicById.get(r.topicId);
                return (
                  <li key={r.id} className={overdue ? "is-overdue" : ""}>
                    <button
                      className="dd-topic-open"
                      onClick={() => setDetailTopicId(r.topicId)}
                      aria-label={`View details for ${r.topicTitle}`}
                    >
                      <span className={`log-title-txt ${r.completed ? "done" : ""}`}>{r.topicTitle}</span>
                      {topic?.notes && <span className="log-notes-txt">{topic.notes}</span>}
                      {topic && topic.tags.length > 0 && (
                        <span className="tag-list">
                          {topic.tags.map((tag) => (
                            <span key={tag} className="tag-pill">{tag}</span>
                          ))}
                        </span>
                      )}
                    </button>
                    {overdue && <span className="overdue-tag">overdue</span>}
                    <input
                      type="checkbox"
                      className="dd-check"
                      checked={r.completed}
                      disabled={pending}
                      onChange={() => toggleReview(r)}
                      aria-label={`Mark ${r.topicTitle} reviewed`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dd-block">
          <div className="dd-block-head">
            <h4>Logged this day</h4>
            {selected <= today && (
              <button className="dd-add" onClick={() => setAdding(true)} disabled={pending}>
                + Add topic
              </button>
            )}
          </div>
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
                    {t.tags.length > 0 && (
                      <span className="tag-list">
                        {t.tags.map((tag) => (
                          <span key={tag} className="tag-pill">{tag}</span>
                        ))}
                      </span>
                    )}
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
          tagSuggestions={allTags}
          pending={pending}
          onClose={() => setDetailTopicId(null)}
          onToggleReview={toggleReview}
          onDelete={removeTopic}
          onSave={saveTopic}
        />
      )}

      {adding && (
        <AddTopic
          day={selected}
          reviewLadder={reviewLadder}
          tagSuggestions={allTags}
          pending={pending}
          onClose={() => setAdding(false)}
          onSubmit={addTopic}
        />
      )}
    </section>
  );
}
