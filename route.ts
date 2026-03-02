import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

interface SyncLabsWebhookPayload {
  id: string;          // job id
  status: "completed" | "failed" | "processing";
  outputUrl?: string;
  error?: string;
}

/**
 * Webhook receiver for SyncLabs job completion.
 * Updates project result_url and deducts 1 credit from the user.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Optional: verify webhook signature
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

  // Find project by sync_job_id
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, clerk_user_id, status")
    .eq("sync_job_id", payload.id)
    .single();

  if (fetchError || !project) {
    console.error("[SyncLabs Webhook] Project not found for job:", payload.id);
    // Return 200 to prevent retries for unknown jobs
    return NextResponse.json({ ok: true });
  }

  // Avoid double-processing
  if (project.status === "completed" || project.status === "failed") {
    return NextResponse.json({ ok: true });
  }

  if (payload.status === "completed" && payload.outputUrl) {
    // Update project as completed with result URL
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: "completed",
        result_url: payload.outputUrl,
        error_message: null,
      })
      .eq("id", project.id);

    if (updateError) {
      console.error("[SyncLabs Webhook] Failed to update project:", updateError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // Deduct 1 credit from user (use RPC or raw update)
    const { error: creditError } = await supabase.rpc("decrement_credits", {
      p_clerk_user_id: project.clerk_user_id,
    });

    if (creditError) {
      // Fallback: manual decrement
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

    console.log(`[SyncLabs Webhook] Job ${payload.id} completed. Project ${project.id} updated.`);
  } else if (payload.status === "failed") {
    await supabase
      .from("projects")
      .update({
        status: "failed",
        error_message: payload.error ?? "Lip-sync failed",
      })
      .eq("id", project.id);

    console.error(`[SyncLabs Webhook] Job ${payload.id} failed:`, payload.error);
  }

  return NextResponse.json({ ok: true });
}
