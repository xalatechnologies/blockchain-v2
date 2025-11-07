import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import type { Token } from "@/types/token";

// Mock fetch
global.fetch = jest.fn();

describe("useSwapQuote", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const tokenIn: Token = {
    address: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
    symbol: "NOR",
    name: "Nor Token",
    decimals: 24,
    chainId: 65001,
  };

  const tokenOut: Token = {
    address: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
    symbol: "DRHT",
    name: "Dirhamat",
    decimals: 18,
    chainId: 65001,
  };

  it("should fetch quote successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        amountOut: "100",
        amountOutMin: "98",
        priceImpact: 0.5,
        gasEstimate: "0.0001",
        route: [],
      }),
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useSwapQuote({ tokenIn, tokenOut, amountIn: "100" }),
      {
        wrapper: Wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.amountOut).toBe("100");
  });

  it("should not fetch when parameters are invalid", () => {
    const { result } = renderHook(
      () => useSwapQuote({ tokenIn: null, tokenOut: null, amountIn: "" }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );

    expect(result.current.isFetching).toBe(false);
  });
});

