# Asset Placeholder

This directory will contain app icons after generation.

Run the icon generator script:
```bash
node scripts/generate-android-icons.js public/favicon.ico
```

This will create:
- icon-mdpi.png (48x48)
- icon-hdpi.png (72x72)
- icon-xhdpi.png (96x96)
- icon-xxhdpi.png (144x144)
- icon-xxxhdpi.png (192x192)

After generating, copy to Android project:
```bash
./scripts/copy-android-icons.sh
```
