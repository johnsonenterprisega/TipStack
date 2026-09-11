import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../src/store/themeStore';
import { FONT_SIZES } from '../../src/theme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  activeColor: string;
}

function TabIcon({ emoji, label, focused, activeColor }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
      <Text style={[styles.label, focused && { color: activeColor, fontWeight: '800' }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" label="Calendar" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Analytics" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏆" label="Trophies" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} activeColor={colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  emojiActive: {
    opacity: 1,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: '#8B91A7',
    fontWeight: '500',
  },
});
