"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

type Generation = {
  id: string;
  created_at: string;
  user_email: string;
  input: string;
  output: string;
};

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const email = session?.user?.email ?? null;
      setUserEmail(email);

      if (!email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
      } else {
        setGenerations(data || []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied.");
  }

  async function deleteGeneration(id: string) {
    const confirmed = confirm("Delete this generation?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setGenerations((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold">Dashboard</h1>
            <p className="mt-3 text-zinc-400">
              Your generated content history.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/#generator"
              className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold"
            >
              Generate
            </a>

            <a
              href="/"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Back home
            </a>
          </div>
        </div>

        {userEmail && (
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm text-zinc-500">Account</p>
              <p className="mt-2 truncate font-semibold">{userEmail}</p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm text-zinc-500">Generations</p>
              <p className="mt-2 text-3xl font-bold">{generations.length}</p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-2 font-semibold text-green-400">Active</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : !userEmail ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="mb-3 text-2xl font-bold">Login required</h2>
            <p className="mb-6 text-zinc-400">
              Please login to view your generation history.
            </p>

            <a
              href="/login"
              className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Login
            </a>
          </div>
        ) : generations.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="mb-3 text-2xl font-bold">No generations yet</h2>
            <p className="mb-6 text-zinc-400">
              Generate your first content to see it here.
            </p>

            <a
              href="/#generator"
              className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Generate content
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {generations.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-zinc-500">
                    <p>{new Date(item.created_at).toLocaleString()}</p>
                    <p>{item.user_email}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => copyText(item.output)}
                      className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                    >
                      Copy
                    </button>

                    <button
                      onClick={() => deleteGeneration(item.id)}
                      className="rounded-xl border border-red-500 px-4 py-2 font-semibold text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-zinc-800 bg-black p-5">
                  <h2 className="mb-2 font-bold">Input</h2>
                  <p className="whitespace-pre-wrap text-zinc-300">
                    {item.input}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <h2 className="mb-4 font-bold">Output</h2>

                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>
                      {item.output}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}