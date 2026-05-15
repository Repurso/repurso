"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        const email = session.user.email;

        setUserEmail(email);

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_email", email)
          .single();

        if (!existingProfile) {
          await supabase.from("profiles").insert({
            user_email: email,
            plan: "free",
          });
        }
      }
    }

    getUser();
  }, []);

  async function generateContent() {
    if (!input.trim()) {
      alert("Please enter content.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          userEmail: userEmail || "anonymous",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong.");
      } else {
        setResult(data.result);
      }
    } catch (error) {
      alert("Failed to generate content.");
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-16 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Repurso</h1>

          <div className="flex items-center gap-4">
            {userEmail ? (
              <>
                <span className="text-sm text-zinc-400">
                  {userEmail}
                </span>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-zinc-700 px-4 py-2"
                >
                  Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        <section className="mb-24 grid gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
              AI content repurposing tool
            </div>

            <h2 className="mb-6 text-6xl font-bold leading-tight">
              Turn one idea into content for every platform.
            </h2>

            <p className="mb-8 text-xl leading-9 text-zinc-400">
              Repurso helps creators, founders and marketers transform one
              piece of content into LinkedIn posts, Instagram captions,
              X posts, TikTok scripts and YouTube descriptions.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://repursoapp.lemonsqueezy.com/checkout/buy/5f45028d-de97-458d-a827-64f8a7adc153"
                target="_blank"
                className="rounded-2xl bg-white px-8 py-4 font-bold text-black"
              >
                Get Creator
              </a>

              <a
                href="https://repursoapp.lemonsqueezy.com/checkout/buy/548cbc91-792f-4fae-b6a5-569f95c119c3"
                target="_blank"
                className="rounded-2xl border border-zinc-700 px-8 py-4 font-bold"
              >
                Get Pro
              </a>
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-800 bg-zinc-950 p-8">
            <div className="mb-6 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
            </div>

            <div className="rounded-3xl bg-black p-6">
              <div className="mb-8">
                <p className="mb-3 text-zinc-500">Input</p>

                <p className="text-xl leading-9">
                  AI tools help creators save time by turning one piece of
                  content into many different formats.
                </p>
              </div>

              <div>
                <p className="mb-3 text-zinc-500">Output</p>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 p-4">
                    LinkedIn post generated
                  </div>

                  <div className="rounded-2xl border border-zinc-800 p-4">
                    Instagram caption generated
                  </div>

                  <div className="rounded-2xl border border-zinc-800 p-4">
                    TikTok script generated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950 p-8">
          <h3 className="mb-2 text-5xl font-bold">
            Generate content
          </h3>

          <p className="mb-8 text-xl text-zinc-400">
            Paste your content and let Repurso turn it into multiple formats.
          </p>

          <textarea
            placeholder="Paste your content here..."
            className="mb-6 h-56 w-full rounded-3xl border border-zinc-800 bg-black p-6 text-lg text-white outline-none placeholder:text-zinc-600"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={generateContent}
            disabled={loading}
            className="rounded-2xl bg-white px-8 py-4 font-bold text-black disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          {result && (
            <div className="mt-10 whitespace-pre-wrap rounded-3xl border border-zinc-800 bg-black p-8 leading-8">
              {result}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}