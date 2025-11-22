import { motion } from 'motion/react';

export function AnimatedChart() {
  const bars = [65, 45, 80, 55, 70, 60, 85];
  
  return (
    <div className="w-full h-24 flex items-end gap-2 px-4">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="flex-1 bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg relative overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            ease: "easeOut",
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.1 + 1,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
