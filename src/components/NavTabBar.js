import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

const TABS = [
  { name: 'Home',    label: 'Closet', icon: '🪞' },
  { name: 'AddItem', label: 'Add',    icon: '＋' },
  { name: 'Outfits', label: 'Looks',  icon: '✦'  },
];

export default function NavTabBar({ navigation, activeRoute }) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = activeRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => !isActive && navigation.navigate(tab.name)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.gold,
  },
  icon: { fontSize: 18, color: COLORS.textPrimary },
  iconActive: { color: COLORS.gold },
  label: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    letterSpacing: 0.8,
  },
  labelActive: { color: COLORS.gold },
});
