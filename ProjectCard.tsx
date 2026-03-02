"use client";

import { useState } from "react";
import { deleteProject } from "@/app/actions";
import {
  Film,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Database } from "@/lib/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface Props {
  project: Project;
}

const STATUS_CONFIG = {
  uploading: {
    label: "Uploading",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  dubbing: {
    label: "Dubbing audio",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  syncing: {
    label: "Syncing lips",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

export default function ProjectCard({ project }: Props) {
  const [deleting, setDeleting] = useState(false);
  const config = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.dubbing;

  const handleDelete = async () => {
    if (!confirm("Delete this project?")) return;
    setDeleting(true);
    await deleteProject(project.id);
  };

  const createdAt = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`glass-card rounded-2xl p-5 flex items-center gap-4 transition-opacity ${deleting ? "opacity-50" : ""}`}>
      {/* Thumbnail placeholder */}
      <div className="w-20 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
        {project.status === "completed" && project.result_url ? (
          <video
            src={project.result_url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <Film className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{project.title}</span>
          <span className="text-xs text-muted-foreground shrink-0 uppercase bg-secondary px-1.5 py-0.5 rounded">
            {project.target_language}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {createdAt}
          </span>
          {project.error_message && (
            <span className="text-red-400 truncate max-w-xs">{project.error_message}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} shrink-0`}
      >
        {config.icon}
        {config.label}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {project.status === "completed" && project.result_url && (
          <>
            <a
              href={project.result_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
            <a
              href={project.result_url}
              download
              className="flex items-center gap-1.5 text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-lg px-3 py-1.5 hover:bg-emerald-400/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
