import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Hook Generator | Create Viral Hooks Instantly | Repurso",
  description:
    "Generate viral hooks for TikTok, Instagram, LinkedIn, X/Twitter and YouTube with AI. Create scroll-stopping hooks instantly with Repurso.",
  keywords: [
    "AI Hook Generator",
    "viral hook generator",
    "LinkedIn hook generator",
    "TikTok hook generator",
    "Instagram hook generator",
    "YouTube hook generator",
    "content hook AI",
  ],
  openGraph: {
    title: "AI Hook Generator | Repurso",
    description: "Generate high-converting hooks for social media with AI.",
    url: "https://repurso.app/ai-hook-generator",
    siteName: "Repurso",
    type: "website",
  },
};

const hooks = [
  "Most creators waste hours rewriting the same content.",
  "This AI tool turns one idea into 10 posts.",
  "Nobody tells founders this about content creation.",
  "Your content problem is not lack of ideas.",
  "I stopped creating content from scratch.",
  "This simple framework changed my engagement overnight.",
];

const faqs = [
  {
    question: "What is an AI hook generator?",
    answer:
      "An AI hook generator helps creators generate attention-grabbing opening lines for social media posts, videos and carousels.",
  },
  {
    question: "Which platforms does Repurso support?",
    answer:
      "Repurso helps generate hooks for TikTok, Instagram, LinkedIn, X/Twitter, YouTube and more.",
  },
  {
    question: "Can I use it for YouTube Shorts and Reels?",
    answer:
      "Yes. Repurso generates hooks optimized for short-form video platforms including Shorts, Reels and TikTok.",
  },
  {
    question: "Is Repurso free?",
    answer:
      "Yes. You can start generating hooks for free and upgrade later for higher limits and premium tools.",
  },
];

export default function AIHookGeneratorPage() {
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

              <p className="font-bold">AI Hook Generator</p>
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
              AI-Powered Viral Hooks
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              AI Hook Generator for Viral Content
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl">
              Generate scroll-stopping hooks for TikTok, Instagram, LinkedIn,
              X/Twitter and YouTube in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/#hook-generator"
                className="rounded-2xl bg-white px-7 py-4 text-center font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Try Hook Generator
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
              Example Hooks
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Hooks that stop the scroll
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hooks.map((hook) => (
              <div
                key={hook}
                className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/10"
              >
                <div className="mb-4 inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                  Viral Hook
                </div>

                <p className="text-lg leading-8 text-zinc-100">{hook}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              1
            </div>

            <h3 className="mb-3 text-2xl font-bold">Enter your topic</h3>

            <p className="leading-7 text-zinc-400">
              Add your niche, product, video idea or content topic.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              2
            </div>

            <h3 className="mb-3 text-2xl font-bold">Generate hooks</h3>

            <p className="leading-7 text-zinc-400">
              Repurso instantly creates multiple attention-grabbing hooks.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              3
            </div>

            <h3 className="mb-3 text-2xl font-bold">Publish faster</h3>

            <p className="leading-7 text-zinc-400">
              Use your hooks for videos, posts, carousels and threads.
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
                <h3 className="mb-3 text-lg font-bold">{faq.question}</h3>

                <p className="leading-7 text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
