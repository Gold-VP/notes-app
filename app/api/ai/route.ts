import { NextResponse } from "next/server";

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

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-plus-preview:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("OpenRouter error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message ?? JSON.stringify(data.error) }, { status: 500 });
    }
    const result = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
