"use client";

export type View = "learn" | "revision";

type Props = {
  view: View;
  onChange: (v: View) => void;
};

// Small fixed pill nav that toggles between the Learn experience (field guide +
// flashcards) and the Revision experience (logger + calendar).
export default function ViewTabs({ view, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="Primary">
      <button
        className={`tab ${view === "learn" ? "active" : ""}`}
        aria-pressed={view === "learn"}
        onClick={() => onChange("learn")}
      >
        Learn
      </button>
      <button
        className={`tab ${view === "revision" ? "active" : ""}`}
        aria-pressed={view === "revision"}
        onClick={() => onChange("revision")}
      >
        Revision
      </button>
    </nav>
  );
}
