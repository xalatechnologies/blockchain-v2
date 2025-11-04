#!/usr/bin/env python3
"""
Generate Perfect Nor Chain Genesis with Correct Vanity Addresses
- BTCBR at 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- NOR at 0x0cf8e180350253271f4b917ccfb0accc4862f263
- Factory at 0x0cf8e180350253271f4b917ccfb0accc4862f264
- Router at 0x0cf8e180350253271f4b917ccfb0accc4862f265
- Dirhamat at 0x0cf8e180350253271f4b917ccfb0accc4862f266
"""

import json
from web3 import Web3

# Correct validator addresses (from memory)
VALIDATORS = [
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"
]

# Deployer address
DEPLOYER = "0xdD779a290C937144F80Eb75b75d814c834536B1b"

# Vanity addresses (correct ones ending in F262-F266)
BTCBR_ADDRESS = Web3.to_checksum_address("0x0cF8e180350253271f4b917CcFb0aCCc4862F262")
NOR_ADDRESS = Web3.to_checksum_address("0x0cf8e180350253271f4b917ccfb0accc4862f263")
FACTORY_ADDRESS = Web3.to_checksum_address("0x0cf8e180350253271f4b917ccfb0accc4862f264")
ROUTER_ADDRESS = Web3.to_checksum_address("0x0cf8e180350253271f4b917ccfb0accc4862f265")
DIRHAMAT_ADDRESS = Web3.to_checksum_address("0x0cf8e180350253271f4b917ccfb0accc4862f266")

# Get BTCBR bytecode from BSC mainnet
w3 = Web3(Web3.HTTPProvider("https://bsc-dataseed.binance.org/"))
BTCBR_CODE = w3.eth.get_code(BTCBR_ADDRESS).hex()

print("=" * 80)
print("🔨 GENERATING PERFECT NOOR CHAIN GENESIS")
print("=" * 80)
print(f"\nValidators:")
for i, val in enumerate(VALIDATORS, 1):
    print(f"  {i}. {val}")

print(f"\nVanity Contracts:")
print(f"  BTCBR:    {BTCBR_ADDRESS}")
print(f"  NOR:      {NOR_ADDRESS}")
print(f"  Factory:  {FACTORY_ADDRESS}")
print(f"  Router:   {ROUTER_ADDRESS}")
print(f"  Dirhamat: {DIRHAMAT_ADDRESS}")

# Generate extraData for Parlia consensus
# Format: 32 bytes vanity + N*20 bytes validator addresses + 65 bytes seal
vanity = "0x" + "00" * 32
validator_bytes = "".join([addr[2:] for addr in VALIDATORS])
seal = "00" * 65
extradata = vanity + validator_bytes + seal

print(f"\n📝 ExtraData: {extradata[:66]}...{extradata[-20:]}")
print(f"   Length: {len(extradata[2:])//2} bytes")

# Create genesis
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
            "epoch": 10000
        }
    },
    "difficulty": "0x1",
    "gasLimit": "0x2FAF080",
    "extradata": extradata,
    "alloc": {}
}

# 1 trillion NOR per validator + deployer
balance_1t = hex(int(1_000_000_000_000 * 10**18))

for validator in VALIDATORS:
    genesis["alloc"][validator.lower()] = {
        "balance": balance_1t
    }

genesis["alloc"][DEPLOYER.lower()] = {
    "balance": balance_1t
}

# BTCBR with code and storage (21 septillion supply)
# Slot 3 = total supply
# Slot 4 = decimals (18)
# Slot 5 = symbol ("BTCBR")
# Slot 6 = name ("Bitcoin BR")
# Balance mapping: keccak256(address + slot 1)

def get_balance_slot(address, slot=1):
    """Calculate storage slot for balance mapping"""
    # Remove 0x prefix, pad address to 32 bytes, pad slot to 32 bytes
    addr_padded = address[2:].lower().zfill(64)
    slot_padded = format(slot, '064x')
    # Concatenate and hash
    key = Web3.keccak(hexstr=addr_padded + slot_padded).hex()
    return key

# 21 septillion = 21,000,000,000,000,000,000,000,000
total_supply = 21_000_000_000_000_000_000_000_000
total_supply_hex = hex(total_supply * 10**18)

# Pre-allocate 10% to deployer
deployer_balance = int(total_supply * 0.1)
deployer_balance_hex = hex(deployer_balance * 10**18)

genesis["alloc"][BTCBR_ADDRESS.lower()] = {
    "balance": "0x0",
    "code": BTCBR_CODE,
    "storage": {
        # Total supply
        "0x0000000000000000000000000000000000000000000000000000000000000003": total_supply_hex,
        # Decimals (18)
        "0x0000000000000000000000000000000000000000000000000000000000000004": "0x0000000000000000000000000000000000000000000000000000000000000012",
        # Symbol storage (BTCBR = 0x42544342520000...)
        "0x0000000000000000000000000000000000000000000000000000000000000005": "0x425443425200000000000000000000000000000000000000000000000000000a",
        # Name storage (Bitcoin BR)
        "0x0000000000000000000000000000000000000000000000000000000000000006": "0x426974636f696e20425200000000000000000000000000000000000000000014",
        # Deployer balance
        get_balance_slot(DEPLOYER, slot=1): deployer_balance_hex
    }
}

print(f"\n✅ BTCBR configured:")
print(f"   Total Supply: {total_supply:,}")
print(f"   Deployer Balance: {deployer_balance:,} (10%)")
print(f"   Code: {len(BTCBR_CODE)} bytes")

# Save genesis
output_file = "data/genesis-nor-perfect.json"
with open(output_file, 'w') as f:
    json.dump(genesis, f, indent=2)

print(f"\n💾 Genesis saved to: {output_file}")

print("\n" + "=" * 80)
print("📋 DEPLOYMENT INSTRUCTIONS")
print("=" * 80)
print("""
1. Stop all validators on remote server
2. Backup current chain data
3. Upload genesis-nor-perfect.json to server
4. Initialize all validators with new genesis:
   geth init --datadir /data/validator1 genesis-nor-perfect.json
   geth init --datadir /data/validator2 genesis-nor-perfect.json
   geth init --datadir /data/validator3 genesis-nor-perfect.json
5. Start validators
6. Wait for block 10,000 to verify epoch revalidation
7. Deploy remaining contracts (NOR, Factory, Router, Dirhamat)
8. Add liquidity and lock
""")

print("=" * 80)
print("✅ GENESIS GENERATION COMPLETE!")
print("=" * 80)
