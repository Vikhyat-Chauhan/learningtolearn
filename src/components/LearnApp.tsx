"use client";

import { useEffect, useRef, useState } from "react";
import FieldGuide from "@/components/FieldGuide";
import FlashcardDeck from "@/components/FlashcardDeck";
import TopNav, { type View, type RevSurface } from "@/components/TopNav";
import RevisionView from "@/components/RevisionView";
import SettingsModal from "@/components/SettingsModal";
import { ToastProvider } from "@/components/Toast";
import type { TopicVM, ReviewVM, UserVM } from "@/lib/revision-types";

// A vertical swipe must exceed this and be more vertical than horizontal.
const SWIPE_THRESHOLD = 60;

// localStorage flag so the swipe-up onboarding hint shows only on first visit.
const SWIPE_HINT_KEY = "mf-swipe-hint-seen";

type Props = {
  initialView: View;
  user: UserVM | null;
  topics: TopicVM[];
  reviews: ReviewVM[];
  reviewLadder: number[];
  authError: string | null;
};

// Top-level shell. Owns the Learn/Revision view switch plus the flashcard
// reveal gesture. In the Learn view the field guide is the landing and the
// flashcards slide up over it; the Revision view is a separate full-page
// surface for logging topics and the spaced-repetition calendar.
export default function LearnApp({ initialView, user, topics, reviews, reviewLadder, authError }: Props) {
  const [view, setView] = useState<View>(initialView);
  const [revSurface, setRevSurface] = useState<RevSurface>("today");
  // Live copy of the ladder so previews update immediately after a save, before
  // the server revalidation re-renders the page with fresh props.
  const [ladder, setLadder] = useState<number[]>(reviewLadder);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [revealBtnVisible, setRevealBtnVisible] = useState(true);
  const revealBtnRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Re-sync the live ladder when the server sends fresh props (e.g. after the
  // save revalidates the page).
  useEffect(() => {
    setLadder(reviewLadder);
  }, [reviewLadder]);

  // Show the swipe-up hint once, the first time a visitor lands on the guide.
  useEffect(() => {
    if (view !== "learn") return;
    try {
      if (!localStorage.getItem(SWIPE_HINT_KEY)) setShowSwipeHint(true);
    } catch {
      /* private mode / storage disabled — just skip the hint */
    }
  }, [view]);

  // Track whether the in-flow reveal button is on screen. The fixed hint pill
  // duplicates that button, so we only surface it while the button is scrolled
  // out of view — never both at once (which read as a rendering glitch).
  useEffect(() => {
    if (view !== "learn") return;
    const btn = revealBtnRef.current;
    if (!btn) return;
    const observer = new IntersectionObserver(
      ([entry]) => setRevealBtnVisible(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(btn);
    return () => observer.disconnect();
  }, [view]);

  // Dismiss the hint once the deck has been opened (gesture learned).
  useEffect(() => {
    if (!flashOpen || !showSwipeHint) return;
    setShowSwipeHint(false);
    try {
      localStorage.setItem(SWIPE_HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [flashOpen, showSwipeHint]);

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
    <ToastProvider>
      <TopNav
        view={view}
        onChangeView={setView}
        surface={revSurface}
        onChangeSurface={setRevSurface}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {view === "learn" ? (
        <>
          <FieldGuide
            onReveal={() => setFlashOpen(true)}
            revealBtnRef={revealBtnRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
          {showSwipeHint && !flashOpen && !revealBtnVisible && (
            <button
              className="swipe-hint"
              onClick={() => setFlashOpen(true)}
              aria-label="Open the flashcards"
            >
              <span className="swipe-hint-arrow" aria-hidden="true">↑</span>
              Swipe up for the flashcards
            </button>
          )}
          <FlashcardDeck open={flashOpen} onClose={() => setFlashOpen(false)} triggerRef={revealBtnRef} />
        </>
      ) : (
        <RevisionView user={user} topics={topics} reviews={reviews} reviewLadder={ladder} authError={authError} surface={revSurface} />
      )}

      {user && settingsOpen && (
        <SettingsModal
          reviewLadder={ladder}
          onClose={() => setSettingsOpen(false)}
          onSaved={setLadder}
        />
      )}
    </ToastProvider>
  );
}
