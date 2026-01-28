import { NextResponse } from "next/server";
import { mockUser } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(mockUser);
}
