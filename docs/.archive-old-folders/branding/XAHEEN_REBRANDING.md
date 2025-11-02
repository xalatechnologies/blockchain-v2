# Xaheen Chain Rebranding Guide

This document outlines the rebranding of the private blockchain from "BitcoinBR network" to "Xaheen Chain" with official domain `xaheen.org`.

## Overview

**Xaheen Chain** is a high-performance private blockchain network based on BNB Smart Chain (BSC/Parlia-PoSA) technology, offering enterprise-grade features with full EVM compatibility.

## Brand Identity

- **Chain Name**: Xaheen Chain
- **Official Domain**: xaheen.org
- **Primary RPC**: https://rpc.xaheen.org
- **Chain ID**: 65001 ⚠️ **CHANGED from 885824**
- **Network ID**: 65001 ⚠️ **CHANGED from 885824**
- **Native Token**: XHT (Xaheen Token) ⚠️ **CHANGED from BNB**
- **Block Time**: 3 seconds (Parlia consensus)

## What Changed

### 1. Network References
- **Old**: BitcoinBR network, BTCBR Private Chain
- **New**: Xaheen Chain

### 2. Domain and RPC Endpoints
- **Old**: https://rpc.bitcoinbr.tech
- **New**: https://rpc.xaheen.org
- **Note**: Legacy RPC URL remains functional during migration period

### 3. Branding in Documentation
All references to "BitcoinBR network" updated to "Xaheen Chain" in:
- CLAUDE.md
- README.md
- .env configuration
- hardhat.config.js

### 4. Chain ID Change ⚠️ **BREAKING CHANGE**
- **Old Chain ID**: 885824
- **New Chain ID**: 65001
- **Impact**: Requires complete blockchain reinitialization
- **Why Changed**: 65001 is a cleaner, more recognizable chain ID for Xaheen Chain
- **Action Required**: All nodes must reinitialize with new genesis.json

## What Stayed the Same

### Technical Infrastructure (Minimal Changes)

1. **BTCBR Token Contract**: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
2. **Validator Addresses**: All three validators unchanged
3. **Validator Keys**: No need to regenerate validator private keys
4. **Port Numbers**: 8545 (RPC), 8546 (WS), 30303-30305 (P2P)
5. **Bridge Contracts**: All 22 bridge implementations unchanged
6. **Docker Configuration**: No changes to container setup

### What Changed (Requires Action)

1. **Chain ID**: Changed from 885824 → 65001 ⚠️
2. **Network ID**: Changed from 885824 → 65001 ⚠️
3. **Genesis Configuration**: Must be regenerated with new chain ID
4. **Blockchain Data**: Must be reinitialized (old chain data incompatible)

### Why Chain ID Changed
- **Branding**: 65001 is more memorable and cleaner for Xaheen Chain
- **Uniqueness**: Avoids confusion with other chain IDs
- **Marketing**: Better aligned with professional blockchain identity

## Migration Checklist

### For Developers

- [x] Update CLAUDE.md with Xaheen Chain references
- [x] Update README.md with new branding
- [x] Update .env file with CHAIN_NAME and CHAIN_DOMAIN
- [x] Update hardhat.config.js comments
- [ ] Update package.json description (optional)
- [ ] Update documentation in docs/ folder (as needed)
- [ ] Create marketing materials with new branding

### For Infrastructure

- [ ] Configure DNS for xaheen.org domain
- [ ] Setup RPC endpoint at rpc.xaheen.org
- [ ] Configure SSL certificate for new domain
- [ ] Setup load balancers pointing to validators
- [ ] Update Nginx configuration with new domain
- [ ] Keep legacy bitcoinbr.tech domain active during transition

### For Users/Partners

- [ ] Announce rebranding to community
- [ ] Update MetaMask network configurations
- [ ] Update documentation references
- [ ] Provide migration guide for RPC endpoint updates
- [ ] Update block explorer branding (if applicable)

## Network Configuration for MetaMask

Users should update their MetaMask custom network with:

```
Network Name: Xaheen Chain
RPC URL: https://rpc.xaheen.org
Chain ID: 65001
Currency Symbol: XHT
Block Explorer URL: https://explorer.xaheen.org (to be configured)
```

## DNS and Infrastructure Setup

### Required DNS Records for xaheen.org

```
A     @              -> [Primary Server IP]
A     rpc            -> [RPC Load Balancer IP]
A     www            -> [Website IP]
CNAME explorer       -> [Block Explorer]
CNAME api            -> [API Server]
```

### SSL/HTTPS Configuration

```bash
# Install certbot and configure SSL for new domain
./scripts/setup-nginx-ssl.sh

# Update nginx configuration
# File: /etc/nginx/sites-available/xaheen-rpc
server {
    listen 443 ssl http2;
    server_name rpc.xaheen.org;

    ssl_certificate /etc/letsencrypt/live/rpc.xaheen.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.xaheen.org/privkey.pem;

    location / {
        proxy_pass http://localhost:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Bridge Infrastructure

The bridge system continues to operate with:
- **BSC Mainnet** ↔ **Xaheen Chain** transfers
- BTCBR token remains the primary bridged asset
- All 22 bridge types remain functional:
  - 6 production bridges
  - 8 experimental bridges
  - 8 theoretical bridges

Bridge fees unchanged:
- Mainnet → Xaheen: 0.1% (min 10 BTCBR)
- Xaheen → Mainnet: 0.2% (min 20 BTCBR)

## Marketing and Communication

### Key Messages

**Xaheen Chain** is a next-generation private blockchain built on proven BSC technology:
- ⚡ Lightning-fast 3-second blocks
- 🔐 Multi-validator security
- 🌉 Advanced bridge infrastructure with 22 implementations
- 💼 Enterprise-ready infrastructure
- 🔗 Full EVM compatibility
- 🚀 BSC mainnet integration

### Positioning
Xaheen Chain bridges the gap between public blockchain transparency and private enterprise requirements, offering:
- Predictable costs (low gas fees)
- High performance (3-second finality)
- Proven security (Parlia consensus)
- Innovation platform (22 bridge types for experimentation)

## Timeline Recommendations

### Phase 1: Internal Preparation (Week 1)
- Update all documentation
- Configure xaheen.org domain and DNS
- Setup SSL certificates
- Test new RPC endpoints
- Update internal tools

### Phase 2: Soft Launch (Week 2)
- Make rpc.xaheen.org live
- Keep legacy RPC active
- Update developer documentation
- Notify close partners

### Phase 3: Public Announcement (Week 3)
- Official announcement
- Press release
- Social media campaign
- Update all public-facing materials
- Migration guide for users

### Phase 4: Full Migration (Week 4+)
- Deprecation notice for old domain
- Monitor usage of legacy endpoints
- Plan eventual sunset of bitcoinbr.tech

## Technical Notes

### Why "btcbr" Network Name Remains in Code
The Hardhat network identifier `btcbr` is kept for backward compatibility:
```javascript
// hardhat.config.js
btcbr: {  // Network identifier stays for compatibility
  url: "https://rpc.xaheen.org",  // But URL updated
  chainId: 885824,
}
```

To deploy to Xaheen Chain:
```bash
npx hardhat run scripts/deploy.js --network btcbr
```

### Environment Variables
New optional variables added:
- `CHAIN_NAME=Xaheen Chain`
- `CHAIN_DOMAIN=xaheen.org`

These are informational and don't affect blockchain operation.

## Support and Resources

### Documentation Locations
- **Technical Guide**: CLAUDE.md
- **User Guide**: README.md
- **Bridge Documentation**: docs/ folder
- **Infrastructure**: infrastructure/ansible/

### Getting Help
For technical support during the transition:
1. Check documentation in docs/ folder
2. Review CLAUDE.md for troubleshooting
3. Test with legacy RPC if issues arise
4. Verify DNS propagation for new domain

## Verification Steps

After rebranding deployment:

```bash
# Test new RPC endpoint
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Should return: {"jsonrpc":"2.0","id":1,"result":"0xd8440"} (885824 in hex)

# Test block number
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test BTCBR contract
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0cF8e180350253271f4b917CcFb0aCCc4862F262","latest"],"id":1}'
```

## Future Considerations

### Potential Next Steps
1. **Native Token**: Consider launching a native Xaheen token (XHN or similar)
2. **Block Explorer**: Deploy branded Blockscout at explorer.xaheen.org
3. **Faucet**: Setup testnet faucet at faucet.xaheen.org
4. **Documentation Site**: Create docs.xaheen.org
5. **Developer Portal**: Build developer.xaheen.org with SDKs and tools
6. **Governance**: Implement on-chain governance for chain parameters

### Branding Assets Needed
- Logo design for Xaheen Chain
- Brand colors and visual identity
- Website design (xaheen.org)
- Social media graphics
- Developer documentation theme
- Block explorer customization

## Conclusion

The rebranding to Xaheen Chain positions the network for growth while maintaining full technical compatibility. The transition is low-risk as no changes to chain ID, validators, or core blockchain infrastructure are required.

**Key Success Factors:**
1. Clear communication to users and partners
2. Seamless RPC endpoint transition
3. Maintained backward compatibility
4. Professional brand presentation
5. Comprehensive documentation

Welcome to **Xaheen Chain** - Where Innovation Meets Enterprise Blockchain! 🚀
