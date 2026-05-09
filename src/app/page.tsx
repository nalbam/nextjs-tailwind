import { Button } from "@/components/ui/button";

const stacks = [
  "Node.js 22",
  "Next.js 16",
  "Better Auth",
  "React 19",
  "TypeScript",
  "AWS DynamoDB (Single Table)",
  "Tailwind CSS",
  "shadcn/ui",
  "pnpm",
];

const quickStart = [
  "cp .env.example .env.local",
  "pnpm install",
  "pnpm dev",
  "Open http://localhost:3000",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 md:px-12">
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur md:p-12">
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-cyan-200 uppercase">
          Production-ready starter
        </p>
        <h1 className="text-3xl leading-tight font-bold text-white md:text-5xl">
          Launch your next project instantly
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
          This template ships with practical foundations for authentication,
          DynamoDB single-table modeling, and a polished UI so you can focus on
          building product features from day one.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button>Get started</Button>
          <Button variant="outline">View on GitHub</Button>
          <Button variant="secondary">Read docs</Button>
        </div>
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
          <h2 className="text-lg font-semibold text-white">Quick start</h2>
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
            <li>• Better Auth API route at `/api/auth/[...all]`.</li>
            <li>
              • DynamoDB single-table key utilities in
              `src/lib/dynamodb.ts`.
            </li>
            <li>
              • Type-safe project structure designed for immediate feature work.
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
