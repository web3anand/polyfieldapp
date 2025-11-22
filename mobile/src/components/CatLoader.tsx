import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';

// CatLoader: Simple animated loader
export default function CatLoader({ label = 'LOADING...' }: { label?: string }) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.dots, { opacity: fadeAnim }]}>•••</Animated.Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  dots: {
    fontSize: 48,
    color: '#6366f1',
    marginBottom: 16,
    letterSpacing: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#666',
    marginTop: 8,
  },
});
