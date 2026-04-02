import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const note = await prisma.note.update({
    where: { id },
    data: { ...body, updatedAt: new Date() },
  });
  return NextResponse.json(note);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
