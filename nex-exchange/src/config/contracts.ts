// NEXRouter ABI (simplified - full ABI will be generated from contract)
export const NEX_ROUTER_ABI = [
  {
    name: "swapCrossChain",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "params", type: "tuple", components: [
        { name: "chainId", type: "uint256" },
        { name: "tokenIn", type: "address" },
        { name: "tokenOut", type: "address" },
        { name: "amountIn", type: "uint256" },
        { name: "minAmountOut", type: "uint256" },
        { name: "path", type: "address[]" },
        { name: "payGasInNOR", type: "bool" },
        { name: "deadline", type: "uint256" },
      ]},
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export const NEX_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_NEX_ROUTER_ADDRESS || "";

