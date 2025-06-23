import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import BookCard from '../../components/books/BookCard';
import { Book as BookIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const BookList: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    books, 
    students, 
    fetchBooks, 
    fetchStudents, 
    addBook,
    assignBook,
    removeBook
  } = useDataStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookSubject, setNewBookSubject] = useState('');
  const [isStoryBook, setIsStoryBook] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchBooks(user.id);
      fetchStudents(user.id);
    }
  }, [user, fetchBooks, fetchStudents]);  const handleAddBook = async () => {
    if (!newBookTitle) {
      toast.error('Kitap başlığı gereklidir');
      return;
    }
    
    // Hikaye kitabı değilse ders bilgisi zorunlu
    if (!isStoryBook && !newBookSubject.trim()) {
      toast.error('Ders kitapları için ders bilgisi gereklidir');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (user) {
        console.log('📚 Kitap ekleniyor:', { 
          title: newBookTitle, 
          author: newBookAuthor, 
          subject: newBookSubject, 
          isStoryBook,
          selectedStudent: selectedStudentId 
        });
        
        // Hikaye kitabı ise subject'i boş bırak veya "Hikaye" olarak ayarla
        const finalSubject = isStoryBook ? (newBookSubject || 'Hikaye') : newBookSubject;
        
        const book = await addBook(user.id, newBookTitle, newBookAuthor, isStoryBook, finalSubject);
        
        if (book) {
          console.log('✅ Kitap başarıyla eklendi:', book);
          
          if (selectedStudentId) {
            console.log('👨‍🎓 Öğrenciye atanıyor:', selectedStudentId);
            await assignBook(selectedStudentId, book.id);
          }
          
          toast.success('Kitap başarıyla eklendi');
          setNewBookTitle('');
          setNewBookAuthor('');
          setNewBookSubject('');
          setIsStoryBook(false);
          setSelectedStudentId('');
          setIsModalOpen(false);
        } else {
          console.error('❌ Kitap ekleme başarısız');
          toast.error('Kitap eklenirken hata oluştu');
        }
      }
    } catch (error) {
      console.error('❌ Kitap ekleme hatası:', error);
      toast.error(`Kitap eklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kitap silme fonksiyonu
  const handleDeleteBook = async (bookId: string) => {
    await removeBook(bookId);
    toast.success('Kitap silindi');
  };
  
  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));
  
  if (!user) return null;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Kitaplar</h1>
          <p className="text-gray-600">Kitaplarınızı yönetin</p>
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
            Kitap Ekle
          </Button>
        </motion.div>
      </div>
      
      {books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, index) => (
            <BookCard 
              key={book.id} 
              book={book} 
              index={index} 
              onDelete={handleDeleteBook}
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
          <BookIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz kitap eklenmemiş</h3>
          <p className="text-gray-600 mb-4">Başlamak için ilk kitabınızı ekleyin</p>
          <Button 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Kitap Ekle
          </Button>
        </motion.div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kitap Ekle"
      >        <div className="space-y-4">
          <Input
            label="Kitap Başlığı"
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            placeholder="Kitap başlığını girin"
            fullWidth
          />
          
          <Input
            label="Yazar (İsteğe bağlı)"
            value={newBookAuthor}
            onChange={(e) => setNewBookAuthor(e.target.value)}
            placeholder="Yazar adını girin"
            fullWidth
          />
            <Input
            label={isStoryBook ? "Ders (İsteğe bağlı)" : "Ders *"}
            value={newBookSubject}
            onChange={(e) => setNewBookSubject(e.target.value)}
            placeholder={isStoryBook ? "Ders adını girin (isteğe bağlı)" : "Ders adını girin (ör: Matematik, Türkçe, Fen)"}
            fullWidth
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isStoryBook"
              checked={isStoryBook}
              onChange={(e) => setIsStoryBook(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isStoryBook" className="text-sm font-medium text-gray-700">
              Bu bir hikaye kitabıdır
            </label>
          </div>
          
          <Select
            label="Öğrenciye Ata (İsteğe bağlı)"
            options={studentOptions}
            value={selectedStudentId}
            onChange={setSelectedStudentId}
            fullWidth
          />
          
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onClick={handleAddBook}
              isLoading={isSubmitting}
            >
              Kitap Ekle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookList;