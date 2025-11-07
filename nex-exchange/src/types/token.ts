export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

export interface SwapQuote {
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  gasEstimate: string;
  route: Token[];
}

export interface SwapParams {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOutMin: string;
  payGasInNOR: boolean;
  deadline: number;
}

