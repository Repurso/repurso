"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import {
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaPinterest,
} from "react-icons/fa";

import { BsThreads } from "react-icons/bs";

import { SiTiktok, SiSnapchat, SiX } from "react-icons/si";
import {
  DEFAULT_PROMPT_TEMPLATE_ID,
  PROMPT_TEMPLATES,
  PromptTemplateId,
} from "@/lib/templates";
import { getPlanLimits } from "@/lib/planLimits";
import { SavedPrompt } from "@/types/prompt";
import {
  DEFAULT_QUALITY_MODE,
  QUALITY_MODES,
  QualityModeId,
} from "@/lib/qualityModes";

const CREATOR_CHECKOUT = (email: string) =>
  `https://repursoapp.lemonsqueezy.com/checkout/buy/f331a19b-e62f-4587-b9a8-19b4dad91db3?checkout[email]=${encodeURIComponent(
    email
  )}&checkout[custom][user_email]=${encodeURIComponent(email)}`;

const PRO_CHECKOUT = (email: string) =>
  `https://repursoapp.lemonsqueezy.com/checkout/buy/41ceda2d-d556-493f-b3f1-777150658c65?checkout[email]=${encodeURIComponent(
    email
  )}&checkout[custom][user_email]=${encodeURIComponent(email)}`;

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


const SECTION_ICONS: Record<string, React.ReactElement> = {
  "LinkedIn Post": <FaLinkedin className="text-[#0A66C2]" />,
  "Twitter/X Post": <SiX className="text-white" />,
  "Instagram Caption": <FaInstagram className="text-pink-500" />,
  "TikTok Script": <SiTiktok className="text-white" />,
  "YouTube Description": <FaYoutube className="text-red-500" />,
  "Facebook Post": <FaFacebook className="text-blue-500" />,
  "Threads Post": <BsThreads className="text-white" />,
  "Snapchat Caption": <SiSnapchat className="text-yellow-400" />,
  "Pinterest Pin Description": <FaPinterest className="text-red-600" />,
};

const LOADING_STEPS = [
  "Analyzing your idea",
  "Generating platform-specific hooks",
  "Optimizing tone and engagement",
  "Creating creator-style variations",
  "Preparing publish-ready outputs",
];


const FAQ_ITEMS = [
  {
    question: "What does Repurso do?",
    answer:
      "Repurso turns one idea into platform-ready content for LinkedIn, X, Instagram, TikTok, YouTube, Facebook, Threads, Snapchat and Pinterest.",
  },
  {
    question: "Can I rewrite generated content?",
    answer:
      "Yes. Each output can be rewritten to be more viral, more professional, shorter, longer or more emotional.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The free plan includes 20 generations so you can test the workflow before upgrading.",
  },
  {
    question: "Can I cancel paid plans?",
    answer:
      "Yes. Paid plans include a 3-day free trial and can be cancelled anytime.",
  },
];

const VIRAL_EXAMPLES = [
  {
    before: "We launched a new AI tool for content creators.",
    after:
      "Most creators waste hours rewriting the same idea for every platform. We built Repurso to fix that.",
  },
  {
    before: "Our product helps marketers create social media content.",
    after:
      "One idea. Nine platform-ready posts. Repurso turns raw thoughts into content you can actually publish.",
  },
  {
    before: "I want to post more consistently.",
    after:
      "Consistency gets easier when one idea becomes LinkedIn, X, TikTok, Instagram and YouTube content in seconds.",
  },
];

const QUICK_START_PROMPTS = [
  {
    title: "SaaS launch",
    description: "Turn a product launch idea into platform-ready posts.",
    prompt:
      "We are launching a new AI SaaS that helps creators repurpose one idea into content for every platform.",
  },
  {
    title: "Founder story",
    description: "Create personal brand content from a founder insight.",
    prompt:
      "I learned that most founders spend too much time building features before validating distribution.",
  },
  {
    title: "Educational post",
    description: "Explain a useful idea in a way people want to save.",
    prompt:
      "Content repurposing helps creators save time by adapting one core idea for different platforms.",
  },
];

const EXTRA_REWRITE_OPTIONS = [
  ["More Storytelling", "more-storytelling"],
  ["More Founder Style", "more-founder-style"],
  ["More Contrarian", "more-contrarian"],
  ["More Gen Z", "more-gen-z"],
  ["More Luxury Brand", "more-luxury-brand"],
];

type OutputSection = {
  id: string;
  title: string;
  content: string;
};

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
      id: title.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-"),
      title,
      content,
    });
  });

  if (sections.length === 0) {
    return [
      {
        id: "generated-content",
        title: "Generated Content",
        content: raw,
      },
    ];
  }

  return sections;
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userPlan, setUserPlan] = useState("free");
  const [generationUsage, setGenerationUsage] = useState(0);
  const [rewriteUsage, setRewriteUsage] = useState(0);

  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplateId>(DEFAULT_PROMPT_TEMPLATE_ID);

  const [qualityMode, setQualityMode] =
    useState<QualityModeId>(DEFAULT_QUALITY_MODE);

  const [rewriteLoadingId, setRewriteLoadingId] = useState<string | null>(null);

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [promptTitle, setPromptTitle] = useState("");
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [hookInput, setHookInput] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [hookLoading, setHookLoading] = useState(false);
  const [copiedHookIndex, setCopiedHookIndex] = useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const outputSections = result ? splitOutput(result) : [];
  const characterCount = input.length;

  const limits = getPlanLimits(userPlan);
  const characterLimit = limits.characters;
  const generationLimit = limits.generations;
  const rewriteLimit = limits.rewrites;

  const generationPercent = Math.min(
    (generationUsage / generationLimit) * 100,
    100
  );

  const rewritePercent = Math.min((rewriteUsage / rewriteLimit) * 100, 100);

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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
            generation_count: 0,
            rewrite_count: 0,
          });

          setUserPlan("free");
          setGenerationUsage(0);
          setRewriteUsage(0);
        } else {
          setUserPlan(existingProfile.plan || "free");
          setGenerationUsage(existingProfile.generation_count || 0);
          setRewriteUsage(existingProfile.rewrite_count || 0);
        }

        const { data: promptData } = await supabase
          .from("saved_prompts")
          .select("*")
          .eq("user_email", email)
          .order("created_at", { ascending: false });

        setSavedPrompts(promptData || []);
      }
    }

    getUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % LOADING_STEPS.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function generateContent() {
    if (!input.trim()) {
      alert("Please enter content.");
      return;
    }

    if (characterCount > characterLimit) {
      alert(`Your ${userPlan} plan allows maximum ${characterLimit} characters.`);
      return;
    }

    if (generationUsage >= generationLimit) {
      alert(`You reached your ${userPlan} plan generation limit.`);
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
          template: selectedTemplate,
          qualityMode,
          userEmail: userEmail || "anonymous",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong.");

        if (data.usage) {
          setGenerationUsage(data.usage.used || 0);
        }

        return;
      }

      setResult(data.result);

      if (data.usage) {
        setGenerationUsage(data.usage.used || 0);
      }
    } catch {
      alert("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  }

  async function rewriteSection(
    sectionId: string,
    content: string,
    rewriteType: string
  ) {
    if (rewriteUsage >= rewriteLimit) {
      alert(`You reached your ${userPlan} plan rewrite limit.`);
      return;
    }

    if (content.length > characterLimit) {
      alert(
        `Your ${userPlan} plan allows maximum ${characterLimit} characters for rewrite.`
      );
      return;
    }

    try {
      setRewriteLoadingId(sectionId);

      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          rewriteType,
          template: selectedTemplate,
          qualityMode,
          userEmail: userEmail || "anonymous",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Rewrite failed.");

        if (data.usage) {
          setRewriteUsage(data.usage.used || 0);
        }

        return;
      }

      const updatedSections = outputSections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            content: data.result,
          };
        }

        return section;
      });

      const rebuiltResult = updatedSections
        .map((section) => `# ${section.title}\n\n${section.content}`)
        .join("\n\n");

      setResult(rebuiltResult);

      if (data.usage) {
        setRewriteUsage(data.usage.used || 0);
      }
    } catch {
      alert("Rewrite failed.");
    } finally {
      setRewriteLoadingId(null);
    }
  }

  async function savePrompt() {
    if (!input.trim()) {
      alert("Please enter content first.");
      return;
    }

    if (!promptTitle.trim()) {
      alert("Please enter a prompt title.");
      return;
    }

    if (!userEmail) {
      alert("Please login first.");
      return;
    }

    try {
      setSavingPrompt(true);

      const { data, error } = await supabase
        .from("saved_prompts")
        .insert({
          user_email: userEmail,
          title: promptTitle,
          prompt: input,
        })
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      setSavedPrompts((prev) => [data, ...prev]);
      setPromptTitle("");

      alert("Prompt saved.");
    } catch {
      alert("Failed to save prompt.");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function deletePrompt(id: string) {
    const confirmed = confirm("Delete this prompt?");

    if (!confirmed) return;

    const { error } = await supabase.from("saved_prompts").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setSavedPrompts((prev) => prev.filter((item) => item.id !== id));
  }

  async function copyText(text: string, sectionId: string) {
    await navigator.clipboard.writeText(text);

    setCopiedSection(sectionId);
    window.setTimeout(() => {
      setCopiedSection(null);
    }, 1800);
  }

  async function generateHooks() {
    if (!hookInput.trim()) {
      alert("Please enter a topic or idea.");
      return;
    }

    setHookLoading(true);
    setHooks([]);

    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: hookInput,
          userEmail: userEmail || "anonymous",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to generate hooks.");
        return;
      }

      setHooks(data.hooks || []);
    } catch {
      alert("Failed to generate hooks.");
    } finally {
      setHookLoading(false);
    }
  }

  async function copyHook(hook: string, index: number) {
    await navigator.clipboard.writeText(hook);

    setCopiedHookIndex(index);
    window.setTimeout(() => {
      setCopiedHookIndex(null);
    }, 1800);
  }

  function exportTextFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], {
      type,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);

    if (filename.endsWith(".md")) {
      setToast("Markdown exported");
    } else {
      setToast("TXT exported");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-2 py-2 text-white sm:px-6 sm:py-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[100px] sm:h-[520px] sm:w-[520px] sm:blur-[140px]" />
        <div className="absolute right-[-120px] top-[220px] h-[280px] w-[280px] rounded-full bg-fuchsia-600/10 blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[130px]" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[280px] w-[280px] rounded-full bg-violet-700/10 blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <nav className="sticky top-2 z-40 mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/55 px-3 py-2.5 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:top-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <img
                src="/logo-icon.png"
                alt="Repurso"
                className="h-8 w-8 rounded-xl object-cover shadow-lg shadow-purple-700/20 transition group-hover:scale-105 sm:h-9 sm:w-9"
              />

              <span className="text-xl font-bold tracking-tight sm:text-3xl">
                Repurso
              </span>
            </Link>

            {!userEmail && (
              <Link
                href="/login"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:hidden"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#hook-generator"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Hooks
            </a>

            <a
              href="#pricing"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Pricing
            </a>

            <button
              onClick={() =>
                (window.location.href =
                  "mailto:repurso.app@gmail.com?subject=Repurso Feedback")
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:text-base"
            >
              Feedback
            </button>

            {userEmail ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:text-base"
                >
                  Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-xl bg-white px-4 py-2 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:block"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        <section className="mb-10 grid items-start gap-4 lg:mb-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div className="pt-2 lg:sticky lg:top-6">
            <div className="mb-4 inline-flex rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100 shadow-lg shadow-purple-950/20">
              AI content repurposing tool
            </div>

            <h2 className="mb-4 bg-gradient-to-br from-white via-white to-purple-200 bg-clip-text text-[2rem] font-bold leading-tight text-transparent sm:mb-5 sm:text-5xl">
              Turn one idea into content for every platform.
            </h2>

            <p className="mb-5 text-sm leading-6 text-zinc-400 sm:mb-6 sm:text-lg sm:leading-8">
              Repurso helps creators, founders and marketers transform one idea
              into platform-ready content for LinkedIn, X, Instagram, TikTok,
              YouTube, Facebook, Threads, Snapchat and Pinterest.
            </p>
<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#generator"
                className="rounded-2xl bg-white px-6 py-3.5 text-center text-sm font-bold text-black shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-8 sm:py-4 sm:text-base"
              >
                Try it free
              </a>

              <a
                href="#pricing"
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-center text-sm font-bold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:px-8 sm:py-4 sm:text-base"
              >
                View pricing
              </a>
            </div>

            <div className="hidden rounded-[28px] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-purple-950/10 backdrop-blur lg:block">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-zinc-500">Output formats</p>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                  Platform-native
                </span>
              </div>

              <div className="grid gap-3">
                {SECTION_TITLES.map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/70 p-2.5 text-xs sm:p-3 sm:text-sm text-zinc-300 transition hover:border-purple-400/30 hover:bg-purple-500/10"
                  >
                    <span className="text-lg">
                      {SECTION_ICONS[title]}
                    </span>

                    {title}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-4">
                <p className="mb-2 text-sm font-semibold text-purple-100">
                  Example workflow
                </p>
                <p className="text-sm leading-6 text-zinc-400">
                  Paste one raw idea and get publish-ready versions for every major social channel.
                </p>
              </div>
            </div>
          </div>

          <section
            id="generator"
            className="rounded-[20px] border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-purple-950/20 backdrop-blur sm:rounded-[32px] sm:p-7"
          >
            <h3 className="mb-2 text-2xl font-bold sm:text-4xl">
              Generate content
            </h3>

            <p className="mb-5 text-sm text-zinc-400 sm:mb-6 sm:text-lg">
              Paste your content and let Repurso turn it into multiple formats.
            </p>
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Quality Mode
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {QUALITY_MODES.map((mode) => {
                  const isSelected = qualityMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setQualityMode(mode.id)}
                      className={`rounded-2xl border p-3 text-left transition sm:p-4 ${
                        isSelected
                          ? "border-white bg-white text-black shadow-lg shadow-purple-950/20"
                          : "border-white/10 bg-black/70 text-white hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10"
                      }`}
                    >
                      <h4 className="mb-1 font-bold">{mode.name}</h4>

                      <p
                        className={`text-xs leading-5 ${
                          isSelected ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {mode.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Template
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {PROMPT_TEMPLATES.map((template) => {
                  const isSelected = selectedTemplate === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`rounded-2xl border p-3 text-left transition sm:p-4 ${
                        isSelected
                          ? "border-white bg-white text-black shadow-lg shadow-purple-950/20"
                          : "border-white/10 bg-black/70 text-white hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10"
                      }`}
                    >
                      <h4 className="mb-1 font-bold">{template.name}</h4>

                      <p
                        className={`text-xs leading-5 ${
                          isSelected ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {template.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-500">Character usage</p>

              <p
                className={`text-sm font-semibold ${
                  characterCount > characterLimit
                    ? "text-red-400"
                    : "text-zinc-400"
                }`}
              >
                {characterCount} / {characterLimit}
              </p>
            </div>

            <textarea
              placeholder="Paste your idea, tweet, article, video script or raw thoughts here..."
              className="mb-3 h-28 w-full rounded-3xl border border-white/10 bg-black/70 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/10 sm:h-44 sm:p-5 sm:text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="mb-5">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className={`h-full rounded-full transition-all ${
                    characterCount > characterLimit ? "bg-red-500" : "bg-white"
                  }`}
                  style={{
                    width: `${Math.min(
                      (characterCount / characterLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Generations</span>
                    <span className="font-semibold text-white">
                      {generationUsage} / {generationLimit}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.55)] transition-all duration-700"
                      style={{
                        width: `${generationPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Rewrites</span>
                    <span className="font-semibold text-white">
                      {rewriteUsage} / {rewriteLimit}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.55)] transition-all duration-700"
                      style={{
                        width: `${rewritePercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-500">
                Current plan:{" "}
                <span className="font-semibold capitalize text-white">
                  {userPlan}
                </span>
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                placeholder="Prompt title..."
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                className="h-13 flex-1 rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-white outline-none placeholder:text-zinc-600"
              />

              <button
                onClick={savePrompt}
                disabled={savingPrompt}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-bold text-white disabled:opacity-60"
              >
                {savingPrompt ? "Saving..." : "Save Prompt"}
              </button>

              <button
                onClick={() => setShowPromptLibrary(true)}
                className="rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-bold text-white"
              >
                Prompt Library
              </button>
            </div>

            <button
              onClick={generateContent}
              disabled={
                loading ||
                characterCount > characterLimit ||
                generationUsage >= generationLimit
              }
              className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-black shadow-xl shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:translate-y-0 disabled:opacity-60 sm:w-auto sm:px-10 sm:py-5 sm:text-lg"
            >
              {loading && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              )}

              {loading ? "Generating..." : "Generate"}
            </button>

            {loading && (
              <div className="mt-6 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-purple-400" />
                  <p className="font-semibold text-purple-100">
                    {LOADING_STEPS[loadingStep]}...
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  {LOADING_STEPS.map((step, index) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition ${
                        index <= loadingStep ? "bg-purple-400" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {showPromptLibrary && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6">
                <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 sm:rounded-[32px] sm:p-8">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-[2rem] font-bold">Prompt Library</h2>

                      <p className="mt-2 text-zinc-400">
                        Reuse your saved prompts instantly.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowPromptLibrary(false)}
                      className="rounded-2xl border border-zinc-700 px-5 py-3 font-bold"
                    >
                      Close
                    </button>
                  </div>

                  {savedPrompts.length === 0 ? (
                    <div className="rounded-3xl border border-zinc-800 bg-black p-8 text-center">
                      <p className="text-zinc-400">No saved prompts yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {savedPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="rounded-3xl border border-zinc-800 bg-black p-5"
                        >
                          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-xl font-bold">
                                {prompt.title}
                              </h3>

                              <p className="mt-2 text-sm text-zinc-500">
                                {new Date(prompt.created_at).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                onClick={() => {
                                  setInput(prompt.prompt);
                                  setShowPromptLibrary(false);
                                }}
                                className="rounded-xl bg-white px-4 py-2 font-semibold text-black"
                              >
                                Use
                              </button>

                              <button
                                onClick={() => deletePrompt(prompt.id)}
                                className="rounded-xl border border-red-500 px-4 py-2 font-semibold text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <p className="whitespace-pre-wrap text-zinc-300">
                            {prompt.prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="mt-8 space-y-5">
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                  <p className="font-bold text-emerald-100">
                    Your platform-ready content is ready.
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/70">
                    Rewrite, copy or export each version below.
                  </p>
                </div>
                {outputSections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-3xl border border-white/10 bg-black/80 p-5 shadow-xl shadow-purple-950/10 transition hover:border-purple-400/30 sm:p-6"
                  >
                    <div className="mb-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="flex min-w-0 items-center gap-3 text-2xl font-bold">
                          <span className="text-2xl">
                            {SECTION_ICONS[section.title]}
                          </span>

                          <span className="truncate">{section.title}</span>
                        </h4>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() =>
                              exportTextFile(
                                `${section.id}.txt`,
                                section.content,
                                "text/plain;charset=utf-8"
                              )
                            }
                            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold text-white transition hover:border-zinc-500 sm:px-4 sm:text-xs"
                          >
                            TXT
                          </button>

                          <button
                            onClick={() =>
                              exportTextFile(
                                `${section.id}.md`,
                                `# ${section.title}\n\n${section.content}`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold text-white transition hover:border-zinc-500 sm:px-4 sm:text-xs"
                          >
                            MD
                          </button>

                          <button
                            onClick={() => copyText(section.content, section.id)}
                            className="rounded-xl bg-purple-600 px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 sm:px-4 sm:text-xs"
                          >
                            {copiedSection === section.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
                          {[
                            ["Regenerate", "default"],
                            ["More Viral", "more-viral"],
                            ["More Professional", "more-professional"],
                            ["Shorter", "shorter"],
                            ["Longer", "longer"],
                            ["More Emotional", "more-emotional"],
                            ...EXTRA_REWRITE_OPTIONS,
                          ].map(([label, type]) => (
                            <button
                              key={type}
                              onClick={() =>
                                rewriteSection(section.id, section.content, type)
                              }
                              disabled={
                                rewriteLoadingId === section.id ||
                                rewriteUsage >= rewriteLimit
                              }
                              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:rounded-2xl sm:px-4 sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-60"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {rewriteLoadingId === section.id && (
                      <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                        Rewriting content with AI...
                      </div>
                    )}

                    {rewriteUsage >= rewriteLimit && (
                      <div className="mb-5 rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                        Rewrite limit reached. Upgrade your plan to continue
                        rewriting.
                      </div>
                    )}

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
            )}
          </section>
        </section>

        <section id="hook-generator" className="mb-10 rounded-[24px] border border-purple-400/20 bg-gradient-to-br from-purple-950/30 via-zinc-950 to-black p-4 shadow-2xl shadow-purple-950/20 sm:mb-20 sm:rounded-[32px] sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-purple-300">
                Hook Generator
              </p>

              <h2 className="text-[2rem] font-bold sm:text-5xl">
                Generate scroll-stopping hooks.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
                Enter a topic, product, idea or niche. Repurso will create viral hooks you can use for TikTok, X, LinkedIn and short-form content.
              </p>
            </div>

            <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-purple-100">
              New
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              type="text"
              placeholder="Example: AI tool for creators, SaaS launch, fitness coaching..."
              value={hookInput}
              onChange={(e) => setHookInput(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/10"
            />

            <button
              onClick={generateHooks}
              disabled={hookLoading}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black shadow-xl shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:opacity-60"
            >
              {hookLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              )}

              {hookLoading ? "Generating..." : "Generate Hooks"}
            </button>
          </div>

          {hooks.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {hooks.map((hook, index) => (
                <div
                  key={`${hook}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/60 p-4 transition hover:border-purple-400/40 hover:bg-purple-500/10"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                      Hook {index + 1}
                    </span>

                    <button
                      onClick={() => copyHook(hook, index)}
                      className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500"
                    >
                      {copiedHookIndex === index ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <p className="leading-7 text-zinc-100">{hook}</p>
                </div>
              ))}
            </div>
          )}

          {!hooks.length && !hookLoading && (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/40 p-5 text-center">
              <p className="font-semibold text-white">
                Try: “AI SaaS for creators” or “fitness coach content ideas”
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Works in the same language as your input.
              </p>
            </div>
          )}
        </section>
        <section className="mb-10 sm:mb-20">
  <div className="mb-6 text-center sm:mb-14">
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
      How it works
    </p>

    <h2 className="mb-4 text-[2rem] font-bold sm:text-5xl">
      Create once. Publish everywhere.
    </h2>

    <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
      Repurso transforms one idea into platform-specific content optimized for
      creators, founders and marketers.
    </p>
  </div>

  <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:grid-cols-3">
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70 sm:rounded-[28px] sm:p-6">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
        1
      </div>

      <h3 className="mb-2 text-sm font-bold sm:mb-3 sm:text-2xl">Paste</h3>

      <p className="hidden leading-7 text-zinc-400 sm:block">
        Add an idea, thread, article, script or raw thoughts into the generator.
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70 sm:rounded-[28px] sm:p-6">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
        2
      </div>

      <h3 className="mb-2 text-sm font-bold sm:mb-3 sm:text-2xl">Generate</h3>

      <p className="hidden leading-7 text-zinc-400 sm:block">
        AI rewrites your content into LinkedIn posts, captions, scripts and
        platform-ready formats.
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70 sm:rounded-[28px] sm:p-6">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
        3
      </div>

      <h3 className="mb-2 text-sm font-bold sm:mb-3 sm:text-2xl">Publish</h3>

      <p className="hidden leading-7 text-zinc-400 sm:block">
        Copy, rewrite, improve or export your content and publish faster across
        every platform.
      </p>
    </div>
  </div>
</section>

<section className="hidden sm:mb-20 sm:block">
  <div className="mb-10 text-center sm:mb-14">
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
      Built for
    </p>

    <h2 className="mb-4 text-[2rem] font-bold sm:text-5xl">
      Made for modern creators.
    </h2>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70">
      <h3 className="mb-4 text-2xl font-bold">Creators</h3>

      <p className="leading-7 text-zinc-400">
        Turn one content idea into posts for every social platform in minutes.
      </p>
    </div>

    <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70">
      <h3 className="mb-4 text-2xl font-bold">Founders</h3>

      <p className="leading-7 text-zinc-400">
        Build audience consistently without spending hours rewriting content.
      </p>
    </div>

    <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-zinc-900/70">
      <h3 className="mb-4 text-2xl font-bold">Marketing teams</h3>

      <p className="leading-7 text-zinc-400">
        Speed up social workflows and generate multiple content angles faster.
      </p>
    </div>
  </div>
</section>

<section className="mb-20 hidden rounded-[32px] border border-purple-400/20 bg-gradient-to-br from-purple-950/35 via-zinc-950 to-black p-8 shadow-2xl shadow-purple-950/20 sm:block sm:p-12">
  <div className="mx-auto max-w-3xl text-center">
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
      Start creating
    </p>

    <h2 className="mb-5 text-4xl font-bold sm:text-5xl">
      Turn your ideas into content faster.
    </h2>

    <p className="mb-8 text-lg leading-8 text-zinc-400">
      No complicated workflow. Paste your content, generate instantly and
      publish everywhere.
    </p>

    <div className="flex flex-col justify-center gap-4 sm:flex-row">
      <a
        href="#generator"
        className="rounded-2xl bg-white px-6 py-3.5 text-center text-sm font-bold text-black shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-8 sm:py-4 sm:text-base"
      >
        Try Repurso Free
      </a>

      <a
        href="#pricing"
        className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-center text-sm font-bold transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 sm:px-8 sm:py-4 sm:text-base"
      >
        View Pricing
      </a>
    </div>
  </div>
</section>
        <section className="mb-14 sm:mb-20">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Why Repurso
            </p>

            <h2 className="mb-4 text-[2rem] font-bold sm:text-5xl">
              Built for faster content workflows.
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Stop rewriting the same idea manually. Generate, improve and export content from one focused workspace.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10">
              <div className="mb-4 text-3xl">⚡</div>
              <h3 className="mb-3 text-2xl font-bold">Save hours every week</h3>
              <p className="leading-7 text-zinc-400">
                Turn a raw idea into multiple platform-ready outputs without rebuilding the same post again and again.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10">
              <div className="mb-4 text-3xl">✦</div>
              <h3 className="mb-3 text-2xl font-bold">Improve every output</h3>
              <p className="leading-7 text-zinc-400">
                Rewrite each version to be more viral, more professional, shorter, longer or more emotional.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10">
              <div className="mb-4 text-3xl">↗</div>
              <h3 className="mb-3 text-2xl font-bold">Publish everywhere</h3>
              <p className="leading-7 text-zinc-400">
                Create native content for the platforms your audience already uses.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 sm:mb-16">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-white/10 bg-zinc-950/70 p-4 sm:rounded-[32px] sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  FAQ
                </p>

                <h2 className="mt-2 text-xl font-bold sm:text-3xl">
                  Questions before you start?
                </h2>
              </div>

              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">
                Help
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div key={item.question} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="font-semibold text-white">
                        {item.question}
                      </span>

                      <span className="text-xl text-zinc-500">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-12 sm:py-16">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Pricing
            </p>

            <h2 className="mb-4 text-[2rem] font-bold sm:text-5xl">
              Choose your content engine.
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Start free, then upgrade when Repurso becomes part of your content
              workflow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 sm:rounded-[32px] sm:p-8">
              <h3 className="mb-2 text-2xl font-bold">Free</h3>

              <p className="mb-6 text-zinc-400">For testing the product.</p>

              <div className="mb-8">
                <span className="text-4xl font-bold sm:text-5xl">$0</span>
                <span className="text-zinc-500"> / forever</span>
              </div>

              <ul className="mb-8 space-y-4 text-zinc-300">
                <li>✓ 20 AI generations / month</li>
                <li>✓ 10 rewrites / month</li>
                <li>✓ 1,000 characters</li>
                <li>✓ 9 output formats</li>
                <li>✓ AI quality modes</li>
                <li>✓ Saved prompt library</li>
              </ul>

              <a
                href="#generator"
                className="block rounded-2xl border border-zinc-700 px-6 py-4 text-center font-bold"
              >
                Start free
              </a>
            </div>

            <div className="relative rounded-[28px] border border-white bg-white p-6 text-black shadow-2xl shadow-purple-950/30 transition hover:-translate-y-1 sm:rounded-[32px] sm:p-8">
              <div className="mb-5 inline-flex rounded-full bg-black px-4 py-2 text-sm font-bold text-white lg:absolute lg:-top-4 lg:left-1/2 lg:mb-0 lg:-translate-x-1/2">
                Most popular
              </div>

              <h3 className="mb-2 text-2xl font-bold">Creator</h3>

              <p className="mb-4 text-zinc-600">
                For creators posting every week.
              </p>

              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold sm:text-5xl">$9.99</span>

                  <span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    3-day free trial
                  </span>
                </div>

                <span className="text-zinc-600"> / month</span>
              </div>

              <ul className="mb-8 space-y-4">
                <li>✓ 300 AI generations / month</li>
                <li>✓ 500 rewrites / month</li>
                <li>✓ 5,000 characters</li>
                <li>✓ AI quality modes</li>
                <li>✓ Saved prompt library</li>
                <li>✓ TXT and Markdown export</li>
                <li>✓ 3-day free trial</li>
                <li>✓ Cancel anytime</li>
              </ul>

              <a
                href={CREATOR_CHECKOUT(userEmail)}
                target="_blank"
                className="block rounded-2xl bg-black px-6 py-4 text-center font-bold text-white"
              >
                Upgrade to Creator
              </a>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 shadow-xl shadow-purple-950/10 transition hover:-translate-y-1 hover:border-purple-400/30 sm:rounded-[32px] sm:p-8">
              <h3 className="mb-2 text-2xl font-bold">Pro</h3>

              <p className="mb-4 text-zinc-400">
                For power users and small teams.
              </p>

              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold sm:text-5xl">$19.99</span>

                  <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-100">
                    3-day free trial
                  </span>
                </div>

                <span className="text-zinc-500"> / month</span>
              </div>

              <ul className="mb-8 space-y-4 text-zinc-300">
                <li>✓ 1000 AI generations / month</li>
                <li>✓ 2000 rewrites / month</li>
                <li>✓ 10,000 characters</li>
                <li>✓ AI quality modes</li>
                <li>✓ Saved prompt library</li>
                <li>✓ Priority content workflows</li>
                <li>✓ 3-day free trial</li>
                <li>✓ Cancel anytime</li>
              </ul>

              <a
                href={PRO_CHECKOUT(userEmail)}
                target="_blank"
                className="block rounded-2xl border border-zinc-700 px-6 py-4 text-center font-bold"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Paid plans include a 3-day free trial. Cancel anytime before the trial ends.
          </p>
        </section>

        <footer className="border-t border-zinc-800 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo-icon.png"
                  alt="Repurso"
                  className="h-8 w-8 rounded-lg object-cover"
                />

                <h3 className="text-2xl font-bold">Repurso</h3>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                AI-powered content repurposing platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-zinc-400">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>

              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>

              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-900 pt-6 text-sm text-zinc-600">
            © 2026 Repurso. All rights reserved.
          </div>
        </footer>
      </div>
</main>
  );
}