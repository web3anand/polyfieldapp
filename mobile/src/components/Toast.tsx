import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastProps extends ToastConfig {
  onDismiss: (id: string) => void;
  index: number;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  action,
  onDismiss,
  index,
}) => {
  const { colors, mode } = useThemeContext();
  const isDark = mode === 'dark';
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: index * 70 + 50, // Stack toasts with 70px spacing, 50px from top
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [index]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          // Swipe threshold reached - dismiss
          handleDismiss();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: colors.success,
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
          border: colors.success,
        };
      case 'error':
        return {
          icon: colors.error,
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          border: colors.error,
        };
      case 'warning':
        return {
          icon: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
          border: '#F59E0B',
        };
      case 'info':
        return {
          icon: '#3B82F6',
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          border: '#3B82F6',
        };
    }
  };

  const toastColors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: toastColors.border,
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={20} color={toastColors.icon} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {action && (
        <TouchableOpacity
          style={[styles.actionButton, { borderTopColor: colors.border }]}
          onPress={() => {
            action.onPress();
            handleDismiss();
          }}
        >
          <Text style={[styles.actionText, { color: toastColors.icon }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Colored indicator bar */}
      <View style={[styles.indicator, { backgroundColor: toastColors.border }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    width: SCREEN_WIDTH - 24,
    maxWidth: 380,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    paddingRight: 10,
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
    lineHeight: 17,
  },
  message: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  closeButton: {
    padding: 2,
    marginTop: 2,
  },
  actionButton: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});

export default Toast;
