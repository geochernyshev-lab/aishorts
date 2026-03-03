import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";

export const revalidate = 10;

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Проекты</h1>
          <p className="text-white/40 text-sm">Все ваши видео и их статус обработки</p>
        </div>
        <Link href="/dashboard" className="btn-teal text-sm px-5 py-2.5 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Новый
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="app-card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <p className="font-semibold text-white/80 mb-2">Нет проектов</p>
          <p className="text-white/35 text-sm mb-6">Загрузите первое видео, чтобы начать</p>
          <Link href="/dashboard" className="btn-teal text-sm px-6 py-2.5 inline-flex">
            Загрузить видео
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
