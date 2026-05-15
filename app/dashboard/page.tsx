"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import { getPlanLimits } from "@/lib/planLimits";

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
  rewrite_count: number;
};

type OutputSection = {
  title: string;
  content: string;
};

const CREATOR_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/5f45028d-de97-458d-a827-64f8a7adc153";

const PRO_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/548cbc91-792f-4fae-b6a5-569f95c119c3";

const SECTION_TITLES = [
  "LinkedIn Post",
  "Twitter/X Post",
  "Instagram Caption",
  "TikTok Script",
  "YouTube Description",
];

function getCheckoutUrl(baseUrl: string, email: string) {
  return `${baseUrl}?checkout[email]=${encodeURIComponent(
    email
  )}&checkout[custom][user_email]=${encodeURIComponent(email)}`;
}

function formatOutput(raw: string) {
  let text = raw;

  SECTION_TITLES.forEach((title) => {
    text = text.replace(
      new RegExp(`\\n?#{0,6}\\s*${title}`, "gi"),
      `\n\n# ${title}\n`
    );
  });

  return text.trim();
}

function splitOutput(raw: string): OutputSection[] {
  const formatted = formatOutput(raw);
  const sections: OutputSection[] = [];

  SECTION_TITLES.forEach((title, index) => {
    const currentMarker = `# ${title}`;
    const nextTitle = SECTION_TITLES[index + 1];
    const nextMarker = nextTitle ? `# ${nextTitle}` : null;

    const start = formatted.indexOf(currentMarker);

    if (start === -1) return;

    const contentStart = start + currentMarker.length;

    const end = nextMarker ? formatted.indexOf(nextMarker, contentStart) : -1;

    const content =
      end === -1
        ? formatted.slice(contentStart).trim()
        : formatted.slice(contentStart, end).trim();

    sections.push({
      title,
      content,
    });
  });

  if (sections.length === 0) {
    return [
      {
        title: "Generated Content",
        content: raw,
      },
    ];
  }

  return sections;
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
        .select("plan, generation_count, rewrite_count")
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

  function exportFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], {
      type,
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);
  }

  const currentPlan = profile?.plan || "free";

  const limits = getPlanLimits(currentPlan);

  const generationUsage = profile?.generation_count || 0;
  const rewriteUsage = profile?.rewrite_count || 0;

  const generationPercent = Math.min(
    (generationUsage / limits.generations) * 100,
    100
  );

  const rewritePercent = Math.min(
    (rewriteUsage / limits.rewrites) * 100,
    100
  );

  const creatorUrl = userEmail
    ? getCheckoutUrl(CREATOR_CHECKOUT, userEmail)
    : "/login";

  const proUrl = userEmail
    ? getCheckoutUrl(PRO_CHECKOUT, userEmail)
    : "/login";

  const analytics = useMemo(() => {
    const totalCharacters = generations.reduce((acc, item) => {
      return acc + item.input.length;
    }, 0);

    const thisWeek = generations.filter((item) => {
      const created = new Date(item.created_at).getTime();

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return created >= weekAgo;
    });

    const averageCharacters =
      generations.length > 0
        ? Math.round(totalCharacters / generations.length)
        : 0;

    return {
      totalGenerations: generations.length,
      thisWeek: thisWeek.length,
      totalCharacters,
      averageCharacters,
    };
  }, [generations]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold">Dashboard</h1>

            <p className="mt-3 text-zinc-400">
              Analytics, usage insights and content history.
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

        {loading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : !userEmail ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="mb-3 text-2xl font-bold">Login required</h2>

            <p className="mb-6 text-zinc-400">
              Please login to view your dashboard.
            </p>

            <a
              href="/login"
              className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Login
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Current plan</p>

                <p className="mt-3 text-3xl font-bold capitalize">
                  {currentPlan}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Total generations</p>

                <p className="mt-3 text-3xl font-bold">
                  {analytics.totalGenerations}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">Rewrites used</p>

                <p className="mt-3 text-3xl font-bold">
                  {rewriteUsage}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">This week</p>

                <p className="mt-3 text-3xl font-bold">
                  {analytics.thisWeek}
                </p>
              </div>
            </div>

            <div className="mb-8 grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Generation usage
                    </h2>

                    <p className="mt-1 text-zinc-400">
                      Monthly AI generation usage.
                    </p>
                  </div>

                  <p className="text-lg font-bold">
                    {generationUsage} / {limits.generations}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${generationPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Rewrite usage
                    </h2>

                    <p className="mt-1 text-zinc-400">
                      Monthly rewrite usage.
                    </p>
                  </div>

                  <p className="text-lg font-bold">
                    {rewriteUsage} / {limits.rewrites}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${rewritePercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-4 xl:grid-cols-3">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">
                  Total input characters
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {analytics.totalCharacters.toLocaleString()}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">
                  Average input size
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {analytics.averageCharacters}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-sm text-zinc-500">
                  Account status
                </p>

                <p className="mt-3 text-3xl font-bold text-green-400">
                  Active
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Billing</h2>

                  <p className="mt-2 text-zinc-400">
                    Upgrade your monthly limits and unlock more AI power.
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
                    <div className="rounded-xl border border-green-500 px-5 py-3 font-semibold text-green-400">
                      Highest plan active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {generations.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <h2 className="mb-3 text-2xl font-bold">
                  No generations yet
                </h2>

                <p className="mb-6 text-zinc-400">
                  Generate your first content to see analytics and history.
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
                {generations.map((item) => {
                  const outputSections = splitOutput(item.output);

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
                    >
                      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-zinc-500">
                          <p>
                            {new Date(item.created_at).toLocaleString()}
                          </p>

                          <p>{item.user_email}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              exportFile(
                                `generation-${item.id}.txt`,
                                item.output,
                                "text/plain;charset=utf-8"
                              )
                            }
                            className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold"
                          >
                            Export TXT
                          </button>

                          <button
                            onClick={() =>
                              exportFile(
                                `generation-${item.id}.md`,
                                item.output,
                                "text/markdown;charset=utf-8"
                              )
                            }
                            className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold"
                          >
                            Export MD
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

                      <div className="space-y-4">
                        {outputSections.map((section) => (
                          <div
                            key={`${item.id}-${section.title}`}
                            className="rounded-2xl border border-zinc-800 bg-black p-5"
                          >
                            <div className="mb-4 flex items-center justify-between gap-4">
                              <h2 className="text-xl font-bold">
                                {section.title}
                              </h2>

                              <div className="flex gap-3">
                                <button
                                  onClick={() =>
                                    exportFile(
                                      `${section.title}.txt`,
                                      section.content,
                                      "text/plain;charset=utf-8"
                                    )
                                  }
                                  className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold"
                                >
                                  TXT
                                </button>

                                <button
                                  onClick={() =>
                                    exportFile(
                                      `${section.title}.md`,
                                      `# ${section.title}\n\n${section.content}`,
                                      "text/markdown;charset=utf-8"
                                    )
                                  }
                                  className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold"
                                >
                                  MD
                                </button>

                                <button
                                  onClick={() =>
                                    copyText(section.content)
                                  }
                                  className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            <div className="leading-8 text-zinc-200">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-4 whitespace-pre-wrap">
                                      {children}
                                    </p>
                                  ),
                                  li: ({ children }) => (
                                    <li className="mb-2">
                                      {children}
                                    </li>
                                  ),
                                }}
                              >
                                {section.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}