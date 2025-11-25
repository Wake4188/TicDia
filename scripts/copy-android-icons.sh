#!/bin/bash

# Copy icons to Android project
# Run this after generating icons and initializing the Android project

echo "📱 Copying icons to Android project..."

if [ ! -d "android" ]; then
  echo "❌ Android project not found. Run 'npm run android:init' first."
  exit 1
fi

# Copy launcher icons
cp android-resources/icons/icon-mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp android-resources/icons/icon-hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp android-resources/icons/icon-xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp android-resources/icons/icon-xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp android-resources/icons/icon-xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Copy round icons (same as regular icons)
cp android-resources/icons/icon-mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp android-resources/icons/icon-hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp android-resources/icons/icon-xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp android-resources/icons/icon-xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp android-resources/icons/icon-xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "✅ Icons copied successfully!"
echo ""
echo "Next steps:"
echo "  1. Build the app: npm run android:build"
echo "  2. Open in Android Studio: npm run android:open"
