import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { ArrowLeft, Book, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
  bookId: string;
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
    fetchStudents, 
    fetchBooks,
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
  
  // Form state for new assignment
  const [newAssignment, setNewAssignment] = useState<DayAssignment>({
    bookId: '',
    pageRange: '', // e.g. "10-20" veya not
    time: isScheduled ? '08:00' : undefined
  });
  
  useEffect(() => {
    if (user) {
      fetchStudents(user.id);
      fetchBooks(user.id);
    }
  }, [user, fetchStudents, fetchBooks]);
  
  const handleAddAssignment = () => {
    if (!selectedDay) return;
    if (!newAssignment.bookId) {
      toast.error('Lütfen bir kitap seçin');
      return;
    }
    // Sayfa aralığı veya not
    let pageStart = 1, pageEnd = 1, note = '';
    if (newAssignment.pageRange) {
      const parsed = newAssignment.pageRange.split('-').map(s => parseInt(s.trim(), 10));
      if (parsed.length === 2 && parsed[0] && parsed[1] && parsed[0] <= parsed[1]) {
        pageStart = parsed[0];
        pageEnd = parsed[1];
        note = newAssignment.pageRange; // Sayfa aralığı da note olarak kaydedilecek
      } else if (parsed.length === 1 && parsed[0]) {
        pageStart = pageEnd = parsed[0];
        note = newAssignment.pageRange;
      } else {
        note = newAssignment.pageRange;
      }
    }
    setAssignments(prev => ({
      ...prev,
      [selectedDay]: [
        ...prev[selectedDay],
        {
          bookId: newAssignment.bookId,
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
      pageRange: '',
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
            await addAssignment(
              program.id,
              selectedStudent,
              assignment.bookId,
              assignment.pageStart,
              assignment.pageEnd,
              day,
              assignment.time,
              assignment.note // not bilgisini de gönder
            );
          }
        }
        
        toast.success('Program başarıyla oluşturuldu');
        navigate(`/programs/${program.id}`);
      }
    } catch (error) {
      toast.error('Program oluşturulurken bir hata oluştu');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));
  
  const bookOptions = books.map(book => ({
    value: book.id,
    label: book.title
  }));
  
  if (!user) return null;
  
  return (
    <div>
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={16} className="mr-1" />
        <span>Programlara Dön</span>
      </button>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Yeni Program Oluştur</h1>
        <p className="text-gray-600">Öğrenciniz için yeni bir ödev programı oluşturun</p>
      </motion.div>
      
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Türü
            </label>
            <div className="flex space-x-4">
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
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Günler</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {daysOfWeek.map((day, index) => (
            <motion.button
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={`
                p-4 rounded-lg text-white font-medium transition-all duration-200
                ${dayColors[day]}
                ${selectedDay === day ? 'ring-4 ring-offset-2 ring-offset-gray-50 scale-105' : ''}
              `}
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
          className="mb-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className={`w-6 h-6 rounded-full mr-2 ${dayColors[selectedDay]}`}></div>
              {selectedDay} Ödevleri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="Kitap"
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
                value={newAssignment.pageRange}
                onChange={e => setNewAssignment(prev => ({ ...prev, pageRange: e.target.value }))}
                fullWidth
              />
            </div>
            
            <Button
              variant="primary"
              onClick={handleAddAssignment}
              fullWidth
            >
              <Book size={16} className="mr-1" />
              Ödev Ekle
            </Button>
            
            {assignments[selectedDay].length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-gray-900">Eklenen Ödevler</h4>
                {assignments[selectedDay].map((assignment, index) => {
                  const book = books.find(b => b.id === assignment.bookId);
                  return (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{book?.title}</p>
                          <p className="text-sm text-gray-600">
                            {assignment.note
                              ? assignment.note
                              : `Sayfa: ${assignment.pageStart} - ${assignment.pageEnd}`}
                          </p>
                          {assignment.time && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {assignment.time}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveAssignment(selectedDay, index)}
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
      
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!selectedStudent || !programTitle}
        >
          Programı Oluştur
        </Button>
      </div>
    </div>
  );
};

export default CreateProgram;