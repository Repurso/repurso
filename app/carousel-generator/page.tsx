import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "AI Carousel Generator | Create Viral Carousels Instantly | Repurso",
  description:
    "Generate engaging carousel posts for Instagram and LinkedIn with AI. Create viral carousel content instantly with Repurso.",
  keywords: [
    "AI Carousel Generator",
    "Instagram carousel generator",
    "LinkedIn carousel generator",
    "AI carousel maker",
    "carousel content generator",
    "viral carousel generator",
    "AI social media carousel",
  ],
  openGraph: {
    title: "AI Carousel Generator | Repurso",
    description:
      "Generate viral carousel content for Instagram and LinkedIn with AI.",
    url: "https://repurso.app/carousel-generator",
    siteName: "Repurso",
    type: "website",
  },
};

const carousels = [
  "5 mistakes killing your content growth",
  "How I grew from 0 to 10k followers",
  "7 hooks that instantly increase engagement",
  "The creator framework nobody talks about",
  "A simple content system for busy founders",
  "How to make people stop scrolling",
];

const faqs = [
  {
    question: "What is an AI Carousel Generator?",
    answer:
      "An AI Carousel Generator helps creators generate carousel post ideas and structured slide content instantly.",
  },
  {
    question: "Can I use Repurso for Instagram carousels?",
    answer:
      "Yes. Repurso helps generate carousel content optimized for Instagram and LinkedIn.",
  },
  {
    question: "Does Repurso generate slide structures?",
    answer:
      "Yes. Repurso helps create structured carousel flows for educational and viral content.",
  },
  {
    question: "Is Repurso free?",
    answer:
      "Yes. You can start generating carousel content for free and upgrade later for premium tools.",
  },
];

export default function CarouselGeneratorPage() {
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
                AI Carousel Generator
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
              AI-Powered Carousel Content
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              AI Carousel Generator for Viral Content
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl">
              Generate engaging carousel ideas and slide structures for
              Instagram and LinkedIn instantly with AI.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/"
                className="rounded-2xl bg-white px-7 py-4 text-center font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Try Carousel Generator
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
              Example Carousels
            </p>

            <h2 className="text-3xl font-bold sm:text-5xl">
              Carousel ideas that drive engagement
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {carousels.map((carousel) => (
              <div
                key={carousel}
                className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-purple-500/10"
              >
                <div className="mb-4 inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                  Viral Carousel
                </div>

                <p className="text-lg leading-8 text-zinc-100">
                  {carousel}
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
              Add your niche, audience or content idea.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
              2
            </div>

            <h3 className="mb-3 text-2xl font-bold">
              Generate carousel flow
            </h3>

            <p className="leading-7 text-zinc-400">
              Repurso instantly creates engaging slide structures.
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
              Turn your ideas into high-performing carousel content.
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