import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseSlides(raw: string) {
  return raw
    .split(/\n(?=Slide\s*\d+\s*:|\d+[.)]\s*)/i)
    .map((item) =>
      item
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/^\s*Slide\s*\d+\s*:\s*/i, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 8);
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
        { error: "Carousel input must be under 1200 characters." },
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
You are Repurso Carousel AI.

Create high-performing LinkedIn / Instagram carousel slide copy.

LANGUAGE RULES:
- Detect the user's input language.
- Write all slides in the same language.
- Do not translate to English unless explicitly requested.

STYLE RULES:
- Make slide 1 a powerful hook.
- Keep every slide concise and visual.
- Use simple language.
- Make each slide useful on its own.
- End with a clear CTA.
- No markdown tables.
- No intro text.
`,
        },
        {
          role: "user",
          content: `
Create exactly 8 carousel slides for this idea:

${input}

FORMAT:
Slide 1: [hook]
Slide 2: [problem]
Slide 3: [mistake or tension]
Slide 4: [insight]
Slide 5: [solution]
Slide 6: [example]
Slide 7: [takeaway]
Slide 8: [CTA]

Return only the slide list.
`,
        },
      ],
    });

    const raw = completion.choices[0].message.content || "";
    const slides = parseSlides(raw);

    if (!slides.length) {
      return NextResponse.json(
        { error: "Could not generate carousel. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ slides });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
