# Nor Arbitrage Bot

Automated arbitrage bot for maintaining NOR price consistency across all spoke chains (BSC, Polygon, Ethereum).

## Purpose

Maintain ±0.5% price tolerance between Nor DEX (canonical price) and spoke DEXs (PancakeSwap, QuickSwap, Uniswap) through automated arbitrage trading.

## How It Works

```
1. Monitor Prices (every 30 seconds)
   ├─> Nor TWAP (canonical): $0.10
   ├─> BSC PancakeSwap: $0.1035
   ├─> Polygon QuickSwap: $0.0998
   └─> Ethereum Uniswap: No liquidity

2. Calculate Deviations
   ├─> BSC: +3.5% (above 0.3% threshold ⚠️)
   ├─> Polygon: -0.2% (below threshold ✅)
   └─> Ethereum: N/A

3. Estimate Profit
   └─> BSC arbitrage: Buy 10K NOR on Nor @ $0.10 = $1,000
                       Sell 10K NOR on BSC @ $0.1035 = $1,035
                       Gross profit: $35
                       Gas cost: -$2
                       DEX fees (0.65%): -$6.50
                       Net profit: $26.50 ✅

4. Execute if Profitable (profit > $5)
   ├─> Buy NOR on Nor
   ├─> Bridge to BSC
   ├─> Sell on PancakeSwap
   └─> Result: Prices converge to ±0.5%
```

## Configuration

### Environment Variables (.env)

```bash
# Nor Chain
PRIVATE_CHAIN_RPC=https://rpc.xaheen.org
PRICE_AUTHORITY_ADDRESS=0x[HUB_PRICE_AUTHORITY]
XAHEEN_PAIR_ADDRESS=0x[NOR_USDT_PAIR]
NOR_TOKEN_ADDRESS=0x[NOR_TOKEN]

# BSC
BSC_MAINNET_RPC=https://bsc.publicnode.com
NOR_BSC_ADDRESS=0x[WRAPPED_NOR_BSC]
XAHEEN_ROUTER_BSC_ADDRESS=0x[BSC_ROUTER]

# Polygon
POLYGON_RPC=https://polygon-rpc.com
NOR_POLYGON_ADDRESS=0x[WRAPPED_NOR_POLYGON]
XAHEEN_ROUTER_POLYGON_ADDRESS=0x[POLYGON_ROUTER]

# Ethereum
ETH_RPC=https://eth.llamarpc.com
NOR_ETH_ADDRESS=0x[WRAPPED_NOR_ETH]
XAHEEN_ROUTER_ETH_ADDRESS=0x[ETH_ROUTER]

# Bot Wallet
ARBITRAGE_BOT_PRIVATE_KEY=0x[BOT_PRIVATE_KEY]

# Optional
VERBOSE_LOGGING=true
```

### Thresholds (in src/config.js)

```javascript
thresholds: {
  deviationTrigger: 0.003,  // 0.3% deviation triggers arbitrage
  minProfit: 5,              // $5 minimum profit (covers gas)
  maxDeviation: 0.03,        // 3% max deviation (circuit breaker)
}
```

## Installation

```bash
cd services/arbitrage-bot
npm install
```

## Usage

### Start Bot

```bash
npm start
```

**Output:**
```
🤖 Nor Arbitrage Bot Starting...

✅ Bot initialized successfully
📊 Monitoring 3 spoke chains
⚙️  Deviation threshold: 0.3%
💰 Minimum profit: $5

[2025-01-15T10:30:00.000Z] Monitoring prices...
   Nor TWAP: $0.100000
   BSC: $0.103500 (+3.50%)
   ⚠️  Deviation above threshold!
   💰 Estimated profit: $26.50
   🚀 Executing arbitrage...
   📥 Buy 10000 NOR on Nor
   📤 Sell 10000 NOR on BSC
   ✅ Arbitrage successful!
   💵 Actual profit: $25.18
   📈 New deviation: 0.10%

[2025-01-15T10:30:30.000Z] Monitoring prices...
   Nor TWAP: $0.100000
   BSC: $0.100100 (+0.10%)
   Polygon: $0.099800 (-0.20%)
   Ethereum: No liquidity
```

### Development Mode (Auto-reload)

```bash
npm run dev
```

## Architecture

### Components

**1. PriceMonitor.js**
- Connects to Nor PriceAuthority
- Queries spoke DEX prices via routers
- Calculates price deviations
- Determines arbitrage direction

**2. ArbitrageExecutor.js**
- Calculates profit (including gas & fees)
- Executes trades on DEXs
- Handles token approvals
- Manages slippage tolerance

**3. config.js**
- Chain configurations
- Threshold settings
- Wallet management
- Validation

**4. index.js**
- Main bot loop
- Graceful shutdown
- Error handling
- Logging

### Trade Flow

```
┌─────────────────────────────────────────────────────────┐
│               Arbitrage Execution Flow                   │
├─────────────────────────────────────────────────────────┤
│ 1. Detect Price Deviation >0.3%                         │
│    └─> BSC: $0.1035 vs Nor: $0.10 = 3.5% deviation  │
│                                                          │
│ 2. Calculate Profit                                     │
│    ├─> Gross: $35                                       │
│    ├─> Gas: -$2                                         │
│    ├─> Fees: -$6.50                                     │
│    └─> Net: $26.50 ✅                                   │
│                                                          │
│ 3. Execute Buy on Nor                                │
│    ├─> Swap 1,000 USDT → 10,000 NOR                    │
│    └─> TxHash: 0xabc...                                 │
│                                                          │
│ 4. Bridge NOR to BSC                                    │
│    ├─> Use existing WBNB bridge                         │
│    └─> Wait for finality (15 blocks)                    │
│                                                          │
│ 5. Execute Sell on BSC                                  │
│    ├─> Approve PancakeSwap                              │
│    ├─> Swap 10,000 NOR → 1,035 USDT                    │
│    └─> TxHash: 0xdef...                                 │
│                                                          │
│ 6. Result                                               │
│    ├─> Profit: $25.18 (after actual slippage)          │
│    └─> New deviation: 0.10% (within tolerance)         │
└─────────────────────────────────────────────────────────┘
```

## Gas Optimization

### Estimated Gas Costs

| Chain | Operation | Gas Cost | USD Cost |
|-------|-----------|----------|----------|
| BSC | Swap | ~200,000 | ~$2 |
| Polygon | Swap | ~250,000 | ~$1 |
| Ethereum | Swap | ~150,000 | ~$15 |

### Optimization Strategies

1. **Batch Operations**: Execute multiple arbitrages in single transaction
2. **Flashbots**: Use MEV protection to avoid frontrunning
3. **Dynamic Gas Pricing**: Adjust based on network congestion
4. **Profit Threshold**: Only execute if profit >$5 (covers all costs)

## MEV Protection (Flashbots)

**Status:** Disabled by default, enable for production

**Configuration:**
```javascript
flashbots: {
  enabled: true,  // Enable in production
  relayUrl: "https://relay.flashbots.net",
}
```

**Benefits:**
- Prevents frontrunning
- Guarantees execution order
- Protects profit margins

## Monitoring

### Key Metrics

1. **Arbitrage Opportunities**
   - Frequency per chain
   - Average deviation when triggered
   - Success rate

2. **Profitability**
   - Gross profit per trade
   - Net profit after costs
   - Cumulative profit

3. **Performance**
   - Trade execution time
   - Gas costs by chain
   - Slippage analysis

4. **System Health**
   - RPC connection status
   - Quote freshness
   - Circuit breaker triggers

### Alerts

**Critical:**
- Arbitrage execution failure
- Price deviation >3% (circuit breaker)
- RPC connection loss

**Warning:**
- Low profitability (<$10)
- High slippage (>2%)
- Gas price spike

## Testing

### Testnet Testing

```bash
# Configure testnet RPCs in .env
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

# Run bot on testnets
npm start
```

### Dry Run Mode

```javascript
// In config.js
dryRun: true  // Simulates trades without execution
```

## Troubleshooting

### Common Issues

**Issue: "No private key configured"**
- Set `ARBITRAGE_BOT_PRIVATE_KEY` in `.env`

**Issue: "Insufficient liquidity"**
- No NOR/USDT pair exists on spoke DEX
- Wait for public LP to be created or use hot inventory

**Issue: "Transaction reverted"**
- Check token approvals
- Verify slippage tolerance
- Ensure sufficient balance

**Issue: "Price deviation but no arbitrage"**
- Profit below $5 threshold
- Gas costs too high
- Adjust thresholds in config.js

## Security

### Best Practices

1. **Private Key Management**
   - Use dedicated wallet for bot
   - Fund only with necessary capital
   - Rotate keys periodically

2. **Capital Limits**
   - Bot trades max 10,000 NOR per operation
   - Keep hot wallet balance modest ($10-20K)
   - Withdraw profits regularly

3. **Monitoring**
   - 24/7 uptime monitoring
   - Alert on unusual activity
   - Regular profit reconciliation

4. **Emergency Stop**
   - `CTRL+C` for graceful shutdown
   - Circuit breaker auto-pauses on >3% deviation
   - Manual pause via PriceAuthority contract

## Performance Expectations

### Conservative Scenario

- **Volume**: $50K/day cross-chain
- **Arbitrage Frequency**: 5-10 trades/day
- **Average Profit**: $15/trade
- **Monthly Profit**: $3,000-6,000

### Moderate Scenario

- **Volume**: $200K/day cross-chain
- **Arbitrage Frequency**: 20-30 trades/day
- **Average Profit**: $25/trade
- **Monthly Profit**: $15,000-22,500

### Optimistic Scenario

- **Volume**: $500K/day cross-chain
- **Arbitrage Frequency**: 50+ trades/day
- **Average Profit**: $30/trade
- **Monthly Profit**: $45,000+

## Maintenance

### Regular Tasks

- **Daily**: Check bot logs, verify profits
- **Weekly**: Analyze performance, adjust thresholds
- **Monthly**: Withdraw profits, rotate keys
- **Quarterly**: Review and optimize strategies

### Upgrades

```bash
# Pull latest code
git pull origin main

# Reinstall dependencies
npm install

# Restart bot
npm start
```

## Support

**Issues**: https://github.com/xaheen-chain/blockchain-v2/issues
**Docs**: See `CROSS_CHAIN_DEX_ARCHITECTURE.md`

---

**Status:** ✅ Ready for Testnet
**Last Updated:** 2025-01-15
