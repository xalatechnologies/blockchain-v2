#!/bin/bash

echo "🚀 XAHEEN CHAINLIST SUBMISSION HELPER"
echo "===================================="
echo ""

# Check if file exists
if [ ! -f "eip155-65001.json" ]; then
    echo "❌ Error: eip155-65001.json not found!"
    exit 1
fi

echo "✅ Chain configuration file found: eip155-65001.json"
echo ""

echo "📋 SUBMISSION STEPS:"
echo ""
echo "1. Open your web browser and go to:"
echo "   👉 https://github.com/ethereum-lists/chains"
echo ""
read -p "Press ENTER when you've opened the page..."

echo ""
echo "2. Click the 'Fork' button (top right corner)"
echo "   This creates a copy of the repository in your GitHub account"
echo ""
read -p "Press ENTER after you've forked the repository..."

echo ""
echo "3. In YOUR forked repository:"
echo "   - Click on '_data' folder"
echo "   - Click on 'chains' folder"
echo "   - Click 'Add file' button (top right)"
echo "   - Click 'Create new file'"
echo ""
read -p "Press ENTER when you're ready to add the file..."

echo ""
echo "4. Name the file: eip155-65001.json"
echo ""
echo "5. Copy and paste this content into the file editor:"
echo ""
echo "════════════════════════════════════════"
cat eip155-65001.json
echo "════════════════════════════════════════"
echo ""
read -p "Press ENTER after you've pasted the content..."

echo ""
echo "6. Scroll down to 'Commit new file' section"
echo "   - Commit message: 'Add Xaheen Chain (Chain ID: 65001)'"
echo "   - Click 'Commit new file' button"
echo ""
read -p "Press ENTER after you've committed the file..."

echo ""
echo "7. Go back to the main page of YOUR forked repository"
echo "   You should see a banner saying 'This branch is 1 commit ahead'"
echo ""
echo "8. Click 'Contribute' button → 'Open pull request'"
echo ""
read -p "Press ENTER when you're on the pull request page..."

echo ""
echo "9. Fill in the pull request details:"
echo ""
echo "   Title: Add Xaheen Chain (Chain ID: 65001)"
echo ""
echo "   Description:"
echo "   ════════════════════════════════════════"
cat << 'EOFPR'
Adding Xaheen Chain - Fast EVM-compatible Layer 1 blockchain

**Chain Details:**
- Chain ID: 65001
- Network ID: 65001
- RPC: https://rpc.xaheen.org
- Explorer: https://explorer.xaheen.org
- Block Time: 3 seconds
- Consensus: Parlia (PoSA)

**Features:**
- Native DEX
- Cross-chain bridges (BSC/ETH/Tron)
- Near-zero gas fees
- Full EVM compatibility

**Website:** https://xaheen.org
**Documentation:** https://docs.xaheen.org

The blockchain is live and operational. RPC endpoint is publicly accessible.
EOFPR
echo "   ════════════════════════════════════════"
echo ""
read -p "Press ENTER after you've filled in the details..."

echo ""
echo "10. Click 'Create pull request' button"
echo ""
read -p "Press ENTER after you've submitted the pull request..."

echo ""
echo "════════════════════════════════════════"
echo "✅ SUBMISSION COMPLETE!"
echo "════════════════════════════════════════"
echo ""
echo "📌 What happens next:"
echo "   - Chainlist maintainers will review your PR (24-48 hours)"
echo "   - They may ask questions or request changes"
echo "   - Once approved, Xaheen will appear on chainlist.org"
echo "   - Users can add Xaheen to MetaMask with 1 click!"
echo ""
echo "🔗 Track your PR at:"
echo "   https://github.com/ethereum-lists/chains/pulls"
echo ""
echo "💡 TIP: Keep GitHub notifications on to respond quickly!"
echo ""
echo "🎉 Congratulations on taking Xaheen public!"
