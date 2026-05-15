"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000",
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the login link.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
        <a href="/" className="mb-8 inline-block text-sm text-zinc-400">
          ← Back to Repurso
        </a>

        <h1 className="mb-2 text-4xl font-bold">Login</h1>

        <p className="mb-6 text-zinc-400">
          Enter your email and we’ll send you a magic login link.
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          className="mb-4 w-full rounded-2xl border border-zinc-800 bg-black p-4 text-white outline-none placeholder:text-zinc-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </div>
    </main>
  );
}