import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  DEFAULT_PROMPT_TEMPLATE_ID,
  isPromptTemplateId,
  PromptTemplateId,
} from "@/lib/templates";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const content = body.content;
    const rewriteType = body.rewriteType || "default";

    const template = isPromptTemplateId(body.template)
      ? body.template
      : DEFAULT_PROMPT_TEMPLATE_ID;

    if (!content || !content.trim()) {
      return NextResponse.json(
        {
          error: "Content is required.",
        },
        { status: 400 }
      );
    }

    const rewriteInstructions = getRewriteInstructions(rewriteType);

    const templateInstructions = getTemplateInstructions(template);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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

${templateInstructions}

${rewriteInstructions}
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

    return NextResponse.json({
      result,
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