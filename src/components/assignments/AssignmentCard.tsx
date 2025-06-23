import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Book, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssignmentCardProps {
  assignment: any;
  index: number;
  isStudent?: boolean;
  onToggleStatus?: (id: string, status: boolean) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ 
  assignment, 
  index,
  isStudent = false,
  onToggleStatus 
}) => {
  const handleToggle = () => {
    if (onToggleStatus) {
      onToggleStatus(assignment.id, !assignment.is_completed);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card
        className={`p-5 border-l-8 ${assignment.is_completed ? 'border-green-500 bg-green-50/60' : 'border-indigo-500 bg-white'} shadow-md rounded-2xl transition-all duration-200`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2 gap-2">
              <Book size={24} className="text-indigo-700" />
              <h3 className="font-extrabold text-indigo-900 text-xl truncate" title={assignment.books?.title || assignment.book_title || 'Genel Not'}>
                {assignment.books?.title || assignment.book_title || 'Genel Not'}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {assignment.note && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Not: {assignment.note}
                </span>
              )}
              {(assignment.books?.title || assignment.book_title) && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Sayfa: {assignment.page_start} - {assignment.page_end}
                </span>
              )}
              {assignment.time && (
                <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                  <Clock size={14} className="mr-1" /> {assignment.time}
                </span>
              )}
            </div>
            {!isStudent && assignment.students && (
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-700">Öğrenci:</span> {assignment.students.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end min-w-[120px]">            <div className="flex items-center gap-1 mb-1">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">{assignment.day}</span>
            </div>
            {assignment.is_completed ? (
              <button 
                onClick={handleToggle}
                className="inline-flex items-center text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-semibold mt-1 transition-colors cursor-pointer"
              >
                ✔ Tamamlandı
              </button>
            ) : (
              <button
                onClick={handleToggle}
                className="inline-flex items-center text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full text-xs font-semibold mt-1 transition-colors cursor-pointer"
              >
                ⏳ Bekliyor
              </button>
            )}
          </div>
        </div>        {isStudent && (
          <div className="mt-4">
            <Button
              variant={assignment.is_completed ? 'success' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleToggle}
              className="font-bold text-base py-2"
            >
              {assignment.is_completed ? 'Tamamlandı' : 'Tamamlandı Olarak İşaretle'}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              {assignment.is_completed
                ? 'Bu ödev tamamlandı olarak işaretlendi.'
                : 'Ödevi tamamladığınızda butona tıklayın.'}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AssignmentCard;