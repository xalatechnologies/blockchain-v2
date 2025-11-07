import { NextRequest, NextResponse } from "next/server";
import { getSwapQuote } from "@/lib/swap-quote";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.ip || "unknown";
    const limited = await rateLimit(ip, "quote", 100, 60); // 100 requests per minute
    if (limited) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { tokenIn, tokenOut, amountIn, chainId } = body;

    // Input validation
    if (!tokenIn || !tokenOut || !amountIn) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (typeof tokenIn !== "string" || typeof tokenOut !== "string" || typeof amountIn !== "string") {
      return NextResponse.json(
        { error: "Invalid parameter types" },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const quote = await getSwapQuote({
      tokenIn,
      tokenOut,
      amountIn,
      chainId,
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get quote" },
      { status: 500 }
    );
  }
}
