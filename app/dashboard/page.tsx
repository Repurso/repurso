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
      description: "Usage, credits, and performance overview",
    },
    {
      id: "history",
      label: "History",
      description: "Search, export, copy, and delete generated content",
    },
    {
      id: "subscription",
      label: "Subscription",
      description: "Current plan, limits, and upgrade options",
    },
  ];

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Repurso Dashboard
            </p>

            <h1 className="text-4xl font-bold sm:text-5xl">Dashboard</h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Manage analytics, generated content history, and subscription
              details from separate dashboard tabs.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/#generator"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-semibold transition hover:border-zinc-500"
            >
              Generate
            </a>

            <a
              href="/"
              className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
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
            <div className="mb-8 grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-3 md:grid-cols-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl p-4 text-left transition ${
                      isActive
                        ? "bg-white text-black"
                        : "bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white"
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

            {activeTab === "analytics" && (
              <section>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Current plan</p>

                    <p className="mt-3 text-3xl font-bold capitalize">
                      {currentPlan}
                    </p>

                    <p className="mt-2 truncate text-sm text-zinc-500">
                      {userEmail}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
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

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Rewrites remaining</p>

                    <p className="mt-3 text-3xl font-bold">
                      {rewriteRemaining}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {rewriteUsage} used of {limits.rewrites}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
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
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
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
                        className="h-full rounded-full bg-white transition-all"
                        style={{
                          width: `${generationPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
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
                        className="h-full rounded-full bg-white transition-all"
                        style={{
                          width: `${rewritePercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">
                      Total saved history
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.totalGenerations}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">
                      Total input characters
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.totalCharacters.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Average input size</p>

                    <p className="mt-3 text-3xl font-bold">
                      {analytics.averageCharacters}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Account status</p>

                    <p className="mt-3 text-3xl font-bold text-green-400">
                      Active
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "subscription" && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
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
                        Upgrade your monthly limits and unlock more room for
                        content generation and rewrites.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {currentPlan === "free" && (
                        <>
                          <a
                            href={creatorUrl}
                            target="_blank"
                            className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
                          >
                            Upgrade to Creator
                          </a>

                          <a
                            href={proUrl}
                            target="_blank"
                            className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-semibold transition hover:border-zinc-500"
                          >
                            Upgrade to Pro
                          </a>
                        </>
                      )}

                      {currentPlan === "creator" && (
                        <a
                          href={proUrl}
                          target="_blank"
                          className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
                        >
                          Upgrade to Pro
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
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Plan</p>

                    <p className="mt-3 text-3xl font-bold capitalize">
                      {currentPlan}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Connected to {userEmail}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Generation limit</p>

                    <p className="mt-3 text-3xl font-bold">
                      {limits.generations}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {generationRemaining} remaining this month
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-sm text-zinc-500">Rewrite limit</p>

                    <p className="mt-3 text-3xl font-bold">
                      {limits.rewrites}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {rewriteRemaining} remaining this month
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                  <h3 className="text-2xl font-bold">Billing note</h3>

                  <p className="mt-3 text-zinc-400">
                    Customer portal is planned after Lemon Squeezy store
                    approval. Checkout and webhook-based plan activation remain
                    active.
                  </p>
                </div>
              </section>
            )}

            {activeTab === "history" && (
              <section>
                <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
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
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
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
                      className="h-12 rounded-2xl border border-zinc-800 bg-black px-5 text-white outline-none placeholder:text-zinc-600"
                    />

                    <select
                      value={dateFilter}
                      onChange={(e) =>
                        setDateFilter(e.target.value as DateFilter)
                      }
                      className="h-12 rounded-2xl border border-zinc-800 bg-black px-5 text-white outline-none"
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
                      className="h-12 rounded-2xl border border-zinc-800 bg-black px-5 text-white outline-none"
                    >
                      <option value="latest">Latest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
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
                ) : filteredGenerations.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
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
                          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6"
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
                                className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold transition hover:border-zinc-500"
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
                                className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold transition hover:border-zinc-500"
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
                                      className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold transition hover:border-zinc-500"
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
                                      className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold transition hover:border-zinc-500"
                                    >
                                      MD
                                    </button>

                                    <button
                                      onClick={() =>
                                        copyText(section.content)
                                      }
                                      className="rounded-xl bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200"
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