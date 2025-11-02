# ⚠️ ETH BRIDGE ISSUE & SOLUTION

## Problem Identified:

The ETH bridge contract on BSC was designed for **native ETH** but BSC uses **ERC-20 wrapped ETH**.

### Contract Design:
```solidity
// Current (WRONG for BSC):
function bridgeETH(address recipient) external payable