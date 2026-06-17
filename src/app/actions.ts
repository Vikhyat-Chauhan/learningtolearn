"use server";

// Server actions for the Revision feature. Every action resolves the signed-in
// user via getUser() and scopes all writes to user.id (RLS enforces this at the
// DB level too). On success they revalidate "/" so the calendar re-renders.

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, topics, reviews, profiles } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { DEFAULT_LADDER, validateLadder } from "@/lib/spacing";
import { addDays, type ISODate } from "@/lib/dates";

class AuthError extends Error {
  constructor() {
    super("Not signed in");
  }
}

async function requireUserId(): Promise<string> {
  const user = await getUser();
  if (!user) throw new AuthError();
  return user.id;
}

// The user's spaced-repetition ladder, read server-side so review materialization
// never trusts client input. Falls back to DEFAULT_LADDER if the profile is
// missing (shouldn't happen — it's upserted at login).
async function getUserLadder(userId: string): Promise<number[]> {
  const [row] = await db
    .select({ reviewLadder: profiles.reviewLadder })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return row?.reviewLadder ?? [...DEFAULT_LADDER];
}

// Persist a new ladder for the signed-in user. New topics logged afterwards use
// it; existing topics keep their already-scheduled reviews (grandfathered).
export async function updateReviewLadder(values: number[]) {
  const userId = await requireUserId();
  const ladder = validateLadder(values);
  await db
    .update(profiles)
    .set({ reviewLadder: ladder })
    .where(eq(profiles.id, userId));
  revalidatePath("/");
}

export type LogTopicInput = {
  title: string;
  notes?: string;
  loggedOn: ISODate;
};

// Insert a topic and fan it out into the spaced-repetition review ladder.
export async function logTopic(input: LogTopicInput) {
  const userId = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const loggedOn = input.loggedOn;

  const ladder = await getUserLadder(userId);

  const [topic] = await db
    .insert(topics)
    .values({
      userId,
      title,
      notes: input.notes?.trim() || null,
      loggedOn,
    })
    .returning({ id: topics.id });

  await db.insert(reviews).values(
    ladder.map((offset, intervalIndex) => ({
      topicId: topic.id,
      userId,
      dueOn: addDays(loggedOn, offset),
      intervalIndex,
    })),
  );

  revalidatePath("/");
}

export async function completeReview(reviewId: string) {
  const userId = await requireUserId();
  await db
    .update(reviews)
    .set({ completedAt: new Date() })
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
  revalidatePath("/");
}

export async function uncompleteReview(reviewId: string) {
  const userId = await requireUserId();
  await db
    .update(reviews)
    .set({ completedAt: null })
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
  revalidatePath("/");
}

export type UpdateTopicInput = { id: string; title: string; notes?: string | null };

// Edit an existing topic's title/notes in place. The covered-on date is not
// editable, so the review ladder (whose due dates derive from it) is untouched.
export async function updateTopic(input: UpdateTopicInput) {
  const userId = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  await db
    .update(topics)
    .set({ title, notes: input.notes?.trim() || null })
    .where(and(eq(topics.id, input.id), eq(topics.userId, userId)));
  revalidatePath("/");
}

// Delete a topic; its reviews cascade.
export async function deleteTopic(topicId: string) {
  const userId = await requireUserId();
  await db.delete(topics).where(and(eq(topics.id, topicId), eq(topics.userId, userId)));
  revalidatePath("/");
}

export type RestoreTopicInput = {
  title: string;
  notes?: string | null;
  loggedOn: ISODate;
  /** Interval indexes (0–4) that were already completed, to preserve checkmarks. */
  completedIntervals?: number[];
};

// Re-create a just-deleted topic and its review ladder. Used by the "Undo"
// affordance after a delete. A new id is assigned (the page re-fetches), and any
// previously-completed reviews are restored as done.
export async function restoreTopic(input: RestoreTopicInput) {
  const userId = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const completed = new Set(input.completedIntervals ?? []);
  const ladder = await getUserLadder(userId);

  const [topic] = await db
    .insert(topics)
    .values({
      userId,
      title,
      notes: input.notes?.trim() || null,
      loggedOn: input.loggedOn,
    })
    .returning({ id: topics.id });

  await db.insert(reviews).values(
    ladder.map((offset, intervalIndex) => ({
      topicId: topic.id,
      userId,
      dueOn: addDays(input.loggedOn, offset),
      intervalIndex,
      completedAt: completed.has(intervalIndex) ? new Date() : null,
    })),
  );

  revalidatePath("/");
}
