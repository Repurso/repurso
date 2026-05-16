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
  `https://repursoapp.lemonsqueezy.com/checkout/buy/5f45028d-de97-458d-a827-64f8a7adc153?checkout[email]=${encodeURIComponent(
    email
  )}&checkout[custom][user_email]=${encodeURIComponent(email)}`;

const PRO_CHECKOUT = (email: string) =>
  `https://repursoapp.lemonsqueezy.com/checkout/buy/548cbc91-792f-4fae-b6a5-569f95c119c3?checkout[email]=${encodeURIComponent(
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


const SECTION_ICONS: Record<string, JSX.Element> = {
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

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied.");
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
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Repurso</h1>

            {!userEmail && (
              <Link
                href="/login"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black sm:hidden"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#pricing" className="text-sm text-zinc-400">
              Pricing
            </a>

            <button
              onClick={() =>
                (window.location.href =
                  "mailto:repurso.app@gmail.com?subject=Repurso Feedback")
              }
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-900 sm:text-base"
            >
              Feedback
            </button>

            {userEmail ? (
              <>
                <span className="w-full truncate text-sm text-zinc-400 sm:w-auto">
                  {userEmail.length > 18
                    ? `${userEmail.slice(0, 6)}...@${userEmail.split("@")[1]}`
                    : userEmail}
                </span>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm sm:text-base"
                >
                  Dashboard
                </Link>

                <button
                  onClick={logout}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-xl bg-white px-4 py-2 font-semibold text-black sm:block"
              >
                Login
              </Link>
            )}
          </div>
        </nav>

        <section className="mb-16 grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div className="pt-2 lg:sticky lg:top-6">
            <div className="mb-4 inline-flex rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
              AI content repurposing tool
            </div>

            <h2 className="mb-5 text-4xl font-bold leading-tight sm:text-5xl">
              Turn one idea into content for every platform.
            </h2>

            <p className="mb-6 text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Repurso helps creators, founders and marketers transform one piece
              of content into LinkedIn posts, Instagram captions, X posts,
              TikTok scripts and YouTube descriptions.
            </p>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#generator"
                className="rounded-2xl bg-white px-8 py-4 text-center font-bold text-black"
              >
                Try it free
              </a>

              <a
                href="#pricing"
                className="rounded-2xl border border-zinc-700 px-8 py-4 text-center font-bold"
              >
                View pricing
              </a>
            </div>

            <div className="hidden rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 lg:block">
              <p className="mb-3 text-sm text-zinc-500">Output formats</p>

              <div className="grid gap-3">
                {SECTION_TITLES.map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300"
                  >
                    <span className="text-lg">
                      {SECTION_ICONS[title]}
                    </span>

                    {title}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section
            id="generator"
            className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 sm:rounded-[32px] sm:p-7"
          >
            <h3 className="mb-2 text-3xl font-bold sm:text-4xl">
              Generate content
            </h3>

            <p className="mb-6 text-base text-zinc-400 sm:text-lg">
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
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-black text-white hover:border-zinc-600"
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
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-black text-white hover:border-zinc-600"
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
              placeholder="Paste your content here..."
              className="mb-3 h-40 w-full rounded-3xl border border-zinc-800 bg-black p-5 text-base text-white outline-none placeholder:text-zinc-600 sm:h-44"
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
                      className="h-full rounded-full bg-white transition-all"
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
                      className="h-full rounded-full bg-white transition-all"
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
              className="w-full rounded-2xl bg-white px-10 py-5 text-lg font-bold text-black transition hover:bg-zinc-200 disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {showPromptLibrary && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6">
                <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 sm:rounded-[32px] sm:p-8">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">Prompt Library</h2>

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
                    <div className="space-y-4">
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
                {outputSections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-3xl border border-zinc-800 bg-black p-5 sm:p-6"
                  >
                    <div className="mb-5 flex flex-col gap-4">
                      <h4 className="flex items-center gap-3 text-2xl font-bold">
                        <span className="text-2xl">
                          {SECTION_ICONS[section.title]}
                        </span>

                        {section.title}
                      </h4>

                      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
                        {[
                          ["Regenerate", "default"],
                          ["More Viral", "more-viral"],
                          ["More Professional", "more-professional"],
                          ["Shorter", "shorter"],
                          ["Longer", "longer"],
                          ["More Emotional", "more-emotional"],
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
                            className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-60"
                          >
                            {label}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            exportTextFile(
                              `${section.id}.txt`,
                              section.content,
                              "text/plain;charset=utf-8"
                            )
                          }
                          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-zinc-500"
                        >
                          Export TXT
                        </button>

                        <button
                          onClick={() =>
                            exportTextFile(
                              `${section.id}.md`,
                              `# ${section.title}\n\n${section.content}`,
                              "text/markdown;charset=utf-8"
                            )
                          }
                          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-zinc-500"
                        >
                          Export MD
                        </button>

                        <button
                          onClick={() => copyText(section.content)}
                          className="rounded-2xl bg-white px-5 py-2 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:col-span-2 lg:col-span-1"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {rewriteLoadingId === section.id && (
                      <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                        Rewriting content...
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

        <section className="mb-20">
  <div className="mb-14 text-center">
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
      How it works
    </p>

    <h2 className="mb-4 text-4xl font-bold sm:text-5xl">
      Create once. Publish everywhere.
    </h2>

    <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-400">
      Repurso transforms one idea into platform-specific content optimized for
      creators, founders and marketers.
    </p>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-black">
        1
      </div>

      <h3 className="mb-3 text-2xl font-bold">Paste your content</h3>

      <p className="leading-7 text-zinc-400">
        Add an idea, thread, article, script or raw thoughts into the generator.
      </p>
    </div>

    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-black">
        2
      </div>

      <h3 className="mb-3 text-2xl font-bold">Generate instantly</h3>

      <p className="leading-7 text-zinc-400">
        AI rewrites your content into LinkedIn posts, captions, scripts and
        platform-ready formats.
      </p>
    </div>

    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-black">
        3
      </div>

      <h3 className="mb-3 text-2xl font-bold">Export and publish</h3>

      <p className="leading-7 text-zinc-400">
        Copy, rewrite, improve or export your content and publish faster across
        every platform.
      </p>
    </div>
  </div>
</section>

<section className="mb-20">
  <div className="mb-14 text-center">
    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
      Built for
    </p>

    <h2 className="mb-4 text-4xl font-bold sm:text-5xl">
      Made for modern creators.
    </h2>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <h3 className="mb-4 text-2xl font-bold">Creators</h3>

      <p className="leading-7 text-zinc-400">
        Turn one content idea into posts for every social platform in minutes.
      </p>
    </div>

    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <h3 className="mb-4 text-2xl font-bold">Founders</h3>

      <p className="leading-7 text-zinc-400">
        Build audience consistently without spending hours rewriting content.
      </p>
    </div>

    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6">
      <h3 className="mb-4 text-2xl font-bold">Marketing teams</h3>

      <p className="leading-7 text-zinc-400">
        Speed up social workflows and generate multiple content angles faster.
      </p>
    </div>
  </div>
</section>

<section className="mb-20 rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 sm:p-12">
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
        className="rounded-2xl bg-white px-8 py-4 text-center font-bold text-black"
      >
        Try Repurso Free
      </a>

      <a
        href="#pricing"
        className="rounded-2xl border border-zinc-700 px-8 py-4 text-center font-bold"
      >
        View Pricing
      </a>
    </div>
  </div>
</section>
        <section id="pricing" className="py-12 sm:py-16">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Pricing
            </p>

            <h2 className="mb-4 text-4xl font-bold sm:text-5xl">
              Choose your content engine.
            </h2>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-400">
              Start free, then upgrade when Repurso becomes part of your content
              workflow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 sm:rounded-[32px] sm:p-8">
              <h3 className="mb-2 text-2xl font-bold">Free</h3>

              <p className="mb-6 text-zinc-400">For testing the product.</p>

              <div className="mb-8">
                <span className="text-5xl font-bold">₺0</span>
                <span className="text-zinc-500"> / forever</span>
              </div>

              <ul className="mb-8 space-y-4 text-zinc-300">
                <li>✓ 3 AI generations / month</li>
                <li>✓ 10 rewrites / month</li>
                <li>✓ 1,000 characters</li>
                <li>✓ 5 output formats</li>
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

            <div className="relative rounded-[28px] border border-white bg-white p-6 text-black sm:rounded-[32px] sm:p-8">
              <div className="mb-5 inline-flex rounded-full bg-black px-4 py-2 text-sm font-bold text-white lg:absolute lg:-top-4 lg:left-1/2 lg:mb-0 lg:-translate-x-1/2">
                Most popular
              </div>

              <h3 className="mb-2 text-2xl font-bold">Creator</h3>

              <p className="mb-6 text-zinc-600">
                For creators posting every week.
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold">₺299</span>
                <span className="text-zinc-600"> / month</span>
              </div>

              <ul className="mb-8 space-y-4">
                <li>✓ 300 AI generations / month</li>
                <li>✓ 500 rewrites / month</li>
                <li>✓ 5,000 characters</li>
                <li>✓ AI quality modes</li>
                <li>✓ Saved prompt library</li>
                <li>✓ TXT and Markdown export</li>
              </ul>

              <a
                href={CREATOR_CHECKOUT(userEmail)}
                target="_blank"
                className="block rounded-2xl bg-black px-6 py-4 text-center font-bold text-white"
              >
                Upgrade to Creator
              </a>
            </div>

            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 sm:rounded-[32px] sm:p-8">
              <h3 className="mb-2 text-2xl font-bold">Pro</h3>

              <p className="mb-6 text-zinc-400">
                For power users and small teams.
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold">₺599</span>
                <span className="text-zinc-500"> / month</span>
              </div>

              <ul className="mb-8 space-y-4 text-zinc-300">
                <li>✓ 1000 AI generations / month</li>
                <li>✓ 2000 rewrites / month</li>
                <li>✓ 10,000 characters</li>
                <li>✓ AI quality modes</li>
                <li>✓ Saved prompt library</li>
                <li>✓ Priority content workflows</li>
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
        </section>

        <footer className="border-t border-zinc-800 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold">Repurso</h3>

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