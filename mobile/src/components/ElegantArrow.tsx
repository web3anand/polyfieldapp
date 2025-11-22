import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Direction = 'up-right' | 'down-right' | 'up' | 'down';

interface ElegantArrowProps {
  direction?: Direction;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
  opacity?: number;
}

export default function ElegantArrow({
  direction = 'up-right',
  size = 20,
  color = '#10B981',
  strokeWidth = 2,
  style,
  opacity = 1,
}: ElegantArrowProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  const renderPaths = () => {
    switch (direction) {
      case 'up-right':
        return (
          <>
            <Path d="M6 18 L18 6" {...common} />
            <Path d="M12 6 H18 M18 6 V12" {...common} />
          </>
        );
      case 'down-right':
        return (
          <>
            <Path d="M6 6 L18 18" {...common} />
            <Path d="M12 18 H18 M18 12 V18" {...common} />
          </>
        );
      case 'up':
        return (
          <>
            <Path d="M12 18 L12 6" {...common} />
            <Path d="M8 10 L12 6 L16 10" {...common} />
          </>
        );
      case 'down':
        return (
          <>
            <Path d="M12 6 L12 18" {...common} />
            <Path d="M8 14 L12 18 L16 14" {...common} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ opacity }, style] as any}>
      {renderPaths()}
    </Svg>
  );
}
