import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import Card from '../../components/ui/Card';
import { Book, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      const { error } = await supabase
        .from('assignments')
        .update({ is_completed: status })
        .eq('id', id);
      
      if (error) throw error;
      
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
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-center mb-8">
          <GraduationCap className="h-12 w-12 text-indigo-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Student Homework</h1>
        </div>
        
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            {student.name}
          </h2>
          {student.email && (
            <p className="text-gray-600 text-center">{student.email}</p>
          )}
        </Card>
        
        {days.length > 0 ? (
          <div className="space-y-8">
            {days.map((day, dayIndex) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1, duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                    <span className="text-indigo-600 font-bold">{day[0]}</span>
                  </span>
                  {day}
                </h2>
                <div className="space-y-4">
                  {assignmentsByDay[day].map((assignment, index) => (
                    <AssignmentCard 
                      key={assignment.id} 
                      assignment={assignment} 
                      index={index} 
                      isStudent={true}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <Book size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No assignments yet</h3>
            <p className="text-gray-600">You don't have any homework assignments</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;