# NEX Exchange - Deployment Guide

## Prerequisites

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. **NEXRouter contract** deployed to NorChain
4. **Environment variables** configured

## Quick Start

### 1. Install Dependencies

```bash
cd nex-exchange
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```env
# NorChain Configuration
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_CHAIN_ID=65001

# NEXRouter Contract Address (after deployment)
NEXT_PUBLIC_NEX_ROUTER_ADDRESS=0x...

# Optional: API Keys
NEXT_PUBLIC_INFURA_KEY=your-infura-key
NEXT_PUBLIC_ALCHEMY_KEY=your-alchemy-key
```

### 3. Deploy NEXRouter Contract

From the root directory:

```bash
# Compile contracts
npx hardhat compile

# Deploy to NorChain
node scripts/deploy-nex-router.js --network btcbr
```

Update `.env.local` with the deployed contract address.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Automatic Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

## Environment Variables for Production

Set these in Vercel dashboard:

- `NEXT_PUBLIC_NORCHAIN_RPC`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_NEX_ROUTER_ADDRESS`

## Post-Deployment Checklist

- [ ] Verify contract addresses are correct
- [ ] Test swap functionality
- [ ] Test wallet connection
- [ ] Verify Sharia compliance badges
- [ ] Test cross-chain swaps
- [ ] Verify NOR gas payment option
- [ ] Test limit orders
- [ ] Test stop-loss orders
- [ ] Verify portfolio tracking
- [ ] Test on mobile devices

## Troubleshooting

### Contract Not Found
- Verify `NEXT_PUBLIC_NEX_ROUTER_ADDRESS` is set correctly
- Check contract is deployed on correct network
- Verify RPC endpoint is accessible

### Wallet Connection Issues
- Ensure MetaMask is installed
- Check network configuration (Chain ID 65001)
- Verify RPC endpoint is correct

### Price Quotes Failing
- Check RPC endpoints are accessible
- Verify token addresses are correct
- Check network connectivity

