import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseItems(raw: string) {
  return raw
    .split(/\n(?=Day\s*\d+\s*:|\d+[.)]\s*)/i)
    .map((item) =>
      item
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/^\s*Day\s*\d+\s*:\s*/i, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 7);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.input;

    if (!input || !input.trim()) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }

    if (input.length > 1200) {
      return NextResponse.json(
        { error: "Calendar input must be under 1200 characters." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.85,
      messages: [
        {
          role: "system",
          content: `
You are Repurso Content Calendar AI.

Create practical 7-day content calendars for creators, founders, brands and marketers.

LANGUAGE RULES:
- Detect the user's input language.
- Write the whole calendar in the same language.
- Do not translate to English unless explicitly requested.

STYLE RULES:
- Make each day specific and actionable.
- Include platform suggestion, content angle, hook, and CTA.
- Keep it concise.
- No intro text.
- No markdown tables.
`,
        },
        {
          role: "user",
          content: `
Create a 7-day content calendar for this niche, product, audience, or creator:

${input}

FORMAT:
Day 1: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 2: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 3: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 4: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 5: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 6: Platform: ... | Angle: ... | Hook: ... | CTA: ...
Day 7: Platform: ... | Angle: ... | Hook: ... | CTA: ...

Return only the 7 days.
`,
        },
      ],
    });

    const raw = completion.choices[0].message.content || "";
    const items = parseItems(raw);

    if (!items.length) {
      return NextResponse.json(
        { error: "Could not generate calendar. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
