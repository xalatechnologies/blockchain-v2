import {
  getHttpProvider,
  getWsProvider,
  getCurrentBlockNumber,
  cleanupProviders,
} from "@/lib/rpc-provider";
import { ethers } from "ethers";

// Mock ethers
jest.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    WebSocketProvider: jest.fn(),
    id: jest.fn((sig) => `0x${sig}`),
  },
}));

describe("RPC Provider", () => {
  beforeEach(() => {
    cleanupProviders();
    jest.clearAllMocks();
  });

  describe("getHttpProvider", () => {
    it("should create HTTP provider", () => {
      const provider = getHttpProvider();
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(
        expect.stringContaining("rpc.norchain.org"),
        expect.objectContaining({
          name: "NorChain",
          chainId: 65001,
        })
      );
      expect(provider).toBeDefined();
    });

    it("should return same instance on subsequent calls", () => {
      const provider1 = getHttpProvider();
      const provider2 = getHttpProvider();
      expect(provider1).toBe(provider2);
    });
  });

  describe("getWsProvider", () => {
    it("should create WebSocket provider", () => {
      const mockWs = {
        addEventListener: jest.fn(),
      };
      (ethers.WebSocketProvider as jest.Mock).mockReturnValue({
        websocket: mockWs,
      });

      const provider = getWsProvider();
      expect(ethers.WebSocketProvider).toHaveBeenCalledWith(
        expect.stringContaining("ws.norchain.org"),
        expect.objectContaining({
          name: "NorChain",
          chainId: 65001,
        })
      );
      expect(provider).toBeDefined();
    });
  });

  describe("getCurrentBlockNumber", () => {
    it("should get current block number", async () => {
      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(12345),
      };
      (ethers.JsonRpcProvider as jest.Mock).mockReturnValue(mockProvider);

      const blockNumber = await getCurrentBlockNumber();
      expect(blockNumber).toBe(12345);
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
    });
  });

  describe("cleanupProviders", () => {
    it("should cleanup providers", () => {
      const mockWs = {
        addEventListener: jest.fn(),
        destroy: jest.fn(),
      };
      (ethers.WebSocketProvider as jest.Mock).mockReturnValue({
        websocket: mockWs,
        destroy: jest.fn(),
      });

      getWsProvider();
      cleanupProviders();

      // Providers should be reset
      const provider1 = getHttpProvider();
      const provider2 = getHttpProvider();
      expect(provider1).not.toBe(provider2); // New instances
    });
  });
});

