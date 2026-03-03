"use client";

import { useState } from "react";
import { deleteProject } from "@/app/actions";
import type { Database } from "@/lib/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const FLAG: Record<string, string> = {
  en:"🇬🇧", es:"🇪🇸", pt:"🇧🇷", de:"🇩🇪", fr:"🇫🇷", it:"🇮🇹",
  ja:"🇯🇵", ko:"🇰🇷", zh:"🇨🇳", ar:"🇸🇦", hi:"🇮🇳", tr:"🇹🇷", ru:"🇷🇺",
};

const STATUS = {
  uploading:  { label: "Загрузка",      cls: "badge-uploading", dot: true },
  dubbing:    { label: "Перевод",        cls: "badge-dubbing",   dot: true },
  syncing:    { label: "Синхронизация",  cls: "badge-syncing",   dot: true },
  completed:  { label: "Готово",         cls: "badge-ready",     dot: false },
  failed:     { label: "Ошибка",         cls: "badge-failed",    dot: false },
};

export default function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(project.status === "completed");
  const [deleting, setDeleting] = useState(false);
  const s = STATUS[project.status] ?? STATUS.dubbing;
  const flag = FLAG[project.target_language] ?? "🌐";

  const timeAgo = (() => {
    const diff = Date.now() - new Date(project.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    return `${Math.floor(hours / 24)} д. назад`;
  })();

  return (
    <div className={`app-card overflow-hidden transition-opacity ${deleting ? "opacity-40" : ""}`}>
      {/* Row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Film icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
          <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-5.25M21 19.5h-1.5A1.5 1.5 0 0118 18V6a1.5 1.5 0 011.5-1.5H21M3.375 4.5h17.25a1.125 1.125 0 011.125 1.125v13.25"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">{project.title}</p>
          <p className="text-xs text-white/35 mt-0.5">{flag} {project.target_language.toUpperCase()} • {timeAgo}</p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${s.cls}`}>
          {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-current pulse-dot" />}
          {!s.dot && project.status === "completed" && <span>✓</span>}
          {s.label}
        </div>
      </div>

      {/* Expanded actions for completed */}
      {open && project.status === "completed" && project.result_url && (
        <div className="flex items-center gap-2 px-4 pb-4">
          <a
            href={project.result_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
            </svg>
            Просмотр
          </a>
          <a
            href={project.result_url}
            download
            className="btn-teal flex-[2] flex items-center justify-center gap-2 py-2.5 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Скачать
          </a>
        </div>
      )}

      {/* Error message */}
      {open && project.status === "failed" && project.error_message && (
        <div className="px-4 pb-4">
          <p className="text-xs text-red-400/80 bg-red-400/8 rounded-lg px-3 py-2">{project.error_message}</p>
        </div>
      )}

      {/* Delete (always visible on open) */}
      {open && project.status !== "completed" && (
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={async (e) => { e.stopPropagation(); if (!confirm("Удалить проект?")) return; setDeleting(true); await deleteProject(project.id); }}
            className="text-xs text-white/25 hover:text-red-400 transition-colors py-1"
            disabled={deleting}
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
