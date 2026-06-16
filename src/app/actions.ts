"use server";

// Server actions for the Revision feature. Every action resolves the signed-in
// user via getUser() and scopes all writes to user.id (RLS enforces this at the
// DB level too). On success they revalidate "/" so the calendar re-renders.

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, topics, reviews } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { REVIEW_LADDER } from "@/lib/spacing";
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
    REVIEW_LADDER.map((offset, intervalIndex) => ({
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

// Delete a topic; its reviews cascade.
export async function deleteTopic(topicId: string) {
  const userId = await requireUserId();
  await db.delete(topics).where(and(eq(topics.id, topicId), eq(topics.userId, userId)));
  revalidatePath("/");
}
