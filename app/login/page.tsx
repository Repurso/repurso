"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  const redirectUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://repurso.app";

  function validateEmailPassword() {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      return false;
    }

    if (!password.trim()) {
      setMessage("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return false;
    }

    return true;
  }

  async function signInWithGoogle() {
    setMessage("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function signInWithPassword() {
    setMessage("");

    if (!validateEmailPassword()) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  async function signUpWithPassword() {
    setMessage("");

    if (!validateEmailPassword()) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email to confirm your account, then log in.");
  }

  async function signInWithMagicLink() {
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for the login link.");
  }

  const title =
    mode === "signup" ? "Create account" : mode === "magic" ? "Magic link" : "Login";

  const subtitle =
    mode === "signup"
      ? "Create your Repurso account with email and password."
      : mode === "magic"
      ? "Get a secure login link sent to your email."
      : "Continue with Google or login with email and password.";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[130px]" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[340px] w-[340px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-purple-950/20 backdrop-blur sm:rounded-[32px] sm:p-8">
        <a
          href="/"
          className="mb-8 inline-flex items-center gap-3 text-sm text-zinc-400 transition hover:text-white"
        >
          <img
            src="/logo-icon.png"
            alt="Repurso"
            className="h-8 w-8 rounded-xl object-cover"
          />

          <span>← Back to Repurso</span>
        </a>

        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-purple-200">
            Repurso
          </p>

          <h1 className="text-4xl font-bold">{title}</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</p>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={googleLoading || loading}
          className="mb-4 w-full rounded-2xl bg-white py-4 font-bold text-black shadow-lg shadow-purple-950/20 transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:translate-y-0 disabled:opacity-60"
        >
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/60 p-1.5">
          {[
            ["login", "Login"],
            ["signup", "Sign up"],
            ["magic", "Magic"],
          ].map(([id, label]) => {
            const isActive = mode === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id as AuthMode);
                  setMessage("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <input
          type="email"
          placeholder="you@example.com"
          className="mb-3 w-full rounded-2xl border border-white/10 bg-black/70 p-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode !== "magic" && (
          <input
            type="password"
            placeholder="Password"
            className="mb-4 w-full rounded-2xl border border-white/10 bg-black/70 p-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm leading-6 text-purple-100">
            {message}
          </div>
        )}

        {mode === "login" && (
          <button
            onClick={signInWithPassword}
            disabled={loading || googleLoading}
            className="w-full rounded-2xl bg-purple-600 py-4 font-bold text-white shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-purple-500 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login with email"}
          </button>
        )}

        {mode === "signup" && (
          <button
            onClick={signUpWithPassword}
            disabled={loading || googleLoading}
            className="w-full rounded-2xl bg-purple-600 py-4 font-bold text-white shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 hover:bg-purple-500 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        )}

        {mode === "magic" && (
          <button
            onClick={signInWithMagicLink}
            disabled={loading || googleLoading}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 font-bold text-white transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/10 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
          By continuing, you agree to Repurso&apos;s terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
