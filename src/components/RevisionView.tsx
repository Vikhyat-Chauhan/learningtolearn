"use client";

import { useState } from "react";
import RevisionCalendar from "@/components/RevisionCalendar";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import { DEFAULT_LADDER } from "@/lib/spacing";
import type { RevSurface } from "@/components/TopNav";
import type { TopicVM, ReviewVM, UserVM } from "@/lib/revision-types";

type Props = {
  user: UserVM | null;
  topics: TopicVM[];
  reviews: ReviewVM[];
  reviewLadder: number[];
  authError: string | null;
  surface: RevSurface;
};

// Friendly copy for the error codes the OAuth callback can redirect with.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Sign-in didn't complete — no authorization code came back. Please try again.",
  auth_failed: "We couldn't sign you in with Google. Please try again.",
  profile_failed: "You're signed in, but we couldn't set up your profile. Please try again.",
};

// The Revision surface. Signed out, it pitches the feature and offers Google
// sign-in. Signed in, it shows the spaced-repetition calendar — adding topics
// happens contextually per day from within it (data fetched server-side and
// passed down).
export default function RevisionView({ user, topics, reviews, reviewLadder, authError, surface }: Props) {
  const [dismissedError, setDismissedError] = useState(false);
  const errorMessage =
    authError && !dismissedError
      ? AUTH_ERROR_MESSAGES[authError] ?? "Something went wrong. Please try again."
      : null;

  return (
    <main className="rev">
      <div className="rev-inner">
        {errorMessage && (
          <div className="rev-error" role="alert">
            <span>{errorMessage}</span>
            <button
              className="rev-error-close"
              aria-label="Dismiss"
              onClick={() => setDismissedError(true)}
            >
              ×
            </button>
          </div>
        )}
        {user ? (
          <>
            {topics.length === 0 && (
              <p className="rev-empty">
                Tap <strong>+ Add topic</strong> to log what you learned today and start your
                revision schedule.
              </p>
            )}
            <RevisionCalendar topics={topics} reviews={reviews} reviewLadder={reviewLadder} surface={surface} />
          </>
        ) : (
          <>
            <header className="rev-head">
              <div className="eyebrow">Spaced repetition</div>
              <h2>
                Log what you learned. <em>Revise</em> it on schedule.
              </h2>
              <p className="rev-principle">
                Note each topic the day you cover it. We resurface it on a forgetting-curve
                ladder — {DEFAULT_LADDER.map((d) => `+${d}`).join(", ")} days — so it sticks.
              </p>
            </header>
            <div className="rev-signin">
              <p>Sign in to log topics and keep your revision schedule synced across devices.</p>
              <SignInWithGoogle />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
