import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#080B12" }}>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,200,0.15)" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ fill: "#00E5C8" }}>
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="text-white">Shorts</span><span style={{ color: "#00E5C8" }}>Localizer</span>
        </span>
      </div>
      <SignUp
        appearance={{
          elements: {
            card: "shadow-2xl",
            rootBox: "w-full max-w-sm",
          },
        }}
      />
    </main>
  );
}
