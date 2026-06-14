"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  overviewPrinciple,
  overviewItems,
  overviewDo,
  overviewAvoid,
  overviewCite,
} from "@/data/overview";

type Props = {
  open: boolean;
  onClose: () => void;
  /** The control that opened the sheet — focus returns here on close. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

// The "field guide" — a native HTML recreation of mastery-half-page.pdf, shown
// as a sheet that slides up over the deck. Content parity with the PDF.
export default function Overview({ open, onClose, triggerRef }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Move focus to the close button when the sheet opens; return it to the
  // trigger when it closes (standard dialog focus management).
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef?.current?.focus();
    }
  }, [open, triggerRef]);

  return (
    <section
      className={`overview${open ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Field guide overview"
      // inert keeps the closed sheet out of the tab order AND the AT tree, and
      // (unlike aria-hidden) safely blurs any focused descendant.
      inert={!open}
    >
      <div className="overview-inner">
        <button ref={closeRef} className="overview-close" aria-label="Close overview" onClick={onClose}>
          ×
        </button>

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
      </div>
    </section>
  );
}
