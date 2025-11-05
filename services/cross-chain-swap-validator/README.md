# Cross-Chain Swap Validator Service

Automates cross-chain swaps using NorChain's mirrored liquidity system.

## What It Does

**Monitors BSC** for swap requests → **Executes on NorChain** → **Returns results to BSC**

### Flow

```
User on BSC
    ↓
[1] User calls CrossChainSwapRouter.swapViaNorChain()
    ↓
[2] Validator detects SwapRequested event
    ↓
[3] Validator bridges tokens BSC → NorChain
    ↓
[4] Validator executes swap on NoorSwap ($5.5M liquidity!)
    ↓
[5] Validator bridges result NorChain → BSC
    ↓
[6] Validator completes swap on BSC
    ↓
User receives tokens on BSC
```

## Installation

```bash
cd services/cross-chain-swap-validator
npm install
```

## Configuration

Create `.env` file in project root with:

```bash
# Required
MAIN_WALLET_PRIVATE_KEY=your_validator_private_key
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org
PRIVATE_CHAIN_RPC=https://rpc.norchain.org

# Optional
MAINNET_PRIVATE_KEY=your_mainnet_key  # For testing
```

## Usage

### Start Service

```bash
npm start
```

### Development Mode (Auto-restart)

```bash
npm run dev
```

### Test Swap

```bash
npm test
```

## Requirements

### Balances

Validator wallet needs:
- **BSC**: 0.1+ BNB (for gas)
- **NorChain**: 1000+ NOR (for gas)

### Permissions

Validator must be:
- Added to `NorChainSwapHandler.validators` mapping on NorChain

## Monitoring

### Logs

Service outputs:
- ✅ **SUCCESS**: Swap completed
- ⚠️  **WARNING**: Non-critical issues
- ❌ **ERROR**: Failures (with refund attempt)
- ℹ️  **INFO**: General information

### Example Output

```
[2025-11-05T12:40:00.000Z] [INFO] Cross-Chain Swap Validator Service
[2025-11-05T12:40:00.100Z] [SUCCESS] SERVICE RUNNING - Waiting for swaps...

[2025-11-05T12:45:30.000Z] [INFO] 🔔 NEW SWAP REQUEST DETECTED
[2025-11-05T12:45:30.100Z] [INFO] Processing Swap Request #1
[2025-11-05T12:45:30.200Z] [INFO] [1/4] Bridging tokens BSC → NorChain...
[2025-11-05T12:45:35.000Z] [SUCCESS] Tokens bridged to NorChain
[2025-11-05T12:45:35.100Z] [INFO] [2/4] Executing swap on NoorSwap...
[2025-11-05T12:45:40.000Z] [SUCCESS] Swap executed on NorChain
[2025-11-05T12:45:40.100Z] [INFO] [3/4] Bridging result NorChain → BSC...
[2025-11-05T12:45:45.000Z] [SUCCESS] Tokens bridged back to BSC
[2025-11-05T12:45:45.100Z] [INFO] [4/4] Completing swap on BSC...
[2025-11-05T12:45:50.000Z] [SUCCESS] Swap completed on BSC
[2025-11-05T12:45:50.100Z] [SUCCESS] Swap #1 COMPLETE in 20.0s
[2025-11-05T12:45:50.200Z] [SUCCESS] User received: 99.5 tokens
```

## Error Handling

If swap fails at any step:
1. **Log error** with details
2. **Attempt automatic refund** via `cancelSwap()`
3. **Alert operators** (future: webhook/email)

## Production Deployment

### As PM2 Service

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start index.js --name cross-chain-validator

# Monitor
pm2 logs cross-chain-validator

# Restart on reboot
pm2 startup
pm2 save
```

### As Systemd Service

Create `/etc/systemd/system/cross-chain-validator.service`:

```ini
[Unit]
Description=Cross-Chain Swap Validator
After=network.target

[Service]
Type=simple
User=validator
WorkingDirectory=/path/to/services/cross-chain-swap-validator
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable cross-chain-validator
sudo systemctl start cross-chain-validator
sudo systemctl status cross-chain-validator
```

## Revenue Tracking

Each swap generates:
- **Bridge fee (in)**: 0.1% of amountIn
- **Swap fee**: 0.3% of swap value
- **Bridge fee (out)**: 0.1% of amountOut

**Total**: ~0.5% per swap

Example: $1,000 swap = $5 revenue

### Daily Projections

| Daily Volume | Your Earnings |
|--------------|---------------|
| $100k | $500/day = $182k/year |
| $1M | $5k/day = $1.8M/year |
| $10M | $50k/day = $18M/year |

## Troubleshooting

### Service won't start

**Check**:
- Environment variables set correctly
- Wallet has sufficient balance
- RPC endpoints accessible

### Swaps timing out

**Check**:
- Validator added to NorChainHandler
- NorChain blockchain producing blocks
- Bridge contracts have sufficient liquidity

### Swaps failing

**Check logs for**:
- Insufficient slippage tolerance
- Low liquidity for pair
- Bridge transfer limits exceeded

## Security

### Best Practices

✅ Use dedicated validator wallet
✅ Keep private key secure (hardware wallet recommended)
✅ Monitor logs regularly
✅ Set up alerts for errors
✅ Regular balance checks

### Key Storage

**Production**: Use encrypted key storage or HSM

**Development**: Use `.env` file (gitignored)

## API Reference

See main index.js for:
- Event handlers
- Swap execution logic
- Error handling
- State management

## Support

For issues:
1. Check logs
2. Review documentation
3. Create GitHub issue with:
   - Error message
   - Swap ID
   - Transaction hashes

## License

MIT

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
**Status**: Production Ready
