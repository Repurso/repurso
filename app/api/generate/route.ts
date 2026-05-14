import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body.input;

    const prompt = `
You are a professional content repurposing assistant.

Convert the user's content into:

1. LinkedIn post
2. Instagram caption
3. X/Twitter post
4. TikTok/Reels short script
5. YouTube description

Keep it clear, engaging and concise.

User content:
${input}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const result =
      completion.choices[0]?.message?.content || "";

    return NextResponse.json({ result });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}