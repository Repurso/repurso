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

const MAX_REWRITE_CHARACTERS = 5000;

function getRewriteInstructions(type: string) {
  switch (type) {
    case "more-viral":
      return `
Make the content more viral, emotional, curiosity-driven, punchy and shareable.
`;

    case "more-professional":
      return `
Make the content more polished, credible, authority-driven and professional.
`;

    case "shorter":
      return `
Make the content shorter, tighter, clearer and easier to skim.
`;

    case "longer":
      return `
Make the content longer, more detailed, more valuable and more insight-driven.
`;

    case "more-emotional":
      return `
Make the content more emotional, relatable, human and story-driven.
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
      return "Sound like a respected industry expert with authority and credibility.";
    case "viral-short-form":
      return "Make it fast-paced, punchy, retention-focused and scroll-stopping.";
    case "product-launch":
      return "Focus on product positioning, benefits, desire, clarity and CTA.";
    case "educational-content":
      return "Make it clear, educational, actionable and easy to understand.";
    case "general":
    default:
      return "Create balanced, modern, premium, human social content.";
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
        { error: "Content is required." },
        { status: 400 }
      );
    }

    if (content.length > MAX_REWRITE_CHARACTERS) {
      return NextResponse.json(
        {
          error: `Rewrite content is too long. Maximum ${MAX_REWRITE_CHARACTERS} characters allowed.`,
        },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are Repurso AI.

You are an elite social media copywriter.

Rewrite the content while preserving meaning.

Quality rules:
- premium
- modern
- human
- concise
- platform-native
- emotionally intelligent
- not robotic

Template direction:
${getTemplateInstructions(template)}

Rewrite direction:
${getRewriteInstructions(rewriteType)}
`,
        },
        {
          role: "user",
          content: `
Rewrite this content:

${content}
`,
        },
      ],
    });

    return NextResponse.json({
      result: completion.choices[0].message.content || "",
    });
  } catch (error: unknown) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}