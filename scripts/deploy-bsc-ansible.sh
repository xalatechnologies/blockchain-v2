#!/bin/bash
# Deploy Complete BSC Chain with BTCBR, Native Balances, P2P, and HTTPS
# Uses Ansible for infrastructure automation

set -e

cd "$(dirname "$0")/../infrastructure/ansible"

echo "========================================="
echo "BSC Chain Deployment with Ansible"
echo "========================================="

# Check if SSH key exists
if [ ! -f ~/.ssh/bsc-validator-key.pem ]; then
    echo "❌ Error: SSH key not found at ~/.ssh/bsc-validator-key.pem"
    echo ""
    echo "Please ensure the SSH key is in place before running this script."
    exit 1
fi

# Set correct permissions on SSH key
chmod 400 ~/.ssh/bsc-validator-key.pem

echo -e "\n1. Testing Ansible connectivity..."
ansible bsc_validators -i inventory/hosts -m ping

echo -e "\n2. Deploying BSC Chain with all fixes..."
echo "   - Genesis with BTCBR token"
echo "   - Native BNB balances (1000 BNB per wallet)"
echo "   - P2P static nodes configuration"
echo "   - Block production setup"
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run main deployment playbook
ansible-playbook -i inventory/hosts playbooks/deploy-bsc-complete.yml

echo -e "\n3. Setting up NGINX with SSL..."
read -p "Setup HTTPS endpoint? (yes/no): " setup_https

if [ "$setup_https" == "yes" ]; then
    ansible-playbook -i inventory/hosts playbooks/setup-nginx-bsc.yml
fi

echo -e "\n========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Wait 1-2 minutes for block production to start"
echo ""
echo "2. Monitor validators:"
echo "   ssh ec2-user@3.91.50.187 'docker logs -f bsc-validator-1'"
echo ""
echo "3. Check status:"
echo "   curl -s http://3.91.50.187:8545 -X POST -H \"Content-Type: application/json\" \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}'"
echo ""
echo "4. Test HTTPS (if configured):"
echo "   curl -s https://rpc.bitcoinbr.tech -X POST -H \"Content-Type: application/json\" \\"
echo "     --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "5. Add to MetaMask:"
echo "   Network: BTCBR Private BSC"
echo "   RPC: https://rpc.bitcoinbr.tech (or http://3.91.50.187:8545)"
echo "   Chain ID: 885824"
echo "   Symbol: BNB"
echo "   BTCBR Token: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
echo ""
echo "========================================="
