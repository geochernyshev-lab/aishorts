import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#080B12" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md" style={{ background: "rgba(8,11,18,0.85)" }}>
        <Logo />
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-white/55 hover:text-white transition-colors px-3 py-1.5 hidden sm:block">Войти</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-teal text-sm px-5 py-2">Начать</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn-teal text-sm px-5 py-2 inline-flex">Дашборд</Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-20 sm:py-32 relative overflow-hidden">
        {/* Wave bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.28 }}>
          <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full h-auto" preserveAspectRatio="xMidYMax meet">
            <defs>
              <linearGradient id="wg1" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#00E5C8" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#9B6DFF" stopOpacity="0.4"/>
              </linearGradient>
              <linearGradient id="wg2" x1="1" x2="0" y1="0" y2="0">
                <stop offset="0%" stopColor="#9B6DFF" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#00E5C8" stopOpacity="0.2"/>
              </linearGradient>
            </defs>
            <path d="M0,300 C180,180 360,420 540,300 C720,180 900,420 1080,300 C1260,180 1380,360 1440,300 L1440,600 L0,600Z" fill="url(#wg1)"/>
            <path d="M0,380 C200,260 400,460 600,360 C800,260 1000,440 1200,370 C1340,310 1400,400 1440,380 L1440,600 L0,600Z" fill="url(#wg2)"/>
            <path d="M0,440 C160,390 320,500 500,440 C700,375 900,470 1100,425 C1270,388 1380,455 1440,435 L1440,600 L0,600Z" fill="url(#wg1)" opacity="0.5"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl w-full mx-auto fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-medium" style={{ background: "rgba(0,229,200,0.1)", border: "1px solid rgba(0,229,200,0.2)", color: "#00E5C8" }}>
            <BoltIcon className="w-3.5 h-3.5" />
            AI-дубляж с сохранением голоса
          </div>

          <h1 className="font-bold tracking-tight leading-[1.15] mb-5 text-white" style={{ fontSize: "clamp(2.2rem, 7vw, 4.8rem)" }}>
            Переводите ваши<br/>
            <span className="gradient-text">Shorts на любой язык</span>
          </h1>

          <p className="text-white/45 mb-10 leading-relaxed" style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)" }}>
            Клонируем ваш голос, переводим аудио и синхронизируем губы —<br className="hidden sm:block"/>
            всё автоматически за пару минут
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <button className="btn-teal w-full sm:w-auto px-8 py-3.5 text-[0.95rem] flex items-center justify-center gap-2">
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignUpButton>
            <button className="btn-ghost w-full sm:w-auto px-8 py-3.5 text-[0.95rem] text-white/65">
              Как это работает
            </button>
          </div>
          <p className="mt-4 text-xs text-white/25">3 бесплатных кредита • Без карты</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 pb-20 w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🎙️", title: "Голос сохранён", desc: "ElevenLabs клонирует тембр и интонацию оригинального спикера" },
            { icon: "👄", title: "Синхронизация губ", desc: "SyncLabs точно подстраивает движения губ под дублированное аудио" },
            { icon: "⚡", title: "Быстро", desc: "Готовое видео за пару минут без ручного редактирования" },
          ].map((f) => (
            <div key={f.title} className="app-card p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-sm mb-1.5 text-white/90">{f.title}</div>
              <div className="text-white/38 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,200,0.15)" }}>
        <BoltIcon className="w-3.5 h-3.5" style={{ color: "#00E5C8" }} />
      </div>
      <span className="font-bold text-[0.95rem] tracking-tight">
        <span className="text-white">Shorts</span><span style={{ color: "#00E5C8" }}>Localizer</span>
      </span>
    </div>
  );
}

function BoltIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ fill: "currentColor", ...style }}>
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
    </svg>
  );
}
