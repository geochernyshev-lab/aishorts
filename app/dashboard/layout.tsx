import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const supabase = createServerSupabaseClient();
  let credits = 3;
  const { data: profile } = await supabase.from("profiles").select("credits").eq("clerk_user_id", userId).single();
  if (!profile) {
    await supabase.from("profiles").insert({ clerk_user_id: userId, credits: 3 });
  } else {
    credits = profile.credits;
  }

  return (
    <div className="min-h-screen" style={{ background: "#080B12" }}>
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md" style={{ background: "rgba(8,11,18,0.9)" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,200,0.15)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ fill: "#00E5C8" }}>
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
            </svg>
          </div>
          <span className="font-bold text-[0.95rem] tracking-tight">
            <span className="text-white">Shorts</span><span style={{ color: "#00E5C8" }}>Localizer</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Credits badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "rgba(0,229,200,0.1)", border: "1px solid rgba(0,229,200,0.2)", color: "#00E5C8" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ fill: "currentColor" }}>
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
            </svg>
            <span>{credits} кредитов</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
