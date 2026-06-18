"use client";

import type { UserVM } from "@/lib/revision-types";

export type View = "learn" | "revision";
export type RevSurface = "today" | "calendar";

type Props = {
  view: View;
  onChangeView: (v: View) => void;
  surface: RevSurface;
  onChangeSurface: (s: RevSurface) => void;
  user: UserVM | null;
  onOpenSettings: () => void;
};

// Full-width sticky app bar. Holds the brand, the Learn/Revision switch, a
// Today/Calendar switch (only inside Revision, when signed in), and the account
// name + Sign out. Replaces the old centered pill nav.
export default function TopNav({ view, onChangeView, surface, onChangeSurface, user, onOpenSettings }: Props) {
  const showSurface = view === "revision" && !!user;

  return (
    <header className="topnav">
      <div className="topnav-brand">learningtolearn</div>

      <nav className="topnav-views" aria-label="Primary">
        <button
          className={`tab ${view === "learn" ? "active" : ""}`}
          aria-pressed={view === "learn"}
          onClick={() => onChangeView("learn")}
        >
          Learn
        </button>
        <button
          className={`tab ${view === "revision" ? "active" : ""}`}
          aria-pressed={view === "revision"}
          onClick={() => onChangeView("revision")}
        >
          Revision
        </button>
      </nav>

      <div className="topnav-right">
        {showSurface && (
          <div className="topnav-surface" role="group" aria-label="Revision view">
            <button
              className={`seg ${surface === "today" ? "active" : ""}`}
              aria-pressed={surface === "today"}
              onClick={() => onChangeSurface("today")}
            >
              Today
            </button>
            <button
              className={`seg ${surface === "calendar" ? "active" : ""}`}
              aria-pressed={surface === "calendar"}
              onClick={() => onChangeSurface("calendar")}
            >
              Calendar
            </button>
          </div>
        )}

        {user && (
          <div className="topnav-account">
            <span className="topnav-name">{user.name ?? user.email}</span>
            <button className="link-btn" type="button" onClick={onOpenSettings}>
              Settings
            </button>
            <form action="/auth/signout" method="post">
              <button className="link-btn" type="submit">Sign out</button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
