import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { persistSession: false },
  });
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string | null;
          credits: number;
          created_at: string;
          updated_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          clerk_user_id: string;
          title: string;
          original_video_url: string;
          dubbed_audio_url: string | null;
          result_url: string | null;
          sync_job_id: string | null;
          elevenlabs_dubbing_id: string | null;
          target_language: string;
          status: "uploading" | "dubbing" | "syncing" | "completed" | "failed";
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
