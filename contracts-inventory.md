# Nor Chain Contracts Inventory

## Core Contracts

### Native Tokens
- **BTCBR.sol** - Bitcoin Reserve token (0x0cF8e180350253271f4b917CcFb0aCCc4862F262)
- **NOR.sol** - Native gas token
- **NRG.sol** - Nor Revenue Governance token

### DEX Contracts
- **NorSwapFactory.sol** - Factory for creating trading pairs
- **NorSwapPair.sol** - Trading pair implementation
- **NorSwapRouter.sol** - Router for swaps and liquidity management
- **WNOR.sol** - Wrapped NOR token

### Bridge Contracts
- **CrossChainBridge.sol** - Main cross-chain bridge
- **BTCBRBridgeMainnet.sol** - BTCBR bridge to Ethereum
- **BTCBRBridgePrivate.sol** - BTCBR bridge to private chains
- **BNBBridgeNor.sol** - BNB bridge to Nor Chain
- **ETHBridgeMainnet.sol** - ETH bridge to Ethereum
- **ETHBridgeNor.sol** - ETH bridge on Nor Chain
- **NORBridgeMainnet.sol** - NOR bridge to Ethereum
- **NORBridgePrivate.sol** - NOR bridge to private chains
- **USDTBridgeMainnet.sol** - USDT bridge to Ethereum
- **USDTBridgeNor.sol** - USDT bridge on Nor Chain
- **LiquidityPoolBridge.sol** - Liquidity pool bridge
- **NFTBridge.sol** - NFT cross-chain bridge
- **TimelockBridge.sol** - Timelocked bridge operations
- **WBNBToken.sol** - Wrapped BNB token
- **WETHToken.sol** - Wrapped ETH token
- **WUSDTToken.sol** - Wrapped USDT token

### Governance Contracts
- **NorGovernance.sol** - Main governance contract
- **LPTokenTimelock.sol** - Timelock for LP tokens

### Staking Contracts
- **NorStaking.sol** - NOR token staking
- **NorFarming.sol** - Yield farming

### Tokenomics Contracts
- **NORBurnMechanism.sol** - Triple burn mechanism
- **NORCharity.sol** - Charity platform
- **NORCrowdfunding.sol** - Crowdfunding platform
- **NORGovernance.sol** - Governance tokenomics
- **NORRevenue.sol** - Revenue distribution
- **NORStaking.sol** - Advanced staking with dynamic APY
- **LiquidityLock.sol** - Liquidity locking mechanism
- **WeeklyBuyback.sol** - Weekly buyback and burn

### Oracle Contracts
- **PriceOracle.sol** - Main price oracle
- **ChainlinkPriceAggregator.sol** - Chainlink price aggregator
- **OracleAggregator.sol** - Multi-source oracle aggregator

### Stablecoin Contracts
- **Dirhamat.sol** - Dirham stablecoin
- **DigitalKES.sol** - Kenyan Shilling stablecoin
- **NORDCoin.sol** - NOR-denominated stablecoin

### Reserve Contracts
- **MultiAssetReserveVault.sol** - Multi-asset reserve vault

### Fund Contracts
- **NorFund.sol** - Investment fund
- **NorFundFactory.sol** - Factory for creating funds
- **FundUnit.sol** - Fund unit token

### Cross-Chain Contracts
- **NORToken.sol** - NOR token for cross-chain
- **PriceAuthority.sol** - Price authority for cross-chain
- **SettlementHub.sol** - Settlement hub for cross-chain
- **SupplyController.sol** - Supply controller for cross-chain
- **NorRouter.sol** - Router for cross-chain trading
- **SettlementInbox.sol** - Settlement inbox for cross-chain

### Factory Contracts
- **CREATE2Factory.sol** - CREATE2 factory for deterministic deployment

### Wrapped Tokens
- **WrappedBTCBR.sol** - Wrapped BTCBR
- **WrappedDirhamat.sol** - Wrapped Dirhamat
- **WrappedNOR.sol** - Wrapped NOR

## Contract Addresses

### Validators
- Validator 1: 0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a
- Validator 2: 0x689cf2c189781d9bb6859a830acbf64044e4432f
- Validator 3: 0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de
- Bootnode: 0xdd779a290c937144f80eb75b75d814c834536b1b

### Core Tokens
- BTCBR: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
- NOR: To be deployed
- NRG: To be deployed

### DEX Contracts
- NorSwapFactory: To be deployed
- NorSwapRouter: To be deployed
- WNOR: To be deployed

### Bridge Contracts
- CrossChainBridge: To be deployed
- BTCBRBridgeMainnet: To be deployed
- BTCBRBridgePrivate: To be deployed

### Governance Contracts
- NorGovernance: To be deployed

### Staking Contracts
- NorStaking: To be deployed
- NorFarming: To be deployed

### Tokenomics Contracts
- NORBurnMechanism: To be deployed
- NORRevenue: To be deployed
- NORStaking: To be deployed
- WeeklyBuyback: To be deployed
- LiquidityLock: To be deployed

### Oracle Contracts
- PriceOracle: To be deployed

### Stablecoin Contracts
- Dirhamat: To be deployed

## Genesis Configuration

Chain ID: 65001
Consensus: Parlia Proof-of-Staked-Authority
Epoch: 10,000 blocks
Block Time: 3 seconds
Gas Limit: 50,000,000

## Network Parameters

- Native Token: NOR
- Gas Token: NOR
- Utility Token: BTCBR
- Governance Token: NRG
- Stablecoin: Dirhamat
- Validators: 3 active, 2 standby
- Minimum Stake: 10,000 NOR for validators
- Block Reward: 2 NOR per block
- Total Supply: 1,000,000,000 NOR
- BTCBR Supply: 21,000,000,000,000,000,000,000,000 (21 septillion)