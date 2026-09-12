import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { AuthSplash } from '@/components/AuthSplash';
import { canViewReports } from '@/security/permissions';

export default function Index() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <AuthSplash />;
  }

  if (status !== 'signedIn') return <Redirect href="/(auth)/login" />;
  return canViewReports(user) ? <Redirect href="/(tabs)/tickets" /> : <Redirect href="/restricted" />;
}
