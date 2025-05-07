import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hoverable = false 
}) => {
  const baseStyle = 'bg-white rounded-lg shadow-md overflow-hidden';
  const hoverStyle = hoverable ? 'cursor-pointer transition-all duration-300' : '';
  
  if (onClick) {
    return (
      <motion.div
        className={`${baseStyle} ${hoverStyle} ${className}`}
        onClick={onClick}
        whileHover={{ scale: hoverable ? 1.02 : 1 }}
        whileTap={{ scale: hoverable ? 0.98 : 1 }}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={`${baseStyle} ${className}`}>
      {children}
    </div>
  );
};

export default Card;