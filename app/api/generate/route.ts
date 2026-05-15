import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_PROMPT_TEMPLATE_ID,
  isPromptTemplateId,
  PromptTemplateId,
} from "@/lib/templates";
import { getPlanLimits } from "@/lib/planLimits";
import {
  DEFAULT_QUALITY_MODE,
  isQualityMode,
  QualityModeId,
} from "@/lib/qualityModes";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getTemplateInstructions(template: PromptTemplateId) {
  switch (template) {
    case "linkedin-authority":
      return `
STYLE DIRECTION:
- Sound like a respected industry expert
- Focus on authority and credibility
- Use sharp professional insights
- Prioritize trust and thought leadership
- Make the writing polished and intelligent
- Use strong LinkedIn style hooks
- Encourage comments and discussion
`;

    case "viral-short-form":
      return `
STYLE DIRECTION:
- Make the content fast-paced and highly engaging
- Prioritize virality and retention
- Use punchy short sentences
- Create curiosity loops
- Use strong hooks immediately
- Make every line highly scroll-stopping
- Optimize heavily for shares and attention
`;

    case "product-launch":
      return `
STYLE DIRECTION:
- Position the product clearly
- Focus on benefits and transformation
- Create excitement naturally
- Increase desire and curiosity
- Highlight pain points and outcomes
- Use persuasive marketing language
- Add CTA naturally
`;

    case "educational-content":
      return `
STYLE DIRECTION:
- Make the content highly educational
- Explain concepts clearly
- Focus on actionable insights
- Make the writing easy to understand
- Teach step-by-step when relevant
- Optimize for saves and shares
- Sound smart but accessible
`;

    case "general":
    default:
      return `
STYLE DIRECTION:
- Create balanced high-quality social content
- Make the writing modern and engaging
- Focus on clarity and platform optimization
- Keep the tone premium and human
`;
  }
}

function getQualityInstructions(mode: QualityModeId) {
  switch (mode) {
    case "fast":
      return {
        temperature: 0.5,
        instructions: `
QUALITY MODE:
- Fast mode is selected.
- Keep outputs shorter and more direct.
- Prioritize speed, clarity, and clean formatting.
- Avoid unnecessary length.
- Still make the writing useful and platform-native.
`,
      };

    case "viral":
      return {
        temperature: 1,
        instructions: `
QUALITY MODE:
- Viral mode is selected.
- Prioritize scroll-stopping hooks.
- Make the content more emotionally charged.
- Optimize for comments, shares, saves, and retention.
- Use punchier lines and stronger curiosity loops.
- Make every platform section feel highly engaging.
`,
      };

    case "premium":
    default:
      return {
        temperature: 0.8,
        instructions: `
QUALITY MODE:
- Premium mode is selected.
- Prioritize polished, high-quality creator-style writing.
- Add emotional depth and strong structure.
- Make the content feel strategic, human, and premium.
- Balance clarity, engagement, and authority.
`,
      };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input = body.input;
    const userEmail = body.userEmail || "anonymous";

    const template = isPromptTemplateId(body.template)
      ? body.template
      : DEFAULT_PROMPT_TEMPLATE_ID;

    const qualityMode = isQualityMode(body.qualityMode)
      ? body.qualityMode
      : DEFAULT_QUALITY_MODE;

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: "Input is required." },
        { status: 400 }
      );
    }

    let plan = "free";
    let generationCount = 0;
    let generationLimit = getPlanLimits("free").generations;
    let characterLimit = getPlanLimits("free").characters;

    if (userEmail !== "anonymous") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("user_email, plan, generation_count, rewrite_count")
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
              rewrite_count: 0,
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
      } else {
        plan = profile.plan || "free";
        generationCount = profile.generation_count || 0;
      }

      const limits = getPlanLimits(plan);
      generationLimit = limits.generations;
      characterLimit = limits.characters;

      if (generationCount >= generationLimit) {
        return NextResponse.json(
          {
            error: `You reached your ${plan} plan limit. Please upgrade your plan.`,
            usage: {
              plan,
              used: generationCount,
              limit: generationLimit,
            },
          },
          { status: 429 }
        );
      }
    } else {
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

      generationCount = usageData?.generation_count || 0;

      if (generationCount >= generationLimit) {
        return NextResponse.json(
          {
            error: "Free limit reached. Please login to continue.",
            usage: {
              plan,
              used: generationCount,
              limit: generationLimit,
            },
          },
          { status: 429 }
        );
      }
    }

    if (input.length > characterLimit) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan allows maximum ${characterLimit} characters.`,
        },
        { status: 400 }
      );
    }

    const templateInstructions = getTemplateInstructions(template);
    const qualitySettings = getQualityInstructions(qualityMode);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: qualitySettings.temperature,
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

${templateInstructions}

${qualitySettings.instructions}
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
    } else {
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
        limit: generationLimit,
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