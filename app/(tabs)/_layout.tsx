import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
              backgroundColor: focused ? Colors.primaryMuted : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
              backgroundColor: focused ? Colors.primaryMuted : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
              backgroundColor: focused ? Colors.primaryMuted : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
