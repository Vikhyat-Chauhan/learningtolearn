"use client";

import { useState } from "react";
import TopicLogger from "@/components/TopicLogger";
import RevisionCalendar from "@/components/RevisionCalendar";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import { REVIEW_LADDER } from "@/lib/spacing";
import type { TopicVM, ReviewVM, UserVM } from "@/lib/revision-types";

type Props = {
  user: UserVM | null;
  topics: TopicVM[];
  reviews: ReviewVM[];
  authError: string | null;
};

// Friendly copy for the error codes the OAuth callback can redirect with.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Sign-in didn't complete — no authorization code came back. Please try again.",
  auth_failed: "We couldn't sign you in with Google. Please try again.",
  profile_failed: "You're signed in, but we couldn't set up your profile. Please try again.",
};

// The Revision surface. Signed out, it pitches the feature and offers Google
// sign-in. Signed in, it shows the topic logger and the spaced-repetition
// calendar (data fetched server-side and passed down).
export default function RevisionView({ user, topics, reviews, authError }: Props) {
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
        <header className="rev-head">
          <div className="eyebrow">Spaced repetition</div>
          <h2>
            Log what you learned. <em>Revise</em> it on schedule.
          </h2>
          <p className="rev-principle">
            Note each topic the day you cover it. We resurface it on a forgetting-curve
            ladder — {REVIEW_LADDER.map((d) => `+${d}`).join(", ")} days — so it sticks.
          </p>
        </header>

        {user ? (
          <>
            <div className="rev-account">
              <span>Signed in as {user.name ?? user.email}</span>
              <form action="/auth/signout" method="post">
                <button className="link-btn" type="submit">Sign out</button>
              </form>
            </div>
            <TopicLogger topics={topics} />
            {topics.length === 0 && (
              <p className="rev-empty">
                Log your first topic above to start your revision schedule — it&apos;ll
                appear on the calendar below.
              </p>
            )}
            <RevisionCalendar topics={topics} reviews={reviews} />
          </>
        ) : (
          <div className="rev-signin">
            <p>Sign in to log topics and keep your revision schedule synced across devices.</p>
            <SignInWithGoogle />
          </div>
        )}
      </div>
    </main>
  );
}
