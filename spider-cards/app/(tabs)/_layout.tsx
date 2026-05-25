import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { font, palette } from '../../src/lib/theme';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 20,
        color: focused ? palette.aetherGold : palette.parchment,
        opacity: focused ? 1 : 0.9,
      }}
    >
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.aetherGold,
        tabBarInactiveTintColor: palette.parchment,
        tabBarStyle: {
          backgroundColor: palette.voidBlack,
          borderTopColor: palette.fog,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: font.title,
          fontWeight: '800',
          letterSpacing: 2,
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'CAPTURE',
          tabBarIcon: ({ focused }) => <TabIcon glyph="✺" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'BESTIARY',
          tabBarIcon: ({ focused }) => <TabIcon glyph="❦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'HUNT',
          tabBarIcon: ({ focused }) => <TabIcon glyph="✦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'WANDERER',
          tabBarIcon: ({ focused }) => <TabIcon glyph="◈" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
