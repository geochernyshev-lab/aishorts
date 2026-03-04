import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { put } from "@vercel/blob";
import { downloadDubbedAudio } from "@/lib/elevenlabs";
import { submitSyncLabsJob } from "@/lib/synclabs";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "dubbing")
      .not("elevenlabs_dubbing_id", "is", null);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY!;

    for (const project of projects) {
      try {
        const res = await fetch(
          `${ELEVENLABS_API_URL}/dubbing/${project.elevenlabs_dubbing_id}`,
          { headers: { "xi-api-key": apiKey } }
        );

        const status = await res.json();
        console.log(`[poll] Project ${project.id} dubbing status:`, status.status);

        if (status.status === "dubbed") {
          const audioUrl = `${ELEVENLABS_API_URL}/dubbing/${project.elevenlabs_dubbing_id}/audio/${project.target_language}`;
          const audioBuffer = await downloadDubbedAudio(audioUrl);

          const audioBlob = await put(
            `audio/${project.clerk_user_id}/${project.id}-dubbed.mp3`,
            new Blob([audioBuffer], { type: "audio/mpeg" }),
            { access: "public" }
          );

          await supabase
            .from("projects")
            .update({ dubbed_audio_url: audioBlob.url, status: "syncing" })
            .eq("id", project.id);

          const syncJob = await submitSyncLabsJob({
            videoUrl: project.original_video_url,
            audioUrl: audioBlob.url,
            webhookUrl: `${APP_URL}/api/webhooks/synclabs`,
          });

          await supabase
            .from("projects")
            .update({ sync_job_id: syncJob.id })
            .eq("id", project.id);

          console.log(`[poll] Project ${project.id} sent to SyncLabs: ${syncJob.id}`);

        } else if (status.status === "failed") {
          await supabase
            .from("projects")
            .update({ status: "failed", error_message: "ElevenLabs dubbing failed" })
            .eq("id", project.id);
        }
      } catch (err) {
        console.error(`[poll] Error on project ${project.id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, processed: projects.length });
  } catch (err) {
    console.error("[poll] Fatal error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
