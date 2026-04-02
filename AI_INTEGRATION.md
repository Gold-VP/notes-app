# notes-app — Полная документация проекта

## Обзор проекта

| Параметр | Значение |
|---|---|
| Репозиторий | Gold-VP/notes-app (GitHub) |
| Деплой | Railway (автодеплой из ветки `main`) |
| URL | https://notes-app-production-7fbd.up.railway.app |

## Стек

- **Frontend/Backend:** Next.js 16.2.2 (App Router, fullstack)
- **БД:** PostgreSQL (Railway managed) + Prisma ORM v5
- **Стили:** Tailwind CSS v4, glassmorphism тема
- **AI:** OpenRouter API → `app/api/ai/route.ts`
- **Язык:** TypeScript

## Модель данных (Prisma)

```prisma
model Note {
  id        String   @id @default(uuid())
  title     String
  body      String
  color     String   @default("white")
  shareId   String   @unique @default(uuid())
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Переменные окружения на Railway

| Переменная | Что содержит |
|---|---|
| `ANTHROPIC_API_KEY` | Ключ OpenRouter (`sk-or-v1-...`) |
| `DATABASE_URL` | PostgreSQL строка (Railway managed, не трогать) |

---

## AI интеграция

### Текущая конфигурация

- **Провайдер:** OpenRouter (`openrouter.ai`)
- **Модель:** `qwen/qwen3.6-plus-preview:free`
- **Ключ:** переменная `ANTHROPIC_API_KEY` (название старое, не переименовывать)
- **Эндпоинт:** `https://openrouter.ai/api/v1/chat/completions`
- **Файл:** `app/api/ai/route.ts`

### Что пробовали и почему не сработало

| Вариант | Ошибка | Причина |
|---|---|---|
| Anthropic Claude | Работал изначально | — |
| Gemini `gemini-1.5-flash` | 404 not found | Модель недоступна в v1beta |
| Gemini `gemini-2.0-flash` | `limit: 0` | Free tier недоступен из РФ |
| OpenRouter `meta-llama/llama-4-scout:free` | 404 No endpoints | Модель убрали |
| OpenRouter `deepseek/deepseek-chat:free` | SIGTERM краш | Недоступна |
| OpenRouter `qwen/qwen3.6-plus-preview:free` | ✅ Работает | — |

> **Вывод:** Gemini API Free tier не работает из России. OpenRouter работает, использовать модели с суффиксом `:free`.

### Если модель перестала работать

1. Зайди на `openrouter.ai/models` → фильтр **Free**
2. Скопируй ID модели (например `google/gemma-3-27b-it:free`)
3. В `app/api/ai/route.ts` замени:
   ```ts
   model: "qwen/qwen3.6-plus-preview:free",
   ```
4. Запушь → Railway задеплоит автоматически

### Рабочий шаблон route.ts

```ts
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
```

---

## Railway — деплой и управление

### Автодеплой
Push в `main` → Railway деплоит автоматически. Ждать 30-60 секунд.

### Redeploy вручную
**Deployments** → текущий деплой → **три точки (...)** → **Redeploy**

### Форсировать через пустой коммит
```bash
git commit --allow-empty -m "trigger redeploy" && git push
```

### Обновить переменную окружения
**Variables** → найти переменную → карандаш → вставить значение → Save
Railway автоматически перезапустит сервис.

### Build/Start команды (не менять)
```
build: prisma generate && next build
start: prisma db push && next start
port:  8080
```

---

## Диагностика проблем

### AI не работает — алгоритм
1. Открыть Railway → **Deployments** → **View Logs**
2. Искать строки `OpenRouter error:` или `AI route error:`
3. По ошибке:
   - `No endpoints found` → модель убрали, заменить на другую
   - `limit: 0` / `quota exceeded` → провайдер не поддерживает Free tier из РФ
   - `401 Unauthorized` → неверный API ключ в переменной `ANTHROPIC_API_KEY`
   - `500 Internal Server Error` без логов → краш сервера, смотреть полные логи

### Фронтенд показывает ошибку
В `app/page.tsx` в функции `aiAction` есть `alert("Ошибка AI: " + data.error)` — сообщение покажется в браузере.
