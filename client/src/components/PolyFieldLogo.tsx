import { motion } from 'motion/react';

export function PolyFieldLogo({ size = 120 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Animated hexagon background */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <polygon
          points="60,10 100,35 100,85 60,110 20,85 20,35"
          fill="url(#logoGradient)"
          opacity="0.2"
          stroke="url(#logoGradient)"
          strokeWidth="2"
        />
      </motion.svg>

      {/* Main logo container */}
      <svg width={size} height={size} viewBox="0 0 120 120" className="relative z-10">
        <defs>
          <linearGradient id="pfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon frame */}
        <motion.polygon
          points="60,15 95,37.5 95,82.5 60,105 25,82.5 25,37.5"
          fill="none"
          stroke="url(#pfGradient)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Sport elements - Soccer ball pattern */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Pentagon center */}
          <polygon
            points="60,45 68,48 65,57 55,57 52,48"
            fill="#fff"
            stroke="#6366f1"
            strokeWidth="1.5"
          />
          
          {/* Hexagons around */}
          <path
            d="M 60,38 L 52,48 L 48,45 L 50,35 L 58,32 Z"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
          />
          <path
            d="M 68,48 L 72,45 L 82,48 L 80,58 L 72,60 L 65,57 Z"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
          />
          <path
            d="M 55,57 L 52,67 L 45,65 L 42,55 L 48,52 L 52,48 Z"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
          />
        </motion.g>

        {/* Letters P F */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          filter="url(#glow)"
        >
          {/* P */}
          <text
            x="35"
            y="85"
            fill="url(#pfGradient)"
            fontSize="32"
            fontFamily="Orbitron, sans-serif"
            fontWeight="900"
          >
            P
          </text>
          
          {/* F */}
          <text
            x="65"
            y="85"
            fill="url(#pfGradient)"
            fontSize="32"
            fontFamily="Orbitron, sans-serif"
            fontWeight="900"
          >
            F
          </text>
        </motion.g>

        {/* Animated dots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.circle
            key={i}
            cx={60 + Math.cos((i * Math.PI) / 3) * 45}
            cy={60 + Math.sin((i * Math.PI) / 3) * 45}
            r="2"
            fill="#6366f1"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{
              delay: 1.5 + i * 0.1,
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
