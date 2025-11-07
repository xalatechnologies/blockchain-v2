import { isShariaCompliant, filterHalalTokens, calculateZakat } from "@/lib/sharia-compliance";
import type { Token } from "@/types/token";

describe("sharia-compliance", () => {
  const norToken: Token = {
    address: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80".toLowerCase(),
    symbol: "NOR",
    name: "Nor Token",
    decimals: 24,
    chainId: 65001,
  };

  const dirhamatToken: Token = {
    address: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2".toLowerCase(),
    symbol: "DRHT",
    name: "Dirhamat",
    decimals: 18,
    chainId: 65001,
  };

  const unknownToken: Token = {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "UNKNOWN",
    name: "Unknown Token",
    decimals: 18,
    chainId: 65001,
  };

  describe("isShariaCompliant", () => {
    it("should identify NOR token as halal", () => {
      const compliance = isShariaCompliant(norToken);
      expect(compliance.isHalal).toBe(true);
      expect(compliance.hasRiba).toBe(false);
      expect(compliance.hasGharar).toBe(false);
      expect(compliance.hasMaysir).toBe(false);
    });

    it("should identify Dirhamat as halal", () => {
      const compliance = isShariaCompliant(dirhamatToken);
      expect(compliance.isHalal).toBe(true);
      expect(compliance.assetBacked).toBe(true);
    });

    it("should mark unknown tokens as non-halal", () => {
      const compliance = isShariaCompliant(unknownToken);
      expect(compliance.isHalal).toBe(false);
      expect(compliance.riskLevel).toBe("high");
    });
  });

  describe("filterHalalTokens", () => {
    it("should filter to only halal tokens", () => {
      const tokens = [norToken, dirhamatToken, unknownToken];
      const halalTokens = filterHalalTokens(tokens);
      
      // Should return exactly 2 halal tokens
      expect(halalTokens).toHaveLength(2);
      
      // Verify halal tokens are included
      const halalAddresses = halalTokens.map(t => t.address.toLowerCase());
      expect(halalAddresses).toContain(norToken.address.toLowerCase());
      expect(halalAddresses).toContain(dirhamatToken.address.toLowerCase());
      
      // Verify unknown token is not included
      expect(halalAddresses).not.toContain(unknownToken.address.toLowerCase());
    });

    it("should return empty array if no halal tokens", () => {
      const tokens = [unknownToken];
      const halalTokens = filterHalalTokens(tokens);
      expect(halalTokens).toHaveLength(0);
    });
  });

  describe("calculateZakat", () => {
    it("should calculate zakat correctly", () => {
      const zakat = calculateZakat(10000, 0); // 10,000 NOK, no nisab threshold
      expect(zakat).toBe(250); // 2.5% of 10,000
    });

    it("should return zero if below nisab", () => {
      const zakat = calculateZakat(1000, 2000); // Below nisab threshold
      expect(zakat).toBe(0);
    });

    it("should calculate zakat above nisab", () => {
      const zakat = calculateZakat(10000, 2000); // 10,000 NOK, 2,000 nisab
      expect(zakat).toBe(200); // 2.5% of (10,000 - 2,000) = 200
    });
  });
});

