"use client";

import { useEffect, useState, useCallback } from "react";

type Note = {
  id: string;
  title: string;
  body: string;
  color: string;
  shareId: string;
  isPublic: boolean;
  updatedAt: string;
};

const COLORS = [
  { name: "white",  bg: "rgba(255,255,255,0.3)" },
  { name: "yellow", bg: "rgba(250,204,21,0.6)" },
  { name: "green",  bg: "rgba(34,197,94,0.6)" },
  { name: "blue",   bg: "rgba(59,130,246,0.6)" },
  { name: "pink",   bg: "rgba(236,72,153,0.6)" },
  { name: "purple", bg: "rgba(139,92,246,0.6)" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function NoteCard({ note, onDelete, onUpdate }: {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Note>) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedBody = useDebounce(body, 800);

  useEffect(() => {
    if (debouncedTitle !== note.title) onUpdate(note.id, { title: debouncedTitle });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle]);

  useEffect(() => {
    if (debouncedBody !== note.body) onUpdate(note.id, { body: debouncedBody });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBody]);

  const aiAction = async (action: string) => {
    const text = `${title}\n${body}`.trim();
    if (!text) return;
    setAiLoading(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text }),
      });
      const data = await res.json();
      if (action === "title") {
        setTitle(data.result);
        onUpdate(note.id, { title: data.result });
      } else {
        setBody(data.result);
        onUpdate(note.id, { body: data.result });
      }
    } finally {
      setAiLoading(null);
    }
  };

  const toggleShare = () => {
    onUpdate(note.id, { isPublic: !note.isPublic });
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/share/${note.shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const date = new Date(note.updatedAt).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short",
  });

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 relative z-10" data-color={note.color}>
      <textarea
        className="glass-input w-full rounded-xl px-3 py-2 resize-none"
        rows={1}
        placeholder="Заголовок..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.95)" }}
        onInput={e => {
          const t = e.target as HTMLTextAreaElement;
          t.style.height = "auto";
          t.style.height = t.scrollHeight + "px";
        }}
      />
      <textarea
        className="glass-input w-full rounded-xl px-3 py-2"
        rows={4}
        placeholder="Начни писать..."
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", minHeight: "80px" }}
      />

      {/* AI */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "summarize", label: "✨ Краткое" },
          { key: "expand",    label: "📝 Расширить" },
          { key: "title",     label: "🏷 Заголовок" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className="btn-ghost rounded-lg px-2 py-1"
            style={{ fontSize: "11px" }}
            onClick={() => aiAction(key)}
            disabled={!!aiLoading}
          >
            {aiLoading === key ? "⏳" : label}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2">
        {COLORS.map(c => (
          <button
            key={c.name}
            title={c.name}
            onClick={() => onUpdate(note.id, { color: c.name })}
            style={{
              width: 14, height: 14, borderRadius: "50%",
              background: c.bg,
              border: note.color === c.name ? "2px solid white" : "2px solid transparent",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{date}</span>
      </div>

      {/* Share */}
      <div className="flex gap-2 items-center pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          className="btn-ghost rounded-lg px-2 py-1"
          style={{ fontSize: "11px", color: note.isPublic ? "rgba(74,222,128,0.9)" : undefined }}
          onClick={toggleShare}
        >
          {note.isPublic ? "🔗 Публичная" : "🔒 Приватная"}
        </button>
        {note.isPublic && (
          <button className="btn-ghost rounded-lg px-2 py-1" style={{ fontSize: "11px" }} onClick={copyLink}>
            {copied ? "✓ Скопировано" : "Копировать ссылку"}
          </button>
        )}
        <button
          className="btn-ghost rounded-lg px-2 py-1 ml-auto"
          style={{ fontSize: "11px", color: "rgba(248,113,113,0.8)" }}
          onClick={() => onDelete(note.id)}
        >
          ✕ Удалить
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes")
      .then(r => r.json())
      .then(data => { setNotes(data); setLoading(false); });
  }, []);

  const createNote = async () => {
    const res = await fetch("/api/notes", { method: "POST" });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const updateNote = useCallback(async (id: string, data: Partial<Note>) => {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
  }, []);

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 min-h-screen">
      <header className="glass sticky top-0 z-20 px-6 py-4 flex items-center gap-4">
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.3px" }}>
          ✦ Заметки
        </h1>
        <input
          className="glass-input rounded-xl px-4 py-2 flex-1 max-w-xs"
          style={{ fontSize: "13px" }}
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
          {filtered.length > 0 ? `${filtered.length} заметок` : ""}
        </span>
        <button className="btn-primary rounded-xl px-4 py-2" style={{ fontSize: "13px", fontWeight: 500 }} onClick={createNote}>
          + Новая
        </button>
      </header>

      <main className="px-6 py-6">
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "80px" }}>Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "100px", color: "rgba(255,255,255,0.3)" }}>
            <p style={{ fontSize: "48px" }}>✦</p>
            <p style={{ marginTop: "12px", fontSize: "14px" }}>
              {search ? "Ничего не найдено" : 'Нет заметок — нажми «+ Новая»'}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {filtered.map(note => (
              <NoteCard key={note.id} note={note} onDelete={deleteNote} onUpdate={updateNote} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
