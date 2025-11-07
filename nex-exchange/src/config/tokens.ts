import type { Token } from "@/types/token";

/**
 * Token registry for NorChain ecosystem
 * Includes Sharia compliance information
 */
export const TOKEN_REGISTRY: Record<string, Token> = {
  // NOR Token - Native utility token
  "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80": {
    address: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
    symbol: "NOR",
    name: "Nor Token",
    decimals: 24,
    chainId: 65001,
    logoURI: "/tokens/nor.png",
  },
  // BTCBR - Bitcoin bridge token
  "0x0cF8e180350253271f4b917CcFb0aCCc4862F262": {
    address: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
    symbol: "BTCBR",
    name: "BTC Bridge",
    decimals: 18,
    chainId: 65001,
    logoURI: "/tokens/btcbr.png",
  },
  // Dirhamat - Gold-backed stablecoin
  "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2": {
    address: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
    symbol: "DRHT",
    name: "Dirhamat",
    decimals: 18,
    chainId: 65001,
    logoURI: "/tokens/drht.png",
  },
};

/**
 * Get token by address
 */
export function getToken(address: string): Token | null {
  return TOKEN_REGISTRY[address.toLowerCase()] || null;
}

/**
 * Get all tokens
 */
export function getAllTokens(): Token[] {
  return Object.values(TOKEN_REGISTRY);
}

/**
 * Get tokens by chain
 */
export function getTokensByChain(chainId: number): Token[] {
  return getAllTokens().filter((token) => token.chainId === chainId);
}

