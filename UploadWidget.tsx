"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadAndProcessVideo } from "@/app/actions";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
  { code: "ko", flag: "🇰🇷", label: "한국어" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "hi", flag: "🇮🇳", label: "हिन्दी" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
];

type State =
  | { type: "idle" }
  | { type: "uploading" }
  | { type: "success" }
  | { type: "error"; message: string };

export default function UploadWidget({ hasCredits }: { hasCredits: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("en");
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<State>({ type: "idle" });

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setState({ type: "error", message: "Нужен видео-файл." }); return; }
    if (f.size > 500 * 1024 * 1024) { setState({ type: "error", message: "Максимум 500MB." }); return; }
    setFile(f);
    setState({ type: "idle" });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !hasCredits) return;
    const fd = new FormData();
    fd.append("video", file);
    fd.append("targetLanguage", targetLang);
    fd.append("title", file.name);
    setState({ type: "uploading" });
    const result = await uploadAndProcessVideo(fd);
    if (result.success) {
      setState({ type: "success" });
      setTimeout(() => { router.refresh(); setState({ type: "idle" }); setFile(null); }, 1200);
    } else {
      setState({ type: "error", message: result.error });
    }
  };

  const isLoading = state.type === "uploading";

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`upload-zone flex flex-col items-center justify-center py-12 px-6 text-center ${dragOver ? "drag-over" : ""} ${!hasCredits ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => hasCredits && inputRef.current?.click()}
        onDrop={hasCredits ? handleDrop : undefined}
        onDragOver={(e) => { e.preventDefault(); if (hasCredits) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(0,229,200,0.1)" }}>🎬</div>
            <p className="text-sm font-medium text-white/90">{file.name}</p>
            <p className="text-xs text-white/35">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            {!isLoading && (
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setState({ type: "idle" }); }} className="text-xs text-white/30 hover:text-white/60 mt-1 transition-colors">
                Удалить
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
              <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-white/75 mb-1">
              {hasCredits ? "Перетащите видео сюда" : "Нет кредитов"}
            </p>
            <p className="text-xs text-white/30">
              {hasCredits ? "или нажмите для выбора • MP4, MOV до 500MB" : "Пополните баланс для продолжения"}
            </p>
          </>
        )}
      </div>

      {/* Language selector */}
      {hasCredits && (
        <div>
          <p className="text-sm text-white/45 mb-3">Целевой язык</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.code)}
                className={`lang-card flex flex-col items-center justify-center py-3 px-2 gap-1.5 ${targetLang === l.code ? "selected" : ""}`}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="text-[11px] text-white/60 font-medium leading-none">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {state.type === "error" && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <span>⚠️</span> {state.message}
        </p>
      )}

      {/* Submit */}
      {hasCredits && file && (
        <button
          onClick={handleSubmit}
          disabled={isLoading || state.type === "success"}
          className="btn-teal w-full py-3.5 text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-[#080B12]/40 border-t-[#080B12] rounded-full spin" />
              Загрузка...
            </>
          ) : state.type === "success" ? (
            <><span>✓</span> Отправлено!</>
          ) : (
            <>Дублировать — 1 кредит</>
          )}
        </button>
      )}
    </div>
  );
}
