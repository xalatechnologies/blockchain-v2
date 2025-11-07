import { createConfig, http, webSocket } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, optimism, avalanche } from "wagmi/chains";

// NorChain configuration
const norChain = {
  id: 65001,
  name: "NorChain",
  nativeCurrency: {
    name: "NOR",
    symbol: "NOR",
    decimals: 24,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NORCHAIN_RPC || "https://rpc.norchain.org"],
      webSocket: [process.env.NEXT_PUBLIC_NORCHAIN_WS || "wss://ws.norchain.org:8546"],
    },
  },
  blockExplorers: {
    default: {
      name: "NorChain Explorer",
      url: "https://explorer.norchain.org",
    },
  },
} as const;

export const config = createConfig({
  chains: [norChain, mainnet, bsc, polygon, arbitrum, optimism, avalanche],
  transports: {
    // Use WebSocket for NorChain (real-time updates)
    [norChain.id]: webSocket(process.env.NEXT_PUBLIC_NORCHAIN_WS || "wss://ws.norchain.org:8546"),
    // HTTP fallback for other chains
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [avalanche.id]: http(),
  },
});
