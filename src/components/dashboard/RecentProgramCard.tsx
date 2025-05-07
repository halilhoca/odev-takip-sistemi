import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Calendar, Check, X } from 'lucide-react';
import { Program } from '../../types';
import { motion } from 'framer-motion';

interface RecentProgramCardProps {
  program: Program & {
    assignments: {
      id: string;
      is_completed: boolean;
      students: {
        name: string;
      };
    }[];
  };
  index: number;
}

const RecentProgramCard: React.FC<RecentProgramCardProps> = ({ program, index }) => {
  // Calculate completion percentage
  const totalAssignments = program.assignments?.length || 0;
  const completedAssignments = program.assignments?.filter(a => a.is_completed)?.length || 0;
  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  const students = Array.from(new Set(program.assignments?.map(a => a.students.name) || []));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/programs/${program.id}`}>
        <Card hoverable className="p-4 h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">{program.title}</h3>
            <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
              {program.is_scheduled ? 'Scheduled' : 'Unscheduled'}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar size={16} className="mr-1" />
            <span>{new Date(program.created_at).toLocaleDateString()}</span>
          </div>
          
          {students.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Students:</p>
              <div className="flex flex-wrap gap-1">
                {students.map((student, i) => (
                  <span 
                    key={i} 
                    className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded-full"
                  >
                    {student}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Completion</span>
              <span className="font-medium text-gray-800">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                className={`h-2 rounded-full ${completionPercentage === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              ></motion.div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center">
            <div className="flex items-center text-green-500 mr-3">
              <Check size={16} className="mr-1" />
              <span className="text-xs">{completedAssignments}</span>
            </div>
            <div className="flex items-center text-red-500">
              <X size={16} className="mr-1" />
              <span className="text-xs">{totalAssignments - completedAssignments}</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default RecentProgramCard;