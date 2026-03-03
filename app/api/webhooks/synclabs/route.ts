import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

interface SyncLabsWebhookPayload {
  id: string;
  status: "completed" | "failed" | "processing";
  outputUrl?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SYNCLABS_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-synclabs-signature");
    if (signature !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: SyncLabsWebhookPayload;
  try {
    payload = (await req.json()) as SyncLabsWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, clerk_user_id, status")
    .eq("sync_job_id", payload.id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ ok: true });
  }

  if (project.status === "completed" || project.status === "failed") {
    return NextResponse.json({ ok: true });
  }

  if (payload.status === "completed" && payload.outputUrl) {
    await supabase
      .from("projects")
      .update({
        status: "completed",
        result_url: payload.outputUrl,
        error_message: null,
      })
      .eq("id", project.id);

    const { error: creditError } = await supabase.rpc("decrement_credits", {
      p_clerk_user_id: project.clerk_user_id,
    });

    if (creditError) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("credits")
        .eq("clerk_user_id", project.clerk_user_id)
        .single();

      if (prof && prof.credits > 0) {
        await supabase
          .from("profiles")
          .update({ credits: prof.credits - 1 })
          .eq("clerk_user_id", project.clerk_user_id);
      }
    }
  } else if (payload.status === "failed") {
    await supabase
      .from("projects")
      .update({
        status: "failed",
        error_message: payload.error ?? "Lip-sync failed",
      })
      .eq("id", project.id);
  }

  return NextResponse.json({ ok: true });
}
