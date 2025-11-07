import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user,
      tokenIn,
      tokenOut,
      amountPerOrder,
      frequency,
      startDate,
      endDate,
    } = body;

    if (!user || !tokenIn || !tokenOut || !amountPerOrder || !frequency) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // TODO: Create DCA schedule in database
    // Schedule will be executed by background job

    return NextResponse.json({
      scheduleId: "mock-dca-schedule-id",
      status: "active",
      nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: "DCA schedule created successfully",
    });
  } catch (error) {
    console.error("DCA schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json(
      { error: "User address required" },
      { status: 400 }
    );
  }

  // TODO: Fetch DCA schedules from database
  return NextResponse.json([]);
}

