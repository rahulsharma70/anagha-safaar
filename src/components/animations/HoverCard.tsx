// src/components/animations/HoverCard.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  rotate?: number;
}

export const HoverCard = ({ 
  children, 
  className = '',
  scale = 1.05,
  rotate = 0
}: HoverCardProps) => {
  return (
    <motion.div
      whileHover={{ 
        scale, 
        rotate,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
