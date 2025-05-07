import React from 'react';
import Card from '../ui/Card';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  color,
  delay = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className="transform transition-transform duration-200 hover:scale-105"
    >
      <Card className="p-4 bg-gradient-to-br from-indigo-500 via-blue-400 to-green-400 shadow-lg">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color} text-white shadow-lg border-2 border-white/30`}> 
            <Icon size={24} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-bold text-white drop-shadow">{title}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
              className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide"
            >
              {value}
            </motion.p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;