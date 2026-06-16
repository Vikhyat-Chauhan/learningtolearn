// OAuth callback: exchange the Google auth code for a Supabase session, upsert a
// minimal profile row, then return to the landing. On failure we bounce back to
// "/" with an ?error= code the landing can surface.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, profiles } from "@/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.user) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const user = data.session.user;

  try {
    await db
      .insert(profiles)
      .values({
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.full_name as string | undefined) ?? null,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: user.email ?? "",
          name: (user.user_metadata?.full_name as string | undefined) ?? null,
        },
      });
  } catch (err) {
    console.error("[auth/callback] profile upsert failed:", err);
    return NextResponse.redirect(`${origin}/?error=profile_failed`);
  }

  // Land back on the Revision view so the user sees their data immediately.
  return NextResponse.redirect(`${origin}/?view=revision`);
}
