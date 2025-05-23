import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AssignmentCardWrapper from '../../components/assignments/AssignmentCardWrapper';
import ProgressSummary from '../../components/assignments/ProgressSummary';
import AssignmentCalendar from '../../components/assignments/AssignmentCalendar';
import { ArrowLeft, Book, Calendar, Clock, ClipboardList, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';

const ProgramDetailNew: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    programs, 
    programAssignments,
    fetchPrograms,
    fetchProgramAssignments,
    removeProgram
  } = useDataStore();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchPrograms(user.id);
    }
    
    if (programId) {
      fetchProgramAssignments(programId);
    }
  }, [user, programId, fetchPrograms, fetchProgramAssignments]);
  
  const program = programs.find(p => p.id === programId);
  
  const handleDelete = async () => {
    if (!programId) return;
    
    setIsDeleting(true);
    
    try {
      await removeProgram(programId);
      toast.success('Program başarıyla silindi');
      setIsDeleteModalOpen(false);
      navigate('/programs');
    } catch (error) {
      toast.error('Program silinemedi');
      setIsDeleting(false);
    }
  };
  
  const generateProgramLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/program/${programId}`;
  };
  
  const copyProgramLink = () => {
    const link = generateProgramLink();
    navigator.clipboard.writeText(link);
    toast.success('Program linki kopyalandı');
  };
  
  if (!program) return null;
  
  // Group assignments by day
  const assignmentsByDay: Record<string, any[]> = {};
  
  programAssignments.forEach(assignment => {
    if (!assignmentsByDay[assignment.day]) {
      assignmentsByDay[assignment.day] = [];
    }
    assignmentsByDay[assignment.day].push(assignment);
  });
  
  // Sort days
  const days = Object.keys(assignmentsByDay);
  const weekdayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  days.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
  
  // Calculate completion stats
  const totalAssignments = programAssignments.length;
  const completedAssignments = programAssignments.filter(a => a.is_completed).length;
  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  return (
    <div>
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={16} className="mr-1" />
        <span>Programlara Dön</span>
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ClipboardList size={24} className="mr-2 text-indigo-600" />
                  {program.title}
                </h1>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600 flex items-center">
                    <User size={16} className="mr-1" />
                    <span>Öğrenci: {program.studentName}</span>
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span>Oluşturulma: {new Date(program.created_at).toLocaleDateString('tr-TR')}</span>
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Clock size={16} className="mr-1" />
                    <span>Program Türü: {program.is_scheduled ? 'Saatli Program' : 'Saatsiz Program'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={copyProgramLink}
                  size="sm"
                >
                  Program Linkini Kopyala
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                  size="sm"
                >
                  <Trash2 size={16} className="mr-1" />
                  Programı Sil
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Genel İlerleme</span>
                <span className="font-medium text-gray-800">
                  {completedAssignments}/{totalAssignments} ({completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className={`h-2 rounded-full ${
                    completionPercentage === 100 
                      ? 'bg-green-500' 
                      : completionPercentage > 50 
                        ? 'bg-indigo-500'
                        : 'bg-yellow-500'
                  }`}
                ></motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* Calendar Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AssignmentCalendar 
            assignmentsByDay={assignmentsByDay}
            weekdayOrder={weekdayOrder}
          />
        </motion.div>

        {/* Detailed Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="lg:col-span-3 mb-6"
        >
          <ProgressSummary 
            totalAssignments={totalAssignments}
            completedAssignments={completedAssignments}
            className="bg-white shadow-md"
          />
        </motion.div>
        
        {/* Daily Assignments */}
        <div className="lg:col-span-3">
          {days.length > 0 ? (
            <div className="space-y-6">
              {days.map((day, dayIndex) => {
                const dayAssignments = assignmentsByDay[day];
                const completedCount = dayAssignments.filter(a => a.is_completed).length;
                const dayPercentage = Math.round((completedCount / dayAssignments.length) * 100);
                
                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.1, duration: 0.5 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                            <span className="text-indigo-600 font-bold">{day[0]}</span>
                          </div>
                          {day}
                        </h2>
                        <span className="text-sm text-gray-500">
                          {completedCount}/{dayAssignments.length} ({dayPercentage}%)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayAssignments.map((assignment, index) => (
                          <AssignmentCardWrapper
                            key={assignment.id} 
                            assignment={assignment} 
                            index={index}
                            variant="alternative" 
                          />
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <Book size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Bu programda ödev yok</h3>
              <p className="text-gray-600">Henüz ödev eklenmemiş</p>
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Programı Sil"
      >
        <div className="space-y-4">
          <p>
            <span className="font-semibold">{program.title}</span> programını silmek istediğinize emin misiniz?
          </p>
          <p className="text-red-600">Bu işlem geri alınamaz. Tüm ödevler de silinecektir.</p>
          
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProgramDetailNew;
