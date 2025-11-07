import { describe, it, expect } from "@jest/globals";
import { createMocks } from "node-mocks-http";
import { POST as quotePOST } from "@/app/api/swap/quote/route";
import { GET as pricesGET } from "@/app/api/prices/route";

describe("API Integration Tests", () => {
  describe("POST /api/swap/quote", () => {
    it("should return quote for valid request", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
          tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
          amountIn: "100",
          chainId: 65001,
        },
        headers: {
          "content-type": "application/json",
        },
      });

      // Mock rate limit
      jest.mock("@/lib/rate-limit", () => ({
        rateLimit: jest.fn().mockResolvedValue(false),
      }));

      await quotePOST(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty("amountOut");
      expect(data).toHaveProperty("amountOutMin");
    });

    it("should validate input parameters", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
          // Missing tokenOut and amountIn
        },
        headers: {
          "content-type": "application/json",
        },
      });

      await quotePOST(req as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Missing required parameters");
    });

    it("should handle invalid amount", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
          tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
          amountIn: "-100", // Invalid negative amount
          chainId: 65001,
        },
        headers: {
          "content-type": "application/json",
        },
      });

      await quotePOST(req as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid amount");
    });
  });

  describe("GET /api/prices", () => {
    it("should return all prices", async () => {
      const { req, res } = createMocks({
        method: "GET",
        url: "/api/prices",
      });

      await pricesGET(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return price for specific token", async () => {
      const { req, res } = createMocks({
        method: "GET",
        url: "/api/prices?token=0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
      });

      await pricesGET(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty("token");
      expect(data).toHaveProperty("price");
    });
  });
});

