import { notFound } from "next/navigation";

type Note = {
  id: string;
  title: string;
  body: string;
  color: string;
  updatedAt: string;
};

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/share/${shareId}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();

  const note: Note = await res.json();

  const date = new Date(note.updatedAt).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="glass-card rounded-3xl p-8 max-w-xl w-full" data-color={note.color}>
        {note.title && (
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "rgba(255,255,255,0.95)", marginBottom: "16px" }}>
            {note.title}
          </h1>
        )}
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {note.body || "Пустая заметка"}
        </p>
        <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
          {date} · ✦ Заметки
        </p>
      </div>
    </div>
  );
}
