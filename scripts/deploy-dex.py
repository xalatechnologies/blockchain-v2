#!/usr/bin/env python3
"""
Deploy Nor Chain DEX contracts using Web3.py
Bypasses Hardhat caching issues
"""

from web3 import Web3
import json
import time

# Configuration
RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"  # Your wallet
BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

# Connect to Nor Chain
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print("═══════════════════════════════════════════════════════════════════════════")
print("         🌙 NOOR CHAIN DEX DEPLOYMENT (Python/Web3) 🌙")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"🔗 RPC: {RPC_URL}")
print(f"👤 Deployer: {account.address}")
print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether')} NOR")
print(f"📊 Current block: {w3.eth.block_number}")
print()

# Load compiled contracts
def load_contract(name):
    with open(f'.build/artifacts/contracts/dex/{name}.sol/{name}.json') as f:
        return json.load(f)

def deploy_contract(name, *args):
    print(f"📦 Deploying {name}...")
    artifact = load_contract(name)
    
    contract = w3.eth.contract(
        abi=artifact['abi'],
        bytecode=artifact['bytecode']
    )
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(account.address)
    
    tx = contract.constructor(*args).build_transaction({
        'chainId': 65001,
        'gas': 5000000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': nonce,
    })
    
    # Sign and send
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print(f"   📝 Transaction: {tx_hash.hex()}")
    print(f"   ⏳ Waiting for confirmation...")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    
    if receipt['status'] == 1:
        print(f"   ✅ {name} deployed at: {receipt['contractAddress']}")
        return receipt['contractAddress']
    else:
        raise Exception(f"Transaction failed: {receipt}")

# Step 1: Deploy WNOR
print("📦 Step 1: Deploying WNOR...")
wnor_address = deploy_contract('WNOR')
print()

# Step 2: Deploy Factory
print("📦 Step 2: Deploying NorSwapFactory...")
factory_address = deploy_contract('NorSwapFactory', account.address)
print()

# Get INIT_CODE_HASH
factory_artifact = load_contract('NorSwapFactory')
factory_contract = w3.eth.contract(address=factory_address, abi=factory_artifact['abi'])
try:
    init_code_hash = factory_contract.functions.INIT_CODE_HASH().call()
except:
    try:
        init_code_hash = factory_contract.functions.INIT_CODE_PAIR_HASH().call()
    except:
        init_code_hash = "0x" + "0" * 64  # Fallback
print(f"   📋 INIT_CODE_HASH: {init_code_hash if isinstance(init_code_hash, str) else init_code_hash.hex()}")
print()

# Step 3: Deploy Router
print("📦 Step 3: Deploying NorSwapRouter...")
router_address = deploy_contract('NorSwapRouter', factory_address, wnor_address)
print()

# Step 4: Create BTCBR/WNOR Pair
print("📦 Step 4: Creating BTCBR/WNOR pair...")
nonce = w3.eth.get_transaction_count(account.address)

create_pair_tx = factory_contract.functions.createPair(
    BTCBR_ADDRESS,
    wnor_address
).build_transaction({
    'chainId': 65001,
    'gas': 3000000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': nonce,
})

signed_tx = w3.eth.account.sign_transaction(create_pair_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"   📝 Transaction: {tx_hash.hex()}")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
pair_address = factory_contract.functions.getPair(BTCBR_ADDRESS, wnor_address).call()
print(f"   ✅ BTCBR/WNOR Pair: {pair_address}")
print()

# Save deployment info
deployment = {
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "chainId": 65001,
    "network": "Nor Chain",
    "rpc": RPC_URL,
    "deployer": account.address,
    "contracts": {
        "BTCBR": BTCBR_ADDRESS,
        "WNOR": wnor_address,
        "NorSwapFactory": factory_address,
        "NorSwapRouter": router_address,
        "initCodeHash": init_code_hash if isinstance(init_code_hash, str) else init_code_hash.hex()
    },
    "pairs": [
        {
            "name": "BTCBR/WNOR",
            "address": pair_address,
            "token0": BTCBR_ADDRESS,
            "token1": wnor_address
        }
    ]
}

with open('deployments/nor-dex-deployment.json', 'w') as f:
    json.dump(deployment, f, indent=2)

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 DEPLOYMENT COMPLETE! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("📋 Deployed Contracts:")
print(f"   BTCBR Token:       {BTCBR_ADDRESS}")
print(f"   WNOR:              {wnor_address}")
print(f"   NorSwap Factory:  {factory_address}")
print(f"   NorSwap Router:   {router_address}")
print(f"   BTCBR/WNOR Pair:   {pair_address}")
print()
print("💾 Deployment saved to: deployments/nor-dex-deployment.json")
print()
