/**
 * PixelLoadingBar Component
 * Retro 8-bit style loading bar with chunky pixel blocks
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeContext } from '../theme/ThemeContext';

interface PixelLoadingBarProps {
  loading?: boolean;
  progress?: number; // 0-100
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function PixelLoadingBar({
  loading = true,
  progress,
  height = 32,
  showLabel = false,
  label = 'LOADING...',
}: PixelLoadingBarProps) {
  const { colors } = useThemeContext();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading && progress === undefined) {
      // Indeterminate loading - animate back and forth
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedProgress, {
            toValue: 100,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(animatedProgress, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Pulse animation for glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else if (progress !== undefined) {
      // Determinate loading - animate to specific progress
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [loading, progress]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (!loading && progress === undefined) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={[styles.barContainer, { height, backgroundColor: colors.surfaceSecondary }]}>
        {/* Pixel border effect */}
        <View style={styles.borderTop} />
        <View style={styles.borderBottom} />
        <View style={styles.borderLeft} />
        <View style={styles.borderRight} />

        {/* Progress fill with pixel blocks */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              backgroundColor: '#10b981',
            },
          ]}
        >
          {/* Pixel pattern overlay */}
          <View style={styles.pixelPattern}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pixelBlock,
                  {
                    backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  },
                ]}
              />
            ))}
          </View>

          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        </Animated.View>

        {/* Percentage text (optional) */}
        {progress !== undefined && (
          <View style={styles.percentageContainer}>
            <Text style={styles.percentage}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  barContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    // Pixel border
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 4,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  borderLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  borderRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  fill: {
    height: '100%',
    position: 'relative',
  },
  pixelPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  pixelBlock: {
    flex: 1,
    height: '100%',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
