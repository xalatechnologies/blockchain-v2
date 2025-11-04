#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# FINAL DOCS REORGANIZATION
#═══════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Clean up docs folder completely
# - Move 80 root MD files to appropriate categories
# - Consolidate duplicate folders
# - Create new 09-playbook category
# - Archive obsolete content
#═══════════════════════════════════════════════════════════════════════════

set -e

DOCS_DIR="/Volumes/Development/sahalat/blockchain-v2/docs"
cd "$DOCS_DIR"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║               FINAL DOCS REORGANIZATION                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create new category for playbook
echo "📚 Step 1: Creating 09-playbook category..."
mkdir -p 09-playbook
mv playbook/* 09-playbook/ 2>/dev/null || true
rmdir playbook 2>/dev/null || true

# Create archive for old duplicate folders
echo "📦 Step 2: Archiving duplicate/obsolete folders..."
mkdir -p .archive-old-folders

# Move duplicate folders to archive
for dir in bridges infrastructure archive deployment-logs technical investor launch liquidity migration scripts-backup tokenomics current branding; do
  if [ -d "$dir" ]; then
    echo "  Archiving $dir..."
    mv "$dir" ".archive-old-folders/" 2>/dev/null || true
  fi
done

# Move 09-archived to .archive-old-folders
if [ -d "09-archived" ]; then
  mv 09-archived/* .archive-old-folders/ 2>/dev/null || true
  rmdir 09-archived 2>/dev/null || true
fi

# Categorize root MD files
echo ""
echo "📝 Step 3: Organizing 80 root markdown files..."

# Deployment-related
echo "  → Deployment docs to 03-deployment..."
for file in BSC_*.md DEPLOYMENT*.md READY_*.md; do
  [ -f "$file" ] && mv "$file" "03-deployment/" 2>/dev/null || true
done

# Bridge-related
echo "  → Bridge docs to 02-bridges..."
for file in BRIDGE_*.md *BRIDGE*.md; do
  [ -f "$file" ] && mv "$file" "02-bridges/" 2>/dev/null || true
done

# Strategy/Launch related
echo "  → Strategy docs to 08-strategy..."
for file in BOT_*.md LAUNCH*.md *STRATEGY*.md MONETIZATION*.md LIQUIDITY*.md PRICE_*.md; do
  [ -f "$file" ] && mv "$file" "08-strategy/" 2>/dev/null || true
done

# Infrastructure related
echo "  → Infrastructure docs to 04-infrastructure..."
for file in *VALIDATOR*.md *INFRASTRUCTURE*.md ANSIBLE*.md; do
  [ -f "$file" ] && mv "$file" "04-infrastructure/" 2>/dev/null || true
done

# Checklists to getting-started
echo "  → Checklists to 01-getting-started..."
for file in CHECKLIST-*.md *CHECKLIST*.md; do
  [ -f "$file" ] && mv "$file" "01-getting-started/" 2>/dev/null || true
done

# Summaries
echo "  → Summary docs to 06-summaries..."
for file in *SUMMARY*.md *COMPLETE*.md CHANGES*.md FILE_ORGANIZATION*.md DOCUMENTATION*.md; do
  [ -f "$file" ] && mv "$file" "06-summaries/" 2>/dev/null || true
done

# Applications/Listings
echo "  → Application docs to 07-applications..."
for file in CHAINLIST*.md *APPLICATION*.md COINGECKO*.md COINMARKETCAP*.md; do
  [ -f "$file" ] && mv "$file" "07-applications/" 2>/dev/null || true
done

# Guides
echo "  → Guide docs to 05-guides..."
for file in USER_GUIDE.md *GUIDE*.md IMPROVEMENT*.md; do
  [ -f "$file" ] && mv "$file" "05-guides/" 2>/dev/null || true
done

# Budget/Investment
echo "  → Budget/Investment docs to 08-strategy..."
for file in *BUDGET*.md *EXPENDITURE*.md INVESTMENT*.md CALCULATION*.md; do
  [ -f "$file" ] && mv "$file" "08-strategy/" 2>/dev/null || true
done

# Compliance/Framework
echo "  → Compliance docs to 09-playbook..."
for file in COMPLIANCE-FRAMEWORK.md; do
  [ -f "$file" ] && mv "$file" "09-playbook/" 2>/dev/null || true
done

# Backup/Archive remaining
echo "  → Archiving remaining legacy docs..."
for file in *.md; do
  [ -f "$file" ] && mv "$file" ".archive-old-folders/" 2>/dev/null || true
done

# Create README files for new structure
echo ""
echo "📖 Step 4: Creating category README files..."

cat > 09-playbook/README.md << 'EOF'
# 09 - Nor Chain Playbook

**Nor Chain Playbook v3** - Public Master Edition

This directory contains the comprehensive vision, strategy, and technical playbook for Nor Chain.

## Playbook Parts

1. **Part 1 – Vision, Ecosystem & Philosophy**
   - Mission and vision
   - Ecosystem overview (Dirhamat, Digital KES, NordCoin, etc.)
   - Core philosophy (ethical, compliant, intelligent, inclusive)
   - Governance and participation model
   - Token economy (NOR)

2. **Part 2 – Technical Foundations**
   - Parlia PoSA consensus
   - Validator framework
   - Genesis configuration
   - Smart contract suite
   - Bridge architecture
   - Liquidity and price control

3. **Part 3 – Financial Products & Halal Funds**
   - Halal fund platform
   - Fund types (gold, sukuk, equity, etc.)
   - FundUnit token standard
   - NAV oracle system
   - Shariah oversight
   - Zakat engine
   - Retirement model

4. **Part 4 – Governance, Compliance & AI**
   - Governance framework (Council, Validator, Community DAOs)
   - Compliance Core (XCC)
   - Regulatory alignment (GDPR, AAOIFI, NSM)
   - AI integration layer
   - Ethical AI principles

5. **Part 5 – Market Strategy & Appendices**
   - Public trading and launch plan
   - Exchange listing strategy
   - Marketing and community growth
   - Developer ecosystem
   - Sustainability and ESG
   - 2025-2027 roadmap

## Key Concepts

**Ecosystem Components**:
- Nor Chain (L1) - Core blockchain
- Dirhamat - AED/Gold-backed stablecoin
- Digital KES - Kenyan Shilling token
- NordCoin - Nordic ESG-compliant currency
- Nor Swap (DEX) - Native decentralized exchange
- Nor Bridge - Cross-chain vault system
- Nor Funds - Halal mutual and retirement funds
- Compliance Core (XCC) - AML/KYC/GDPR framework
- AI Agents - Autonomous liquidity and compliance management

**Technical Specs**:
- Chain ID: 65001
- Block Time: 3 seconds
- Epoch: 10,000 blocks (~8h 20m)
- Validators: 3 active + 2 standby
- Native Token: NOR (21 billion, 24 decimals)

**Philosophy**:
- Ethical by Design (no riba, no gharar)
- Compliant by Default (GDPR, AAOIFI, NSM)
- Intelligent by Architecture (AI-driven)
- Inclusive by Access (public-permissioned)
- Sustainable by Operation (low-energy PoSA)

**Vision**: Enable ethical, transparent, and intelligent financial systems across emerging economies—bridging fiat, gold, digital assets, and AI-driven governance.

---

**Document Version**: v3.0-2025-11-02
**Copyright**: © 2025 Nor Technologies AS
**Purpose**: Educational and development reference
EOF

echo ""
echo "✅ Step 5: Verification..."
echo ""
echo "Final structure:"
tree -L 1 -d . 2>/dev/null || ls -d */

echo ""
echo "Root MD files remaining:"
ls -1 *.md 2>/dev/null | wc -l

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                DOCS REORGANIZATION COMPLETE ✅                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Structure:"
echo "  00-critical/     - Emergency procedures"
echo "  01-getting-started/ - Quick start guides"
echo "  02-bridges/      - Bridge infrastructure"
echo "  03-deployment/   - Deployment guides"
echo "  04-infrastructure/ - Validator setup"
echo "  05-guides/       - User/dev guides"
echo "  06-summaries/    - Progress reports"
echo "  07-applications/ - Exchange listings"
echo "  08-strategy/     - Business strategy"
echo "  09-playbook/     - Comprehensive vision & playbook"
echo ""
echo "Archived:"
echo "  .archive-old-folders/ - Legacy duplicate folders and old docs"
echo ""
