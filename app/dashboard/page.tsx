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

type DateFilter = "all" | "today" | "week" | "month";
type SortOrder = "latest" | "oldest";
type DashboardTab = "analytics" | "history" | "subscription";

const CREATOR_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/f331a19b-e62f-4587-b9a8-19b4dad91db3";

const PRO_CHECKOUT =
  "https://repursoapp.lemonsqueezy.com/checkout/buy/41ceda2d-d556-493f-b3f1-777150658c65";

const SECTION_TITLES = [
  "LinkedIn Post",
  "Twitter/X Post",
  "Instagram Caption",
  "TikTok Script",
  "YouTube Description",
  "Facebook Post",
  "Threads Post",
  "Snapchat Caption",
  "Pinterest Pin Description",
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

function getRemaining(limit: number, used: number) {
  return Math.max(limit - used, 0);
}

function getPercent(used: number, limit: number) {
  if (limit <= 0) return 0;

  return Math.min((used / limit) * 100, 100);
}

function isWithinDateFilter(date: string, filter: DateFilter) {
  if (filter === "all") return true;

  const created = new Date(date);
  const now = new Date();

  if (filter === "today") {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }

  if (filter === "week") {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return created.getTime() >= weekAgo;
  }

  if (filter === "month") {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }

  return true;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("analytics");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  async function copyText(text: string, key = "dashboard") {
    await navigator.clipboard.writeText(text);

    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey(null);
    }, 1800);
  }

  async function deleteGeneration(id: string) {
    const confirmed = confirm("Delete this generation?");

    if (!confirmed) return;

    const { error } = await supabase.from("generations").delete().eq("id", id);

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

  function clearFilters() {
    setSearchQuery("");
    setDateFilter("all");
    setSortOrder("latest");
  }

  const currentPlan = profile?.plan || "free";
  const limits = getPlanLimits(currentPlan);

  const generationUsage = profile?.generation_count || 0;
  const rewriteUsage = profile?.rewrite_count || 0;

  const generationRemaining = getRemaining(limits.generations, generationUsage);
  const rewriteRemaining = getRemaining(limits.rewrites, rewriteUsage);

  const generationPercent = getPercent(generationUsage, limits.generations);
  const rewritePercent = getPercent(rewriteUsage, limits.rewrites);

  const creatorUrl = userEmail
    ? getCheckoutUrl(CREATOR_CHECKOUT, userEmail)
    : "/login";

  const proUrl = userEmail ? getCheckoutUrl(PRO_CHECKOUT, userEmail) : "/login";

  const filteredGenerations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = generations.filter((item) => {
      const matchesSearch =
        !query ||
        item.input.toLowerCase().includes(query) ||
        item.output.toLowerCase().includes(query) ||
        new Date(item.created_at).toLocaleString().toLowerCase().includes(query);

      const matchesDate = isWithinDateFilter(item.created_at, dateFilter);

      return matchesSearch && matchesDate;
    });

    return filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();

      if (sortOrder === "latest") return bTime - aTime;

      return aTime - bTime;
    });
  }, [generations, searchQuery, dateFilter, sortOrder]);

  const analytics = useMemo(() => {
    const totalCharacters = generations.reduce((acc, item) => {
      return acc + item.input.length;
    }, 0);

    const thisWeek = generations.filter((item) => {
      const created = new Date(item.created_at).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return created >= weekAgo;
    });

    const today = generations.filter((item) => {
      const created = new Date(item.created_at);
      const now = new Date();

      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    });

    const averageCharacters =
      generations.length > 0
        ? Math.round(totalCharacters / generations.length)
        : 0;

    return {
      totalGenerations: generations.length,
      thisWeek: thisWeek.length,
      today: today.length,
      totalCharacters,
      averageCharacters,
    };
  }, [generations]);

  const tabs: { id: DashboardTab; label: string; description: string }[] = [
    {
      id: "analytics",
      label: "Analytics",
      description: "Usage, credits, and account overview",
    },
    {
      id: "history",
      label: "History",
      description: "Search, export, copy, and delete generations",
    },
    {
      id: "subscription",
      label: "Subscription",
      description: "Current plan, limits, and upgrades",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-3 py-3 text-white sm:px-6 sm:py-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[110px] sm:h-[520px] sm:w-[520px] sm:blur-[140px]" />
        <div className="absolute right-[-120px] top-[260px] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[110px] sm:h-[420px] sm:w-[420px] sm:blur-[130px]" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[300px] w-[300px] rounded-full bg-violet-700/10 blur-[110px] sm:h-[420px] sm:w-[420px] sm:blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="sticky top-2 z-40 mb-6 rounded-2xl border border-white/10 bg-black/55 px-3 py-3 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:top-4 sm:mb-8 sm:rounded-3xl sm:px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <a href="/" className="group flex items-center gap-3">
              <img
                src="/logo-icon.png"
                alt="Repurso"
                className="h-8 w-8 rounded-xl object-cover shadow-lg shadow-purple-700/20 transition group-hover:scale-105 sm:h-9 sm:w-9"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-200">
                  Repurso Dashboard
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
              </div>
            </a>

            <div className="flex flex-wrap gap-3">
              <a
                href="/#generator"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:px-5 sm:py-3"
              >
                Generate
              </a>

              <a
                href="/#hook-generator"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:px-5 sm:py-3"
              >
                Hooks
              </a>

              <a
                href="/"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-5 sm:py-3"
              >
                Back home
              </a>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Track usage, manage history, and control subscription details from clean dashboard tabs.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8 shadow-2xl shadow-purple-950/20">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400/20 border-t-purple-400" />
              <p className="font-semibold text-purple-100">Loading dashboard...</p>
            </div>
            <p className="text-sm text-zinc-500">Fetching your usage, history and subscription details.</p>
          </div>
        ) : !userEmail ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8 shadow-2xl shadow-purple-950/20">
            <h2 className="mb-3 text-2xl font-bold">Login required</h2>

            <p className="mb-6 text-zinc-400">
              Please login to view your dashboard.
            </p>

            <a
              href="/login"
              className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black shadow-lg shadow-purple-950/20 transition hover:bg-zinc-200"
            >
              Login
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-2 rounded-3xl border border-white/10 bg-zinc-950/70 p-2 shadow-2xl shadow-purple-950/10 backdrop-blur md:grid-cols-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl border border-transparent p-4 text-left transition ${
                      isActive
                        ? "bg-white text-black shadow-lg shadow-purple-950/20"
                        : "bg-black/60 text-zinc-400 hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
                    }`}
                  >
                    <span className="block text-base font-bold">
                      {tab.label}
                    </span>

                    <span
                      className={`mt-1 block text-sm ${
                        isActive ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      {tab.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Plan</p>
                <p className="mt-2 text-xl font-bold capitalize">{currentPlan}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Generations left</p>
                <p className="mt-2 text-xl font-bold">{generationRemaining}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">History items</p>
                <p className="mt-2 text-xl font-bold">{generations.length}</p>
              </div>
            </div>

            {activeTab === "analytics" && (
              <section>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Current plan</p>

                    <p className="mt-3 text-3xl font-bold capitalize">
                      {currentPlan}
                    </p>

                    <p className="mt-2 truncate text-sm text-zinc-500">
                      {userEmail}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">
                      Generations remaining
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {generationRemaining}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {generationUsage} used of {limits.generations}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Rewrites remaining</p>

                    <p className="mt-3 text-3xl font-bold">
                      {rewriteRemaining}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {rewriteUsage} used of {limits.rewrites}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">This week</p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.thisWeek}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {analytics.today} generated today
                    </p>
                  </div>
                </div>

                <div className="mb-8 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          Generation usage
                        </h2>

                        <p className="mt-1 text-zinc-400">
                          Monthly AI generation usage.
                        </p>
                      </div>

                      <p className="shrink-0 text-lg font-bold">
                        {generationUsage} / {limits.generations}
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.55)] transition-all duration-700"
                        style={{
                          width: `${generationPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">Rewrite usage</h2>

                        <p className="mt-1 text-zinc-400">
                          Monthly rewrite usage.
                        </p>
                      </div>

                      <p className="shrink-0 text-lg font-bold">
                        {rewriteUsage} / {limits.rewrites}
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.55)] transition-all duration-700"
                        style={{
                          width: `${rewritePercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">
                      Total saved history
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.totalGenerations}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">
                      Total input characters
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.totalCharacters.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Average input size</p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.averageCharacters}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Account status</p>

                    <p className="mt-3 text-3xl font-bold text-green-400">
                      Active
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Recent activity</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Your latest generated content.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("history")}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold transition hover:border-purple-400/40 hover:bg-purple-500/10"
                    >
                      View history
                    </button>
                  </div>

                  {generations.slice(0, 3).length === 0 ? (
                    <p className="text-zinc-500">No activity yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {generations.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-black/60 p-4"
                        >
                          <p className="mb-2 text-xs text-zinc-600">
                            {new Date(item.created_at).toLocaleString()}
                          </p>

                          <p className="line-clamp-2 text-sm text-zinc-300">
                            {item.input}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "subscription" && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        Subscription
                      </p>

                      <h2 className="text-3xl font-bold">
                        Your current plan is{" "}
                        <span className="capitalize">{currentPlan}</span>
                      </h2>

                      <p className="mt-3 max-w-2xl text-zinc-400">
                        Upgrade your monthly limits and unlock more AI content
                        generation and rewrites.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {currentPlan === "free" && (
                        <>
                          <a
                            href={creatorUrl}
                            target="_blank"
                            className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black shadow-lg shadow-purple-950/20 transition hover:-translate-y-0.5 hover:bg-zinc-200"
                          >
                            Start Creator trial
                          </a>

                          <a
                            href={proUrl}
                            target="_blank"
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center font-semibold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10"
                          >
                            Start Pro trial
                          </a>
                        </>
                      )}

                      {currentPlan === "creator" && (
                        <a
                          href={proUrl}
                          target="_blank"
                          className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black shadow-lg shadow-purple-950/20 transition hover:-translate-y-0.5 hover:bg-zinc-200"
                        >
                          Start Pro trial
                        </a>
                      )}

                      {currentPlan === "pro" && (
                        <div className="rounded-xl border border-green-500 px-5 py-3 text-center font-semibold text-green-400">
                          Highest plan active
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Plan</p>

                    <p className="mt-3 text-3xl font-bold capitalize">
                      {currentPlan}
                    </p>

                    <p className="mt-2 truncate text-sm text-zinc-500">
                      {userEmail}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Generation limit</p>

                    <p className="mt-3 text-3xl font-bold">
                      {limits.generations}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {generationRemaining} remaining this month
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                    <p className="text-sm text-zinc-500">Rewrite limit</p>

                    <p className="mt-3 text-3xl font-bold">
                      {limits.rewrites}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {rewriteRemaining} remaining this month
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white p-6 text-black shadow-2xl shadow-purple-950/20">
                    <div className="mb-3 inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                      Creator
                    </div>

                    <p className="text-4xl font-bold">$9.99</p>
                    <p className="mt-1 text-sm text-zinc-600">/ month · 3-day free trial</p>

                    <ul className="mt-5 space-y-3 text-sm">
                      <li>✓ 300 generations / month</li>
                      <li>✓ 500 rewrites / month</li>
                      <li>✓ 5,000 characters</li>
                    </ul>

                    <a
                      href={creatorUrl}
                      target="_blank"
                      className="mt-6 block rounded-2xl bg-black px-5 py-3 text-center font-bold text-white"
                    >
                      Start Creator trial
                    </a>
                  </div>

                  <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-6 shadow-2xl shadow-purple-950/20">
                    <div className="mb-3 inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-100">
                      Pro
                    </div>

                    <p className="text-4xl font-bold">$19.99</p>
                    <p className="mt-1 text-sm text-zinc-400">/ month · 3-day free trial</p>

                    <ul className="mt-5 space-y-3 text-sm text-zinc-300">
                      <li>✓ 1000 generations / month</li>
                      <li>✓ 2000 rewrites / month</li>
                      <li>✓ 10,000 characters</li>
                    </ul>

                    <a
                      href={proUrl}
                      target="_blank"
                      className="mt-6 block rounded-2xl bg-white px-5 py-3 text-center font-bold text-black"
                    >
                      Start Pro trial
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30">
                  <h3 className="text-2xl font-bold">Billing note</h3>

                  <p className="mt-3 text-zinc-400">
                    Paid plans include a 3-day free trial. Customer portal can be added after Lemon Squeezy store approval. Checkout links and webhook-based plan activation remain ready.
                  </p>
                </div>
              </section>
            )}

            {activeTab === "history" && (
              <section>
                <div className="mb-6 rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Content history</h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {filteredGenerations.length} result
                        {filteredGenerations.length === 1 ? "" : "s"} shown
                        from {generations.length} total.
                      </p>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-purple-400/40 hover:text-white"
                    >
                      Clear filters
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 rounded-2xl border border-white/10 bg-black/70 px-5 text-white outline-none placeholder:text-zinc-600"
                    />

                    <select
                      value={dateFilter}
                      onChange={(e) =>
                        setDateFilter(e.target.value as DateFilter)
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-black/70 px-5 text-white outline-none"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>

                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as SortOrder)
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-black/70 px-5 text-white outline-none"
                    >
                      <option value="latest">Latest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                </div>

                {generations.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8">
                    <h2 className="mb-3 text-2xl font-bold">
                      No generations yet
                    </h2>

                    <p className="mb-6 text-zinc-400">
                      Generate your first content to see analytics and history.
                    </p>

                    <a
                      href="/#generator"
                      className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black shadow-lg shadow-purple-950/20 transition hover:bg-zinc-200"
                    >
                      Generate content
                    </a>
                  </div>
                ) : filteredGenerations.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8 text-center">
                    <h2 className="mb-3 text-2xl font-bold">
                      No results found
                    </h2>

                    <p className="mb-6 text-zinc-400">
                      Try a different search term or filter.
                    </p>

                    <button
                      onClick={clearFilters}
                      className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredGenerations.map((item) => {
                      const outputSections = splitOutput(item.output);

                      return (
                        <div
                          key={item.id}
                          className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 sm:p-6"
                        >
                          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-zinc-500">
                              <p>
                                {new Date(item.created_at).toLocaleString()}
                              </p>

                              <p>{item.user_email}</p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                              <button
                                onClick={() =>
                                  exportFile(
                                    `generation-${item.id}.txt`,
                                    item.output,
                                    "text/plain;charset=utf-8"
                                  )
                                }
                                className="rounded-xl border border-white/10 px-4 py-2 font-semibold transition hover:border-purple-400/40"
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
                                className="rounded-xl border border-white/10 px-4 py-2 font-semibold transition hover:border-purple-400/40"
                              >
                                Export MD
                              </button>

                              <button
                                onClick={() => deleteGeneration(item.id)}
                                className="rounded-xl border border-red-500 px-4 py-2 font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mb-5 rounded-2xl border border-white/10 bg-black/70 p-5">
                            <h2 className="mb-2 font-bold">Input</h2>

                            <p className="whitespace-pre-wrap text-zinc-300">
                              {item.input}
                            </p>
                          </div>

                          <div className="space-y-4">
                            {outputSections.map((section) => (
                              <div
                                key={`${item.id}-${section.title}`}
                                className="rounded-2xl border border-white/10 bg-black/70 p-5"
                              >
                                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <h2 className="text-xl font-bold">
                                    {section.title}
                                  </h2>

                                  <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                      onClick={() =>
                                        exportFile(
                                          `${section.title}.txt`,
                                          section.content,
                                          "text/plain;charset=utf-8"
                                        )
                                      }
                                      className="rounded-xl border border-white/10 px-4 py-2 font-semibold transition hover:border-purple-400/40"
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
                                      className="rounded-xl border border-white/10 px-4 py-2 font-semibold transition hover:border-purple-400/40"
                                    >
                                      MD
                                    </button>

                                    <button
                                      onClick={() =>
                                        copyText(section.content, `${item.id}-${section.title}`)
                                      }
                                      className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white shadow-lg shadow-purple-950/20 transition hover:bg-purple-500"
                                    >
                                      {copiedKey === `${item.id}-${section.title}` ? "Copied" : "Copy"}
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
                                        <li className="mb-2">{children}</li>
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
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
