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

function getRewriteInstructions(type: string) {
  switch (type) {
    case "more-viral":
      return `
Make the content:
- more viral
- more emotionally engaging
- more curiosity-driven
- more attention-grabbing
- faster paced
- more shareable
`;

    case "more-professional":
      return `
Make the content:
- more polished
- more authority-driven
- more professional
- more credible
- more executive-level
`;

    case "shorter":
      return `
Make the content:
- shorter
- tighter
- more concise
- easier to skim
`;

    case "longer":
      return `
Make the content:
- longer
- more detailed
- more valuable
- more insight-driven
`;

    case "more-emotional":
      return `
Make the content:
- more emotional
- more relatable
- more human
- more story-driven
`;

    default:
      return `
Improve the content quality while preserving the original intent.
`;
  }
}

function getTemplateInstructions(template: PromptTemplateId) {
  switch (template) {
    case "linkedin-authority":
      return `
STYLE DIRECTION:
- Sound like a respected industry expert
- Focus on authority and credibility
- Use sharp professional insights
- Prioritize trust and thought leadership
`;

    case "viral-short-form":
      return `
STYLE DIRECTION:
- Make the content fast-paced and highly engaging
- Prioritize virality and retention
- Use punchy short sentences
- Create curiosity loops
`;

    case "product-launch":
      return `
STYLE DIRECTION:
- Position the product clearly
- Focus on benefits and transformation
- Create excitement naturally
- Increase desire and curiosity
`;

    case "educational-content":
      return `
STYLE DIRECTION:
- Make the content highly educational
- Explain concepts clearly
- Focus on actionable insights
`;

    case "general":
    default:
      return `
STYLE DIRECTION:
- Create balanced high-quality social content
- Keep the tone modern and engaging
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
- Keep rewrites shorter, cleaner, and more direct.
- Prioritize clarity and speed.
- Preserve the core meaning.
`,
      };

    case "viral":
      return {
        temperature: 1,
        instructions: `
QUALITY MODE:
- Viral mode is selected.
- Make the rewrite more attention-grabbing.
- Strengthen hooks, curiosity, emotion, and retention.
- Optimize for comments, shares, saves, and scroll-stopping impact.
`,
      };

    case "premium":
    default:
      return {
        temperature: 0.8,
        instructions: `
QUALITY MODE:
- Premium mode is selected.
- Make the rewrite polished, strategic, and creator-level.
- Improve structure, emotional intelligence, and platform-native feel.
- Keep the writing human, premium, and non-robotic.
`,
      };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const content = body.content;
    const rewriteType = body.rewriteType || "default";
    const userEmail = body.userEmail || "anonymous";

    const template = isPromptTemplateId(body.template)
      ? body.template
      : DEFAULT_PROMPT_TEMPLATE_ID;

    const qualityMode = isQualityMode(body.qualityMode)
      ? body.qualityMode
      : DEFAULT_QUALITY_MODE;

    if (!content || !content.trim()) {
      return NextResponse.json(
        {
          error: "Content is required.",
        },
        { status: 400 }
      );
    }

    let plan = "free";
    let rewriteCount = 0;
    let rewriteLimit = getPlanLimits("free").rewrites;
    let characterLimit = getPlanLimits("free").characters;

    if (userEmail !== "anonymous") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("user_email, plan, rewrite_count")
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
            .select("user_email, plan, rewrite_count")
            .single();

        if (insertProfileError) {
          return NextResponse.json(
            { error: insertProfileError.message },
            { status: 500 }
          );
        }

        plan = newProfile.plan || "free";
        rewriteCount = newProfile.rewrite_count || 0;
      } else {
        plan = profile.plan || "free";
        rewriteCount = profile.rewrite_count || 0;
      }

      const limits = getPlanLimits(plan);

      rewriteLimit = limits.rewrites;
      characterLimit = limits.characters;

      if (rewriteCount >= rewriteLimit) {
        return NextResponse.json(
          {
            error: `You reached your ${plan} plan rewrite limit. Please upgrade your plan.`,
            usage: {
              plan,
              used: rewriteCount,
              limit: rewriteLimit,
            },
          },
          { status: 429 }
        );
      }
    }

    if (content.length > characterLimit) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan allows maximum ${characterLimit} characters for rewrite.`,
        },
        { status: 400 }
      );
    }

    const rewriteInstructions = getRewriteInstructions(rewriteType);
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

You are an elite social media copywriter.

Your job is to improve and rewrite content while preserving the original meaning.

The rewritten content must feel:
- premium
- modern
- human
- engaging
- platform-native
- emotionally intelligent

Avoid robotic AI writing.
Do not add markdown section titles unless the original content already uses them.
Preserve the same platform context as the original section.
Return only the improved rewritten content.

${templateInstructions}

${rewriteInstructions}

${qualitySettings.instructions}
`,
        },
        {
          role: "user",
          content: `
Rewrite and improve this content:

${content}
`,
        },
      ],
    });

    const result = completion.choices[0].message.content || "";

    if (!result.trim()) {
      return NextResponse.json(
        {
          error: "Rewrite failed. Please try again.",
        },
        { status: 500 }
      );
    }

    if (userEmail !== "anonymous") {
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          rewrite_count: rewriteCount + 1,
        })
        .eq("user_email", userEmail);

      if (updateProfileError) {
        return NextResponse.json(
          { error: updateProfileError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        result,
        usage: {
          plan,
          used: rewriteCount + 1,
          limit: rewriteLimit,
        },
      });
    }

    return NextResponse.json({
      result,
      usage: {
        plan,
        used: 0,
        limit: rewriteLimit,
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