import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BookCard from '../../components/books/BookCard';
import { 
  ArrowLeft, Book, ClipboardList, Trash2, User, Calendar, Check, 
  School, Phone, Users, GraduationCap, BookOpen, PlusCircle, Clock
} from 'lucide-react';
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
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'pending'>('all');
  
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

  // Kitap eklemek için yeni fonksiyon
  const handleAddBooks = async () => {
    if (!studentId || selectedBooks.length === 0) return;
    
    try {
      const data = selectedBooks.map(bookId => ({
        student_id: studentId,
        book_id: bookId,
        teacher_id: user?.id
      }));
      
      const { error } = await window.supabase
        .from('student_books')
        .insert(data);
      
      if (error) throw error;
      
      toast.success('Kitaplar başarıyla eklendi');
      setIsAddBookModalOpen(false);
      setSelectedBooks([]);
      fetchStudentBooks(studentId);
    } catch (err) {
      toast.error('Kitaplar eklenirken bir hata oluştu');
      console.error(err);
    }
  };
  
  // Kitap seçimi için yardımcı fonksiyon
  const toggleBookSelection = (bookId: string) => {
    if (selectedBooks.includes(bookId)) {
      setSelectedBooks(selectedBooks.filter(id => id !== bookId));
    } else {
      setSelectedBooks([...selectedBooks, bookId]);
    }
  };
  
  // Öğrenciye henüz atanmamış kitapları filtrele
  const availableBooks = books.filter(book => !studentBookIds.includes(book.id));

  // Programları filtreleme
  const filteredPrograms = studentPrograms.filter((program: any) => {
    if (activeFilter === 'all') return true;
    
    const total = program.assignments.length;
    const completed = program.assignments.filter((a: any) => a.is_completed).length;
    
    if (activeFilter === 'completed') {
      // Tamamlanma oranı %100 olan programlar
      return total > 0 && completed === total;
    } else if (activeFilter === 'pending') {
      // Tamamlanma oranı %100 olmayan programlar
      return total > 0 && completed < total;
    }
    
    return true;
  });

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
      
      {/* Öğrenci Bilgileri Kartı - Yeni tasarım */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center">
            <User size={20} className="mr-2" />
            Öğrenci Bilgileri
          </h2>
        </div>
        
        <div className="bg-white rounded-b-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sol Kolon - Temel Bilgiler */}
            <div className="space-y-6">
              {/* Okul Bilgileri */}
              <div className="flex items-start">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <School className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Okul</h3>
                  <p className="text-gray-700 mt-1">{student.school || "Belirtilmemiş"}</p>
                </div>
              </div>
              
              {/* Sınıf Bilgileri */}
              <div className="flex items-start">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sınıf</h3>
                  <p className="text-gray-700 mt-1">{student.grade || "Belirtilmemiş"}</p>
                </div>
              </div>
              
              {/* Alan Bilgileri */}
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Alan</h3>
                  <p className="text-gray-700 mt-1">{student.field || "Belirtilmemiş"}</p>
                </div>
              </div>
            </div>
            
            {/* Sağ Kolon - İletişim Bilgileri */}
            <div className="space-y-6">
              {/* Öğrenci Telefonu */}
              <div className="flex items-start">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <Phone className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Telefon</h3>
                  <p className="text-gray-700 mt-1">{student.phone || "Belirtilmemiş"}</p>
                </div>
              </div>
              
              {/* Veli Bilgileri */}
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Veli Bilgileri</h3>
                  <div className="mt-1 space-y-1">
                    <p className="text-gray-700">
                      <span className="font-medium">İsim:</span> {student.parent_name || "Belirtilmemiş"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Telefon:</span> {student.parent_phone || "Belirtilmemiş"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* E-posta */}
              <div className="flex items-start">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">E-posta</h3>
                  <p className="text-gray-700 mt-1">{student.email || "Belirtilmemiş"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Kitaplar bölümü */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Book size={20} className="mr-2 text-purple-600" />
                Öğrenci Kitapları
              </h2>
              
              <Button 
                variant="success"
                size="sm"
                onClick={() => setIsAddBookModalOpen(true)}
              >
                <PlusCircle size={16} className="mr-1" />
                Kitap Ekle
              </Button>
            </div>
            
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
        
        {/* Programlar bölümü */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <ClipboardList size={20} className="mr-2 text-blue-600" />
                Programlar
              </h2>
              
              <Link to={`/programs/new?studentId=${studentId}`}>
                <Button 
                  variant="success"
                  size="sm"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Program Oluştur
                </Button>
              </Link>
            </div>
            
            {/* Filtreleme Butonları */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${
                  activeFilter === 'completed' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Check size={14} className="inline mr-1" />
                Tamamlanan
              </button>              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${
                  activeFilter === 'pending' 
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-400 shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock size={14} className="inline mr-1" />
                Bekleyen
              </button>
            </div>
            
            {filteredPrograms.length > 0 ? (
              <div className="space-y-3">
                {filteredPrograms.map((program: any) => {
                  const total = program.assignments.length;
                  const completed = program.assignments.filter((a: any) => a.is_completed).length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (                    <Link to={`/programs/${program.id}`} key={program.id}>
                      <div className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition cursor-pointer ${
                        activeFilter === 'pending' && program.assignments.some((a: any) => !a.is_completed) 
                          ? 'border-orange-300 bg-orange-50/60 shadow-sm' 
                          : ''
                      }`}>
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
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  percent < 30 ? 'bg-red-500' : 
                                  percent < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{width: `${percent}%`}}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (              <div className="text-center py-6">
                <ClipboardList size={36} className="mx-auto text-gray-400 mb-3" />
                <p className={`text-gray-600 ${activeFilter === 'pending' ? 'font-medium text-orange-600' : ''}`}>
                  {activeFilter === 'all' ? 'Bu öğrenciye ait program yok' :
                   activeFilter === 'completed' ? 'Tamamlanan program yok' : 'Bekleyen program yok'}
                </p>
                {activeFilter === 'pending' && (
                  <p className="text-xs text-orange-500 mt-2">
                    Tüm programlar tamamlanmış görünüyor. Tebrikler!
                  </p>
                )}
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
      
      {/* Kitap Ekleme Modal'ı */}
      <Modal
        isOpen={isAddBookModalOpen}
        onClose={() => {
          setIsAddBookModalOpen(false);
          setSelectedBooks([]);
        }}
        title="Öğrenciye Kitap Ekle"
      >
        <div className="space-y-4">
          {availableBooks.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">{student.name}</span> adlı öğrenciye eklemek istediğiniz kitapları seçin:
              </p>
              
              <div className="max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {availableBooks.map(book => (
                    <div 
                      key={book.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                        selectedBooks.includes(book.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleBookSelection(book.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-500">{book.author}</div>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedBooks.includes(book.id) ? 'bg-green-500' : 'border border-gray-300'
                      }`}>
                        {selectedBooks.includes(book.id) && (
                          <Check size={16} className="text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAddBookModalOpen(false);
                    setSelectedBooks([]);
                  }}
                >
                  Vazgeç
                </Button>
                <Button
                  variant="success"
                  onClick={handleAddBooks}
                  disabled={selectedBooks.length === 0}
                >
                  {selectedBooks.length > 0 ? `${selectedBooks.length} Kitap Ekle` : 'Kitap Ekle'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Book size={36} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Eklenebilecek kitap bulunmamaktadır</p>
              <p className="text-sm text-gray-500 mt-2">Önce "Kitaplar" sayfasından kitap ekleyebilirsiniz.</p>
              
              <div className="mt-4">
                <Link to="/books">
                  <Button variant="primary">
                    Kitaplar Sayfasına Git
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetail;