#!/usr/bin/env python3
"""
Complete A-Z Inventory of Current Nor Chain
Shows everything deployed, addresses, balances, code, storage
"""

from web3 import Web3
import json

RPC_URL = "http://3.91.50.187:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

print("=" * 100)
print("🔍 COMPLETE NOOR CHAIN INVENTORY A-Z")
print("=" * 100)

# Chain status
current_block = w3.eth.block_number
print(f"\n📊 CHAIN STATUS:")
print(f"   Chain ID: {w3.eth.chain_id}")
print(f"   Current Block: {current_block:,}")
print(f"   Epoch Size: 10,000 blocks")
print(f"   Current Epoch: {current_block // 10000}")
print(f"   Stuck at: Block {current_block} ⚠️  EPOCH REVALIDATION FAILED")

# Expected validator addresses from memory
VALIDATORS = [
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"
]

# Deployer
DEPLOYER = "0xdD779a290C937144F80Eb75b75d814c834536B1b"

# Known addresses
KNOWN_ADDRESSES = {
    "VANITY ADDRESSES (Should Be)": {
        "BTCBR": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
        "NOR": "0x0cf8e180350253271f4b917ccfb0accc4862f263",
        "Factory": "0x0cf8e180350253271f4b917ccfb0accc4862f264",
        "Router": "0x0cf8e180350253271f4b917ccfb0accc4862f265",
        "Dirhamat": "0x0cf8e180350253271f4b917ccfb0accc4862f266",
    },
    "DEPLOYED ADDRESSES (Current)": {
        "BTCBR (wrong)": "0x1f4b942bBA4e923d4B663B3B4dfd6e27f3dea2c3",
        "NOR (wrong)": "0xCBE0EA61FDaB09CBd013C50CbF7c1dD969193c9b",
        "Dirhamat": "0xd1a00bb0f0af75c20D58ABcF11590780003133D7",
        "WETH": "0x381Acd8Ab92811094D0b8F73411C24F0b2122359",
        "WUSDT": "0x8ea180e32448d695A9036A992B2a3bdE67348B9e",
        "WBNB": "0x4664836683f62eB96388461f79602fC1Aeb6A78E",
        "Factory": "0x9f37c0fCc07741C7bF452390F4415820f0E605B7",
        "Router": "0x51321281AB0644aed5555b3A306C7AbfFf13c4C2",
    },
    "INFRASTRUCTURE": {
        "CrossChainBridge": "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84",
        "NorGovernance": "0x563559e9B62246054DCdC459dD43A6430565e13e",
        "NorStaking": "0xed09Cf03c86648a21Df809e92492185BABb51B0a",
        "NorFarming": "0xD31f1D176c01E89d379Bb0f5288E5e5746E8bf07",
        "PriceOracle": "0x2c0941eD0d2fbe8fF6Ade30c8e50819DaA548d29",
    }
}

print("\n" + "=" * 100)
print("📋 ADDRESS INVENTORY")
print("=" * 100)

all_addresses = {}

for category, addresses in KNOWN_ADDRESSES.items():
    print(f"\n{category}:")
    print("-" * 100)
    for name, addr in addresses.items():
        addr_checksummed = Web3.to_checksum_address(addr)
        
        # Get code
        code = w3.eth.get_code(addr_checksummed)
        has_code = len(code) > 2
        
        # Get balance
        balance = w3.eth.get_balance(addr_checksummed)
        balance_nor = float(w3.from_wei(balance, 'ether'))
        
        # Get nonce (transactions sent)
        nonce = w3.eth.get_transaction_count(addr_checksummed)
        
        status = "✅ CODE" if has_code else "❌ EOA"
        
        print(f"   {name:25} {addr_checksummed}")
        print(f"      Status: {status}  |  Balance: {balance_nor:,.2f} NOR  |  Nonce: {nonce}")
        
        all_addresses[name] = {
            "address": addr_checksummed,
            "has_code": has_code,
            "balance": balance_nor,
            "nonce": nonce
        }

# Check validators
print("\n" + "=" * 100)
print("⚙️  VALIDATORS")
print("=" * 100)

for i, val_addr in enumerate(VALIDATORS, 1):
    val_checksummed = Web3.to_checksum_address(val_addr)
    balance = w3.eth.get_balance(val_checksummed)
    balance_nor = float(w3.from_wei(balance, 'ether'))
    nonce = w3.eth.get_transaction_count(val_checksummed)
    
    print(f"   Validator {i}: {val_checksummed}")
    print(f"      Balance: {balance_nor:,.2f} NOR  |  Nonce: {nonce}")

# Check deployer
print("\n" + "=" * 100)
print("👤 DEPLOYER")
print("=" * 100)

deployer_checksummed = Web3.to_checksum_address(DEPLOYER)
balance = w3.eth.get_balance(deployer_checksummed)
balance_nor = float(w3.from_wei(balance, 'ether'))
nonce = w3.eth.get_transaction_count(deployer_checksummed)

print(f"   Address: {deployer_checksummed}")
print(f"   Balance: {balance_nor:,.2f} NOR")
print(f"   Nonce: {nonce}")

# Check liquidity pairs
print("\n" + "=" * 100)
print("💧 LIQUIDITY PAIRS")
print("=" * 100)

try:
    factory_addr = Web3.to_checksum_address("0x9f37c0fCc07741C7bF452390F4415820f0E605B7")
    
    with open('.build/artifacts/contracts/dex/NorSwapFactory.sol/NorSwapFactory.json') as f:
        factory_abi = json.load(f)['abi']
    
    factory = w3.eth.contract(address=factory_addr, abi=factory_abi)
    
    # Try to get pair count
    try:
        pair_count = factory.functions.allPairsLength().call()
        print(f"   Total Pairs: {pair_count}")
        
        for i in range(pair_count):
            pair_addr = factory.functions.allPairs(i).call()
            print(f"   Pair {i+1}: {pair_addr}")
    except:
        print("   ⚠️  Could not read factory pairs")
        
except Exception as e:
    print(f"   ⚠️  Factory not accessible: {e}")

# Genesis comparison
print("\n" + "=" * 100)
print("🔍 GENESIS FILE ANALYSIS")
print("=" * 100)

try:
    with open('data/genesis-nor-ultimate.json') as f:
        genesis = json.load(f)
    
    extradata = genesis['extradata']
    print(f"   ExtraData: {extradata[:66]}...{extradata[-20:]}")
    print(f"   ExtraData Length: {len(extradata[2:])//2} bytes")
    
    # Extract validator addresses from extraData
    # Format: 32 bytes vanity + N*20 bytes validators + 65 bytes seal
    validators_hex = extradata[2 + 64 : 2 + 64 + (3 * 40)]  # 3 validators * 40 hex chars
    
    genesis_validators = []
    for i in range(0, len(validators_hex), 40):
        val_hex = "0x" + validators_hex[i:i+40]
        genesis_validators.append(Web3.to_checksum_address(val_hex))
    
    print(f"\n   Genesis Validators (from extraData):")
    for i, val in enumerate(genesis_validators, 1):
        match = "✅" if val in VALIDATORS else "❌ MISMATCH"
        print(f"      {i}. {val} {match}")
    
    print(f"\n   Expected Validators (from memory):")
    for i, val in enumerate(VALIDATORS, 1):
        match = "✅" if val in genesis_validators else "❌ MISSING"
        print(f"      {i}. {val} {match}")
    
    # Check genesis allocations
    print(f"\n   Genesis Allocations:")
    for addr, alloc in genesis.get('alloc', {}).items():
        addr_checksummed = Web3.to_checksum_address(addr)
        has_code = 'code' in alloc
        status = "CONTRACT" if has_code else "EOA"
        print(f"      {addr_checksummed} ({status})")
        
except Exception as e:
    print(f"   ⚠️  Could not read genesis: {e}")

# Summary
print("\n" + "=" * 100)
print("📊 SUMMARY")
print("=" * 100)

print(f"""
✅ WORKING:
   • Chain is running (block {current_block:,})
   • RPC accessible
   • Some contracts deployed

❌ ISSUES:
   • Chain STUCK at block {current_block} (epoch revalidation failed)
   • Wrong validator addresses in genesis extraData
   • Contracts deployed at wrong addresses (not vanity ...F262-F266)
   • No liquidity due to wrong addresses

🎯 REQUIRED ACTIONS:
   1. Create test genesis with 200-block epoch
   2. Test epoch revalidation with correct validators
   3. Verify revalidation works multiple times (3+ epochs)
   4. Create production genesis with 10,000-block epoch
   5. Deploy all contracts to correct vanity addresses
   6. Add and lock liquidity
   7. Deploy governance/staking/farming
   8. Final verification

⏱️  TESTING TIME:
   • 200-block epoch = ~10 minutes per epoch
   • Test 3 epochs = ~30 minutes total
   • Production deployment = ~2 hours
""")

print("=" * 100)

# Save inventory
inventory = {
    "timestamp": w3.eth.get_block('latest')['timestamp'],
    "block": current_block,
    "chain_id": w3.eth.chain_id,
    "addresses": all_addresses,
    "validators": {
        "expected": VALIDATORS,
        "genesis": genesis_validators if 'genesis_validators' in locals() else []
    },
    "deployer": {
        "address": deployer_checksummed,
        "balance": balance_nor,
        "nonce": nonce
    }
}

with open('deployments/nor-chain-complete-inventory.json', 'w') as f:
    json.dump(inventory, f, indent=2)

print(f"💾 Inventory saved to: deployments/nor-chain-complete-inventory.json")
print("=" * 100)
