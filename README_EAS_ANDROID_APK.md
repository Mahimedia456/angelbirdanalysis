# AngelBird Android APK via EAS

Merge this ZIP into the root of the current AngelBird project.

Run:

```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\BUILD-ANGELBIRD-ANDROID-APK-EAS.ps1
```

The script:
1. installs mobile dependencies
2. checks Expo SDK dependency alignment
3. runs TypeScript
4. runs Expo Doctor
5. checks EAS login
6. preserves existing eas.json and adds an `apk` profile
7. checks EAS project linking
8. starts an EAS cloud Android APK build and waits for completion

If the project is not linked yet, run this once:

```powershell
cd D:\angelbird-analytics\apps\mobile
npx eas-cli@latest init
```

Then rerun the build script.

APK build profile:

```json
{
  "build": {
    "apk": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```
