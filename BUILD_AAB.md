# Building Android App Bundle (AAB) for Kamwaalay App - Without Expo

This guide shows you how to build an AAB file locally without using Expo's build service.

## Prerequisites

1. **Java JDK 17 or higher**
2. **Android SDK** (via Android Studio or command-line tools)
3. **Environment Variables** properly set

## Step 1: Verify Prerequisites

### Check Java Installation
```bash
java -version
```
Should show Java 17 or higher.

### Install Java (if needed)
```bash
# On macOS with Homebrew:
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Add to your ~/.zshrc for persistence:
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

### Check Android SDK
```bash
# Verify ANDROID_HOME is set
echo $ANDROID_HOME

# If not set, add to ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Step 2: Ensure Android Project Exists

If you haven't already generated the native Android project:

```bash
npx expo prebuild --platform android
```

This creates the `/android` folder with all necessary native code.

## Step 3: Generate a Signing Key (Required for Release Builds)

AAB files must be signed. Create a keystore if you don't have one:

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore kamwaalay-release-key.keystore -alias kamwaalay-key-alias -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (can be same as keystore password)
# - Your name, organization, etc.
```

**IMPORTANT:** 
- Store the keystore file securely
- Remember your passwords
- Never commit the keystore to git (it's already in .gitignore)

## Step 4: Configure Gradle for Signing

Create or edit `android/gradle.properties` and add (replace with your actual values):

```properties
KAMWAALAY_UPLOAD_STORE_FILE=kamwaalay-release-key.keystore
KAMWAALAY_UPLOAD_KEY_ALIAS=kamwaalay-key-alias
KAMWAALAY_UPLOAD_STORE_PASSWORD=your_keystore_password
KAMWAALAY_UPLOAD_KEY_PASSWORD=your_key_password
```

Then edit `android/app/build.gradle` to add the signing configuration:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('KAMWAALAY_UPLOAD_STORE_FILE')) {
                storeFile file(KAMWAALAY_UPLOAD_STORE_FILE)
                storePassword KAMWAALAY_UPLOAD_STORE_PASSWORD
                keyAlias KAMWAALAY_UPLOAD_KEY_ALIAS
                keyPassword KAMWAALAY_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

## Step 5: Build the AAB

Now you can build the AAB file:

```bash
# Navigate to android directory
cd android

# Clean previous builds (optional but recommended)
./gradlew clean

# Build the release AAB
./gradlew bundleRelease
```

## Step 6: Locate Your AAB File

After successful build, find your AAB at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

## Step 7: Test the AAB (Optional)

You can test the AAB using bundletool:

```bash
# Install bundletool
brew install bundletool

# Generate APKs from AAB for testing
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab --output=kamwaalay.apks --mode=universal

# Extract the universal APK
unzip kamwaalay.apks -d extracted_apks

# Install on connected device
adb install extracted_apks/universal.apk
```

## Common Issues & Solutions

### Issue: "SDK location not found"
**Solution:** Set ANDROID_HOME environment variable (see Step 1)

### Issue: "Java version mismatch"
**Solution:** Ensure Java 17 is installed and JAVA_HOME is set correctly

### Issue: "Execution failed for task ':app:bundleRelease'"
**Solution:** Check that signing configuration is correct in build.gradle

### Issue: "Keystore file not found"
**Solution:** Ensure the keystore path in gradle.properties is correct (relative to android/app/)

## Build Variants

- **Debug AAB:** `./gradlew bundleDebug` (not recommended for distribution)
- **Release AAB:** `./gradlew bundleRelease` (for Google Play Store)

## File Sizes

AAB files are typically smaller than APKs because Google Play generates optimized APKs for each device configuration.

## Next Steps

1. Upload the AAB to Google Play Console
2. Google Play will generate optimized APKs for different device configurations
3. Users will download only what they need for their specific device

## Current App Configuration

- **Package Name:** `com.kamwaalay.app`
- **Version:** `1.0.0`
- **Min SDK:** Check android/app/build.gradle
- **Target SDK:** Check android/app/build.gradle

## Security Notes

⚠️ **NEVER commit these files to version control:**
- `*.keystore` files
- `gradle.properties` with passwords
- Any files containing signing credentials

These are already in your `.gitignore`, but double-check before committing!
