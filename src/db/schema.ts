// Drizzle schema — the single source of truth for the database shape.
//
// Conventions:
// - `profiles.id` mirrors the Supabase auth user id (auth.users.id). We don't FK
//   into the auth schema; the app upserts a profile row on first login.
// - User-owned rows carry `userId` and are always query-scoped to the signed-in
//   user (belt-and-suspenders alongside the RLS policies in the RLS migration).

import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

// A signed-in user. id === Supabase auth user id.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  email: text("email").notNull(),
  name: text("name"),
  // The user's spaced-repetition ladder (day offsets). Defaults to DEFAULT_LADDER
  // in src/lib/spacing.ts; read server-side when materializing reviews.
  reviewLadder: integer("review_ladder").array().notNull().default([1, 3, 7, 14, 30]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A topic the user covered on a given day. Logging one fans out into a ladder of
// `reviews` (see src/lib/spacing.ts).
export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    // Free-text labels for categorizing/filtering topics. Stored as a text array
    // (no join table); defaults to empty so existing rows backfill cleanly.
    tags: text("tags").array().notNull().default([]),
    // The day the topic was covered (YYYY-MM-DD; no time, no tz drift).
    loggedOn: date("logged_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserLogged: index("topics_user_logged_idx").on(t.userId, t.loggedOn),
  }),
);

// A scheduled revision for a topic. Materialized at log time — one row per rung
// of the spaced-repetition ladder. `userId` is denormalized so calendar range
// queries and RLS hit a single table.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    // The day this review is due (loggedOn + ladder offset).
    dueOn: date("due_on").notNull(),
    // 0..N — which rung of the user's review ladder produced this review.
    intervalIndex: integer("interval_index").notNull(),
    // null until the user checks it off.
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    byUserDue: index("reviews_user_due_idx").on(t.userId, t.dueOn),
  }),
);
