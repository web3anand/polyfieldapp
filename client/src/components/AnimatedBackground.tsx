import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Reduced from 5 to 3 shapes for better performance
  const shapes = [
    { size: 60, x: 10, y: 15, delay: 0, duration: 25 },
    { size: 50, x: 85, y: 25, delay: 2, duration: 30 },
    { size: 45, x: 50, y: 70, delay: 1, duration: 28 },
  ];

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
        {shapes.map((shape, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
            }}
          >
            <svg
              width={shape.size}
              height={shape.size}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {index % 3 === 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#gradient1)"
                  strokeWidth="3"
                  fill="none"
                />
              )}
              {index % 3 === 1 && (
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="80"
                  stroke="url(#gradient2)"
                  strokeWidth="3"
                  fill="none"
                  rx="8"
                />
              )}
              {index % 3 === 2 && (
                <polygon
                  points="50,10 90,90 10,90"
                  stroke="url(#gradient3)"
                  strokeWidth="3"
                  fill="none"
                />
              )}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute will-change-transform"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: "linear",
          }}
        >
          <svg
            width={shape.size}
            height={shape.size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {index % 3 === 0 && (
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient1)"
                strokeWidth="3"
                fill="none"
              />
            )}
            {index % 3 === 1 && (
              <rect
                x="10"
                y="10"
                width="80"
                height="80"
                stroke="url(#gradient2)"
                strokeWidth="3"
                fill="none"
                rx="8"
              />
            )}
            {index % 3 === 2 && (
              <polygon
                points="50,10 90,90 10,90"
                stroke="url(#gradient3)"
                strokeWidth="3"
                fill="none"
              />
            )}
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}