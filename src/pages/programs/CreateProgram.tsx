import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { ArrowLeft, Book, Clock, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createAssignment } from '../../lib/supabase';

const daysOfWeek = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

const dayColors = {
  'Pazartesi': 'bg-blue-500 hover:bg-blue-600',
  'Salı': 'bg-purple-500 hover:bg-purple-600',
  'Çarşamba': 'bg-green-500 hover:bg-green-600',
  'Perşembe': 'bg-yellow-500 hover:bg-yellow-600',
  'Cuma': 'bg-pink-500 hover:bg-pink-600',
  'Cumartesi': 'bg-indigo-500 hover:bg-indigo-600',
  'Pazar': 'bg-red-500 hover:bg-red-600'
};

interface DayAssignment {
  bookId?: string; // Artık zorunlu değil
  pageStart: number;
  pageEnd: number;
  note?: string;
  time?: string;
}

interface Assignment {
  id: string;
  studentId: string;
  day: string;
  assignments: DayAssignment[];
}

const CreateProgram: React.FC = () => {
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    students, 
    books, 
    studentBooks,
    fetchStudents, 
    fetchBooks,
    fetchStudentBooks,
    addProgram,
    addAssignment
  } = useDataStore();
  
  const [programTitle, setProgramTitle] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, DayAssignment[]>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Form state for new assignment
  const [newAssignment, setNewAssignment] = useState<DayAssignment>({
    bookId: '',
    pageStart: 1,
    pageEnd: 1,
    note: '',
    time: isScheduled ? '08:00' : undefined
  });
  
  useEffect(() => {
    if (user) {
      fetchStudents(user.id);
      fetchBooks(user.id);
    }
  }, [user, fetchStudents, fetchBooks]);

  // Seçilen öğrenci değiştiğinde o öğrencinin kitaplarını çek
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentBooks(selectedStudent);
    }
  }, [selectedStudent, fetchStudentBooks]);
  
  const handleAddAssignment = () => {
    if (!selectedDay) return;
    
    // Kitap seçimi artık zorunlu değil, ancak kitap seçilmişse veya not varsa eklemeye izin ver
    if (!newAssignment.bookId && !newAssignment.note?.trim()) {
      toast.error('Lütfen bir kitap seçin veya not yazın');
      return;
    }
    
    // Sayfa aralığı veya not
    let pageStart = 1, pageEnd = 1, note = '';
    if (newAssignment.note) {
      const parsed = newAssignment.note.split('-').map(s => parseInt(s.trim(), 10));
      if (parsed.length === 2 && parsed[0] && parsed[1] && parsed[0] <= parsed[1]) {
        pageStart = parsed[0];
        pageEnd = parsed[1];
        note = newAssignment.note; // Sayfa aralığı da note olarak kaydedilecek
      } else if (parsed.length === 1 && parsed[0]) {
        pageStart = pageEnd = parsed[0];
        note = newAssignment.note;
      } else {
        note = newAssignment.note;
      }
    }
    setAssignments(prev => ({
      ...prev,
      [selectedDay]: [
        ...prev[selectedDay],
        {
          bookId: newAssignment.bookId || undefined, // Boşsa undefined
          pageStart,
          pageEnd,
          note,
          time: newAssignment.time
        }
      ]
    }));
    // Reset form
    setNewAssignment({
      bookId: '',
      pageStart: 1,
      pageEnd: 1,
      note: '',
      time: isScheduled ? '08:00' : undefined
    });
  };
  
  const handleRemoveAssignment = (day: string, index: number) => {
    setAssignments(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async () => {
    if (!programTitle || !selectedStudent) {
      toast.error('Program başlığı ve öğrenci seçimi zorunludur');
      return;
    }
    const totalAssignments = Object.values(assignments).reduce(
      (sum, dayAssignments) => sum + dayAssignments.length, 
      0
    );
    if (totalAssignments === 0) {
      toast.error('En az bir ödev eklemelisiniz');
      return;
    }
    setIsSubmitting(true);
    try {
      if (user) {
        // Create program
        const program = await addProgram(user.id, programTitle, isScheduled);
        if (!program) {
          throw new Error('Program oluşturulamadı');
        }
        // Create assignments for each day
        for (const [day, dayAssignments] of Object.entries(assignments)) {
          for (const assignment of dayAssignments) {
            const { error } = await createAssignment(
              program.id,
              selectedStudent,
              assignment.bookId || null, // Undefined ise null yap
              assignment.pageStart,
              assignment.pageEnd,
              day,
              assignment.time,
              assignment.note
            );
            if (error) {
              // Kullanıcı dostu hata mesajları
              if (error.code === '23502' && error.message.includes('book_id')) {
                toast.error('Kitap seçmeden not eklemek için veritabanı güncellemesi gerekiyor. Lütfen yöneticiyle iletişime geçin.');
              } else {
                toast.error('Program oluştururken hata: ' + (error.message || 'Bilinmeyen hata'));
              }
              console.error('Assignment ekleme hatası:', error);
              return; // Hata durumunda durdur
            }
          }
        }
        toast.success('Program başarıyla oluşturuldu');
        navigate(`/programs/${program.id}`);
      }
    } catch (error: any) {
      toast.error('Program oluşturulurken bir hata oluştu: ' + (error?.message || error));
      console.error('Program oluşturma hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));
  
  // Debug bilgisi
  console.log('🔍 CreateProgram State:', { 
    selectedStudent, 
    studentsCount: students.length,
    booksCount: books.length, 
    studentBooksCount: studentBooks.length,
    studentBooksData: studentBooks.slice(0, 3) // İlk 3 öğe
  });
  
  // Sadece seçili öğrenciye atanan kitapları göster
  const bookOptions = selectedStudent && studentBooks.length > 0 
    ? studentBooks.map(studentBook => ({
        value: studentBook.books.id,
        label: studentBook.books.title
      }))
    : [];
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center px-0 py-0 w-full">
      {/* DEBUG: Hamburger menü render edildi */}
      <div className="fixed top-1 left-1 z-50 sm:hidden bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-bold shadow">
        DEBUG: Hamburger menü kodu render edildi
      </div>
      {/* Mobil sağ üst hamburger menü */}
      <div className="fixed top-4 right-4 z-50 sm:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-full bg-white shadow-md border border-gray-200 focus:outline-none"
          aria-label="Menüyü Aç"
        >
          <Menu size={28} className="text-indigo-700" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 border border-gray-100 animate-fade-in">
            <button
              className="w-full text-left px-4 py-2 text-indigo-700 hover:bg-indigo-50 text-base font-medium"
              onClick={() => { setMenuOpen(false); navigate('/students'); }}
            >
              Öğrenciler
            </button>
            <button
              className="w-full text-left px-4 py-2 text-indigo-700 hover:bg-indigo-50 text-base font-medium"
              onClick={() => { setMenuOpen(false); navigate('/books'); }}
            >
              Kitaplar
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center text-indigo-600 hover:text-indigo-900 mb-4 text-base font-medium"
        style={{ alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={20} className="mr-2" />
        <span>Programlara Dön</span>
      </button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4 w-full max-w-none"
      >
        <h1 className="text-2xl font-bold text-indigo-700 mb-1">Yeni Program Oluştur</h1>
        <p className="text-gray-500 text-base">Öğrenciniz için yeni bir ödev programı oluşturun</p>
      </motion.div>
      <Card className="p-3 sm:p-6 mb-6 w-full max-w-none shadow-md rounded-2xl bg-white">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full">
          <Input
            label="Program Başlığı"
            value={programTitle}
            onChange={(e) => setProgramTitle(e.target.value)}
            placeholder="Program başlığını girin"
            fullWidth
          />
          <Select
            label="Öğrenci"
            options={studentOptions}
            value={selectedStudent}
            onChange={setSelectedStudent}
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Türü
            </label>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!isScheduled}
                  onChange={() => setIsScheduled(false)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Saatsiz Program</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={isScheduled}
                  onChange={() => setIsScheduled(true)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Saatli Program</span>
              </label>
            </div>
          </div>
        </div>
      </Card>
      <div className="mb-6 w-full max-w-none">
        <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-4">Günler</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7 sm:gap-6 w-full">
          {daysOfWeek.map((day, index) => (
            <motion.button
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
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
                {assignments[day].length} ödev
              </span>
            </motion.button>
          ))}
        </div>
      </div>
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full max-w-none"
        >
          <Card className="p-3 sm:p-6 shadow rounded-2xl bg-white w-full max-w-none">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center text-indigo-700">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 ${(dayColors as Record<string, string>)[selectedDay]}`}></div>
              {selectedDay} Ödevleri
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 mb-4">
              <Select
                label="Kitap (İsteğe bağlı)"
                options={bookOptions}
                value={newAssignment.bookId}
                onChange={(value) => setNewAssignment(prev => ({ ...prev, bookId: value }))}
                fullWidth
              />
              {isScheduled && (
                <Input
                  label="Saat"
                  type="time"
                  value={newAssignment.time}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, time: e.target.value }))}
                  fullWidth
                />
              )}
              <Input
                label="Sayfa Aralığı veya Not Ekle (örn: 10-20 veya 'Sadece okuma')"
                placeholder="örn: 10-20 veya 'Sadece okuma'"
                value={newAssignment.note}
                onChange={e => setNewAssignment(prev => ({ ...prev, note: e.target.value }))}
                fullWidth
              />
            </div>
            <Button
              variant="primary"
              onClick={handleAddAssignment}
              fullWidth
              className="mt-2"
            >
              <Book size={16} className="mr-1" />
              Ödev Ekle
            </Button>
            {assignments[selectedDay].length > 0 && (
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-4">
                <h4 className="font-medium text-indigo-700 text-sm sm:text-base">Eklenen Ödevler</h4>
                {assignments[selectedDay].map((assignment, index) => {
                  const book = books.find(b => b.id === assignment.bookId);
                  return (
                    <Card key={index} className="p-3 sm:p-4 rounded-xl shadow bg-indigo-50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                          {book ? (
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{book.title}</p>
                          ) : (
                            <p className="font-medium text-gray-900 text-sm sm:text-base">Genel Not</p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-600">
                            {assignment.note
                              ? assignment.note
                              : book ? `Sayfa: ${assignment.pageStart} - ${assignment.pageEnd}` : 'Not'}
                          </p>
                          {assignment.time && (
                            <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {assignment.time}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveAssignment(selectedDay, index)}
                          className="mt-2 sm:mt-0"
                        >
                          Sil
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      )}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 w-full max-w-none">
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!selectedStudent || !programTitle}
          fullWidth
          className="rounded-xl text-lg py-3"
        >
          Programı Oluştur
        </Button>
      </div>
    </div>
  );
};

export default CreateProgram;