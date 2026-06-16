"use client";

import { useEffect, useRef, useState } from "react";
import FieldGuide from "@/components/FieldGuide";
import FlashcardDeck from "@/components/FlashcardDeck";
import ViewTabs, { type View } from "@/components/ViewTabs";
import RevisionView from "@/components/RevisionView";
import type { TopicVM, ReviewVM, UserVM } from "@/lib/revision-types";

// A vertical swipe must exceed this and be more vertical than horizontal.
const SWIPE_THRESHOLD = 60;

type Props = {
  initialView: View;
  user: UserVM | null;
  topics: TopicVM[];
  reviews: ReviewVM[];
};

// Top-level shell. Owns the Learn/Revision view switch plus the flashcard
// reveal gesture. In the Learn view the field guide is the landing and the
// flashcards slide up over it; the Revision view is a separate full-page
// surface for logging topics and the spaced-repetition calendar.
export default function LearnApp({ initialView, user, topics, reviews }: Props) {
  const [view, setView] = useState<View>(initialView);
  const [flashOpen, setFlashOpen] = useState(false);
  const revealBtnRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // ↑ opens the flashcards, ↓ / Esc closes them — only relevant in the Learn view.
  useEffect(() => {
    if (view !== "learn") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setFlashOpen(true);
      else if (e.key === "ArrowDown" || e.key === "Escape") setFlashOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  // Reveal the flashcards on a swipe up — but only once the guide is scrolled to
  // the bottom, so mid-page swipes just scroll the guide as expected.
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const isSwipeUp = -dy >= SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx);
    if (!isSwipeUp) return;
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
    if (atBottom) setFlashOpen(true);
  };

  return (
    <>
      <ViewTabs view={view} onChange={setView} />

      {view === "learn" ? (
        <>
          <FieldGuide
            onReveal={() => setFlashOpen(true)}
            revealBtnRef={revealBtnRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
          <FlashcardDeck open={flashOpen} onClose={() => setFlashOpen(false)} triggerRef={revealBtnRef} />
        </>
      ) : (
        <RevisionView user={user} topics={topics} reviews={reviews} />
      )}
    </>
  );
}
