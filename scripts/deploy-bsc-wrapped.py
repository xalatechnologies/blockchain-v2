#!/usr/bin/env python3
"""
Deploy BSC Bridge and Wrapped Tokens on Noor Chain
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
print("         🌉 BSC BRIDGE & WRAPPED TOKENS DEPLOYMENT 🌉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"🔗 Network: Noor Chain (PRIVATE - Chain ID 65001)")
print(f"📍 Server: 3.91.50.187 (AWS)")
print(f"👤 Deployer: {account.address}")
print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether'):,.2f} NOR")
print()

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
    "network": "Noor Chain (PRIVATE)",
    "deployer": account.address,
    "wrapped_tokens": {},
    "bridges": {}
}

# Deploy WBNB Token
print("📦 Step 1: Deploying Wrapped BNB (WBNB)...")
wbnb_address = deploy_contract(
    'WBNBToken',
    '.build/artifacts/contracts/bridges/production/WBNBToken.sol/WBNBToken.json'
)
results['wrapped_tokens']['WBNB'] = wbnb_address
print()

# Deploy BNB Bridge (Noor Chain side)
print("📦 Step 2: Deploying BNB Bridge (Noor Chain)...")
bnb_bridge_noor = deploy_contract(
    'BNBBridgeXaheen',
    '.build/artifacts/contracts/bridges/production/BNBBridgeXaheen.sol/BNBBridgeXaheen.json',
    wbnb_address
)
results['bridges']['BNB_NoorChain'] = bnb_bridge_noor
print()

# Deploy BSC Bridge for BTCBR
print("📦 Step 3: Deploying BTCBR Bridge (for BSC Mainnet connection)...")
btcbr_bsc_bridge = deploy_contract(
    'BTCBRBridgeBSC',
    '.build/artifacts/contracts/bridges/production/BTCBRBridgePrivate.sol/BTCBRBridgePrivate.json',
    BTCBR_ADDRESS,
    2  # Require 2 signatures
)
results['bridges']['BTCBR_BSC'] = btcbr_bsc_bridge
print()

# Save deployment
with open('deployments/noor-bsc-wrapped-deployment.json', 'w') as f:
    json.dump(results, f, indent=2)

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 BSC INFRASTRUCTURE DEPLOYED! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("💎 Wrapped Tokens:")
print(f"   WBNB: {wbnb_address}")
print()
print("🌉 BSC Bridges:")
print(f"   BNB Bridge (Noor Chain):  {bnb_bridge_noor}")
print(f"   BTCBR Bridge (BSC):       {btcbr_bsc_bridge}")
print()
print("💾 Deployment saved to: deployments/noor-bsc-wrapped-deployment.json")
print()
print("⚠️  IMPORTANT - YOUR NETWORK STATUS:")
print("   🔒 PRIVATE CHAIN (Noor Chain)")
print("   📍 Running on AWS server 3.91.50.187")
print("   🔢 Chain ID: 65001 (NOT public BSC mainnet)")
print("   💰 Native token: NOR")
print()
print("📝 To connect to PUBLIC BSC Mainnet:")
print("   1. Deploy BTCBRBridgeMainnet on BSC mainnet (Chain ID 56)")
print("   2. Deploy BNBBridgeMainnet on BSC mainnet")
print("   3. Configure validators for cross-chain transfers")
print("   4. Fund bridge contracts on both chains")
print()
print("✅ Current DEX status:")
print("   - Trading LIVE on Noor Chain (private)")
print("   - BTCBR/WNOR pair active with liquidity")
print("   - Ready for internal testing")
print()
