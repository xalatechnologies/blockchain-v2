/**
 * Convert NOR Logo SVG to PNG formats
 *
 * Uses sharp library for high-quality image conversion
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const svgPath = join(projectRoot, 'assets', 'nor-logo.svg');
const outputDir = join(projectRoot, 'assets');

const sizes = [
  { name: '32', size: 32 },
  { name: '64', size: 64 },
  { name: '200', size: 200 },
  { name: '256', size: 256 }
];

async function convertLogo() {
  console.log('\n🎨 Converting NOR Logo to PNG formats\n');

  try {
    // Read SVG content
    const svgBuffer = readFileSync(svgPath);
    console.log(`✅ Read SVG file: ${svgPath}`);

    // Convert to each size
    for (const { name, size } of sizes) {
      const outputPath = join(outputDir, `nor-logo-${name}.png`);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✅ Created ${size}x${size}: nor-logo-${name}.png`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ALL PNG VERSIONS CREATED!');
    console.log('═══════════════════════════════════════\n');

    console.log('📁 Files created in /assets/:');
    sizes.forEach(({ name, size }) => {
      console.log(`  • nor-logo-${name}.png (${size}x${size})`);
    });

    console.log('\n🚀 NEXT STEPS:');
    console.log('');
    console.log('1. BSCScan (IMMEDIATE):');
    console.log('   https://bscscan.com/token/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E');
    console.log('   Click "Update Token Info" → Upload nor-logo-256.png');
    console.log('');
    console.log('2. Trust Wallet (3-7 days):');
    console.log('   Follow: docs/LOGO_SUBMISSION_GUIDE.md - Step 2');
    console.log('');
    console.log('3. CoinGecko (1-3 days):');
    console.log('   https://www.coingecko.com/en/coins/new');
    console.log('   Upload nor-logo-200.png');
    console.log('');
    console.log('✅ Ready to submit!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('sharp')) {
      console.log('\n💡 Installing sharp library...');
      console.log('Run: npm install sharp');
      console.log('Then run this script again.');
    }

    throw error;
  }
}

convertLogo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nFull error:', error);
    process.exit(1);
  });
