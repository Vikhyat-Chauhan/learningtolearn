// Server entry: resolve the signed-in user and (if any) load their topics +
// reviews, then hand plain serializable view-models to the client shell. The
// Learn experience needs no data, so signed-out visitors fetch nothing.

import { desc, eq } from "drizzle-orm";
import { db, topics as topicsTable, reviews as reviewsTable } from "@/db";
import { getUser } from "@/lib/supabase/server";
import LearnApp from "@/components/LearnApp";
import type { TopicVM, ReviewVM, UserVM } from "@/lib/revision-types";
import type { View } from "@/components/TopNav";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; error?: string }>;
}) {
  const { view, error } = await searchParams;
  const initialView: View = view === "learn" ? "learn" : "revision";

  const user = await getUser();

  let userVM: UserVM | null = null;
  let topicVMs: TopicVM[] = [];
  let reviewVMs: ReviewVM[] = [];

  if (user) {
    userVM = {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string | undefined) ?? null,
    };

    const rows = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.userId, user.id))
      .orderBy(desc(topicsTable.loggedOn));

    topicVMs = rows.map((t) => ({
      id: t.id,
      title: t.title,
      notes: t.notes,
      loggedOn: t.loggedOn,
    }));

    const titleById = new Map(rows.map((t) => [t.id, t.title]));

    const revRows = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, user.id));

    reviewVMs = revRows.map((r) => ({
      id: r.id,
      topicId: r.topicId,
      topicTitle: titleById.get(r.topicId) ?? "",
      dueOn: r.dueOn,
      intervalIndex: r.intervalIndex,
      completed: r.completedAt !== null,
    }));
  }

  return (
    <LearnApp
      initialView={initialView}
      user={userVM}
      topics={topicVMs}
      reviews={reviewVMs}
      authError={error ?? null}
    />
  );
}
