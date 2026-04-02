import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const note = await prisma.note.findUnique({ where: { shareId } });
  if (!note || !note.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(note);
}
