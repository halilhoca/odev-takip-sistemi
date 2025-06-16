import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Program } from '../../types';
import { Calendar, ClipboardList, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgramCardProps {
  program: Program;
  index: number;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, index }) => {
  const programDate = program.date?.toDate ? program.date.toDate() : new Date();
  const dateStr = programDate.toLocaleDateString('tr-TR');

  // Yeni: assignments üzerinden ilerleme hesapla
  const totalAssignments = program.assignments?.length || 0;
  const completedAssignments = program.assignments?.filter((a: any) => a.is_completed)?.length || 0;
  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/programs/${program.id}`}>
        <Card hoverable className="p-4 h-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <ClipboardList size={20} className="text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">{program.title}</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${program.is_scheduled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {program.is_scheduled ? (
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  Saatli
                </div>
              ) : 'Saatsiz'}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Calendar size={16} className="mr-1" />
            <span>{dateStr}</span>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">İlerleme</span>
              <span className="font-medium text-gray-800">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                className={`h-2 rounded-full ${
                  completionPercentage === 100 
                    ? 'bg-green-500' 
                    : completionPercentage > 50 
                      ? 'bg-indigo-500'
                      : 'bg-yellow-500'
                }`}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{completedAssignments} tamamlandı</span>
              <span>{totalAssignments} ödev</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default ProgramCard;