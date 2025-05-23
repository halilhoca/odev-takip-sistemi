import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updatePublicAssignmentStatus } from '../../lib/publicSupabase';
import AssignmentCardWrapper from '../../components/assignments/AssignmentCardWrapper';
import ProgressSummary from '../../components/assignments/ProgressSummary';
import Card from '../../components/ui/Card';
import { Book, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Yapılanlar ve Yapılmayanlar filtresi için state
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      
      setLoading(true);
      
      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (studentError) throw studentError;
        
        // Fetch assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            books (title),
            programs (title, is_scheduled)
          `)
          .eq('student_id', studentId)
          .order('day');
        
        if (assignmentsError) throw assignmentsError;
        
        setStudent(studentData);
        setAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);
  
  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      // Try to use authenticated Supabase client first
      let error;
      try {
        const result = await supabase
          .from('assignments')
          .update({ is_completed: status })
          .eq('id', id);
        error = result.error;
      } catch (e) {
        error = e;
      }
      
      // If there's an error (likely permission error), fall back to public client
      if (error) {
        const { error: publicError } = await updatePublicAssignmentStatus(id, status);
        if (publicError) throw publicError;
      }
      
      // Update local state
      setAssignments(
        assignments.map(assignment => 
          assignment.id === id 
            ? { ...assignment, is_completed: status } 
            : assignment
        )
      );
      
      toast.success(status ? 'Marked as completed!' : 'Marked as not completed');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  
  // Group assignments by day
  const assignmentsByDay: Record<string, any[]> = {};
  
  assignments.forEach(assignment => {
    if (!assignmentsByDay[assignment.day]) {
      assignmentsByDay[assignment.day] = [];
    }
    
    assignmentsByDay[assignment.day].push(assignment);
  });
  
  // Sort days
  const days = Object.keys(assignmentsByDay);
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  days.sort((a, b) => {
    return weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b);
  });
  
  // Calculate completion stats for progress summary
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.is_completed).length;
  
  // Filtrelenmiş ödevleri elde et
  const getFilteredAssignments = (dayAssignments: any[]) => {
    if (filterStatus === 'completed') {
      return dayAssignments.filter(a => a.is_completed);
    } else if (filterStatus === 'incomplete') {
      return dayAssignments.filter(a => !a.is_completed);
    }
    return dayAssignments;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Student Not Found</h1>
          <p className="text-gray-600">The student you're looking for doesn't exist or has been removed.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-center mb-4">
          <GraduationCap className="h-8 w-8 text-indigo-600 mr-1.5" />
          <h1 className="text-2xl font-bold text-gray-900">Öğrenci Ödevleri</h1>
        </div>
        
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-0.5">
            {student.name}
          </h2>
          {student.email && (
            <p className="text-sm text-gray-600 text-center">{student.email}</p>
          )}
        </Card>
        
        {/* Add progress summary here */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-5"
        >
          <ProgressSummary 
            totalAssignments={totalAssignments}
            completedAssignments={completedAssignments}
            className="bg-white shadow-md"
          />
        </motion.div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full shadow-md p-1 flex">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === 'completed' 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Yapılanlar
            </button>
            <button
              onClick={() => setFilterStatus('incomplete')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === 'incomplete' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Yapılmayanlar
            </button>
          </div>
        </div>
        
        {days.length > 0 ? (
          <div className="space-y-4">
            {days.map((day, dayIndex) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1, duration: 0.5 }}
              >
                <h2 className="text-base font-semibold mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-1.5">
                      <span className="text-indigo-600 font-bold text-xs">{day[0]}</span>
                    </span>
                    {day}
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                      filterStatus === 'all' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : filterStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {getFilteredAssignments(assignmentsByDay[day]).length} ödev
                    </span>
                  </div>
                </h2>
                <div className="space-y-2">
                  {getFilteredAssignments(assignmentsByDay[day]).map((assignment, index) => (
                    <AssignmentCardWrapper
                      key={assignment.id} 
                      assignment={assignment} 
                      index={index} 
                      isStudent={true}
                      variant="alternative"
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                {/* Filtreye göre ödev yoksa göster */}
                {getFilteredAssignments(assignmentsByDay[day]).length === 0 && (
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center mb-4">
                    {filterStatus === 'all' ? (
                      <>
                        <p className="text-sm font-medium text-gray-600">Bu gün için ödev bulunmuyor</p>
                      </>
                    ) : filterStatus === 'completed' ? (
                      <>
                        <p className="text-sm font-medium text-gray-600">Bu gün için tamamlanan ödev yok</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-600">Bu gün için tamamlanmamış ödev yok</p>
                      </>
                    )}
                  </div>
                )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-5 rounded-lg shadow-sm text-center">
            <Book size={36} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Ödev yok</h3>
            <p className="text-sm text-gray-600">Henüz hiç ev ödevi atanmamış</p>
          </div>
        )}
        
        {/* Filtre seçiliyken gösterilecek ödev yoksa */}
        {days.length > 0 && Object.keys(assignmentsByDay).every(day => getFilteredAssignments(assignmentsByDay[day]).length === 0) && (
          <div className="bg-white p-5 rounded-lg shadow-sm text-center mt-4">
            <Book size={24} className="mx-auto text-gray-400 mb-2" />
            {filterStatus === 'all' ? (
              <>
                <h3 className="text-base font-medium text-gray-800 mb-1">Ödev bulunmuyor</h3>
                <p className="text-sm text-gray-500">Henüz hiç ödev atanmamış</p>
              </>
            ) : filterStatus === 'completed' ? (
              <>
                <h3 className="text-base font-medium text-gray-800 mb-1">Tamamlanmış ödev yok</h3>
                <p className="text-sm text-gray-500">Henüz hiç ödev tamamlanmamış</p>
              </>
            ) : (
              <>
                <h3 className="text-base font-medium text-gray-800 mb-1">Tamamlanmamış ödev yok</h3>
                <p className="text-sm text-gray-500">Tüm ödevler tamamlanmış, tebrikler!</p>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;