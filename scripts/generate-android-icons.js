#!/usr/bin/env node

/**
 * Icon Generator Script for TicDia Android App
 * 
 * This script generates all required Android icon sizes from a source image.
 * Requires: sharp (npm install sharp)
 * 
 * Usage: node scripts/generate-android-icons.js [source-image-path]
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for Android
const ICON_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
};

const PLAYSTORE_ICON_SIZE = 512;

async function generateIcons(sourcePath) {
    // Verify source file exists
    if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source image not found: ${sourcePath}`);
        process.exit(1);
    }

    console.log(`📱 Generating Android icons from: ${sourcePath}\n`);

    // Create directories if they don't exist
    const iconsDir = path.join(__dirname, '../android-resources/icons');
    const playstoreDir = path.join(__dirname, '../android-resources/playstore');

    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }
    if (!fs.existsSync(playstoreDir)) {
        fs.mkdirSync(playstoreDir, { recursive: true });
    }

    try {
        // Generate launcher icons
        console.log('🎨 Generating launcher icons...');
        for (const [density, size] of Object.entries(ICON_SIZES)) {
            const outputPath = path.join(iconsDir, `icon-${density}.png`);
            await sharp(sourcePath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);
            console.log(`  ✓ Generated ${density}: ${size}x${size}px`);
        }

        // Generate Play Store icon
        console.log('\n🏪 Generating Play Store icon...');
        const playstoreIconPath = path.join(playstoreDir, 'icon-512.png');
        await sharp(sourcePath)
            .resize(PLAYSTORE_ICON_SIZE, PLAYSTORE_ICON_SIZE, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(playstoreIconPath);
        console.log(`  ✓ Generated Play Store icon: 512x512px`);

        console.log('\n✅ All icons generated successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Review icons in android-resources/icons/');
        console.log('  2. Run: npm run android:init (if not already done)');
        console.log('  3. Copy icons to Android project:');
        console.log('     npm run android:copy-icons');

    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        process.exit(1);
    }
}

// Get source image path from command line argument
const sourceImage = process.argv[2];

if (!sourceImage) {
    console.log('Usage: node scripts/generate-android-icons.js <source-image-path>');
    console.log('\nExample:');
    console.log('  node scripts/generate-android-icons.js public/favicon.ico');
    console.log('  node scripts/generate-android-icons.js path/to/logo-1024.png');
    console.log('\nRecommended source image size: 1024x1024px or larger');
    process.exit(1);
}

generateIcons(sourceImage);
