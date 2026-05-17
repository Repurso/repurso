import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseHooks(raw: string) {
  return raw
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.input;

    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: "Input is required." },
        { status: 400 }
      );
    }

    if (input.length > 1000) {
      return NextResponse.json(
        { error: "Hook input must be under 1000 characters." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.95,
      messages: [
        {
          role: "system",
          content: `
You are Repurso Hook AI.

You are an elite social media strategist who writes scroll-stopping hooks for:
- TikTok
- X/Twitter
- LinkedIn
- Instagram Reels
- YouTube Shorts

LANGUAGE RULES:
- Automatically detect the user's input language.
- Write every hook in the same language as the user's input.
- Do not translate to English unless the user explicitly asks for English.
- Preserve natural tone, idioms and cultural context.

STYLE RULES:
- Hooks must be short, punchy and human.
- Avoid generic AI-sounding phrases.
- No hashtags.
- No emojis unless they are very natural.
- No explanations.
- No markdown headings.
- Each hook should create curiosity, urgency, contradiction, emotion or authority.
- Make hooks specific enough to feel usable.
`,
        },
        {
          role: "user",
          content: `
Create exactly 10 high-performing social media hooks for this topic or idea:

${input}

FORMAT:
Return only a numbered list of 10 hooks.
Do not add intro text.
Do not add explanations.
`,
        },
      ],
    });

    const raw = completion.choices[0].message.content || "";
    const hooks = parseHooks(raw);

    if (!hooks.length) {
      return NextResponse.json(
        { error: "Could not generate hooks. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ hooks });
  } catch (error: unknown) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
