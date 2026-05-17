import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "AI YouTube Title Generator | Create Viral Titles Instantly | Repurso",
  description:
    "Generate high-click YouTube titles with AI. Create viral YouTube video titles instantly with Repurso.",
  keywords: [
    "AI YouTube Title Generator",
    "YouTube title generator",
    "viral YouTube titles",
    "AI YouTube SEO",
    "YouTube headline generator",
    "clickable YouTube titles",
    "YouTube AI writer",
  ],
  openGraph: {
    title: "AI YouTube Title Generator | Repurso",
    description:
      "Generate high-converting YouTube titles with AI instantly.",
    url: "https://repurso.app/youtube-title-generator",
    siteName: "Repurso",
    type: "website",
  },
};

const titles = [
  "I Tried AI Content Creation for 30 Days",
  "How I Grew to 100K Followers Using AI",
  "The Content Strategy Nobody Talks About",
  "This AI Tool Saves Me 10 Hours Every Week",
  "Why Most Creators Never Grow",
  "I Built an AI SaaS From Scratch",
];

const faqs = [
  {
    question: "What is an AI YouTube Title Generator?",
    answer:
      "An AI YouTube Title Generator helps creators generate clickable and engaging YouTube video titles instantly.",
  },
  {
    question: "Can Repurso generate viral YouTube titles?",
    answer:
      "Yes. Repurso helps generate high-click and SEO-friendly YouTube titles optimized for engagement.",
  },
  {
    question: "Does Repurso support Shorts titles?",
    answer:
      "Yes. Repurso helps generate titles for YouTube Shorts and long-form videos.",
  },
  {
    question: "Is Repurso free?",
    answer:
      "Yes. You can generate YouTube titles for free and upgrade later for premium features.",
  },
];

export default function YouTubeTitleGeneratorPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="Repurso"
              className="h-9 w-9 rounded-xl"
            />

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-purple-200">
                Repurso
              </p>

              <p className="font-bold">
                AI YouTube Title Generator
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200"
          >
            Open App
          </Link>
        </nav>

        <section className="mb-14 rounded-[32px] border border-purple-400/20 bg-gradient-to-br from-purple-950/30 via-zinc-950 to-black p-6 shadow-2xl shadow-purple-950/20 sm:p-10">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100">
              AI-Powered YouTube Titles
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              AI YouTube Title Generator
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl">
              Generate clickable YouTube titles for videos and Shorts instantly
              with AI.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/"
                className="rounded-2xl bg-white px-7 py-4 text-center font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Try YouTube Title Generator
              </Link>

              <Link
                href="/#pricing"
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-4 text-center font-bold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Example Titles
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Titles designed for clicks
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {titles.map((title) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/10"
              >
                <div className="mb-4 inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                  Viral Title
                </div>

                <p className="text-lg leading-8 text-zinc-100">
                  {title}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              1
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Enter your topic
            </h3>

            <p className="leading-7 text-zinc-400">
              Add your niche, video idea or audience.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              2
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Generate titles
            </h3>

            <p className="leading-7 text-zinc-400">
              Repurso instantly creates clickable YouTube titles.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              3
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Grow faster
            </h3>

            <p className="leading-7 text-zinc-400">
              Create higher-performing video content with better titles.
            </p>
          </div>
        </section>

        <section className="mb-20 rounded-[32px] border border-white/10 bg-zinc-950/70 p-6 sm:p-8">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              FAQ
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-black/60 p-5"
              >
                <h3 className="mb-3 text-lg font-bold">
                  {faq.question}
                </h3>

                <p className="leading-7 text-zinc-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}