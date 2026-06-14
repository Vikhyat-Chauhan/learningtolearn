"use client";

import { type RefObject } from "react";
import {
  overviewPrinciple,
  overviewItems,
  overviewDo,
  overviewAvoid,
  overviewCite,
} from "@/data/overview";

type Props = {
  /** Reveal the flashcards sheet. */
  onReveal: () => void;
  /** Ref on the reveal button so focus can return here when the sheet closes. */
  revealBtnRef: RefObject<HTMLButtonElement | null>;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

// The landing view — a native HTML recreation of mastery-half-page.pdf. The
// flashcards live behind the reveal affordance at the bottom (swipe up / button).
export default function FieldGuide({ onReveal, revealBtnRef, onTouchStart, onTouchEnd }: Props) {
  return (
    <main className="guide" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="overview-inner">
        <header className="overview-head">
          <div className="eyebrow">An evidence-based field guide</div>
          <h2>
            How to actually <em>master</em> anything
          </h2>
          <p className="overview-principle">{overviewPrinciple}</p>
        </header>

        <div className="overview-grid">
          {overviewItems.map((item) => (
            <div className="ov-cell" key={item.num}>
              <div className="ov-num">{item.num}</div>
              <h3 className="ov-title">{item.title}</h3>
              <p className="ov-desc">{item.desc}</p>
              <span className="ov-tag">{item.tag}</span>
            </div>
          ))}
        </div>

        <footer className="overview-foot">
          <p>
            <span className="foot-key do">DO →</span> {overviewDo}
          </p>
          <p>
            <span className="foot-key avoid">AVOID →</span> {overviewAvoid}
          </p>
          <p className="overview-cite">{overviewCite}</p>
        </footer>

        <button ref={revealBtnRef} className="reveal-btn" onClick={onReveal} aria-haspopup="dialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          <span>Swipe up for the flashcards</span>
        </button>
      </div>
    </main>
  );
}
