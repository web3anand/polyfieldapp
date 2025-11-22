import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export interface AnimatedNumberOptions {
  duration?: number;
  easing?: (value: number) => number;
  fractionDigits?: number;
}

/**
 * Smoothly animates a number from its previous value to the target.
 * Returns a display number that updates over time without rerendering the whole screen.
 */
export function useAnimatedNumber(target: number, options: AnimatedNumberOptions = {}) {
  const { duration = 300, easing = Easing.out(Easing.cubic), fractionDigits = 1 } = options;
  const anim = useRef(new Animated.Value(0)).current;
  const prev = useRef(target);
  const [display, setDisplay] = useState(target);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;

    // Cancel any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    anim.setValue(0);
    const id = anim.addListener(({ value }) => {
      const interpolated = from + (to - from) * value;
      setDisplay(Number(interpolated.toFixed(fractionDigits)));
    });

    animationRef.current = Animated.timing(anim, {
      toValue: 1,
      duration,
      easing,
      useNativeDriver: false,
    });

    animationRef.current.start(() => {
      anim.removeListener(id);
      setDisplay(Number(to.toFixed(fractionDigits)));
      prev.current = to;
      animationRef.current = null;
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      anim.removeListener(id);
    };
  }, [target, duration, easing, fractionDigits]);

  return display;
}
