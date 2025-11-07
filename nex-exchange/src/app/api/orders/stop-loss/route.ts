import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, tokenIn, tokenOut, amount, stopPrice } = body;

    if (!user || !tokenIn || !tokenOut || !amount || !stopPrice) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // TODO: Call NEXRouter contract to place stop-loss order
    // const orderId = await placeStopLoss(...);

    return NextResponse.json({
      orderId: "mock-stop-loss-id",
      status: "active",
      message: "Stop-loss order placed successfully",
    });
  } catch (error) {
    console.error("Stop-loss order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to place order" },
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

  // TODO: Fetch stop-loss orders from contract or database
  return NextResponse.json([]);
}

