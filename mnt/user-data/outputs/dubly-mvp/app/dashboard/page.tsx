import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import UploadWidget from "@/components/UploadWidget";
import ProjectCard from "@/components/ProjectCard";

export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("credits").eq("clerk_user_id", userId).single();
  const credits = profile?.credits ?? 0;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="fade-up">
      <h1 className="text-2xl font-bold text-white mb-1">Дашборд</h1>
      <p className="text-white/40 text-sm mb-8">Загрузите видео и выберите язык для дубляжа</p>

      <UploadWidget hasCredits={credits > 0} />

      {projects && projects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold text-white mb-4">Ваши проекты</h2>
          <div className="flex flex-col gap-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
