# TicDia Android Build - Quick Start

This is the **android-playstore** branch, configured for building and deploying the Android app to Google Play Store.

## 🚀 Quick Start

### First Time Setup

1. **Install Prerequisites:**
   - [Android Studio](https://developer.android.com/studio)
   - Java JDK 17+ ([Download](https://adoptium.net/))

2. **Initialize Android Project:**
   ```bash
   npm run android:init
   ```

3. **Build and Sync:**
   ```bash
   npm run android:build
   ```

4. **Open in Android Studio:**
   ```bash
   npm run android:open
   ```

### For Subsequent Builds

```bash
# Development build
npm run android:build
npm run android:open

# Production release (requires keystore setup)
npm run android:release
```

---

## 📚 Documentation

- **[ANDROID_PLAYSTORE_GUIDE.md](ANDROID_PLAYSTORE_GUIDE.md)** - Complete deployment guide
- **[PLAYSTORE_LISTING.md](PLAYSTORE_LISTING.md)** - Pre-filled Play Store content
- **[android-resources/README.md](android-resources/README.md)** - Asset requirements

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run android:init` | Initialize Android project (first time only) |
| `npm run android:build` | Build web app and sync to Android |
| `npm run android:sync` | Sync web assets to existing Android project |
| `npm run android:open` | Open project in Android Studio |
| `npm run android:release` | Build signed release AAB for Play Store |

---

## 🎨 Generating Assets

### Generate Icons
```bash
# Install sharp if not already installed
npm install sharp --save-dev

# Generate all icon sizes
node scripts/generate-android-icons.js public/favicon.ico

# Copy icons to Android project
./scripts/copy-android-icons.sh
```

### Create Screenshots
1. Run app in Android Studio
2. Take screenshots (Cmd/Ctrl + S)
3. Save to `android-resources/playstore/`

---

## ✅ Pre-Deployment Checklist

Before submitting to Play Store:

- [ ] App builds successfully: `npm run android:build`
- [ ] Tested on emulator or real device
- [ ] All icons generated and copied
- [ ] Screenshots created (minimum 2)
- [ ] Feature graphic created (1024x500px)
- [ ] Privacy policy accessible at https://ticdia.vercel.app/privacy.html
- [ ] Terms accessible at https://ticdia.vercel.app/terms.html
- [ ] Keystore created and backed up securely
- [ ] Release AAB built: `npm run android:release`
- [ ] Version code and name updated in build.gradle
- [ ] Release notes written

---

## 📝 Key Configuration

**App ID:** `com.ticdia.app`

**App Name:** TicDia

**Build Output:** `android/app/build/outputs/bundle/release/app-release.aab`

**Required Fee:** $25 one-time Google Play Console registration

---

## 🔐 Security Notes

**NEVER commit these files to git:**
- `*.keystore` or `*.jks` (signing keys)
- `android/key.properties` (keystore passwords)
- `android/local.properties` (SDK path)

Keep backups of your keystore file and passwords in a secure location!

---

## 🆘 Troubleshooting

### "Android project not found"
```bash
npm run android:init
```

### "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Build fails
```bash
cd android
./gradlew clean
cd ..
npm run android:build
```

### More help
See [ANDROID_PLAYSTORE_GUIDE.md](ANDROID_PLAYSTORE_GUIDE.md) troubleshooting section.

---

## 🎯 What's Different in This Branch?

Compared to the `main` branch:

✅ **App ID:** Changed to `com.ticdia.app` (production-ready)

✅ **Build Mode:** Uses local web build (no remote server)

✅ **Android Scripts:** Added build/sync/release commands

✅ **Documentation:** Comprehensive Play Store guides

✅ **Assets:** Templates for icons, screenshots, graphics

✅ **Security:** Keystore setup instructions

---

**Ready to publish? Follow the [ANDROID_PLAYSTORE_GUIDE.md](ANDROID_PLAYSTORE_GUIDE.md)**

For the main web app branch, switch back to `main`:
```bash
git checkout main
```
