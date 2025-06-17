import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BookCard from '../../components/books/BookCard';
import { 
  ArrowLeft, Book, ClipboardList, Trash2, User, Calendar, Check, 
  School, Phone, Users, GraduationCap, BookOpen, PlusCircle, Clock,
  Download, Share2, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);  const [questionStatsData, setQuestionStatsData] = useState<any[]>([]);
  const [readingStatusData, setReadingStatusData] = useState<any[]>([]);
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user && studentId) {
      fetchStudents(user.id);
      fetchBooks(user.id);
      fetchStudentBooks(studentId);      fetchStudentAssignments(studentId);
      fetchQuestionStats(); // Soru istatistiklerini de fetch et
      fetchCoachNotes(); // Koç notlarını da fetch et
      fetchReadingStatus(); // Reading status'u da fetch et
    }
  }, [user, studentId, fetchStudents, fetchBooks, fetchStudentBooks, fetchStudentAssignments]);
  
  // Soru istatistiklerini fetch etme fonksiyonu
  const fetchQuestionStats = async () => {
    if (!studentId) return;
    
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          id,
          correct_answers,
          wrong_answers,
          blank_answers,
          programs(title),
          books(title)
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      // Frontend'de sadece soru istatistiği olan kayıtları filtrele
      const filteredAssignments = (assignments || []).filter((assignment: any) => 
        assignment.correct_answers !== null || 
        assignment.wrong_answers !== null || 
        assignment.blank_answers !== null
      );

      console.log('Fetched assignments:', assignments);
      console.log('Filtered assignments:', filteredAssignments);
      
      // Test için mock veri ekle (eğer veri yoksa)
      if (filteredAssignments.length === 0) {
        console.log('No data found, adding mock data for testing');
        const mockData = [
          {
            id: 'mock1',
            correct_answers: 15,
            wrong_answers: 5,
            blank_answers: 2,
            programs: { title: 'Test Program' },
            books: { title: 'Matematik Kitabı' }
          },
          {
            id: 'mock2',
            correct_answers: 20,
            wrong_answers: 8,
            blank_answers: 3,
            programs: { title: 'Test Program' },
            books: { title: 'Fizik Kitabı' }
          }
        ];
        setQuestionStatsData(mockData);
      } else {
        setQuestionStatsData(filteredAssignments);
      }
    } catch (error) {
      console.error('Error fetching question stats:', error);
    }
  };
  
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

    try {
      await removeStudent(studentId);

      toast.success('Student deleted successfully');
      setIsDeleteModalOpen(false);
      navigate('/students');
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
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
      const { error } = await supabase
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
      
      const { error } = await supabase
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
  const availableBooks = books.filter(book => !studentBookIds.includes(book.id)).map(book => ({
    ...book,
    author: book.author || 'Unknown Author', // Provide a default value if author is missing
  }));
  
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
  
  const completedPrograms = studentPrograms.filter((program: any) => {
    const total = program.assignments.length;
    const completed = program.assignments.filter((a: any) => a.is_completed).length;
    return total > 0 && completed === total;
  });
  
  const incompletePrograms = studentPrograms.filter((program: any) => {
    const total = program.assignments.length;
    const completed = program.assignments.filter((a: any) => a.is_completed).length;
    return total > 0 && completed < total;
  });
  
  // PDF oluşturma fonksiyonu
  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${student?.name.replace(/\s+/g, '_')}_rapor.pdf`);
      toast.success('PDF başarıyla oluşturuldu!');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken bir hata oluştu');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Link paylaşma fonksiyonu
  const shareReportLink = async () => {
    setIsCopyingLink(true);
    try {
      // Öğrenci bilgileri ile özel rapor linki oluştur
      const studentName = student?.name?.replace(/\s+/g, '-').toLowerCase() || 'ogrenci';
      const timestamp = new Date().getTime();
      const reportUrl = `${window.location.origin}/public-report/${studentId}/${studentName}-${timestamp}`;
      
      await navigator.clipboard.writeText(reportUrl);
      toast.success('Rapor linki panoya kopyalandı! Bu linki velilerle paylaşabilirsiniz.');
    } catch (error) {
      console.error('Link kopyalama hatası:', error);
      toast.error('Link kopyalanırken bir hata oluştu');
    } finally {
      setIsCopyingLink(false);
    }
  };
  
  // Grafik verileri hazırlama - kitap bazında toplama
  const prepareChartData = () => {
    console.log('questionStatsData:', questionStatsData);
    if (!questionStatsData.length) return null;

    // Kitap bazında verileri toplama
    const bookStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const bookTitle = assignment.books?.title || 'Bilinmeyen Kitap';
      
      if (!bookStats[bookTitle]) {
        bookStats[bookTitle] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      bookStats[bookTitle].correct += assignment.correct_answers || 0;
      bookStats[bookTitle].wrong += assignment.wrong_answers || 0;
      bookStats[bookTitle].blank += assignment.blank_answers || 0;
    });

    console.log('bookStats:', bookStats);

    const chartData = {
      labels: Object.keys(bookStats),
      datasets: [
        {
          label: 'Doğru',
          data: Object.values(bookStats).map(stats => stats.correct),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Yanlış',
          data: Object.values(bookStats).map(stats => stats.wrong),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: 'Boş',
          data: Object.values(bookStats).map(stats => stats.blank),
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1,
        },
      ],
    };

    return { chartData, bookStats };
  };

  // Kitap bazında istatistikler
  const getBookStatistics = () => {
    if (!questionStatsData.length) return [];

    // Kitap bazında verileri toplama
    const bookStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const bookTitle = assignment.books?.title || 'Bilinmeyen Kitap';
      
      if (!bookStats[bookTitle]) {
        bookStats[bookTitle] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      bookStats[bookTitle].correct += assignment.correct_answers || 0;
      bookStats[bookTitle].wrong += assignment.wrong_answers || 0;
      bookStats[bookTitle].blank += assignment.blank_answers || 0;
    });

    return Object.keys(bookStats).map(bookTitle => {
      const stats = bookStats[bookTitle];
      const totalQuestions = stats.correct + stats.wrong + stats.blank;
      const successRate = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;
      
      return {
        bookTitle,
        totalQuestions,
        successRate,
        correct: stats.correct,
        wrong: stats.wrong,
        blank: stats.blank
      };
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Kitap Bazında Soru Çözme İstatistikleri',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };
  
  // Koç notlarını fetch etme fonksiyonu
  const fetchCoachNotes = async () => {
    if (!studentId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .select('notes')
        .eq('student_id', studentId)
        .eq('coach_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCoachNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching coach notes:', error);
    }
  };

  // Koç notlarını kaydetme fonksiyonu
  const saveCoachNotes = async () => {
    if (!studentId || !user) return;
    
    try {
      const { error } = await supabase
        .from('coach_notes')
        .upsert({
          student_id: studentId,
          coach_id: user.id,
          notes: coachNotes
        }, {
          onConflict: 'student_id,coach_id'
        });

      if (error) throw error;
      
      toast.success('Koç notları kaydedildi!');
    } catch (error) {
      console.error('Error saving coach notes:', error);
      toast.error('Koç notları kaydedilirken bir hata oluştu');
    }  };

  // Reading status'u fetch etme fonksiyonu
  const fetchReadingStatus = async () => {
    if (!studentId) return;
    
    try {
      const { data, error } = await supabase
        .from('reading_status')
        .select(`
          *,
          books(id, title, author, is_story_book)
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching reading status:', error);
        return;
      }

      console.log('Reading status data:', data);
      setReadingStatusData(data || []);
    } catch (error) {
      console.error('Error fetching reading status:', error);
    }
  };
  // Kitabı okunmuş olarak işaretleme fonksiyonu
  const markBookAsRead = async (bookId: string) => {
    if (!studentId) return;
    
    try {
      const { error } = await supabase
        .from('reading_status')
        .upsert({
          student_id: studentId,
          book_id: bookId,
          is_read: true,
          reading_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'student_id,book_id'
        });

      if (error) throw error;
      
      // Kitap bilgisini bul
      const book = books.find(b => b.id === bookId);
      
      // Optimistic update - state'i hemen güncelle
      setReadingStatusData(prevData => {
        const existingIndex = prevData.findIndex((item: any) => item.book_id === bookId);
        
        const newItem = {
          id: Date.now().toString(), // Temporary ID
          student_id: studentId,
          book_id: bookId,
          is_read: true,
          reading_date: new Date().toISOString().split('T')[0],
          books: book
        };
        
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prevData];
          updated[existingIndex] = { ...updated[existingIndex], ...newItem };
          return updated;
        } else {
          // Add new
          return [...prevData, newItem];
        }
      });
      
      toast.success('Kitap okunmuş olarak işaretlendi!');
      
      // Background'da gerçek veriyi de fetch et
      fetchReadingStatus();
    } catch (error) {
      console.error('Error marking book as read:', error);
      toast.error('Kitap işaretlenirken bir hata oluştu');
      // Hata durumunda veriyi yeniden fetch et
      fetchReadingStatus();
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
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center"
                >
                  <FileText size={16} className="mr-1" />
                  Raporlama
                </Button>
                
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
      
      {/* Raporlama Modal'ı */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Öğrenci Raporlama"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <div ref={reportRef} className="space-y-6 bg-white p-6">
            {/* Öğrenci Bilgileri */}
            <div className="bg-gray-50 p-4 rounded-lg border-b">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{student?.name} - Öğrenci Raporu</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Email: {student?.email}</div>
                <div>Okul: {student?.school || 'Belirtilmemiş'}</div>
                <div>Sınıf: {student?.grade || 'Belirtilmemiş'}</div>
                <div>Alan: {student?.field || 'Belirtilmemiş'}</div>
              </div>
            </div>

            {/* Program İstatistikleri */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Program İstatistikleri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 p-3 rounded-md text-center">
                  <div className="text-2xl font-bold text-green-700">{completedPrograms.length}</div>
                  <div className="text-sm text-green-600">Tamamlanan Program</div>
                </div>
                <div className="bg-red-100 p-3 rounded-md text-center">
                  <div className="text-2xl font-bold text-red-700">{incompletePrograms.length}</div>
                  <div className="text-sm text-red-600">Tamamlanmayan Program</div>
                </div>
              </div>
            </div>

            {/* Soru İstatistikleri Grafiği */}
            {questionStatsData.length > 0 ? (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Kitap Bazında Soru Çözme İstatistikleri</h3>
                <div className="h-80">
                  {prepareChartData() && <Bar data={prepareChartData()!.chartData} options={chartOptions} />}
                </div>
                
                {/* Özet İstatistikler */}
                <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-blue-100 rounded">
                    <div className="font-semibold text-blue-700">
                      {questionStatsData.reduce((sum: number, item: any) => 
                        sum + (item.correct_answers || 0) + (item.wrong_answers || 0) + (item.blank_answers || 0), 0)}
                    </div>
                    <div className="text-blue-600">Toplam Soru</div>
                  </div>
                  <div className="text-center p-2 bg-green-100 rounded">
                    <div className="font-semibold text-green-700">
                      {questionStatsData.reduce((sum: number, item: any) => sum + (item.correct_answers || 0), 0)}
                    </div>
                    <div className="text-green-600">Toplam Doğru</div>
                  </div>
                  <div className="text-center p-2 bg-red-100 rounded">
                    <div className="font-semibold text-red-700">
                      {questionStatsData.reduce((sum: number, item: any) => sum + (item.wrong_answers || 0), 0)}
                    </div>
                    <div className="text-red-600">Toplam Yanlış</div>
                  </div>
                  <div className="text-center p-2 bg-gray-100 rounded">
                    <div className="font-semibold text-gray-700">
                      {questionStatsData.reduce((sum: number, item: any) => sum + (item.blank_answers || 0), 0)}
                    </div>
                    <div className="text-gray-600">Toplam Boş</div>
                  </div>
                </div>
                
                {/* Kitap Bazında Detaylı İstatistikler */}
                {getBookStatistics().length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-semibold text-gray-800">Kitap Bazında Detaylı İstatistikler</h4>
                    <div className="grid gap-4">
                      {getBookStatistics().map((book: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{book.bookTitle}</h5>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{book.successRate}%</div>
                              <div className="text-xs text-gray-500">Başarı Oranı</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div className="text-center p-2 bg-blue-100 rounded">
                              <div className="font-semibold text-blue-700">{book.totalQuestions}</div>
                              <div className="text-blue-600">Toplam Soru</div>
                            </div>
                            <div className="text-center p-2 bg-green-100 rounded">
                              <div className="font-semibold text-green-700">{book.correct}</div>
                              <div className="text-green-600">Doğru</div>
                            </div>
                            <div className="text-center p-2 bg-red-100 rounded">
                              <div className="font-semibold text-red-700">{book.wrong}</div>
                              <div className="text-red-600">Yanlış</div>
                            </div>
                            <div className="text-center p-2 bg-gray-100 rounded">
                              <div className="font-semibold text-gray-700">{book.blank}</div>
                              <div className="text-gray-600">Boş</div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${book.successRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">Henüz soru çözme istatistiği bulunmuyor.</p>
                <p className="text-sm text-gray-500 mt-1">Öğrenci program linkinden kitap bazında soru sayılarını girebilir.</p>
              </div>            )}

            {/* Okunan Hikaye Kitapları */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <BookOpen className="mr-2" size={20} />
                Okunan Hikaye Kitapları
              </h3>
              
              {readingStatusData.filter((item: any) => item.books?.is_story_book && item.is_read).length > 0 ? (
                <div className="grid gap-3">
                  {readingStatusData
                    .filter((item: any) => item.books?.is_story_book && item.is_read)
                    .map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.books?.title}</h4>
                          {item.books?.author && (
                            <p className="text-sm text-gray-600">Yazar: {item.books.author}</p>
                          )}
                          {item.reading_date && (
                            <p className="text-xs text-gray-500">
                              Okunma Tarihi: {new Date(item.reading_date).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">"{item.notes}"</p>
                          )}
                        </div>
                        <div className="text-green-600">
                          <Check size={20} />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>Henüz okunmuş hikaye kitabı bulunmuyor.</p>
                  <p className="text-sm mt-1">Hikaye kitabı ekleyip, manuel olarak okunmuş olarak işaretlemeniz gerekiyor.</p>
                </div>
              )}

              {/* Hikaye Kitaplarını Okunmuş Olarak İşaretleme */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-md font-medium text-gray-700 mb-2">Hikaye Kitabını Okunmuş Olarak İşaretle:</h4>
                <div className="flex flex-wrap gap-2">
                  {books
                    .filter(book => book.is_story_book && !readingStatusData.some((rs: any) => rs.book_id === book.id && rs.is_read))
                    .map(book => (
                      <button
                        key={book.id}
                        onClick={() => markBookAsRead(book.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                      >
                        {book.title}
                      </button>
                    ))}
                </div>
                {books.filter(book => book.is_story_book).length === 0 && (
                  <p className="text-sm text-gray-500">Henüz hikaye kitabı eklenmemiş.</p>
                )}
              </div>
            </div>

            {/* Koç Notları */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                <FileText className="mr-2" size={20} />
                Koç Notları
              </h3>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Öğrenci hakkında notlarınızı buraya yazabilirsiniz..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={saveCoachNotes}
                  variant="success"
                  size="sm"
                >
                  Notları Kaydet
                </Button>
              </div>
            </div>
          </div>

          {/* Modal Alt Kısım - Butonlar */}
          <div className="flex justify-between items-center pt-4 border-t bg-gray-50 px-6 py-4 rounded-b-lg">
            <div className="flex space-x-3">
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex items-center"
                variant="primary"
              >
                <Download className="mr-2" size={16} />
                {isGeneratingPDF ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
              </Button>
              
              <Button
                onClick={shareReportLink}
                disabled={isCopyingLink}
                className="flex items-center"
                variant="secondary"
              >
                <Share2 className="mr-2" size={16} />
                {isCopyingLink ? 'Kopyalanıyor...' : 'Link Paylaş'}
              </Button>
            </div>
            
            <Button
              onClick={() => setIsReportModalOpen(false)}
              variant="secondary"
            >
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetail;