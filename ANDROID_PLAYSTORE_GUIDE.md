# Android Play Store Deployment Guide

Complete step-by-step guide to deploy TicDia to the Google Play Store.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [One-Time Setup](#one-time-setup)
- [Building the Android App](#building-the-android-app)
- [Creating a Signed Release](#creating-a-signed-release)
- [Google Play Console Setup](#google-play-console-setup)
- [Uploading to Play Store](#uploading-to-play-store)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
1. **Android Studio** (Latest version)
   - Download from: https://developer.android.com/studio
   - Install with Android SDK
   
2. **Java Development Kit (JDK)** 17 or higher
   - Check if installed: `java --version`
   - Download from: https://adoptium.net/ (if needed)

3. **Node.js** 18+ (you already have this)

### Verify Installation
```bash
# Check Java version
java --version
# Should show version 17 or higher

# Check Android Studio installation
# Open Android Studio -> About Android Studio
```

---

## One-Time Setup

### Step 1: Initialize Android Project

From the project root directory:

```bash
# This creates the android/ directory
npm run android:init
```

This command creates a native Android project in the `android/` folder.

### Step 2: Configure Android SDK Path

1. Open Android Studio
2. Go to **Preferences/Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Note the **Android SDK Location** (usually `~/Library/Android/sdk` on Mac)
4. Create/edit `android/local.properties`:
   ```properties
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```

### Step 3: Accept Android Licenses

```bash
cd ~/Library/Android/sdk/tools/bin
./sdkmanager --licenses
# Accept all licenses by typing 'y' when prompted
```

---

## Building the Android App

### Development Build (for testing)

```bash
# Build web app and sync to Android
npm run android:build

# Open in Android Studio
npm run android:open
```

In Android Studio:
- Click the **green play button** to run on an emulator or connected device
- Or click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)** for testing

### Production Build

Follow the steps in [Creating a Signed Release](#creating-a-signed-release).

---

## Creating a Signed Release

Apps on Google Play Store must be signed with a release key.

### Step 1: Generate a Keystore

A keystore is your app's signing certificate. **Keep it safe and never lose it!**

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore (you'll be prompted for passwords and info)
keytool -genkeypair -v -storetype PKCS12 -keystore ticdia-release.keystore -alias ticdia -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (CREATE A STRONG PASSWORD)
# - Key password (can be the same as keystore password)
# - Your name
# - Organization
# - City/State/Country
```

> [!CAUTION]
> **Critical:** Store the keystore file and passwords securely! If you lose them, you cannot update your app on the Play Store.

Recommended password storage:
- Use a password manager (1Password, LastPass, Bitwarden)
- Store keystore file in a secure backup (encrypted cloud storage)

### Step 2: Configure Gradle for Signing

Create `android/key.properties` (this file is gitignored for security):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=ticdia
storeFile=app/ticdia-release.keystore
```

### Step 3: Update build.gradle

Edit `android/app/build.gradle`, add before `android {}` block:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build Signed AAB

```bash
# From project root
npm run android:release

# Or manually:
cd android
./gradlew bundleRelease
```

The signed `.aab` file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Google Play Console Setup

### Step 1: Create Developer Account

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. **Pay the $25 one-time registration fee**
4. Complete the developer account setup form

### Step 2: Create App Listing

1. Click **"Create app"**
2. Fill in basic information:
   - **App name:** TicDia
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free

3. Accept declarations and click **"Create app"**

### Step 3: Complete Store Listing

Navigate to **"Store presence"** → **"Main store listing"**:

#### App Details
- **App name:** TicDia
- **Short description:** (50 characters)
  ```
  Discover Wikipedia in an addictive TikTok-style feed
  ```

- **Full description:** (up to 4000 characters)
  ```
  TicDia transforms how you learn! Swipe through Wikipedia articles like social media stories.

  ✨ KEY FEATURES:
  • Vertical feed interface - Addictive, distraction-free reading
  • 10 languages supported - Learn in your native language
  • Text-to-speech - Listen to articles with AI voices
  • Smart categories - Science, History, Tech, Arts & more
  • Personalized feed - AI-curated content based on your interests
  • Save & bookmark - Keep articles for later
  • Reading stats - Track your learning journey

  📚 LEARN SMARTER:
  TicDia makes education engaging. Perfect for:
  - Students looking for quick knowledge
  - Curious minds exploring new topics
  - Language learners practicing reading
  - Anyone who loves learning

  🌍 MULTILINGUAL:
  English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Arabic

  🎨 CUSTOMIZE:
  - 12+ fonts
  - 10+ highlight themes
  - Dark mode
  - Adjustable text size

  Start your learning journey today - Download TicDia!
  ```

#### Graphics
Required assets (see `/android-resources/playstore/`):
- **App icon:** 512x512px (already in `android/app/src/main/res/`)
- **Feature graphic:** 1024x500px
- **Phone screenshots:** At least 2 (PNG/JPEG, up to 8)
- **7-inch tablet screenshots:** At least 2 (optional but recommended)

#### Contact Details
- **Email:** Your support email
- **Website:** https://ticdia.vercel.app
- **Privacy policy URL:** https://ticdia.vercel.app/privacy.html

### Step 4: Content Rating

1. Go to **"Policy"** → **"App content"**
2. Click **"Start questionnaire"**
3. Answer questions honestly (educational app, no user-generated content)
4. Receive your rating

### Step 5: Target Audience

1. Go to **"Policy"** → **"Target audience and content"**
2. Select target age groups: **13+** (educational content)
3. Complete advertising questionnaire

### Step 6: Data Safety

1. Go to **"Policy"** → **"Data safety"**
2. Complete form about data collection:
   - Collects user data: **Yes** (email, reading analytics)
   - Data is encrypted in transit
   - Users can request deletion
   - Privacy policy in app and URL

---

## Uploading to Play Store

### Step 1: Create Release

1. Go to **"Release"** → **"Production"**
2. Click **"Create new release"**

### Step 2: Upload AAB

1. Click **"Upload"**
2. Select your signed AAB file:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

### Step 3: Release Notes

Add release notes (what's new):
```
Initial release of TicDia!

• Swipe through Wikipedia articles in TikTok-style feed
• 10 languages supported
• Text-to-speech with AI voices
• Personalized content recommendations
• Reading statistics and achievements
• Save articles for later
• Beautiful dark mode design
```

### Step 4: Review and Rollout

1. Review all sections (must have green checkmarks)
2. Click **"Save"** → **"Review release"**
3. Click **"Start rollout to Production"**

### Step 5: Wait for Review

- Google reviews your app (typically 1-7 days)
- You'll receive email notifications
- Check status in Play Console dashboard

### Step 6: Go Live! 🎉

Once approved, your app is **LIVE** on the Play Store!

---

## Updating Your App

For future updates:

1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.1.0"  // Your version number
   ```

2. Build new AAB:
   ```bash
   npm run android:release
   ```

3. Upload to Play Console → Production → Create new release

---

## Troubleshooting

### Common Issues

#### "SDK location not found"
**Solution:** Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

#### "Gradle build failed"
**Solution:** 
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

#### "Unable to find a matching configuration of project :capacitor-android"
**Solution:** Check Capacitor versions match in package.json

#### "Keystore file not found"
**Solution:** Ensure `android/app/ticdia-release.keystore` exists and path in `key.properties` is correct

#### Build is slow
**Solution:** Increase memory in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

#### "Version code already used"
**Solution:** Increment `versionCode` in `android/app/build.gradle`

### Getting Help

- **Android Studio Issues:** https://developer.android.com/studio/troubleshoot
- **Capacitor Docs:** https://capacitorjs.com/docs/android
- **Play Console Help:** https://support.google.com/googleplay/android-developer

---

## Checklist

Before submitting to Play Store, verify:

- [ ] App builds successfully with `npm run android:release`
- [ ] Tested on real device or emulator
- [ ] All screenshots and graphics ready
- [ ] Privacy policy accessible
- [ ] App description and details complete
- [ ] Content rating obtained
- [ ] Data safety form completed
- [ ] Signed with release keystore
- [ ] Version codes are correct
- [ ] Release notes written

---

## Next Steps After Publishing

1. **Monitor reviews:** Respond to user feedback
2. **Track analytics:** Use Google Play Console analytics
3. **Plan updates:** Regular updates improve ranking
4. **Promote your app:** Share on social media, website
5. **Consider ASO:** App Store Optimization for better discoverability

---

**🎉 Congratulations on publishing TicDia to the Play Store!**

For questions or issues, refer to:
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
