# ⚡ Xaheen Chain - Quick Connect

**Copy-paste ready connection details for your client**

---

## 🔌 Connection Parameters (Simple)

| Parameter | Value |
|-----------|-------|
| **Chain ID** | `65001` (0xFDE9) |
| **RPC URL** | `https://rpc.xaheen.org` |
| **WebSocket** | `wss://ws.xaheen.org` |
| **Currency Symbol** | `XHT` |
| **Block Explorer** | `https://explorer.xaheen.org` |
| **Node Type** | Archive (full history) |

---

## 📱 Add to MetaMask (One-Click)

**Visit**: https://xaheen.org/add-to-metamask.html

Or manually:
1. Open MetaMask
2. Networks → Add Network
3. Enter details above
4. Save

---

## 🧪 Test Connection

```bash
# Check Chain ID (should return 0xfde9)
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

---

## ⚙️ Current Status

**Local Deployment** (Active Now):
- RPC: `http://localhost:8545` ✅
- Chain ID: `65001` ✅
- Validators: 3 operational ✅

**Production** (Coming Soon):
- Domain: xaheen.org ⚙️ Pending DNS
- Public RPC: Week 1-2 ⚙️
- Explorer: Week 2-3 ⚙️

---

## 📞 Support

- Docs: https://docs.xaheen.org
- Email: support@xaheen.org
- Telegram: t.me/xaheen_chain

**Where Intelligence Meets Blockchain** 🧠⚡
