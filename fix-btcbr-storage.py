#!/usr/bin/env python3
"""
Fix BTCBR storage slots in genesis.json
The balance mapping is at slot 1, not slot 0
"""

import json
import requests
from web3 import Web3

# Configuration
BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
YOUR_WALLET = "0xdD779a290C937144F80Eb75b75d814c834536B1b"
VALIDATOR_WALLET = "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD"

# Total supply: 21 septillion
TOTAL_SUPPLY = 21000000000000000000000000000000000000000
HALF_SUPPLY = 10500000000000000000000000000000000000000

print("Fetching BTCBR bytecode from BSC mainnet...")
BSC_RPC = "https://bsc-dataseed1.binance.org/"
response = requests.post(BSC_RPC, json={
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": [BTCBR_ADDRESS, "latest"],
    "id": 1
})
bytecode = response.json()["result"]
print(f"✓ Bytecode fetched: {len(bytecode)} characters")

# Calculate storage slot for balance mapping (slot 1)
def get_balance_slot(address, slot=1):
    addr_padded = address.lower().replace("0x", "").zfill(64)
    slot_padded = hex(slot)[2:].zfill(64)
    key = Web3.keccak(hexstr=addr_padded + slot_padded).hex()
    return key

# Create correct storage layout based on mainnet
storage = {
    # Slot 3: Total supply
    "0x0000000000000000000000000000000000000000000000000000000000000003": 
        "0x" + hex(TOTAL_SUPPLY)[2:].zfill(64),
    # Slot 4: Decimals (18)
    "0x0000000000000000000000000000000000000000000000000000000000000004": 
        "0x0000000000000000000000000000000000000000000000000000000000000012",
    # Slot 5: Symbol ("BTCBR") - length 5, hex encoded
    "0x0000000000000000000000000000000000000000000000000000000000000005": 
        "0x42544342520000000000000000000000000000000000000000000000000000000a",
    # Slot 6: Name ("Bitcoin BR") - length 10, hex encoded
    "0x0000000000000000000000000000000000000000000000000000000000000006": 
        "0x426974636f696e204252000000000000000000000000000000000000000000014",
    # Balance mapping at slot 1
    get_balance_slot(YOUR_WALLET, 1): "0x" + hex(HALF_SUPPLY)[2:].zfill(64),
    get_balance_slot(VALIDATOR_WALLET, 1): "0x" + hex(HALF_SUPPLY)[2:].zfill(64),
}

print("\n✓ Storage slots calculated:")
print(f"  Total Supply (slot 3): {TOTAL_SUPPLY}")
print(f"  Decimals (slot 4): 18")
print(f"  Symbol (slot 5): BTCBR")
print(f"  Name (slot 6): Bitcoin BR")
print(f"  Your balance: {HALF_SUPPLY}")
print(f"  Validator balance: {HALF_SUPPLY}")

# Load genesis file
genesis_path = "genesis-fixed.json"
try:
    with open(genesis_path, 'r') as f:
        genesis = json.load(f)
    print(f"\n✓ Loaded genesis from {genesis_path}")
except FileNotFoundError:
    print(f"\n✗ Genesis file not found at {genesis_path}")
    print("Creating new genesis template...")
    genesis = {
        "config": {
            "chainId": 885824,
            "homesteadBlock": 0,
            "eip150Block": 0,
            "eip155Block": 0,
            "eip158Block": 0,
            "byzantiumBlock": 0,
            "constantinopleBlock": 0,
            "petersburgBlock": 0,
            "istanbulBlock": 0,
            "muirGlacierBlock": 0,
            "ramanujanBlock": 0,
            "nielsBlock": 0,
            "mirrorSyncBlock": 0,
            "brunoBlock": 0,
            "eulerBlock": 0,
            "parlia": {
                "period": 3,
                "epoch": 200
            }
        },
        "nonce": "0x0",
        "timestamp": "0x0",
        "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000faa5aa97651c2e2b6860219bb8f9902d416db5ddfd634d55ce9b99058dc06cdda1f866b39579a9f3b753b892551d1c374fda6fd7f6e9b787688c4ea50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "gasLimit": "0x2625a00",
        "difficulty": "0x1",
        "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "coinbase": "0x0000000000000000000000000000000000000000",
        "alloc": {}
    }

# Update BTCBR contract in alloc
if "alloc" not in genesis:
    genesis["alloc"] = {}

genesis["alloc"][BTCBR_ADDRESS.lower()] = {
    "balance": "0x0",
    "code": bytecode,
    "storage": storage
}

# Save updated genesis
output_path = "genesis-btcbr-fixed.json"
with open(output_path, 'w') as f:
    json.dump(genesis, f, indent=2)

print(f"\n✓ Genesis file saved to {output_path}")
print(f"\nNext steps:")
print(f"1. Stop all validators")
print(f"2. Delete validator data directories")
print(f"3. Reinitialize with this genesis file")
print(f"4. Restart validators")
