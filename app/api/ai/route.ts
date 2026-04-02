import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { action, text } = await req.json();

  const prompts: Record<string, string> = {
    summarize: `Кратко суммируй эту заметку в 2-3 предложениях на русском языке:\n\n${text}`,
    expand: `Расширь и дополни эту заметку, добавив полезные детали. Отвечай на том же языке что и заметка:\n\n${text}`,
    title: `Придумай короткий заголовок (до 5 слов) для этой заметки. Верни только заголовок без кавычек:\n\n${text}`,
  };

  const prompt = prompts[action];
  if (!prompt) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const result = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ result });
}
