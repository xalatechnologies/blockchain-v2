import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/cache";

interface PriceData {
  token: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
}

const CACHE_TTL = 30; // 30 seconds cache for prices

// Mock price data - in production, fetch from on-chain oracles
const PRICE_DATA: Record<string, PriceData> = {
  "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80": {
    token: "NOR",
    price: 0.006,
    change24h: 15.2,
    volume24h: 1250000,
    liquidity: 5500000,
  },
  "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2": {
    token: "DRHT",
    price: 0.27,
    change24h: 0.1,
    volume24h: 50000,
    liquidity: 500000,
  },
  "0x0cF8e180350253271f4b917CcFb0aCCc4862F262": {
    token: "BTCBR",
    price: 0.00005,
    change24h: 2.5,
    volume24h: 250000,
    liquidity: 2500000,
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Try cache first
  const cacheKey = token ? `price:${token}` : "prices:all";
  const cached = await getCache<PriceData | PriceData[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  if (token) {
    const price = PRICE_DATA[token.toLowerCase()];
    if (!price) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }
    
    // Cache the result
    await setCache(cacheKey, price, CACHE_TTL);
    return NextResponse.json(price);
  }

  // Return all prices
  const allPrices = Object.values(PRICE_DATA);
  await setCache(cacheKey, allPrices, CACHE_TTL);
  return NextResponse.json(allPrices);
}
