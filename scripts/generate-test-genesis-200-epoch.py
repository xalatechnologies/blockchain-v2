#!/usr/bin/env python3
"""
Generate TEST Genesis with 200-block epoch for FAST revalidation testing
This allows us to test epoch transitions in ~10 minutes instead of hours
"""

import json
from web3 import Web3

# Correct validator addresses
VALIDATORS = [
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"
]

DEPLOYER = "0xdD779a290C937144F80Eb75b75d814c834536B1b"

# Vanity addresses
BTCBR_ADDRESS = Web3.to_checksum_address("0x0cF8e180350253271f4b917CcFb0aCCc4862F262")

# Get BTCBR bytecode
w3 = Web3(Web3.HTTPProvider("https://bsc-dataseed.binance.org/"))
BTCBR_CODE = w3.eth.get_code(BTCBR_ADDRESS).hex()

print("=" * 80)
print("🧪 GENERATING TEST GENESIS - 200 BLOCK EPOCH")
print("=" * 80)

# Generate extraData
vanity = "0x" + "00" * 32
validator_bytes = "".join([addr[2:] for addr in VALIDATORS])
seal = "00" * 65
extradata = vanity + validator_bytes + seal

print(f"\nValidators:")
for i, val in enumerate(VALIDATORS, 1):
    print(f"  {i}. {val}")

print(f"\n⚡ TEST PARAMETERS:")
print(f"   Epoch: 200 blocks (~10 minutes)")
print(f"   Block time: 3 seconds")
print(f"   Time per epoch: 200 * 3s = 600s = 10 min")
print(f"   Test duration: 3 epochs = 30 minutes")

# Create test genesis
genesis = {
    "config": {
        "chainId": 65001,
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
            "epoch": 200  # TEST: 200 blocks instead of 10,000
        }
    },
    "difficulty": "0x1",
    "gasLimit": "0x2FAF080",
    "extradata": extradata,
    "alloc": {}
}

# Give each validator 1 trillion NOR
balance_1t = hex(int(1_000_000_000_000 * 10**18))

for validator in VALIDATORS:
    genesis["alloc"][validator.lower()] = {"balance": balance_1t}

genesis["alloc"][DEPLOYER.lower()] = {"balance": balance_1t}

# BTCBR with code
total_supply = 21_000_000_000_000_000_000_000_000
total_supply_hex = hex(total_supply * 10**18)

deployer_balance = int(total_supply * 0.1)
deployer_balance_hex = hex(deployer_balance * 10**18)

def get_balance_slot(address, slot=1):
    addr_padded = address[2:].lower().zfill(64)
    slot_padded = format(slot, '064x')
    key = Web3.keccak(hexstr=addr_padded + slot_padded).hex()
    return key

genesis["alloc"][BTCBR_ADDRESS.lower()] = {
    "balance": "0x0",
    "code": BTCBR_CODE,
    "storage": {
        "0x0000000000000000000000000000000000000000000000000000000000000003": total_supply_hex,
        "0x0000000000000000000000000000000000000000000000000000000000000004": "0x0000000000000000000000000000000000000000000000000000000000000012",
        "0x0000000000000000000000000000000000000000000000000000000000000005": "0x425443425200000000000000000000000000000000000000000000000000000a",
        "0x0000000000000000000000000000000000000000000000000000000000000006": "0x426974636f696e20425200000000000000000000000000000000000000000014",
        get_balance_slot(DEPLOYER, slot=1): deployer_balance_hex
    }
}

# Save
output_file = "data/genesis-nor-test-200.json"
with open(output_file, 'w') as f:
    json.dump(genesis, f, indent=2)

print(f"\n💾 Test genesis saved: {output_file}")

print("\n" + "=" * 80)
print("🧪 TEST PROCEDURE")
print("=" * 80)
print("""
1. Stop validators on server
2. Backup current data
3. Initialize with test genesis (200-block epoch)
4. Start validators
5. Monitor epoch transitions:
   - Block 200: First revalidation
   - Block 400: Second revalidation  
   - Block 600: Third revalidation
6. If all 3 epochs pass → validators are correctly configured ✅
7. Then deploy production genesis with 10,000-block epoch

MONITORING:
   watch -n 1 'curl -s -X POST -H "Content-Type: application/json" \\
   --data '"'"'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'"'"' \\
   http://3.91.50.187:8545'

CRITICAL BLOCKS TO WATCH:
   Block 199 → 200 (first epoch boundary)
   Block 399 → 400 (second epoch boundary)
   Block 599 → 600 (third epoch boundary)

If chain doesn't get stuck, epoch revalidation is WORKING! 🎉
""")

print("=" * 80)
print("✅ TEST GENESIS READY")
print("=" * 80)
