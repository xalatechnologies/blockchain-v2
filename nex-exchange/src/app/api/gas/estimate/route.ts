import { NextRequest, NextResponse } from "next/server";
import { estimateGasInNOR } from "@/lib/nor-gas-optimizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainId, gasLimit, norPriceUSD } = body;

    if (!chainId || !gasLimit) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const estimate = await estimateGasInNOR(
      chainId,
      BigInt(gasLimit),
      norPriceUSD || 0.006
    );

    return NextResponse.json({
      nativeGas: estimate.nativeGas.toString(),
      nativeGasPrice: estimate.nativeGasPrice.toString(),
      norEquivalent: estimate.norEquivalent.toString(),
      norPrice: estimate.norPrice,
      nativePrice: estimate.nativePrice,
      savings: estimate.savings,
    });
  } catch (error) {
    console.error("Gas estimate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to estimate gas" },
      { status: 500 }
    );
  }
}

