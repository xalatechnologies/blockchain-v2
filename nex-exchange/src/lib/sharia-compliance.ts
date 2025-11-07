import type { Token, TokenShariaInfo } from "@/types/sharia";

/**
 * Check if a token is Sharia-compliant
 * Based on AAOIFI standards and Islamic finance principles
 */
export function isShariaCompliant(token: Token): TokenShariaInfo {
  // Known halal tokens on NorChain
  const halalTokens: Record<string, Partial<TokenShariaInfo>> = {
    // NOR Token - Native utility token, no interest
    "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80": {
      isHalal: true,
      certification: "AAOIFI",
      hasRiba: false,
      hasGharar: false,
      hasMaysir: false,
      assetBacked: false, // Utility token
      profitSharing: false,
      riskLevel: "low",
      complianceNotes: [
        "Native utility token for gas and staking",
        "No interest-bearing mechanisms",
        "Transparent governance",
      ],
    },
    // Dirhamat - Gold-backed stablecoin
    "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2": {
      isHalal: true,
      certification: "AAOIFI",
      hasRiba: false,
      hasGharar: false,
      hasMaysir: false,
      assetBacked: true, // Gold-backed
      profitSharing: false,
      riskLevel: "low",
      complianceNotes: [
        "100% gold-backed stablecoin",
        "Sharia-compliant asset backing",
        "No interest mechanisms",
      ],
    },
    // BTCBR - Bridge token (represents Bitcoin)
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F262": {
      isHalal: true,
      certification: "AAOIFI",
      hasRiba: false,
      hasGharar: false,
      hasMaysir: false,
      assetBacked: true, // Backed by Bitcoin
      profitSharing: false,
      riskLevel: "medium",
      complianceNotes: [
        "Bridge token representing Bitcoin",
        "No interest-bearing mechanisms",
        "Transparent bridge operations",
      ],
    },
  };

  const tokenInfo = halalTokens[token.address.toLowerCase()];

  if (tokenInfo) {
    return {
      tokenAddress: token.address,
      ...tokenInfo,
    } as TokenShariaInfo;
  }

  // Default: Unknown tokens need review
  return {
    tokenAddress: token.address,
    isHalal: false,
    hasRiba: false, // Unknown
    hasGharar: false, // Unknown
    hasMaysir: false, // Unknown
    assetBacked: false,
    profitSharing: false,
    riskLevel: "high",
    complianceNotes: [
      "Token not yet reviewed for Sharia compliance",
      "Please consult with Islamic finance advisor",
    ],
  };
}

/**
 * Filter tokens by Sharia compliance
 */
export function filterHalalTokens(tokens: Token[]): Token[] {
  return tokens.filter((token) => {
    const info = isShariaCompliant(token);
    return info.isHalal;
  });
}

/**
 * Calculate zakat amount
 * Zakat is 2.5% of total assets above nisab threshold (85g gold equivalent)
 */
export function calculateZakat(
  totalAssets: number,
  nisabThreshold: number = 0 // Default: assume assets are above nisab
): number {
  if (totalAssets <= nisabThreshold) {
    return 0;
  }
  const eligibleAssets = totalAssets - nisabThreshold;
  return eligibleAssets * 0.025; // 2.5%
}

