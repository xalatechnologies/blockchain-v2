import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db/client";

export async function GET() {
  try {
    const healthy = await healthCheck();
    if (healthy) {
      return NextResponse.json({ status: "healthy" });
    }
    return NextResponse.json(
      { status: "unhealthy" },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

