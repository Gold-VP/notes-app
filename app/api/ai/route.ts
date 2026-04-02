import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.ANTHROPIC_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { action, text } = await req.json();

    const prompts: Record<string, string> = {
      summarize: `Кратко суммируй эту заметку в 2-3 предложениях на русском языке:\n\n${text}`,
      expand: `Расширь и дополни эту заметку, добавив полезные детали. Отвечай на том же языке что и заметка:\n\n${text}`,
      title: `Придумай короткий заголовок (до 5 слов) для этой заметки. Верни только заголовок без кавычек:\n\n${text}`,
    };

    const prompt = prompts[action];
    if (!prompt) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(prompt);
    const result = response.response.text();

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
