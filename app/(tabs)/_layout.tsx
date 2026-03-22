import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function TabIcon({
  name, focusedName, color, focused, primaryMuted,
}: {
  name: any; focusedName: any; color: string; focused: boolean; primaryMuted: string;
}) {
  return (
    <View style={{
      width: 34, height: 34, justifyContent: 'center', alignItems: 'center',
      backgroundColor: focused ? primaryMuted : 'transparent',
      borderRadius: 10,
    }}>
      <Ionicons name={focused ? focusedName : name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="list-outline" focusedName="list" color={color} focused={focused} primaryMuted={theme.primaryMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-outline" focusedName="calendar" color={color} focused={focused} primaryMuted={theme.primaryMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" focusedName="person" color={color} focused={focused} primaryMuted={theme.primaryMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings-outline" focusedName="settings" color={color} focused={focused} primaryMuted={theme.primaryMuted} />
          ),
        }}
      />
    </Tabs>
  );
}
