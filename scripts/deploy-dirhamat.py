#!/usr/bin/env python3
"""
Deploy Dirhamat stablecoin and MultiAssetReserveVault on Nor Chain
"""

from web3 import Web3
import json
import time

# Configuration
RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

# Use production oracles
GOLD_ORACLE = "0x4f001737E8A1c9e8954F3B01411c2BB22d229792"  # GOLD/USD
AED_ORACLE = "0x5F8Eb9B80D717Eb9826AB995933A486350eabFC0"   # AED/USD

# Connect
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print("═══════════════════════════════════════════════════════════════════════════")
print("         💎 DIRHAMAT STABLECOIN DEPLOYMENT 💎")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"🔗 RPC: {RPC_URL}")
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
    "network": "Nor Chain",
    "deployer": account.address,
    "stablecoin": {},
    "vault": {}
}

# Deploy MultiAssetReserveVault
print("📦 Step 1: Deploying MultiAssetReserveVault...")
vault_address = deploy_contract(
    'MultiAssetReserveVault',
    '.build/artifacts/contracts/reserves/MultiAssetReserveVault.sol/MultiAssetReserveVault.json'
)
results['vault']['MultiAssetReserveVault'] = vault_address
print()

# Deploy Dirhamat
print("📦 Step 2: Deploying Dirhamat stablecoin...")
dirhamat_address = deploy_contract(
    'Dirhamat',
    '.build/artifacts/contracts/stablecoins/Dirhamat.sol/Dirhamat.json',
    GOLD_ORACLE,  # Gold price oracle
    AED_ORACLE,   # AED/USD oracle
    account.address  # Compliance core (temporary)
)
results['stablecoin']['Dirhamat'] = dirhamat_address
print()

# Save deployment
with open('deployments/nor-dirhamat-deployment.json', 'w') as f:
    json.dump(results, f, indent=2)

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 DIRHAMAT DEPLOYED! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("💎 Dirhamat Stablecoin:")
print(f"   Contract:  {dirhamat_address}")
print(f"   Symbol:    DIRHAMAT")
print(f"   Decimals:  18")
print(f"   Peg:       1 DIRHAMAT = 1 AED")
print()
print("🏦 MultiAssetReserveVault:")
print(f"   Contract:  {vault_address}")
print()
print("🔮 Oracles:")
print(f"   Gold Price:  {GOLD_ORACLE}")
print(f"   AED/USD:     {AED_ORACLE}")
print()
print("💾 Deployment saved to: deployments/nor-dirhamat-deployment.json")
print()
print("📝 Next Steps:")
print("   1. Add reserve assets to vault (WUSDT, WBNB, gold, etc.)")
print("   2. Update Dirhamat reserve backing")
print("   3. Set up Shariah board oversight")
print("   4. Configure compliance integration")
print("   5. Mint initial DIRHAMAT supply")
print()
