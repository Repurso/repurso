import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FREE_LIMIT = 3;

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

    if (userEmail === "anonymous") {
      const { data: usageData } = await supabase
        .from("usage_limits")
        .select("*")
        .eq("user_email", "anonymous")
        .single();

      if (usageData && usageData.generation_count >= FREE_LIMIT) {
        return NextResponse.json(
          {
            error: "Free limit reached. Please login to continue.",
          },
          { status: 429 }
        );
      }

      if (!usageData) {
        await supabase.from("usage_limits").insert({
          user_email: "anonymous",
          generation_count: 1,
        });
      } else {
        await supabase
          .from("usage_limits")
          .update({
            generation_count: usageData.generation_count + 1,
          })
          .eq("user_email", "anonymous");
      }
    }

    const completion = await client.chat.completions.create({
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

    await supabase.from("generations").insert({
      user_email: userEmail,
      input,
      output: result,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Server error",
      },
      {
        status: 500,
      }
    );
  }
}