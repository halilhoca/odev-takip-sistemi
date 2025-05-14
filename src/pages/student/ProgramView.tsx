import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import Card from '../../components/ui/Card';
import { Book, Calendar, Check, ClipboardList, User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProgramView: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  
  const [program, setProgram] = useState<any>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      
      setLoading(true);
      
      try {
        // First fetch assignments to get student info
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            books (title),
            students (name)
          `)
          .eq('program_id', programId)
          .order('day');
        
        if (assignmentsError) throw assignmentsError;
        
        if (!assignmentsData || assignmentsData.length === 0) {
          throw new Error('Program not found');
        }
        
        // Then fetch program details
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('*')
          .eq('id', programId)
          .single();
        
        if (programError) throw programError;
        
        setProgram(programData);
        setStudentName(assignmentsData[0].students.name);
        setAssignments(assignmentsData);
        
        // Subscribe to real-time updates
        const subscription = supabase
          .channel('assignments-channel')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'assignments',
              filter: `program_id=eq.${programId}`
            },
            (payload) => {
              setAssignments(current =>
                current.map(assignment =>
                  assignment.id === payload.new.id
                    ? { ...assignment, ...payload.new }
                    : assignment
                )
              );
              
              const isCompleted = payload.new.is_completed;
              toast.success(
                isCompleted ? 'Ödev tamamlandı! ✅' : 'Ödev tamamlanmadı olarak işaretlendi ❌',
                { duration: 3000 }
              );
            }
          )
          .subscribe();
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [programId]);
  
  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_completed: status })
        .eq('id', id);
      if (error) throw error;
      // Local state'i anında güncelle
      setAssignments(current =>
        current.map(assignment =>
          assignment.id === id
            ? { ...assignment, is_completed: status }
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum güncellenirken bir hata oluştu');
    }
  };
  
  // Group assignments by completion status and day
  const completedAssignments = assignments.filter(a => a.is_completed);
  const incompleteAssignments = assignments.filter(a => !a.is_completed);
  
  // Group assignments by day within each section
  const groupByDay = (assignments: any[]) => {
    const grouped: Record<string, any[]> = {};
    assignments.forEach(assignment => {
      if (!grouped[assignment.day]) {
        grouped[assignment.day] = [];
      }
      grouped[assignment.day].push(assignment);
    });
    return grouped;
  };
  
  const completedByDay = groupByDay(completedAssignments);
  const incompleteByDay = groupByDay(incompleteAssignments);
  
  // Sort days
  const weekdayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const sortDays = (days: string[]) => {
    return days.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
  };

  // Gün sekmesi için state
  const allDays = Array.from(new Set(assignments.map(a => a.day))).sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
  const [selectedDay, setSelectedDay] = useState<string>(allDays[0] || '');

  // Seçili güne göre ödevleri filtrele
  const dayAssignments = assignments.filter(a => a.day === selectedDay);
  const completedDayAssignments = dayAssignments.filter(a => a.is_completed);
  const incompleteDayAssignments = dayAssignments.filter(a => !a.is_completed);

  // Gün renkleri (program oluşturma ile aynı)
  const dayColors: Record<string, string> = {
    Pazartesi: 'bg-blue-500 hover:bg-blue-600',
    Salı: 'bg-purple-500 hover:bg-purple-600',
    Çarşamba: 'bg-green-500 hover:bg-green-600',
    Perşembe: 'bg-yellow-500 hover:bg-yellow-600',
    Cuma: 'bg-pink-500 hover:bg-pink-600',
    Cumartesi: 'bg-indigo-500 hover:bg-indigo-600',
    Pazar: 'bg-red-500 hover:bg-red-600',
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Program Bulunamadı</h1>
          <p className="text-gray-600">Aradığınız program mevcut değil veya kaldırılmış.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-6 px-3 sm:py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Üst Bilgi Kartı */}
        <Card className="p-5 mb-6 border-none bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-lg flex items-center justify-center border-2 border-white/30">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-md">{program.title}</h1>
                <div className="flex items-center flex-wrap gap-3 mt-1 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="opacity-80" />
                    {new Date(program.created_at).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={16} className="opacity-80" />
                    {studentName}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <span className="text-lg font-bold">
                {assignments.length > 0 ? Math.round((completedAssignments.length / assignments.length) * 100) : 0}% Tamamlandı
              </span>
              <div className="w-56 h-4 bg-black/10 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0}%` }}
                  transition={{ duration: 0.7 }}
                  className={`h-4 rounded-full bg-gradient-to-r from-green-300 to-emerald-400 shadow-lg`}
                ></motion.div>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="flex items-center text-xs font-medium bg-white/20 px-3 py-1 rounded-full">
                  <Check size={14} className="mr-1" />{completedAssignments.length} tamamlandı
                </span>
                <span className="flex items-center text-xs font-medium bg-red-500/20 px-3 py-1 rounded-full">
                  <X size={14} className="mr-1" />{incompleteAssignments.length} kaldı
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Günler - Büyük ve renkli butonlar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7 sm:gap-6 w-full mb-8">
          {allDays.map((day, index) => (
            <motion.button
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedDay(day)}
              className={`
                p-4 sm:p-6 rounded-xl shadow text-white font-medium transition-all duration-200
                ${(dayColors as Record<string, string>)[day]}
                ${selectedDay === day ? 'ring-2 sm:ring-4 ring-offset-2 ring-offset-gray-50 scale-105' : ''}
                text-base sm:text-lg
              `}
              style={{ minWidth: 120 }}
            >
              <span className="block text-lg font-bold">{day}</span>
              <span className="block text-sm mt-1">
                {assignments.filter(a => a.day === day).length} ödev
              </span>
            </motion.button>
          ))}
        </div>
        
        {/* Seçili günün ödevleri */}
        <div className="grid grid-cols-1 gap-4">
          {/* Tamamlanmamış ödevler */}
          {incompleteDayAssignments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 border-l-4 border-red-400 bg-gradient-to-br from-red-50 to-white shadow-md">
                <h3 className="text-base font-semibold mb-3 flex items-center text-red-600">
                  <X size={18} className="mr-2" />Tamamlanmamış Ödevler
                </h3>
                <div className="space-y-2">
                  {incompleteDayAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer hover:bg-white hover:shadow-lg rounded-lg transition-all transform hover:scale-102 border border-gray-200 hover:border-red-200"
                      onClick={() => handleToggleStatus(assignment.id, true)}
                    >
                      <AssignmentCard
                        assignment={assignment}
                        index={index}
                        isStudent={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* Tamamlanan ödevler */}
          {completedDayAssignments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-4 border-l-4 border-green-400 bg-gradient-to-br from-green-50 to-white shadow-md">
                <h3 className="text-base font-semibold mb-3 flex items-center text-green-600">
                  <Check size={18} className="mr-2" />Tamamlanan Ödevler
                </h3>
                <div className="space-y-2">
                  {completedDayAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer hover:bg-white hover:shadow-lg rounded-lg transition-all transform hover:scale-102 border border-gray-200 hover:border-green-200"
                      onClick={() => handleToggleStatus(assignment.id, false)}
                    >
                      <AssignmentCard
                        assignment={assignment}
                        index={index}
                        isStudent={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* Ödev yoksa */}
          {incompleteDayAssignments.length === 0 && completedDayAssignments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 text-center text-gray-500 bg-gray-50 border-dashed border-2 border-gray-200 shadow-inner">
                <Book size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-lg font-medium">Bu gün için ödev bulunmuyor</p>
                <p className="text-sm text-gray-400 mt-1">Başka bir günü seçmeyi deneyin</p>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Motivasyon mesajı */}
        {completedDayAssignments.length > 0 && incompleteDayAssignments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <div className="inline-block bg-gradient-to-r from-green-500 to-teal-400 px-4 py-2 rounded-full text-white font-bold shadow-lg">
              🎉 Tebrikler! Bu gün için tüm ödevlerinizi tamamladınız. 🎉
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProgramView;