"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateContent() {
    if (!input.trim()) {
      alert("Please enter content.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data.result);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            Repurso
          </div>

          <div className="hidden gap-6 text-sm text-zinc-400 md:flex">
            <span>Features</span>
            <span>Pricing</span>
            <span>Login</span>
          </div>
        </nav>

        <div className="grid items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-400">
              AI content repurposing tool
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Turn one idea into content for every platform.
            </h1>

            <p className="mb-8 text-lg leading-8 text-zinc-400">
              Repurso helps creators, founders and marketers transform one piece
              of content into LinkedIn posts, Instagram captions, X posts,
              short-form video scripts and YouTube descriptions.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#generator"
                className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black"
              >
                Try it free
              </a>

              <a
                href="#pricing"
                className="rounded-xl border border-zinc-800 px-6 py-3 text-center font-semibold text-white"
              >
                View pricing
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
            </div>

            <div className="rounded-2xl bg-black p-5">
              <p className="mb-3 text-sm text-zinc-500">Input</p>
              <p className="mb-6 text-zinc-300">
                AI tools help creators save time by turning one piece of content
                into many different formats.
              </p>

              <p className="mb-3 text-sm text-zinc-500">Output</p>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="rounded-xl border border-zinc-800 p-3">
                  LinkedIn post generated
                </div>
                <div className="rounded-xl border border-zinc-800 p-3">
                  Instagram caption generated
                </div>
                <div className="rounded-xl border border-zinc-800 p-3">
                  TikTok script generated
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          id="generator"
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="mb-6">
            <h2 className="mb-2 text-3xl font-bold">
              Generate content
            </h2>
            <p className="text-zinc-400">
              Paste your content and let Repurso turn it into multiple formats.
            </p>
          </div>

          <textarea
            className="min-h-56 w-full rounded-2xl border border-zinc-800 bg-black p-5 text-white outline-none placeholder:text-zinc-600"
            placeholder="Paste your content here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={generateContent}
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Content"}
          </button>

          {result && (
            <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-black p-6 leading-7 text-zinc-200">
              {result}
            </div>
          )}
        </section>

        <section id="pricing" className="py-16">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-4xl font-bold">
              Simple pricing
            </h2>
            <p className="text-zinc-400">
              Start free. Upgrade when you need more content.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-2 text-2xl font-bold">Free</h3>
              <p className="mb-5 text-zinc-400">For testing the product.</p>
              <p className="mb-6 text-4xl font-bold">$0</p>
              <ul className="space-y-3 text-zinc-300">
                <li>3 generations/day</li>
                <li>5 output formats</li>
                <li>Basic content quality</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white bg-white p-6 text-black">
              <h3 className="mb-2 text-2xl font-bold">Creator</h3>
              <p className="mb-5 text-zinc-600">For active creators.</p>
              <p className="mb-6 text-4xl font-bold">$9/mo</p>
              <ul className="space-y-3">
                <li>300 generations/month</li>
                <li>Better output quality</li>
                <li>Content history</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-2 text-2xl font-bold">Pro</h3>
              <p className="mb-5 text-zinc-400">For power users.</p>
              <p className="mb-6 text-4xl font-bold">$19/mo</p>
              <ul className="space-y-3 text-zinc-300">
                <li>1000 generations/month</li>
                <li>Priority generation</li>
                <li>Advanced formats</li>
              </ul>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}