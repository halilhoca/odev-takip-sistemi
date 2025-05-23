import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, X, Clock } from 'lucide-react';

interface AssignmentCalendarProps {
  assignmentsByDay: Record<string, any[]>;
  weekdayOrder: string[];
  className?: string;
}

const AssignmentCalendar: React.FC<AssignmentCalendarProps> = ({
  assignmentsByDay,
  weekdayOrder,
  className = ''
}) => {
  const days = Object.keys(assignmentsByDay);
  
  // Sort days based on weekday order
  days.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
  
  // Get day stats
  const getDayStats = (day: string) => {
    const assignments = assignmentsByDay[day];
    const total = assignments.length;
    const completed = assignments.filter(a => a.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };
  
  // Get status color based on completion percentage
  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };
  
  return (
    <div className={`bg-white rounded-xl p-4 shadow-md ${className}`}>
      <div className="flex items-center mb-3">
        <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
        <h3 className="font-semibold text-gray-800">Haftalık Ödev Durumu</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {/* Calendar headers */}
        {weekdayOrder.map((day, i) => (
          <div key={`header-${i}`} className="text-center text-xs font-medium text-gray-500">
            {day.substring(0, 3)}
          </div>
        ))}
        
        {/* Calendar cells */}
        {weekdayOrder.map((day, i) => {
          const hasAssignments = days.includes(day);
          const { total, completed, percentage } = hasAssignments ? getDayStats(day) : { total: 0, completed: 0, percentage: 0 };
          
          return (
            <motion.div 
              key={`cell-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`aspect-square rounded-lg shadow-sm flex flex-col items-center justify-center ${
                hasAssignments ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {hasAssignments ? (
                <>
                  <div className="h-2 w-full px-2 mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${getStatusColor(percentage)}`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700">{total} ödev</span>
                  <div className="flex mt-1 gap-1">
                    <div className="flex items-center">
                      <Check size={10} className="text-green-500" />
                      <span className="text-[9px] text-green-700">{completed}</span>
                    </div>
                    <div className="flex items-center">
                      <X size={10} className="text-red-500" />
                      <span className="text-[9px] text-red-700">{total - completed}</span>
                    </div>
                  </div>
                </>
              ) : (
                <Clock size={16} className="text-gray-300" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentCalendar;
