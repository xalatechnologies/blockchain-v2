import { POST } from "@/app/api/swap/quote/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/swap-quote");
jest.mock("@/lib/rate-limit");

import { getSwapQuote } from "@/lib/swap-quote";
import { rateLimit } from "@/lib/rate-limit";

describe("POST /api/swap/quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockResolvedValue(false);
  });

  it("should return quote successfully", async () => {
    const mockQuote = {
      amountOut: "100",
      amountOutMin: "98",
      priceImpact: 0.5,
      gasEstimate: "0.0001",
      route: [],
    };

    (getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);

    const request = new NextRequest("http://localhost/api/swap/quote", {
      method: "POST",
      body: JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "100",
        chainId: 65001,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockQuote);
  });

  it("should return 400 for missing parameters", async () => {
    const request = new NextRequest("http://localhost/api/swap/quote", {
      method: "POST",
      body: JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required parameters");
  });

  it("should return 429 for rate limit exceeded", async () => {
    (rateLimit as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest("http://localhost/api/swap/quote", {
      method: "POST",
      body: JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "100",
        chainId: 65001,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Rate limit exceeded");
  });

  it("should return 500 for server error", async () => {
    (getSwapQuote as jest.Mock).mockRejectedValue(new Error("Server error"));

    const request = new NextRequest("http://localhost/api/swap/quote", {
      method: "POST",
      body: JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "100",
        chainId: 65001,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Server error");
  });
});

