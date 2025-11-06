/**
 * Find Vanity Address for NOR Token
 *
 * Searches for cool addresses like:
 * - 0xNOR... (starts with NOR)
 * - 0x...NOR (ends with NOR)
 * - 0xN0R... (N0R pattern)
 * - 0x000...NOR (leading zeros + NOR)
 */

import { ethers } from 'ethers';
import fs from 'fs';

const FACTORY_ADDRESS = "0x4e59b44847b379578588920cA78FbF26c0B4956C"; // Nick's Method (same on all chains)

// Get NOR token bytecode hash
console.log('\n🔍 Finding Vanity Address for NOR Token\n');
console.log('Loading NOR token bytecode...');

const NORToken = JSON.parse(
  fs.readFileSync('.build/artifacts/contracts/crosschain/NORToken.sol/NORToken.json', 'utf8')
);

const bytecodeHash = ethers.keccak256(NORToken.bytecode);
console.log(`Bytecode hash: ${bytecodeHash}\n`);

// Compute CREATE2 address
function computeCreate2Address(salt) {
  const hash = ethers.keccak256(
    ethers.solidityPacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', FACTORY_ADDRESS, salt, bytecodeHash]
    )
  );
  return ethers.getAddress('0x' + hash.slice(-40));
}

// Check if address matches pattern
function checkPattern(address) {
  const addr = address.toLowerCase();
  const patterns = [];

  // Starts with 0xnor, 0xn0r, etc.
  if (addr.startsWith('0xnor')) patterns.push('Starts with NOR');
  if (addr.startsWith('0xn0r')) patterns.push('Starts with N0R');
  if (addr.startsWith('0x0nor')) patterns.push('Starts with 0NOR');
  if (addr.startsWith('0x00nor')) patterns.push('Starts with 00NOR');
  if (addr.startsWith('0x000nor')) patterns.push('Starts with 000NOR');

  // Ends with nor
  if (addr.endsWith('nor')) patterns.push('Ends with NOR');
  if (addr.endsWith('n0r')) patterns.push('Ends with N0R');
  if (addr.endsWith('0nor')) patterns.push('Ends with 0NOR');

  // Contains nor in middle
  if (addr.includes('nor') && !addr.startsWith('0xnor') && !addr.endsWith('nor')) {
    patterns.push('Contains NOR');
  }

  // Special patterns
  if (addr.includes('000') && addr.includes('nor')) patterns.push('Has 000 + NOR');
  if (addr.match(/0x[0-9a-f]{2}nor/)) patterns.push('Early NOR pattern');

  return patterns;
}

// Score address (lower = better)
function scoreAddress(address) {
  const addr = address.toLowerCase();
  let score = 100;

  // Prefix patterns (best)
  if (addr.startsWith('0xnor')) score = 1;
  if (addr.startsWith('0xn0r')) score = 2;
  if (addr.startsWith('0x0nor')) score = 3;
  if (addr.startsWith('0x00nor')) score = 4;
  if (addr.startsWith('0x000nor')) score = 5;

  // Suffix patterns (good)
  if (addr.endsWith('nor')) score = Math.min(score, 10);
  if (addr.endsWith('n0r')) score = Math.min(score, 11);
  if (addr.endsWith('0nor')) score = Math.min(score, 12);

  // Contains NOR (okay)
  if (addr.includes('nor')) score = Math.min(score, 20);

  // Leading zeros (nice)
  const leadingZeros = addr.match(/^0x(0+)/)?.[1]?.length || 0;
  score -= leadingZeros * 0.5;

  return score;
}

// Main search
const found = [];
let attempts = 0;
const startTime = Date.now();

console.log('Searching for vanity addresses...\n');
console.log('Targets:');
console.log('  🎯 Best:    0xNOR..., 0xN0R..., 0x0NOR...');
console.log('  🎯 Good:    0x...NOR, 0x...N0R');
console.log('  🎯 Okay:    Contains "nor" anywhere\n');
console.log('Press Ctrl+C when you see one you like!\n');
console.log('═══════════════════════════════════════════════════\n');

// Search function
function search(maxAttempts = 1000000) {
  for (let i = 0; i < maxAttempts; i++) {
    attempts++;

    // Generate random salt
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const address = computeCreate2Address(salt);
    const patterns = checkPattern(address);

    if (patterns.length > 0) {
      const score = scoreAddress(address);
      found.push({ address, salt, patterns, score });

      // Sort by score
      found.sort((a, b) => a.score - b.score);

      // Print top 10
      console.clear();
      console.log('\n🔍 Finding Vanity Address for NOR Token\n');
      console.log(`Attempts: ${attempts.toLocaleString()}`);
      console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      console.log(`Rate: ${(attempts / ((Date.now() - startTime) / 1000)).toFixed(0)} addr/sec\n`);
      console.log('═══════════════════════════════════════════════════\n');
      console.log('🏆 Best Addresses Found:\n');

      found.slice(0, 15).forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.address}`);
        console.log(`   Patterns: ${item.patterns.join(', ')}`);
        console.log(`   Score: ${item.score.toFixed(1)}`);
        console.log(`   Salt: ${item.salt}\n`);
      });

      // Stop if we found a perfect match
      if (score <= 2) {
        console.log('═══════════════════════════════════════════════════\n');
        console.log('🎉 PERFECT MATCH FOUND!\n');
        console.log(`Address: ${address}`);
        console.log(`Salt: ${salt}\n`);
        console.log('This address starts with 0xNOR or 0xN0R!\n');
        console.log('Press Ctrl+C and use this salt for deployment.\n');

        // Save to file
        fs.writeFileSync('vanity-address-result.json', JSON.stringify({
          address,
          salt,
          patterns,
          score,
          attempts,
          timeSeconds: (Date.now() - startTime) / 1000
        }, null, 2));

        return true;
      }
    }

    // Update progress every 10k attempts
    if (i > 0 && i % 10000 === 0) {
      process.stdout.write(`\rAttempts: ${attempts.toLocaleString()} | Found: ${found.length} | Rate: ${(attempts / ((Date.now() - startTime) / 1000)).toFixed(0)} addr/sec`);
    }
  }

  return false;
}

// Run search
console.log('Starting search (this may take a few minutes)...\n');

// Search in batches
let totalSearched = 0;
const batchSize = 100000;

const searchInterval = setInterval(() => {
  const found = search(batchSize);
  totalSearched += batchSize;

  if (found || totalSearched >= 10000000) { // Stop after 10M attempts
    clearInterval(searchInterval);

    if (totalSearched >= 10000000) {
      console.log('\n\n═══════════════════════════════════════════════════\n');
      console.log('Searched 10 million salts. Pick your favorite from above!\n');
      console.log('To use an address, copy its salt and use it in deployment.\n');
    }
  }
}, 100);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n═══════════════════════════════════════════════════\n');
  console.log('Search stopped by user.\n');

  if (found.length > 0) {
    console.log('🏆 Top 5 Addresses Found:\n');
    found.slice(0, 5).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.address}`);
      console.log(`   Patterns: ${item.patterns.join(', ')}`);
      console.log(`   Salt: ${item.salt}\n`);
    });

    console.log('To use an address, copy its salt and run:\n');
    console.log('  node scripts/deploy-nor-create2.js --salt "YOUR_SALT_HERE"\n');
  } else {
    console.log('No matching addresses found yet. Try running longer!\n');
  }

  process.exit(0);
});
