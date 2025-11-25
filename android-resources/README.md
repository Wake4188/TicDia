# Android Resources

This directory contains all assets needed for the Android app and Play Store listing.

## Directory Structure

```
android-resources/
├── icons/              # App icons (all sizes)
├── splash/             # Splash screen resources
└── playstore/          # Play Store listing graphics
```

## Required Assets

### App Icons (`icons/`)

Create these icon sizes (all in PNG format):

| Density | Size | Filename |
|---------|------|----------|
| mdpi | 48x48 | icon-mdpi.png |
| hdpi | 72x72 | icon-hdpi.png |
| xhdpi | 96x96 | icon-xhdpi.png |
| xxhdpi | 144x144 | icon-xxhdpi.png |
| xxxhdpi | 192x192 | icon-xxxhdpi.png |

**Design Guidelines:**
- Use your app logo/brand
- Simple, recognizable design
- Works well at small sizes
- No text (use logo/symbol only)
- Transparent background NOT recommended for launcher icons

**Suggested Design:** The TicDia logo (using the 'T' icon from your current favicon)

### Splash Screen (`splash/`)

Create splash screen assets:

| File | Size | Purpose |
|------|------|---------|
| splash.png | 2732x2732 | Main splash image |
| splash-land.png | 2732x2732 | Landscape splash |

**Design Guidelines:**
- Center your logo/icon
- Match your app's color scheme (black background)
- Keep important elements in the center 40%

### Play Store Graphics (`playstore/`)

#### Feature Graphic
- **Filename:** feature-graphic.png
- **Size:** 1024x500px
- **Format:** PNG or JPEG
- **Content:** App name, tagline, visual showcase of the app

**Example Layout:**
```
[TicDia Logo] "Discover Wikipedia in TikTok Style"
[Screenshot mockup showing the feed]
```

#### Screenshots (Phone)
- **Minimum:** 2 screenshots
- **Recommended:** 4-8 screenshots
- **Size:** 1080x1920px (9:16 aspect ratio)
- **Format:** PNG or JPEG

**Suggested Screenshots:**
1. `screenshot-1-feed.png` - Main article feed
2. `screenshot-2-article.png` - Article reading view
3. `screenshot-3-categories.png` - Category browse page
4. `screenshot-4-profile.png` - User profile/stats
5. `screenshot-5-settings.png` - Customization options
6. `screenshot-6-darkmode.png` - Dark mode showcase
7. `screenshot-7-tts.png` - Text-to-speech player
8. `screenshot-8-achievements.png` - Achievements/badges

#### Screenshots (Tablet - Optional)
- **Size:** 1536x2048px
- **Same content as phone but optimized for tablet**

#### App Icon for Store
- **Filename:** icon-512.png
- **Size:** 512x512px
- **Format:** PNG (32-bit, no alpha)

---

## How to Generate Icons

### Option 1: Using Design Tools
1. Create your primary icon at **1024x1024px** in Figma/Photoshop/Illustrator
2. Export at different sizes listed above
3. Save to `icons/` directory

### Option 2: Using Online Tools
- **App Icon Generator:** https://appicon.co/
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/
- Upload your 1024x1024 icon and download all sizes

### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick
brew install imagemagick

# Generate all sizes from a source icon
convert source-icon-1024.png -resize 48x48 icons/icon-mdpi.png
convert source-icon-1024.png -resize 72x72 icons/icon-hdpi.png
convert source-icon-1024.png -resize 96x96 icons/icon-xhdpi.png
convert source-icon-1024.png -resize 144x144 icons/icon-xxhdpi.png
convert source-icon-1024.png -resize 192x192 icons/icon-xxxhdpi.png
convert source-icon-1024.png -resize 512x512 playstore/icon-512.png
```

---

## How to Take Screenshots

### Using Android Emulator
1. Run your app: `npm run android:open`
2. Launch emulator in Android Studio
3. Navigate to different screens
4. Press **Cmd+S** (Mac) or **Ctrl+S** (Windows) to take screenshots
5. Screenshots saved to Desktop by default

### Using Physical Device
1. Connect device via USB
2. Enable Developer Mode and USB Debugging
3. Run: `npm run android:open`
4. Take screenshots on device (Power + Volume Down)
5. Transfer to computer

### Tools for Enhanced Screenshots
- **Mockuuups Studio** - Add device frames
- **Figma** - Create promotional screenshots with text overlays
- **Canva** - Design feature graphics and promotional images

---

## After Creating Assets

### Copy Icons to Android Project
After running `npm run android:init`, copy your icons:

```bash
# Copy to appropriate drawable folders
cp icons/icon-mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp icons/icon-hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp icons/icon-xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp icons/icon-xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp icons/icon-xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

### Copy Splash Screen
```bash
cp splash/splash.png android/app/src/main/res/drawable/splash.png
```

---

## Design Tips

### App Icon
- **Keep it simple:** Icons should be recognizable at 48x48px
- **Use bold colors:** Match your brand colors
- **No text:** Symbols work better than text at small sizes
- **Test on device:** View at actual size before finalizing

### Feature Graphic
- **Bold headline:** Make app name prominent
- **Show the app:** Include screenshots or mockups
- **Brand colors:** Use your app's color palette
- **High contrast:** Ensure text is readable

### Screenshots
- **Show key features:** Highlight what makes your app unique
- **Use actual content:** Real Wikipedia articles, not lorem ipsum
- **Add captions:** Brief text explaining each feature
- **Consistent styling:** Use the same device frame for all
- **Show variety:** Different screens, light/dark mode, etc.

---

## Resources

- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [Material Design Icons](https://material.io/design/iconography)
- [Play Store Artwork Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)

---

**Note:** For the initial submission, you can use placeholder assets from your current web app favicons and screenshots, then update with professional graphics later.
