import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/AppHeader';
import { AuthSplash } from '@/components/AuthSplash';
import { TabGlyph } from '@/components/TabGlyph';
import { canViewReports } from '@/security/permissions';
import { colors, effects } from '@/theme';

export default function ReportingTabsLayout() {
  const { status, user } = useAuth();

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
        },
        tabBarStyle: {
          height: 78,
          paddingTop: 7,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border.soft,
          backgroundColor: colors.surface.card,
          ...effects.soft,
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
