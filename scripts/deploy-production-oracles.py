#!/usr/bin/env python3
"""
Deploy production-grade OracleAggregator contracts for Noor Chain
"""

from web3 import Web3
import json
import time

# Configuration
RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

# Oracle nodes (use validators as initial oracle nodes)
ORACLE_NODES = [
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",  # Validator 1
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",  # Validator 2
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"   # Validator 3
]

# Connect
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print("═══════════════════════════════════════════════════════════════════════════")
print("         🔮 PRODUCTION ORACLE DEPLOYMENT 🔮")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"🔗 RPC: {RPC_URL}")
print(f"👤 Deployer: {account.address}")
print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether'):,.2f} NOR")
print()

def load_contract(path):
    with open(path) as f:
        return json.load(f)

def deploy_oracle(name, price_feed):
    print(f"📦 Deploying {name} ({price_feed})...")
    artifact = load_contract('.build/artifacts/contracts/oracles/OracleAggregator.sol/OracleAggregator.json')
    
    contract = w3.eth.contract(
        abi=artifact['abi'],
        bytecode=artifact['bytecode']
    )
    
    nonce = w3.eth.get_transaction_count(account.address)
    
    tx = contract.constructor(price_feed, ORACLE_NODES).build_transaction({
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
    "oracleNodes": ORACLE_NODES,
    "oracles": {}
}

# Deploy Gold Price Oracle
gold_oracle = deploy_oracle("GoldPriceOracle", "GOLD/USD")
results['oracles']['GOLD_USD'] = gold_oracle
print()

# Deploy AED/USD Oracle
aed_oracle = deploy_oracle("AedUsdOracle", "AED/USD")
results['oracles']['AED_USD'] = aed_oracle
print()

# Deploy NOR/USD Oracle
nor_oracle = deploy_oracle("NorUsdOracle", "NOR/USD")
results['oracles']['NOR_USD'] = nor_oracle
print()

# Deploy BTCBR/USD Oracle
btcbr_oracle = deploy_oracle("BtcbrUsdOracle", "BTCBR/USD")
results['oracles']['BTCBR_USD'] = btcbr_oracle
print()

# Save deployment
with open('deployments/noor-production-oracles.json', 'w') as f:
    json.dump(results, f, indent=2)

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 PRODUCTION ORACLES DEPLOYED! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("🔮 Oracle Aggregators:")
print(f"   GOLD/USD:   {gold_oracle}")
print(f"   AED/USD:    {aed_oracle}")
print(f"   NOR/USD:    {nor_oracle}")
print(f"   BTCBR/USD:  {btcbr_oracle}")
print()
print("📊 Oracle Nodes (3):")
for i, node in enumerate(ORACLE_NODES, 1):
    print(f"   Node {i}: {node}")
print()
print("💾 Deployment saved to: deployments/noor-production-oracles.json")
print()
print("📝 Features:")
print("   ✅ Multi-source consensus (3 validators as oracle nodes)")
print("   ✅ Median price calculation (outlier resistant)")
print("   ✅ 24-hour staleness protection")
print("   ✅ Oracle reputation scoring")
print("   ✅ 10% deviation threshold")
print()
print("📋 Next Steps:")
print("   1. Configure oracle nodes to submit prices")
print("   2. Update Dirhamat to use production oracles")
print("   3. Set up automated price feeds")
print()
