import { NextResponse } from "next/server";

const MODELS = [
  "google/gemma-4-26b-a4b-it:free",   // 99.7% uptime, Google AI Studio
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
];

async function callOpenRouter(model: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message ?? JSON.stringify(data.error));
  }

  const result = data.choices?.[0]?.message?.content;
  if (!result) throw new Error("Empty response from model");

  return result;
}

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

    let lastError = "";
    for (const model of MODELS) {
      try {
        const result = await callOpenRouter(model, prompt);
        return NextResponse.json({ result });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.warn(`Model ${model} failed: ${lastError}`);
      }
    }

    return NextResponse.json({ error: `All models failed. Last error: ${lastError}` }, { status: 500 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
