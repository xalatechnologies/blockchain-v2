"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { NEX_ROUTER_ABI } from "@/config/contracts";
import { parseAmount } from "@/lib/utils";
import type { Token } from "@/types/token";

interface SwapButtonProps {
  tokenIn: Token | null;
  tokenOut: Token | null;
  amountIn: string;
  amountOutMin: string;
  payGasInNOR: boolean;
  disabled: boolean;
}

export function SwapButton({
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMin,
  payGasInNOR,
  disabled,
}: SwapButtonProps) {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !address) return;

    try {
      // TODO: Check token approval first
      // TODO: Approve if needed
      
      // TODO: Call NEXRouter.swapCrossChain()
      // This is a placeholder - actual implementation will use the deployed contract
      console.log("Swap:", {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: parseAmount(amountIn, tokenIn.decimals).toString(),
        amountOutMin: parseAmount(amountOutMin, tokenOut.decimals).toString(),
        payGasInNOR,
      });
    } catch (error) {
      console.error("Swap error:", error);
    }
  };

  const isLoading = isPending || isConfirming || isApproving;
  const buttonText = isLoading
    ? isApproving
      ? "Approving..."
      : isPending
      ? "Confirming..."
      : "Processing..."
    : "Swap";

  return (
    <Button
      onClick={handleSwap}
      disabled={disabled || isLoading || !address}
      className="w-full h-12 text-lg"
    >
      {!address ? "Connect Wallet" : buttonText}
    </Button>
  );
}

