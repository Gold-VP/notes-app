import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST() {
  const note = await prisma.note.create({ data: {} });
  return NextResponse.json(note);
}
