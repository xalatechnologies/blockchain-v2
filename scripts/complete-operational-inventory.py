#!/usr/bin/env python3
"""
Complete Operational Inventory of Nor Chain
All liquidity, bridges, locks, DEX status, cross-chain functionality
"""

from web3 import Web3
import json
import time

RPC_URL = "http://3.91.50.187:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

print("=" * 100)
print("📊 NOOR CHAIN COMPLETE OPERATIONAL INVENTORY")
print("=" * 100)
print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
print(f"Block: {w3.eth.block_number:,}")
print(f"Chain ID: {w3.eth.chain_id}")

# Load ABIs
def load_abi(path):
    try:
        with open(path) as f:
            return json.load(f)['abi']
    except:
        return None

FACTORY_ABI = load_abi('.build/artifacts/contracts/dex/NorSwapFactory.sol/NorSwapFactory.json')
ROUTER_ABI = load_abi('.build/artifacts/contracts/dex/NorSwapRouter.sol/NorSwapRouter.json')
PAIR_ABI = load_abi('.build/artifacts/contracts/dex/NorSwapPair.sol/NorSwapPair.json')
ERC20_ABI = load_abi('.build/artifacts/contracts/tokens/MockERC20.sol/MockERC20.json')
BRIDGE_ABI = load_abi('.build/artifacts/contracts/bridges/production/CrossChainBridge.sol/CrossChainBridge.json')
LOCK_ABI = load_abi('.build/artifacts/contracts/utils/LiquidityLock.sol/LiquidityLock.json')

# Contract addresses
FACTORY = Web3.to_checksum_address("0x9f37c0fCc07741C7bF452390F4415820f0E605B7")
ROUTER = Web3.to_checksum_address("0x51321281AB0644aed5555b3A306C7AbfFf13c4C2")
BRIDGE = Web3.to_checksum_address("0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84")

TOKENS = {
    "BTCBR": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
    "BTCBR (wrong)": "0x1f4b942bBA4e923d4B663B3B4dfd6e27f3dea2c3",
    "NOR (wrong)": "0xCBE0EA61FDaB09CBd013C50CbF7c1dD969193c9b",
    "Dirhamat": "0xd1a00bb0f0af75c20D58ABcF11590780003133D7",
    "WETH": "0x381Acd8Ab92811094D0b8F73411C24F0b2122359",
    "WUSDT": "0x8ea180e32448d695A9036A992B2a3bdE67348B9e",
    "WBNB": "0x4664836683f62eB96388461f79602fC1Aeb6A78E",
}

INFRASTRUCTURE = {
    "CrossChainBridge": "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84",
    "NorGovernance": "0x563559e9B62246054DCdC459dD43A6430565e13e",
    "NorStaking": "0xed09Cf03c86648a21Df809e92492185BABb51B0a",
    "NorFarming": "0xD31f1D176c01E89d379Bb0f5288E5e5746E8bf07",
    "PriceOracle": "0x2c0941eD0d2fbe8fF6Ade30c8e50819DaA548d29",
}

inventory = {
    "timestamp": int(time.time()),
    "block": w3.eth.block_number,
    "chain_id": w3.eth.chain_id,
    "dex": {},
    "liquidity": {},
    "locks": {},
    "bridge": {},
    "governance": {},
    "issues": []
}

# ============================================================================
# 1. DEX STATUS
# ============================================================================
print("\n" + "=" * 100)
print("🏪 DEX STATUS - NorSwap")
print("=" * 100)

try:
    factory = w3.eth.contract(address=FACTORY, abi=FACTORY_ABI)
    router = w3.eth.contract(address=ROUTER, abi=ROUTER_ABI)
    
    pair_count = factory.functions.allPairsLength().call()
    print(f"\n✅ Factory: {FACTORY}")
    print(f"   Total Pairs: {pair_count}")
    
    print(f"\n✅ Router: {ROUTER}")
    router_factory = router.functions.factory().call()
    print(f"   Connected to Factory: {router_factory}")
    print(f"   Match: {'✅' if router_factory.lower() == FACTORY.lower() else '❌'}")
    
    inventory["dex"] = {
        "factory": FACTORY,
        "router": ROUTER,
        "pair_count": pair_count,
        "status": "operational"
    }
    
except Exception as e:
    print(f"❌ DEX Error: {e}")
    inventory["dex"]["status"] = "error"
    inventory["issues"].append(f"DEX initialization failed: {e}")

# ============================================================================
# 2. LIQUIDITY PAIRS
# ============================================================================
print("\n" + "=" * 100)
print("💧 LIQUIDITY PAIRS")
print("=" * 100)

pairs_data = []
total_liquidity_usd = 0

if FACTORY_ABI and PAIR_ABI:
    factory = w3.eth.contract(address=FACTORY, abi=FACTORY_ABI)
    
    try:
        pair_count = factory.functions.allPairsLength().call()
        
        print(f"\nFound {pair_count} pairs:")
        print("-" * 100)
        
        for i in range(pair_count):
            try:
                pair_addr = factory.functions.allPairs(i).call()
                pair = w3.eth.contract(address=pair_addr, abi=PAIR_ABI)
                
                token0_addr = pair.functions.token0().call()
                token1_addr = pair.functions.token1().call()
                
                reserves = pair.functions.getReserves().call()
                reserve0, reserve1 = reserves[0], reserves[1]
                
                total_supply = pair.functions.totalSupply().call()
                
                # Get token symbols
                token0 = w3.eth.contract(address=token0_addr, abi=ERC20_ABI)
                token1 = w3.eth.contract(address=token1_addr, abi=ERC20_ABI)
                
                try:
                    symbol0 = token0.functions.symbol().call()
                    symbol1 = token1.functions.symbol().call()
                except:
                    symbol0 = token0_addr[:8]
                    symbol1 = token1_addr[:8]
                
                reserve0_human = reserve0 / 10**18
                reserve1_human = reserve1 / 10**18
                lp_supply = total_supply / 10**18
                
                # Estimate USD value (assuming USDT pairs)
                usd_value = 0
                if 'USDT' in symbol0.upper():
                    usd_value = reserve0_human * 2
                elif 'USDT' in symbol1.upper():
                    usd_value = reserve1_human * 2
                
                total_liquidity_usd += usd_value
                
                print(f"\n   Pair #{i+1}: {pair_addr}")
                print(f"      {symbol0}/{symbol1}")
                print(f"      Reserve {symbol0}: {reserve0_human:,.2f}")
                print(f"      Reserve {symbol1}: {reserve1_human:,.2f}")
                print(f"      LP Supply: {lp_supply:,.6f}")
                if usd_value > 0:
                    print(f"      Est. Value: ${usd_value:,.2f}")
                
                pairs_data.append({
                    "address": pair_addr,
                    "token0": {"address": token0_addr, "symbol": symbol0, "reserve": reserve0_human},
                    "token1": {"address": token1_addr, "symbol": symbol1, "reserve": reserve1_human},
                    "lp_supply": lp_supply,
                    "usd_value": usd_value
                })
                
            except Exception as e:
                print(f"   ⚠️  Pair #{i+1}: Error reading - {e}")
        
        print(f"\n{'=' * 100}")
        print(f"💰 TOTAL LIQUIDITY: ${total_liquidity_usd:,.2f}")
        print(f"{'=' * 100}")
        
        inventory["liquidity"] = {
            "pairs": pairs_data,
            "total_pairs": pair_count,
            "total_usd": total_liquidity_usd
        }
        
    except Exception as e:
        print(f"❌ Liquidity Error: {e}")
        inventory["issues"].append(f"Liquidity read failed: {e}")

# ============================================================================
# 3. LIQUIDITY LOCKS
# ============================================================================
print("\n" + "=" * 100)
print("🔒 LIQUIDITY LOCKS")
print("=" * 100)

# Try to find LiquidityLock contract
try:
    with open('deployments/nor-liquidity-locks.json') as f:
        lock_data = json.load(f)
        lock_addr = lock_data.get('liquidityLock')
        
        if lock_addr:
            lock_addr = Web3.to_checksum_address(lock_addr)
            print(f"\n✅ LiquidityLock: {lock_addr}")
            
            if LOCK_ABI:
                lock = w3.eth.contract(address=lock_addr, abi=LOCK_ABI)
                
                # Check locks for each pair
                locked_count = 0
                total_locked_value = 0
                
                for pair_info in pairs_data:
                    try:
                        pair_addr = Web3.to_checksum_address(pair_info['address'])
                        lock_info = lock.functions.locks(pair_addr).call()
                        
                        if lock_info[0] > 0:  # amount locked
                            locked_count += 1
                            amount = lock_info[0] / 10**18
                            unlock_time = lock_info[1]
                            
                            time_left = unlock_time - int(time.time())
                            days_left = time_left // 86400
                            
                            print(f"\n   {pair_info['token0']['symbol']}/{pair_info['token1']['symbol']}:")
                            print(f"      LP Locked: {amount:,.6f}")
                            print(f"      Unlock: {time.strftime('%Y-%m-%d', time.gmtime(unlock_time))}")
                            print(f"      Days Left: {days_left:,}")
                            
                            total_locked_value += pair_info['usd_value']
                    except:
                        pass
                
                print(f"\n{'=' * 100}")
                print(f"🔒 LOCKED PAIRS: {locked_count}/{len(pairs_data)}")
                print(f"💰 LOCKED VALUE: ${total_locked_value:,.2f}")
                print(f"{'=' * 100}")
                
                inventory["locks"] = {
                    "contract": lock_addr,
                    "locked_pairs": locked_count,
                    "total_pairs": len(pairs_data),
                    "locked_value_usd": total_locked_value
                }
        else:
            print("❌ No LiquidityLock contract found")
            inventory["issues"].append("LiquidityLock contract not deployed")
            
except FileNotFoundError:
    print("❌ No lock deployment file found")
    inventory["issues"].append("No liquidity lock deployment record")
except Exception as e:
    print(f"❌ Lock Error: {e}")
    inventory["issues"].append(f"Lock read failed: {e}")

# ============================================================================
# 4. CROSS-CHAIN BRIDGE
# ============================================================================
print("\n" + "=" * 100)
print("🌉 CROSS-CHAIN BRIDGE")
print("=" * 100)

try:
    bridge = w3.eth.contract(address=BRIDGE, abi=BRIDGE_ABI)
    
    print(f"\n✅ Bridge: {BRIDGE}")
    
    # Check supported tokens
    supported_tokens = []
    for name, addr in TOKENS.items():
        addr_checksum = Web3.to_checksum_address(addr)
        try:
            is_supported = bridge.functions.supportedTokens(addr_checksum).call()
            if is_supported:
                supported_tokens.append(name)
                print(f"   ✅ {name}: SUPPORTED")
            else:
                print(f"   ❌ {name}: NOT SUPPORTED")
        except:
            print(f"   ⚠️  {name}: Could not check")
    
    # Check supported chains
    supported_chains = []
    for chain_id, chain_name in [(1, "Ethereum"), (56, "BSC"), (137, "Polygon")]:
        try:
            chain_info = bridge.functions.bridges(chain_id).call()
            if chain_info[3]:  # isActive
                supported_chains.append(chain_name)
                print(f"   ✅ {chain_name} (Chain {chain_id}): ACTIVE")
            else:
                print(f"   ❌ {chain_name} (Chain {chain_id}): INACTIVE")
        except:
            print(f"   ⚠️  {chain_name}: Not configured")
    
    inventory["bridge"] = {
        "contract": BRIDGE,
        "supported_tokens": supported_tokens,
        "supported_chains": supported_chains,
        "status": "partial" if len(supported_tokens) < 3 else "full"
    }
    
    if len(supported_tokens) < 3:
        inventory["issues"].append(f"Only {len(supported_tokens)}/3 tokens enabled on bridge")
    
except Exception as e:
    print(f"❌ Bridge Error: {e}")
    inventory["issues"].append(f"Bridge read failed: {e}")

# ============================================================================
# 5. GOVERNANCE & INFRASTRUCTURE
# ============================================================================
print("\n" + "=" * 100)
print("⚙️  GOVERNANCE & INFRASTRUCTURE")
print("=" * 100)

for name, addr in INFRASTRUCTURE.items():
    addr_checksum = Web3.to_checksum_address(addr)
    code = w3.eth.get_code(addr_checksum)
    balance = w3.eth.get_balance(addr_checksum)
    
    status = "✅ DEPLOYED" if len(code) > 2 else "❌ NOT DEPLOYED"
    balance_nor = float(w3.from_wei(balance, 'ether'))
    
    print(f"\n   {name}: {addr_checksum}")
    print(f"      Status: {status}")
    print(f"      Balance: {balance_nor:,.2f} NOR")
    
    inventory["governance"][name] = {
        "address": addr_checksum,
        "deployed": len(code) > 2,
        "balance": balance_nor
    }

# ============================================================================
# 6. WEB INTERFACE
# ============================================================================
print("\n" + "=" * 100)
print("🌐 WEB INTERFACE")
print("=" * 100)

import os
dex_interface_path = "dex-interface/index.html"
if os.path.exists(dex_interface_path):
    print(f"\n   ✅ DEX Interface: http://localhost:8080/index.html")
    print(f"      File: {dex_interface_path}")
    inventory["web_interface"] = {
        "url": "http://localhost:8080/index.html",
        "status": "available"
    }
else:
    print(f"\n   ❌ DEX Interface not found")
    inventory["web_interface"] = {"status": "missing"}
    inventory["issues"].append("DEX web interface not found")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 100)
print("📊 EXECUTIVE SUMMARY")
print("=" * 100)

print(f"""
✅ OPERATIONAL:
   • DEX: {pair_count} trading pairs
   • Liquidity: ${total_liquidity_usd:,.2f}
   • Locked Liquidity: {inventory['locks'].get('locked_pairs', 0)}/{len(pairs_data)} pairs
   • Bridge Tokens: {len(inventory.get('bridge', {}).get('supported_tokens', []))}/3
   • Bridge Chains: {len(inventory.get('bridge', {}).get('supported_chains', []))}/3
   • Infrastructure: {sum(1 for v in inventory['governance'].values() if v['deployed'])}/{len(INFRASTRUCTURE)} contracts

❌ CRITICAL ISSUES:
   • Chain stuck at block {w3.eth.block_number:,} (epoch revalidation failure)
   • Wrong validator addresses in genesis
   • Contracts at non-vanity addresses
""")

if inventory["issues"]:
    print("\n⚠️  WARNINGS:")
    for issue in inventory["issues"]:
        print(f"   • {issue}")

print(f"""
🎯 RECOMMENDATIONS:
   1. Fix validator addresses → epoch revalidation
   2. Re-deploy with vanity addresses (...F262-F266)
   3. Re-add liquidity to new addresses
   4. Re-lock all LP tokens
   5. Enable remaining bridge tokens (BTCBR, NOR)
   6. Complete cross-chain deployment

💰 CURRENT VALUE LOCKED:
   • Total Liquidity: ${total_liquidity_usd:,.2f}
   • Locked: ${inventory['locks'].get('locked_value_usd', 0):,.2f}
   • At Risk: ALL (due to epoch failure)
""")

print("=" * 100)

# Save inventory
output_file = 'deployments/nor-operational-inventory.json'
with open(output_file, 'w') as f:
    json.dump(inventory, f, indent=2)

print(f"\n💾 Operational inventory saved to: {output_file}")
print("=" * 100)
