# AngelBird Mobile Expo SDK 57 Dependency Hotfix

Mobile-only dependency alignment patch.

Updated:
- expo: 57.0.23
- expo-background-task: ~57.0.18
- expo-task-manager: ~57.0.18
- app package version: 0.15.1

No web or backend files are included.

Run from project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\FIX-EXPO-SDK57-DEPS.ps1
```

Then optionally:

```powershell
.\VERIFY-MOBILE-EXPO-SDK57-HOTFIX.ps1
```
