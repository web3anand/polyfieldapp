import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ElegantArrow from './ElegantArrow';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeContext';

// A pill-style bottom navigation bar inspired by the Radix navigation menu styling
export default function CustomBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Math.max(insets.bottom - 6, 6),
        backgroundColor: colors.tabBarBackground,
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
      },
    ]}>      
      <View style={styles.inner}>        
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Skip rendering if tabBarButton returns null (hidden from tab bar)
          if (typeof options.tabBarButton === 'function') {
            const buttonResult = options.tabBarButton({ children: null } as any);
            if (buttonResult === null) {
              return null;
            }
          }
          
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          // Icon mapping (extend as needed)
          const iconName: keyof typeof Ionicons.glyphMap = isFocused
            ? route.name === 'Portfolio'
              ? 'wallet'
              : route.name === 'Profile'
              ? 'person'
              : 'ellipse'
            : route.name === 'Portfolio'
            ? 'wallet-outline'
            : route.name === 'Profile'
            ? 'person-outline'
            : 'ellipse-outline';

          const labelText = typeof label === 'string' ? label : route.name;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton, 
                isFocused && { backgroundColor: colors.primary }
              ]}
              key={route.key}
              activeOpacity={0.85}
            >
              {route.name === 'Markets' ? (
                <ElegantArrow
                  direction="up-right"
                  size={20}
                  color={isFocused ? '#fff' : colors.textTertiary}
                  opacity={isFocused ? 1 : 0.7}
                />
              ) : (
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? '#fff' : colors.textTertiary}
                />
              )}
              <Text style={[
                styles.label, 
                { color: isFocused ? '#fff' : colors.textTertiary }
              ]}>{labelText}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 6,
  },
});
