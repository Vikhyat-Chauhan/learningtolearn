"use client";

import { useEffect, useRef, useState } from "react";
import FieldGuide from "@/components/FieldGuide";
import FlashcardDeck from "@/components/FlashcardDeck";

// A vertical swipe must exceed this and be more vertical than horizontal.
const SWIPE_THRESHOLD = 60;

// Owns the open/close state and the reveal gesture. The field guide is the
// landing; the flashcards slide up over it once the reader reaches the end.
export default function LearnApp() {
  const [flashOpen, setFlashOpen] = useState(false);
  const revealBtnRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // ↑ opens the flashcards, ↓ / Esc closes them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setFlashOpen(true);
      else if (e.key === "ArrowDown" || e.key === "Escape") setFlashOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
      <FieldGuide
        onReveal={() => setFlashOpen(true)}
        revealBtnRef={revealBtnRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
      <FlashcardDeck open={flashOpen} onClose={() => setFlashOpen(false)} triggerRef={revealBtnRef} />
    </>
  );
}
