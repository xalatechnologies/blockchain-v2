#!/usr/bin/env python3
"""
Deploy Oracle and Bridge contracts on Noor Chain
"""

from web3 import Web3
import json
import time

# Configuration
RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"
BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

# Connect
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print("═══════════════════════════════════════════════════════════════════════════")
print("         🌉 NOOR CHAIN INFRASTRUCTURE DEPLOYMENT 🌉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"🔗 RPC: {RPC_URL}")
print(f"👤 Deployer: {account.address}")
print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether'):,.2f} NOR")
print()

# Load compiled contracts
def load_contract(path):
    with open(path) as f:
        return json.load(f)

def deploy_contract(name, path, *args):
    print(f"📦 Deploying {name}...")
    artifact = load_contract(path)
    
    contract = w3.eth.contract(
        abi=artifact['abi'],
        bytecode=artifact['bytecode']
    )
    
    nonce = w3.eth.get_transaction_count(account.address)
    
    tx = contract.constructor(*args).build_transaction({
        'chainId': 65001,
        'gas': 5000000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': nonce,
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print(f"   📝 Transaction: {tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    
    if receipt['status'] == 1:
        print(f"   ✅ {name} deployed at: {receipt['contractAddress']}")
        return receipt['contractAddress']
    else:
        raise Exception(f"Transaction failed")

results = {
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "chainId": 65001,
    "network": "Noor Chain",
    "deployer": account.address,
    "oracle": {},
    "bridges": {}
}

# Deploy Oracle
print("═══════════════════════════════════════════════════════════════════════════")
print("                         🔮 ORACLE CONTRACTS 🔮")
print("═══════════════════════════════════════════════════════════════════════════")
print()

oracle_address = deploy_contract(
    'MockOracle',
    '.build/artifacts/contracts/mocks/MockOracle.sol/MockOracle.json'
)
results['oracle']['MockOracle'] = oracle_address
print()

# Deploy Bridges
print("═══════════════════════════════════════════════════════════════════════════")
print("                         🌉 BRIDGE CONTRACTS 🌉")
print("═══════════════════════════════════════════════════════════════════════════")
print()

print("📦 Deploying BTCBRBridgeMainnet (Ethereum)...")
eth_bridge = deploy_contract(
    'BTCBRBridgeMainnet',
    '.build/artifacts/contracts/bridges/production/BTCBRBridgeMainnet.sol/BTCBRBridgeMainnet.json',
    BTCBR_ADDRESS,
    2  # Require 2 signatures for multi-sig
)
results['bridges']['Ethereum_Mainnet'] = eth_bridge
print()

print("📦 Deploying BTCBRBridgePrivate...")
private_bridge = deploy_contract(
    'BTCBRBridgePrivate',
    '.build/artifacts/contracts/bridges/production/BTCBRBridgePrivate.sol/BTCBRBridgePrivate.json',
    BTCBR_ADDRESS,
    2
)
results['bridges']['Private_Chain'] = private_bridge
print()

print("📦 Deploying BTCBRBridgeTron...")
tron_bridge = deploy_contract(
    'BTCBRBridgeTron',
    '.build/artifacts/contracts/bridges/multichain/BTCBRBridgeTron.sol/BTCBRBridgeTron.json',
    BTCBR_ADDRESS
)
results['bridges']['Tron'] = tron_bridge
print()

# Save deployment
with open('deployments/noor-infrastructure-deployment.json', 'w') as f:
    json.dump(results, f, indent=2)

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 INFRASTRUCTURE DEPLOYED! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("🔮 Oracle:")
print(f"   ChainlinkPriceOracle: {oracle_address}")
print()
print("🌉 Bridges:")
print(f"   Ethereum Mainnet: {eth_bridge}")
print(f"   Private Chain:    {private_bridge}")
print(f"   Tron:             {tron_bridge}")
print()
print("💾 Deployment saved to: deployments/noor-infrastructure-deployment.json")
print()
print("📝 Next Steps:")
print("   1. Configure oracle price feeds")
print("   2. Set up bridge validators (multi-sig)")
print("   3. Fund bridge contracts")
print("   4. Test cross-chain transfers")
print()
