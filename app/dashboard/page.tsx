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

type Profile = {
  plan: string;
  generation_count: number;
};

const CREATOR_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/5f45028d-de97-458d-a827-64f8a7adc153";

const PRO_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/548cbc91-792f-4fae-b6a5-569f95c119c3";

function getPlanLimit(plan: string) {
  if (plan === "creator") return 300;
  if (plan === "pro") return 1000;
  return 3;
}

function getCheckoutUrl(baseUrl: string, email: string) {
  return `${baseUrl}?checkout[email]=${encodeURIComponent(
    email
  )}&checkout[custom][user_email]=${encodeURIComponent(email)}`;
}

export default function DashboardPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan, generation_count")
        .eq("user_email", email)
        .single();

      if (profileData) {
        setProfile(profileData);
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

    setGenerations((prev) => prev.filter((item) => item.id !== id));
  }

  const currentPlan = profile?.plan || "free";
  const currentUsage = profile?.generation_count || 0;
  const currentLimit = getPlanLimit(currentPlan);

  const creatorUrl = userEmail
    ? getCheckoutUrl(CREATOR_CHECKOUT, userEmail)
    : "/login";

  const proUrl = userEmail
    ? getCheckoutUrl(PRO_CHECKOUT, userEmail)
    : "/login";

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
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Account</p>
                <p className="mt-2 truncate font-semibold">{userEmail}</p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Plan</p>
                <p className="mt-2 text-3xl font-bold capitalize">
                  {currentPlan}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Usage</p>
                <p className="mt-2 text-3xl font-bold">
                  {currentUsage} / {currentLimit}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Status</p>
                <p className="mt-2 font-semibold text-green-400">Active</p>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Billing</h2>
                  <p className="mt-2 text-zinc-400">
                    Manage your Repurso plan and monthly generation limit.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {currentPlan === "free" && (
                    <>
                      <a
                        href={creatorUrl}
                        target="_blank"
                        className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
                      >
                        Upgrade to Creator
                      </a>

                      <a
                        href={proUrl}
                        target="_blank"
                        className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold"
                      >
                        Upgrade to Pro
                      </a>
                    </>
                  )}

                  {currentPlan === "creator" && (
                    <a
                      href={proUrl}
                      target="_blank"
                      className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
                    >
                      Upgrade to Pro
                    </a>
                  )}

                  {currentPlan === "pro" && (
                    <p className="rounded-xl border border-green-500 px-5 py-3 font-semibold text-green-400">
                      You are on the highest plan
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
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
                    <ReactMarkdown>{item.output}</ReactMarkdown>
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