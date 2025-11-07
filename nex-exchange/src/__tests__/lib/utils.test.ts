import { formatAddress, formatAmount, parseAmount, cn } from "@/lib/utils";

describe("utils", () => {
  describe("formatAddress", () => {
    it("should format address correctly", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const formatted = formatAddress(address);
      expect(formatted).toBe("0x1234...7890");
    });

    it("should handle empty address", () => {
      expect(formatAddress("")).toBe("");
    });

    it("should handle short address", () => {
      const address = "0x1234";
      const formatted = formatAddress(address);
      expect(formatted).toBe(address);
    });
  });

  describe("formatAmount", () => {
    it("should format small amounts", () => {
      expect(formatAmount("0.0000005", 18)).toBe("<0.000001");
      expect(formatAmount("0.000001", 18)).toBe("0.000001");
      expect(formatAmount("0.5", 18)).toBe("0.50");
    });

    it("should format large amounts", () => {
      expect(formatAmount("1000", 18)).toBe("1.00K");
      expect(formatAmount("1500", 18)).toBe("1.50K");
      expect(formatAmount("2000000", 18)).toBe("2.00M");
    });

    it("should handle zero", () => {
      expect(formatAmount("0", 18)).toBe("0");
    });

    it("should handle invalid input", () => {
      expect(formatAmount("invalid", 18)).toBe("0");
    });
  });

  describe("parseAmount", () => {
    it("should parse amount correctly", () => {
      const result = parseAmount("1.5", 18);
      expect(result).toBe(BigInt("1500000000000000000"));
    });

    it("should handle zero", () => {
      expect(parseAmount("0", 18)).toBe(0n);
    });

    it("should handle invalid input", () => {
      expect(parseAmount("invalid", 18)).toBe(0n);
    });
  });

  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });
  });
});

