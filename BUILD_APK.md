# Building Android APK for Kamwaalay App

## Option 1: Using EAS Build (Recommended - Cloud-based)

This is the easiest method and doesn't require local Android development setup.

### Steps:

1. **Login to EAS** (if not already logged in):
   ```bash
   eas login
   ```

2. **Configure EAS project**:
   ```bash
   eas build:configure
   ```
   - Answer "Yes" when asked to create an EAS project

3. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   - This will build an APK in the cloud
   - You'll get a download link when the build completes

4. **Download the APK**:
   - The build will provide a URL to download the APK
   - Or use: `eas build:list` to see your builds

## Option 2: Local Build (Requires Android Studio)

### Prerequisites:
1. Install Java JDK 17 or higher
2. Install Android Studio
3. Set up Android SDK

### Steps:

1. **Install Java JDK**:
   ```bash
   # On macOS with Homebrew:
   brew install openjdk@17
   ```

2. **Set JAVA_HOME**:
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

3. **Build the APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Find the APK**:
   - The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

## Option 3: Using Expo Development Build

1. **Create development build**:
   ```bash
   eas build --platform android --profile development
   ```

2. **Install on device**:
   - Download and install the APK on your Android device

## Current Configuration

- **Package Name**: `com.kamwaalay.app`
- **Version**: `1.0.0`
- **Build Profile**: `preview` (generates APK)

## Notes

- The `eas.json` file is already configured for APK builds
- The `app.json` includes the Android package name
- For production builds, use: `eas build --platform android --profile production`

