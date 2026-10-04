import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[
          styles.label,
          focused && { color: activeColor, fontWeight: '800' },
        ]}
      >
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
    height: Platform.OS === 'ios' ? 84 : 66,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    gap: 2,
  },
  emoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  emojiActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  label: {
    fontSize: 10.5,
    color: '#8B91A7',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});
