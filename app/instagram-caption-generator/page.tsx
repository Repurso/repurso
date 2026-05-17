import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "AI Instagram Caption Generator | Create Viral Captions Instantly | Repurso",
  description:
    "Generate viral Instagram captions with AI. Create engaging captions for Reels, posts and carousels instantly with Repurso.",
  keywords: [
    "AI Instagram Caption Generator",
    "Instagram caption generator",
    "AI captions for Instagram",
    "viral Instagram captions",
    "Instagram AI writer",
    "Instagram post captions",
    "Reels caption generator",
  ],
  openGraph: {
    title: "AI Instagram Caption Generator | Repurso",
    description:
      "Generate engaging Instagram captions for posts, Reels and carousels with AI.",
    url: "https://repurso.app/instagram-caption-generator",
    siteName: "Repurso",
    type: "website",
  },
};

const captions = [
  "POV: your content strategy finally starts working.",
  "Building in silence until the results get loud.",
  "Creators who post consistently always win.",
  "Small audience. Big vision.",
  "This is your sign to start creating content.",
  "Less overthinking. More publishing.",
];

const faqs = [
  {
    question: "What is an AI Instagram Caption Generator?",
    answer:
      "An AI Instagram Caption Generator helps creators generate engaging captions for Instagram posts, Reels and carousels instantly.",
  },
  {
    question: "Can I use Repurso for Instagram Reels?",
    answer:
      "Yes. Repurso creates captions optimized for Reels, short-form videos and high-engagement content.",
  },
  {
    question: "Does Repurso support other platforms?",
    answer:
      "Yes. Repurso supports LinkedIn, X/Twitter, TikTok, YouTube, Threads and more.",
  },
  {
    question: "Is Repurso free to use?",
    answer:
      "Yes. You can generate captions for free and upgrade later for premium features and higher limits.",
  },
];

export default function InstagramCaptionGeneratorPage() {
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
                AI Instagram Caption Generator
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
              AI-Powered Instagram Captions
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              AI Instagram Caption Generator for Viral Posts
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl">
              Generate engaging Instagram captions for posts, Reels and
              carousels in seconds with AI.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/"
                className="rounded-2xl bg-white px-7 py-4 text-center font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Try Caption Generator
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
              Example Captions
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Captions that increase engagement
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {captions.map((caption) => (
              <div
                key={caption}
                className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/10"
              >
                <div className="mb-4 inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                  Viral Caption
                </div>

                <p className="text-lg leading-8 text-zinc-100">
                  {caption}
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
              Enter your idea
            </h3>

            <p className="leading-7 text-zinc-400">
              Add your niche, product, post idea or content topic.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              2
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Generate captions
            </h3>

            <p className="leading-7 text-zinc-400">
              Repurso instantly creates engaging Instagram captions.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              3
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Publish faster
            </h3>

            <p className="leading-7 text-zinc-400">
              Use your captions for posts, Reels and carousels.
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