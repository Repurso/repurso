"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-zinc-400">
              View your generated content history.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            Back home
          </a>
        </div>

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
                <div className="mb-4 flex flex-col gap-1 text-sm text-zinc-500">
                  <span>{item.user_email}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>

                <div className="mb-5">
                  <h2 className="mb-2 font-bold">Input</h2>
                  <p className="whitespace-pre-wrap text-zinc-300">
                    {item.input}
                  </p>
                </div>

                <div>
                  <h2 className="mb-2 font-bold">Output</h2>
                  <p className="whitespace-pre-wrap text-zinc-300">
                    {item.output}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}