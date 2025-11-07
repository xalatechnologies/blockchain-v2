import { NextRequest, NextResponse } from "next/server";
import { getBestRoute } from "@/lib/price-aggregator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenIn, tokenOut, amountIn } = body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const { route, allRoutes } = await getBestRoute(
      tokenIn,
      tokenOut,
      amountIn
    );

    if (!route) {
      return NextResponse.json(
        { error: "No liquidity found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bestRoute: {
        source: route.source.name,
        chainId: route.source.chainId,
        amountOut: route.amountOut.toString(),
        gasEstimate: route.gasEstimate.toString(),
        priceImpact: route.priceImpact,
      },
      allRoutes: allRoutes.map((r) => ({
        source: r.source.name,
        chainId: r.source.chainId,
        amountOut: r.amountOut.toString(),
        gasEstimate: r.gasEstimate.toString(),
        priceImpact: r.priceImpact,
      })),
    });
  } catch (error) {
    console.error("Liquidity aggregation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to aggregate liquidity" },
      { status: 500 }
    );
  }
}

