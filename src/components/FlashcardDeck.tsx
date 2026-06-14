"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cards } from "@/data/cards";
import Overview from "@/components/Overview";

// A gesture counts as a vertical swipe (vs a tap or a horizontal drag) when it
// moves further than this many pixels and is more vertical than horizontal.
const SWIPE_THRESHOLD = 60;

// Small circular-arrow glyph reused in both hints — the "retrieve" motif.
function RetrieveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 3v6h6" />
    </svg>
  );
}

export default function FlashcardDeck() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const revealBtnRef = useRef<HTMLButtonElement>(null);
  // Start point of the current touch, for swipe detection.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const card = cards[index];

  // Navigate with wrap-around; landing on a new card always shows the front.
  const go = useCallback((idx: number) => {
    setIndex((idx + cards.length) % cards.length);
    setFlipped(false);
  }, []);

  // Keyboard: ↑ reveals the overview, ↓/Esc dismisses it. Left/Right move
  // between cards, but only while the overview is closed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setOverviewOpen(true);
      else if (e.key === "ArrowDown" || e.key === "Escape") setOverviewOpen(false);
      else if (!overviewOpen && e.key === "ArrowRight") go(index + 1);
      else if (!overviewOpen && e.key === "ArrowLeft") go(index - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, go, overviewOpen]);

  // A single vertical swipe toggles the overview: up reveals, down dismisses.
  // The threshold keeps a tap (which flips the card) from triggering it.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dy) < SWIPE_THRESHOLD || Math.abs(dy) <= Math.abs(dx)) return;
    setOverviewOpen(dy < 0); // swipe up (dy negative) reveals; down dismisses
  };

  const toggleFlip = () => setFlipped((f) => !f);

  // The big front number: "00" and "★" render bare; the eight steps append "/08".
  const isBareNumber = card.num === "00" || card.num === "★";

  return (
    <main className="deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <svg className="curve" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        {/* the forgetting curve: retention decaying over time */}
        <path d="M0,40 C120,150 200,225 360,255 C520,282 720,292 1000,296" />
        {/* spaced reviews lifting it back up */}
        <path className="spaced" d="M250,232 L250,90 M500,275 L500,120 M750,288 L750,150" />
      </svg>

      <header className="deck-header">
        <div className="eyebrow">A deck for retrieval practice</div>
        <h1>
          How to actually <em>master</em> anything
        </h1>
      </header>

      <div className="scene">
        <div className="stack">
          <div
            ref={cardRef}
            className={`card${flipped ? " flipped" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Flashcard. Activate to flip."
            aria-pressed={flipped}
            onClick={toggleFlip}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                toggleFlip();
              }
            }}
          >
            <div className="face front">
              <div className="meta-row">
                <span className="step-label">{card.label}</span>
                <span className="step-num">
                  {card.num}
                  {!isBareNumber && <small>/08</small>}
                </span>
              </div>
              <div className="body">
                <p className="cue">{card.cue}</p>
              </div>
              <div className="hint">
                <RetrieveIcon />
                Tap the card to reveal
              </div>
            </div>

            <div className="face back">
              <div className="kicker">The method</div>
              <div className="body">
                <p className="answer" dangerouslySetInnerHTML={{ __html: card.answer }} />
                <span className="cite">{card.cite}</span>
              </div>
              <div className="hint">
                <RetrieveIcon />
                Tap to flip back
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="nav" aria-label="Previous card" onClick={() => go(index - 1)}>
          ←
        </button>
        <div className="center">
          <div className="counter">
            <span>{index + 1}</span> <span className="sep">/</span> <span>{cards.length}</span>
          </div>
          <div className="dots">
            {cards.map((_, idx) => (
              <button
                key={idx}
                className={`dot${idx === index ? " active" : ""}`}
                aria-label={`Go to card ${idx + 1}`}
                onClick={() => go(idx)}
              />
            ))}
          </div>
          <button className="flip-btn" onClick={toggleFlip}>
            Flip
          </button>
        </div>
        <button className="nav" aria-label="Next card" onClick={() => go(index + 1)}>
          →
        </button>
      </div>

      <button ref={revealBtnRef} className="reveal-btn" onClick={() => setOverviewOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" />
        </svg>
        <span>Swipe up for the field guide</span>
      </button>

      <Overview open={overviewOpen} onClose={() => setOverviewOpen(false)} triggerRef={revealBtnRef} />
    </main>
  );
}
