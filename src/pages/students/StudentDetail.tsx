import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import BookCard from '../../components/books/BookCard';
import { ArrowLeft, Book, ClipboardList, Trash2, User, Calendar, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    students, 
    books,
    studentBooks,
    studentAssignments,
    fetchStudents,
    fetchBooks,
    fetchStudentBooks,
    fetchStudentAssignments,
    removeStudent
  } = useDataStore();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (user && studentId) {
      fetchStudents(user.id);
      fetchBooks(user.id);
      fetchStudentBooks(studentId);
      fetchStudentAssignments(studentId);
    }
  }, [user, studentId, fetchStudents, fetchBooks, fetchStudentBooks, fetchStudentAssignments]);
  
  const student = students.find(s => s.id === studentId);
  
  const studentBookIds = studentBooks.map(sb => sb.book_id);
  const studentBooksData = books.filter(b => studentBookIds.includes(b.id));
  
  // Öğrenciye ait programları özetle ve benzersiz olarak al
  const programMap: Record<string, any> = {};
  studentAssignments.forEach(a => {
    if (a.programs && !programMap[a.program_id]) {
      programMap[a.program_id] = {
        id: a.program_id,
        title: a.programs.title,
        is_scheduled: a.programs.is_scheduled,
        created_at: a.created_at,
        assignments: []
      };
    }
    if (programMap[a.program_id]) {
      programMap[a.program_id].assignments.push(a);
    }
  });
  const studentPrograms = Object.values(programMap);
  
  const handleDelete = async () => {
    if (!studentId) return;
    
    setIsDeleting(true);
    
    const { error } = await removeStudent(studentId);
    
    if (error) {
      toast.error('Failed to delete student');
      setIsDeleting(false);
      return;
    }
    
    toast.success('Student deleted successfully');
    setIsDeleteModalOpen(false);
    navigate('/students');
  };
  
  const generateProgramLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student/${studentId}`;
  };
  
  const copyProgramLink = () => {
    const link = generateProgramLink();
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  // Öğrenciye ait kitaptan silme
  const handleDeleteBook = async (bookId: string) => {
    // Burada supabase'den student_books tablosundan ilgili kaydı silmelisiniz
    // (Varsa useDataStore'da bir fonksiyon ile veya doğrudan supabase ile)
    try {
      const { error } = await window.supabase
        .from('student_books')
        .delete()
        .eq('student_id', studentId)
        .eq('book_id', bookId);
      if (error) throw error;
      toast.success('Kitap silindi');
      fetchStudentBooks(studentId!);
    } catch (err) {
      toast.error('Kitap silinemedi');
    }
  };

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Öğrenci Bulunamadı</h2>
        <p className="text-gray-600">Seçili öğrenci mevcut değil veya silinmiş.</p>
        <Button onClick={() => navigate('/students')} className="mt-4">Öğrenciler Listesine Dön</Button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <div className="mb-6">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Öğrencilere Dön</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <User size={24} className="mr-2 text-indigo-600" />
              {student.name}
            </h1>
            {student.email && (
              <p className="text-gray-600">{student.email}</p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-3 md:mt-0 flex flex-wrap gap-2"
          >
            <Button
              variant="primary"
              onClick={copyProgramLink}
              size="sm"
            >
              Öğrenci Linkini Kopyala
            </Button>
            
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              size="sm"
            >
              <Trash2 size={16} className="mr-1" />
              Öğrenciyi Sil
            </Button>
          </motion.div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Book size={20} className="mr-2 text-purple-600" />
              Öğrenci Kitapları
            </h2>
            
            {studentBooksData.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {studentBooksData.map((book, index) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    index={index} 
                    onDelete={handleDeleteBook}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Book size={36} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Bu öğrenciye henüz kitap atanmadı</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ClipboardList size={20} className="mr-2 text-blue-600" />
              Programlar
            </h2>
            {studentPrograms.length > 0 ? (
              <div className="space-y-3">
                {studentPrograms.map((program: any) => {
                  const total = program.assignments.length;
                  const completed = program.assignments.filter((a: any) => a.is_completed).length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link to={`/programs/${program.id}`} key={program.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition cursor-pointer">
                        <div>
                          <div className="font-medium text-gray-900">{program.title}</div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar size={14} className="mr-1" />
                            {new Date(program.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-600 mb-1">İlerleme</span>
                          <div className="flex items-center gap-1">
                            <Check size={14} className="text-green-500" />
                            <span className="text-green-600 font-semibold">{completed}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{total}</span>
                            <span className="ml-2 text-xs text-gray-500">({percent}%)</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <ClipboardList size={36} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Bu öğrenciye ait program yok</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Öğrenciyi Sil"
      >
        <div className="space-y-4">
          <p><span className="font-semibold">{student.name}</span> adlı öğrenciyi silmek istediğinize emin misiniz?</p>
          <p className="text-red-600">Bu işlem geri alınamaz. Bu öğrenciye ait tüm ödevler ve programlar da silinecek.</p>
          
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Vazgeç
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

export default StudentDetail;