const stacks = [
  "Node.js 22",
  "Next.js 16",
  "Better Auth",
  "React 19",
  "TypeScript",
  "AWS DynamoDB (Single Table)",
  "Tailwind CSS",
  "pnpm",
];

const quickStart = [
  "cp .env.example .env.local",
  "pnpm install",
  "pnpm dev",
  "브라우저에서 http://localhost:3000 접속",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 md:px-12">
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur md:p-12">
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-cyan-200 uppercase">
          Production-ready starter
        </p>
        <h1 className="text-3xl leading-tight font-bold text-white md:text-5xl">
          바로 시작 가능한 Next.js 템플릿
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
          인증, 데이터 모델링, 디자인 시스템까지 기본기를 갖춘 템플릿입니다.
          클론 후 바로 실행해 멋진 화면과 실전 구조를 기반으로 새 프로젝트를 시작하세요.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stacks.map((stack) => (
            <div
              key={stack}
              className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100"
            >
              {stack}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Quick Start</h2>
          <ol className="mt-4 space-y-2 text-sm text-slate-300">
            {quickStart.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="text-cyan-300">{index + 1}.</span>
                <code>{step}</code>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Included foundations</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>• Better Auth API 라우트(`/api/auth/[...all]`)가 준비되어 있습니다.</li>
            <li>• DynamoDB 단일 테이블 키 설계 유틸(`src/lib/dynamodb.ts`)을 포함합니다.</li>
            <li>• 타입 안전한 기본 구조로 기능 추가를 빠르게 시작할 수 있습니다.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
