import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Calendar, Clock, CheckCircle, Clock3, BookOpen, LayoutList, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssignmentCardProps {
  assignment: any;
  index: number;
  isStudent?: boolean;
  onToggleStatus?: (id: string, status: boolean) => void;
}

const AssignmentCardAlt: React.FC<AssignmentCardProps> = ({ 
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

  // Calculate progress for the visual indicator (if page range is provided)
  const totalPages = assignment.page_end - assignment.page_start + 1;
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="w-full"
    >
      <Card
        className={`overflow-visible ${assignment.is_completed ? 'bg-gradient-to-br from-green-50 to-teal-50' : 'bg-gradient-to-br from-white to-blue-50'} shadow hover:shadow-md transition-all duration-300 rounded-xl`}
      >        {/* Status badge positioned at the top-right corner - daha küçük */}
        <div className="relative">
          <div 
            className={`absolute -top-2 -right-2 z-10 px-2 py-1 rounded-full shadow-sm cursor-pointer
              ${assignment.is_completed 
                ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700' 
                : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:from-blue-500 hover:to-purple-600'}`}
            onClick={handleToggle}
          >
            <div className="flex items-center gap-0.5 text-xs font-medium">
              {assignment.is_completed 
                ? <><CheckCircle size={10} /> Tamamlandı</>
                : <><Clock3 size={10} /> Bekliyor</>
              }
            </div>
          </div>
        </div>

        {/* Main card content - daha kompakt */}
        <div className="px-4 pt-4 pb-3">
          {/* Header with book title and date */}
          <div className="flex flex-row items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className={`p-1.5 rounded-full ${assignment.is_completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <BookOpen size={14} className={assignment.is_completed ? 'text-green-600' : 'text-blue-600'} />
                </div>
                <h3 className="font-bold text-gray-800 text-base leading-tight truncate" title={assignment.books?.title || assignment.book_title}>
                  {assignment.books?.title || assignment.book_title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium shrink-0">
              <Calendar size={12} className="text-gray-500" />
              <span className={`${assignment.is_completed ? 'text-green-700' : 'text-blue-700'}`}>
                {assignment.day}
              </span>
            </div>
          </div>          {/* Assignment details - daha kompakt */}
          <div className="flex flex-col space-y-2 mb-2">
            {/* Pages section - daha küçük */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-1 rounded-md">
                <LayoutList size={12} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-gray-700">Sayfa: {assignment.page_start} - {assignment.page_end}</span>
                  <span className="text-[10px] text-gray-500">{totalPages} sayfa</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${assignment.is_completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: assignment.is_completed ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Notes section - daha küçük ve kompakt */}
            {assignment.note && (
              <div className="flex items-start gap-2">
                <div className="bg-yellow-100 p-1 rounded-md mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <div className="text-xs text-gray-700 flex-1">
                  <span className="font-medium text-gray-600">Not:</span>
                  <p className="text-gray-600 line-clamp-2">{assignment.note}</p>
                </div>
              </div>
            )}

            {/* Time section - daha küçük */}
            {assignment.time && (
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1 rounded-md">
                  <Clock size={12} className="text-purple-600" />
                </div>
                <div className="text-xs text-gray-700">
                  <span className="font-medium text-purple-700">{assignment.time}</span>
                </div>
              </div>
            )}            {/* Student name - daha küçük */}
            {!isStudent && assignment.students && (
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-1 rounded-md">
                  <User size={10} className="text-indigo-600" />
                </div>
                <span className="text-xs text-gray-700">
                  <span className="font-medium">Öğrenci:</span> {assignment.students.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action button for students - daha kompakt */}
        {isStudent && (
          <div className={`border-t ${assignment.is_completed ? 'border-green-200' : 'border-blue-200'} px-3 py-2`}>
            <Button
              variant={assignment.is_completed ? 'success' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleToggle}
              className="font-medium transition-all duration-300 text-xs"
            >
              {assignment.is_completed ? (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle size={12} />
                  <span>Tamamlandı</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle size={12} />
                  <span>Tamamlandı Olarak İşaretle</span>
                </div>
              )}
            </Button>
            
            <p className="text-[10px] text-center mt-1.5 text-gray-500">
              {assignment.is_completed
                ? 'Tamamlandı olarak işaretlendi'
                : 'Tamamladığınızda butona tıklayın'}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AssignmentCardAlt;
