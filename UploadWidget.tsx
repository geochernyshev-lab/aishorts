"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadAndProcessVideo } from "@/app/actions";
import { Upload, Film, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "it", label: "Italian" },
];

type UploadState =
  | { type: "idle" }
  | { type: "uploading"; progress: number }
  | { type: "processing" }
  | { type: "success"; projectId: string }
  | { type: "error"; message: string };

interface Props {
  hasCredits: boolean;
}

export default function UploadWidget({ hasCredits }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("en");
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>({ type: "idle" });

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setState({ type: "error", message: "Please upload a video file." });
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setState({ type: "error", message: "Video must be under 500MB." });
      return;
    }
    setFile(f);
    setState({ type: "idle" });
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !hasCredits) return;

    const formData = new FormData();
    formData.append("video", file);
    formData.append("targetLanguage", targetLang);
    formData.append("title", title || file.name);

    setState({ type: "uploading", progress: 0 });

    // Simulate upload progress (actual upload happens in action)
    const interval = setInterval(() => {
      setState((prev) =>
        prev.type === "uploading" && prev.progress < 90
          ? { type: "uploading", progress: prev.progress + 10 }
          : prev
      );
    }, 300);

    const result = await uploadAndProcessVideo(formData);
    clearInterval(interval);

    if (result.success) {
      setState({ type: "success", projectId: result.projectId });
      setTimeout(() => {
        router.push("/dashboard/projects");
        router.refresh();
      }, 1500);
    } else {
      setState({ type: "error", message: result.error });
    }
  };

  const reset = () => {
    setFile(null);
    setState({ type: "idle" });
    setTitle("");
  };

  const isLoading = state.type === "uploading" || state.type === "processing";

  return (
    <div className="glass-card rounded-2xl p-6 max-w-2xl">
      {!hasCredits ? (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          You have no credits remaining. Please upgrade to continue.
        </div>
      ) : (
        <>
          {/* Drop zone */}
          {!file ? (
            <div
              className={`upload-zone rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "drag-over" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleChange}
              />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">
                Drop your video here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, MOV, WebM — up to 500MB
              </p>
            </div>
          ) : (
            /* File selected view */
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
                {!isLoading && state.type !== "success" && (
                  <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Project title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My dubbed video"
                  disabled={isLoading}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
              </div>

              {/* Target language */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Target language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress bar */}
              {state.type === "uploading" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{state.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status messages */}
              {state.type === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {state.message}
                </div>
              )}

              {state.type === "success" && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Submitted! Redirecting to projects...
                </div>
              )}

              {/* Submit button */}
              {state.type !== "success" && (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !file}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {state.type === "uploading" ? "Uploading..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Start Dubbing — 1 Credit
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
