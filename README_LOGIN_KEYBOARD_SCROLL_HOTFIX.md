# AngelBird Mobile — Login Keyboard Scroll Hotfix

Mobile-only patch. Web/backend/reporting logic is untouched.

Changes in `apps/mobile/app/(auth)/login.tsx`:
- Android KeyboardAvoidingView uses `height` behavior while keyboard is open.
- iOS continues to use `padding` and now uses automatic keyboard insets.
- Login ScrollView stays vertically scrollable with the keyboard open.
- Dragging the form can dismiss the keyboard.
- Sign-in controls remain reachable on small screens.

The existing `android.softwareKeyboardLayoutMode = resize` config from the current mobile checkpoint should remain unchanged.
