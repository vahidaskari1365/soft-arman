import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTechnicians } from "@/lib/queries";

export async function GET() {
  await requireUser();
  const repair = await getTechnicians("repair_technician");
  const intake = await getTechnicians("intake_technician");
  return NextResponse.json({ repair, intake });
}
