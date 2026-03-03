import ProjectCard from "./ProjectCard";
import type { Database } from "@/lib/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface Props {
  projects: Project[];
}

export default function RecentProjects({ projects }: Props) {
  return (
    <div className="grid gap-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
