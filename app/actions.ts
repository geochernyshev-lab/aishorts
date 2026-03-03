"use server";

import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { createServerSupabaseClient } from "@/lib/supabase";
import { startElevenLabsDubbing, waitForDubbingComplete, downloadDubbedAudio } from "@/lib/elevenlabs";
import { submitSyncLabsJob } from "@/lib/synclabs";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type UploadVideoResult =
  | { success: true; projectId: string }
  | { success: false; error: string };

export async function uploadAndProcessVideo(
  formData: FormData
): Promise<UploadVideoResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const file = formData.get("video") as File | null;
  const targetLanguage = (formData.get("targetLanguage") as string) ?? "en";
  const title = (formData.get("title") as string) ?? file?.name ?? "Untitled";

  if (!file || file.size === 0) {
    return { success: false, error: "No video file provided" };
  }

  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("clerk_user_id", userId)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert({ clerk_user_id: userId, credits: 3 });
  } else if (profile.credits <= 0) {
    return { success: false, error: "Insufficient credits. Please upgrade your plan." };
  }

  const blob = await put(`videos/${userId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      clerk_user_id: userId,
      title,
      original_video_url: blob.url,
      target_language: targetLanguage,
      status: "dubbing",
    })
    .select("id")
    .single();

  if (insertError || !project) {
    return { success: false, error: "Failed to create project" };
  }

  processVideo({
    userId,
    projectId: project.id,
    videoUrl: blob.url,
    targetLanguage,
  }).catch(async (err) => {
    console.error("[processVideo] Error:", err);
    await supabase
      .from("projects")
      .update({ status: "failed", error_message: String(err) })
      .eq("id", project.id);
  });

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

async function processVideo({
  userId,
  projectId,
  videoUrl,
  targetLanguage,
}: {
  userId: string;
  projectId: string;
  videoUrl: string;
  targetLanguage: string;
}) {
  const supabase = createServerSupabaseClient();

  const { dubbing_id } = await startElevenLabsDubbing({ videoUrl, targetLanguage });

  await supabase
    .from("projects")
    .update({ elevenlabs_dubbing_id: dubbing_id })
    .eq("id", projectId);

  const audioApiUrl = await waitForDubbingComplete(dubbing_id, targetLanguage);
  const audioBuffer = await downloadDubbedAudio(audioApiUrl);

  const audioBlob = await put(
    `audio/${userId}/${projectId}-dubbed.mp3`,
    new Blob([audioBuffer], { type: "audio/mpeg" }),
    { access: "public" }
  );

  await supabase
    .from("projects")
    .update({ dubbed_audio_url: audioBlob.url, status: "syncing" })
    .eq("id", projectId);

  const webhookUrl = `${APP_URL}/api/webhooks/synclabs`;
  const syncJob = await submitSyncLabsJob({
    videoUrl,
    audioUrl: audioBlob.url,
    webhookUrl,
  });

  await supabase
    .from("projects")
    .update({ sync_job_id: syncJob.id })
    .eq("id", projectId);
}

export async function deleteProject(projectId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServerSupabaseClient();
  await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("clerk_user_id", userId);

  revalidatePath("/dashboard");
}
