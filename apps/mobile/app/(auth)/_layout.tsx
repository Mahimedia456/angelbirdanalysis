import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { AuthSplash } from '@/components/AuthSplash';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthSplash />;
  }

  if (status === 'signedIn') {
    return <Redirect href="/(tabs)/tickets" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
