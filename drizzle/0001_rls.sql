-- Row-level security: each user can only touch their own rows. This is
-- defense-in-depth for any access via the Supabase anon/auth client; the app's
-- Drizzle connection uses the table-owner role, which bypasses RLS (ENABLE, not
-- FORCE), and already scopes every query by user id.

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "profiles_own" ON "profiles"
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);--> statement-breakpoint

CREATE POLICY "topics_own" ON "topics"
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);--> statement-breakpoint

CREATE POLICY "reviews_own" ON "reviews"
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
