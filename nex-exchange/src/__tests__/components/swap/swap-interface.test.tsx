import { render, screen, waitFor } from "@testing-library/react";
import { SwapInterface } from "@/components/swap/swap-interface";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the hooks
jest.mock("@/hooks/use-swap-quote", () => ({
  useSwapQuote: jest.fn(() => ({
    quote: null,
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/use-sharia-filter", () => ({
  useShariaFilter: jest.fn(() => ({
    halalOnly: false,
    setHalalOnly: jest.fn(),
  })),
}));

describe("SwapInterface", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it("should render swap interface", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SwapInterface />
      </QueryClientProvider>
    );

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
  });

  it("should show Sharia compliance badge", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SwapInterface />
      </QueryClientProvider>
    );

    expect(screen.getByText("Sharia Compliant")).toBeInTheDocument();
  });

  it("should show halal filter", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SwapInterface />
      </QueryClientProvider>
    );

    expect(screen.getByText("Show Only Halal Assets")).toBeInTheDocument();
  });
});

