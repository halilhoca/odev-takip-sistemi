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
      <Card className={`p-4 border-l-4 ${assignment.is_completed ? 'border-green-500' : 'border-indigo-500'}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center mb-2">
              <Book size={18} className="text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">
                {assignment.books?.title || assignment.book_title}
              </h3>
            </div>
            
            {!isStudent && assignment.students && (
              <p className="text-sm text-gray-600 mb-2">
                Student: <span className="font-medium">{assignment.students.name}</span>
              </p>
            )}
            
            <p className="text-sm text-gray-600">
              {assignment.note
                ? assignment.note
                : `Sayfa: ${assignment.page_start} - ${assignment.page_end}`}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center justify-end mb-1">
              <Calendar size={16} className="text-gray-500 mr-1" />
              <span className="text-sm text-gray-600">{assignment.day}</span>
            </div>
            
            {assignment.time && (
              <div className="flex items-center justify-end">
                <Clock size={16} className="text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{assignment.time}</span>
              </div>
            )}
          </div>
        </div>
        
        {isStudent && (
          <div className="mt-3">
            <Button
              variant={assignment.is_completed ? 'success' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleToggle}
            >
              {assignment.is_completed ? 'Tamamlandı' : 'Tamamlandı Olarak İşaretle'}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AssignmentCard;