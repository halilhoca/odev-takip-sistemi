import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StudentCard from '../../components/students/StudentCard';
import { GraduationCap, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentList: React.FC = () => {
  const { user } = useAuthStore();
  const { students, fetchStudents, addStudent } = useDataStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentName, setNewStudentParentName] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentField, setNewStudentField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchStudents(user.id);
    }
  }, [user, fetchStudents]);
  
  const handleAddStudent = async () => {
    if (!newStudentName) {
      toast.error('Öğrenci adı gereklidir');
      return;
    }
    
    setIsSubmitting(true);
    
    if (user) {
      const result = await addStudent(
        user.id, 
        newStudentName, 
        newStudentEmail,
        newStudentSchool,
        newStudentGrade,
        newStudentPhone,
        newStudentParentName,
        newStudentParentPhone,
        newStudentField
      );
      
      if (result) {
        toast.success('Öğrenci başarıyla eklendi');
        // Tüm form alanlarını temizle
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentSchool('');
        setNewStudentGrade('');
        setNewStudentPhone('');
        setNewStudentParentName('');
        setNewStudentParentPhone('');
        setNewStudentField('');
        setIsModalOpen(false);
      } else {
        toast.error('Öğrenci eklenirken hata oluştu');
      }
    }
    
    setIsSubmitting(false);
  };
  
  if (!user) return null;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
          <p className="text-gray-600">Öğrencilerinizi yönetin</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Öğrenci Ekle
          </Button>
        </motion.div>
      </div>
      
      {students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, index) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              index={index} 
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-sm text-center"
        >
          <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz öğrenci eklenmemiş</h3>
          <p className="text-gray-600 mb-4">Başlamak için ilk öğrencinizi ekleyin</p>
          <Button 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Öğrenci Ekle
          </Button>
        </motion.div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Öğrenci Ekle"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label="Öğrenci Adı *"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Öğrenci adını girin"
            fullWidth
          />
          
          <Input
            label="E-posta (İsteğe bağlı)"
            type="email"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            placeholder="Öğrenci e-postasını girin"
            fullWidth
          />
          
          <Input
            label="Okul"
            value={newStudentSchool}
            onChange={(e) => setNewStudentSchool(e.target.value)}
            placeholder="Öğrencinin okulunu girin"
            fullWidth
          />
          
          <Input
            label="Sınıf"
            value={newStudentGrade}
            onChange={(e) => setNewStudentGrade(e.target.value)}
            placeholder="Örn: 9-A, 10. Sınıf"
            fullWidth
          />
          
          <Input
            label="Telefon Numarası"
            type="tel"
            value={newStudentPhone}
            onChange={(e) => setNewStudentPhone(e.target.value)}
            placeholder="Örn: 555 123 4567"
            fullWidth
          />
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-medium text-gray-700 mb-2">Veli Bilgileri</h3>
            
            <Input
              label="Veli Adı"
              value={newStudentParentName}
              onChange={(e) => setNewStudentParentName(e.target.value)}
              placeholder="Veli adını girin"
              fullWidth
            />
            
            <div className="mt-4">
              <Input
                label="Veli Telefon Numarası"
                type="tel"
                value={newStudentParentPhone}
                onChange={(e) => setNewStudentParentPhone(e.target.value)}
                placeholder="Örn: 555 123 4567"
                fullWidth
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <Input
              label="Alan (İsteğe bağlı)"
              value={newStudentField}
              onChange={(e) => setNewStudentField(e.target.value)}
              placeholder="Örn: Sayısal, Sözel, Eşit Ağırlık"
              fullWidth
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onClick={handleAddStudent}
              isLoading={isSubmitting}
            >
              Öğrenci Ekle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentList;