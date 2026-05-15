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

    if (!input) {
      return NextResponse.json(
        { error: "Input is required." },
        { status: 400 }
      );
    }

    let plan = "free";
    let generationCount = 0;
    let limit = 3;

    if (userEmail !== "anonymous") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("user_email", userEmail)
        .single();

      if (profile) {
        plan = profile.plan || "free";
        generationCount = profile.generation_count || 0;
        limit = getPlanLimit(plan);
      } else {
        await supabaseAdmin.from("profiles").insert({
          user_email: userEmail,
          plan: "free",
          generation_count: 0,
        });
      }

      if (generationCount >= limit) {
        return NextResponse.json(
          {
            error: `You reached your ${plan} plan limit. Please upgrade your plan.`,
          },
          { status: 429 }
        );
      }
    } else {
      const { data: usageData } = await supabaseAdmin
        .from("usage_limits")
        .select("*")
        .eq("user_email", "anonymous")
        .single();

      if (usageData && usageData.generation_count >= 3) {
        return NextResponse.json(
          {
            error: "Free limit reached. Please login to continue.",
          },
          { status: 429 }
        );
      }

      if (!usageData) {
        await supabaseAdmin.from("usage_limits").insert({
          user_email: "anonymous",
          generation_count: 1,
        });
      } else {
        await supabaseAdmin
          .from("usage_limits")
          .update({
            generation_count: usageData.generation_count + 1,
          })
          .eq("user_email", "anonymous");
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional content repurposing assistant.",
        },
        {
          role: "user",
          content: `
Convert this content into:

1. LinkedIn post
2. Instagram caption
3. Twitter/X post
4. TikTok script
5. YouTube description

Content:
${input}
`,
        },
      ],
    });

    const result = completion.choices[0].message.content || "";

    await supabaseAdmin.from("generations").insert({
      user_email: userEmail,
      input,
      output: result,
    });

    if (userEmail !== "anonymous") {
      await supabaseAdmin
        .from("profiles")
        .update({
          generation_count: generationCount + 1,
        })
        .eq("user_email", userEmail);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Server error",
      },
      { status: 500 }
    );
  }
}