"use server";

import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { createServerSupabaseClient } from "@/lib/supabase";
import { startElevenLabsDubbing } from "@/lib/elevenlabs";
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

  // Загружаем видео в Blob
  const blob = await put(`videos/${userId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  // Создаём проект в базе
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

  // Запускаем дубляж — НЕ ждём завершения, крон сам проверит
  try {
    const { dubbing_id } = await startElevenLabsDubbing({
      videoUrl: blob.url,
      targetLanguage,
    });

    await supabase
      .from("projects")
      .update({ elevenlabs_dubbing_id: dubbing_id })
      .eq("id", project.id);
  } catch (err) {
    await supabase
      .from("projects")
      .update({ status: "failed", error_message: String(err) })
      .eq("id", project.id);
    return { success: false, error: String(err) };
  }

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
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
