import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/AppHeader';
import { AuthSplash } from '@/components/AuthSplash';
import { TabGlyph } from '@/components/TabGlyph';
import { canViewReports } from '@/security/permissions';
import { colors, effects } from '@/theme';

export default function ReportingTabsLayout() {
  const { status, user } = useAuth();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 10);

  if (status === 'loading') {
    return <AuthSplash />;
  }

  if (status !== 'signedIn') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!canViewReports(user)) {
    return <Redirect href="/restricted" />;
  }

  return (
    <Tabs
      initialRouteName="tickets"
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.brand.ink,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarStyle: {
          height: 66 + safeBottom,
          paddingTop: 7,
          paddingBottom: safeBottom,
          borderTopWidth: 1,
          borderTopColor: colors.border.soft,
          backgroundColor: colors.surface.card,
          ...effects.soft,
        },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingTop: 2,
        },
        sceneStyle: {
          backgroundColor: colors.surface.page,
        },
      }}
    >
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Ticket Report',
          tabBarIcon: ({ focused }) => <TabGlyph kind="tickets" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="satisfaction"
        options={{
          title: 'Satisfaction',
          tabBarIcon: ({ focused }) => <TabGlyph kind="satisfaction" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rma"
        options={{
          title: 'RMA Report',
          tabBarIcon: ({ focused }) => <TabGlyph kind="rma" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
