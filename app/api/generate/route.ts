import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getPlanLimit(plan: string) {
  if (plan === "creator") return 300;
  if (plan === "pro") return 1000;
  return 3;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input = body.input;
    const userEmail = body.userEmail || "anonymous";

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: "Input is required." },
        { status: 400 }
      );
    }

    let plan = "free";
    let generationCount = 0;
    let limit = 3;

    if (userEmail !== "anonymous") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("user_email, plan, generation_count")
        .eq("user_email", userEmail)
        .maybeSingle();

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }

      if (!profile) {
        const { data: newProfile, error: insertProfileError } =
          await supabaseAdmin
            .from("profiles")
            .insert({
              user_email: userEmail,
              plan: "free",
              generation_count: 0,
            })
            .select("user_email, plan, generation_count")
            .single();

        if (insertProfileError) {
          return NextResponse.json(
            { error: insertProfileError.message },
            { status: 500 }
          );
        }

        plan = newProfile.plan || "free";
        generationCount = newProfile.generation_count || 0;
        limit = getPlanLimit(plan);
      } else {
        plan = profile.plan || "free";
        generationCount = profile.generation_count || 0;
        limit = getPlanLimit(plan);
      }

      if (generationCount >= limit) {
        return NextResponse.json(
          {
            error: `You reached your ${plan} plan limit. Please upgrade your plan.`,
          },
          { status: 429 }
        );
      }
    }

    if (userEmail === "anonymous") {
      const { data: usageData, error: usageError } = await supabaseAdmin
        .from("usage_limits")
        .select("user_email, generation_count")
        .eq("user_email", "anonymous")
        .maybeSingle();

      if (usageError) {
        return NextResponse.json(
          { error: usageError.message },
          { status: 500 }
        );
      }

      const anonymousCount = usageData?.generation_count || 0;

      if (anonymousCount >= 3) {
        return NextResponse.json(
          {
            error: "Free limit reached. Please login to continue.",
          },
          { status: 429 }
        );
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are Repurso AI.

You are one of the best social media content strategists in the world.

Your job is to transform raw ideas, transcripts, notes, tweets, or content into HIGHLY engaging platform-native content.

Your outputs must feel:
- modern
- viral
- human
- emotionally engaging
- authority-building
- concise
- premium quality

Avoid generic AI sounding writing.
Never sound robotic.

Always optimize for:
- retention
- engagement
- shares
- saves
- curiosity

You MUST output valid markdown.
Never use plain text section titles.
Every section title MUST start with #.
Use blank lines between sections.
`,
        },
        {
          role: "user",
          content: `
Transform the following content into premium social media content.

IMPORTANT RULES:
- Create extremely strong hooks
- Avoid generic AI phrasing
- Make the writing feel natural
- Use line breaks properly
- Make every section platform optimized
- Add emotional triggers naturally
- Make the content concise but impactful
- Do NOT repeat the same sentences across platforms
- Use modern creator language
- Include CTA when appropriate
- Use emojis naturally but not excessively

MARKDOWN FORMAT RULES:
- You MUST use proper markdown formatting.
- Every main section title MUST start with exactly one #.
- Put one blank line after every section title.
- Do NOT write plain text titles.
- Do NOT remove markdown formatting.
- Do NOT wrap the answer in code blocks.

OUTPUT FORMAT:

# LinkedIn Post

Write the LinkedIn post here.

# Twitter/X Post

Write the Twitter/X post here.

# Instagram Caption

Write the Instagram caption here.

# TikTok Script

Write the TikTok script here.

# YouTube Description

Write the YouTube description here.

CONTENT:
${input}
`,
        },
      ],
    });

    const result = completion.choices[0].message.content || "";

    const { error: generationInsertError } = await supabaseAdmin
      .from("generations")
      .insert({
        user_email: userEmail,
        input,
        output: result,
      });

    if (generationInsertError) {
      return NextResponse.json(
        { error: generationInsertError.message },
        { status: 500 }
      );
    }

    if (userEmail !== "anonymous") {
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          generation_count: generationCount + 1,
        })
        .eq("user_email", userEmail);

      if (updateProfileError) {
        return NextResponse.json(
          { error: updateProfileError.message },
          { status: 500 }
        );
      }
    }

    if (userEmail === "anonymous") {
      const { data: usageData } = await supabaseAdmin
        .from("usage_limits")
        .select("user_email, generation_count")
        .eq("user_email", "anonymous")
        .maybeSingle();

      if (!usageData) {
        const { error: insertUsageError } = await supabaseAdmin
          .from("usage_limits")
          .insert({
            user_email: "anonymous",
            generation_count: 1,
          });

        if (insertUsageError) {
          return NextResponse.json(
            { error: insertUsageError.message },
            { status: 500 }
          );
        }
      } else {
        const { error: updateUsageError } = await supabaseAdmin
          .from("usage_limits")
          .update({
            generation_count: usageData.generation_count + 1,
          })
          .eq("user_email", "anonymous");

        if (updateUsageError) {
          return NextResponse.json(
            { error: updateUsageError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      result,
      usage: {
        plan,
        used: generationCount + 1,
        limit,
      },
    });
  } catch (error: unknown) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}