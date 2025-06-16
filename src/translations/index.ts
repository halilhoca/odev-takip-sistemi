import { useLanguageStore } from '../store/languageStore';

export const translations = {
  tr: {
    // Auth
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    confirmPassword: 'Şifreyi Onaylayın',
    dontHaveAccount: 'Hesabınız yok mu?',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    registerNow: 'Şimdi Kayıt Olun',
    signIn: 'Giriş Yapın',
    
    // Navigation
    dashboard: 'Genel Bakış',
    students: 'Öğrenciler',
    books: 'Kitaplar',
    programs: 'Programlar',
    progress: 'İlerleme',
    logout: 'Çıkış Yap',
    
    // Dashboard
    totalStudents: 'Toplam Öğrenci',
    totalBooks: 'Toplam Kitap',
    totalPrograms: 'Toplam Program',
    viewAll: 'Tümünü Gör',
    recentPrograms: 'Son Programlar',
    
    // Students
    addStudent: 'Öğrenci Ekle',
    studentName: 'Öğrenci Adı',
    studentEmail: 'Öğrenci E-postası (İsteğe bağlı)',
    class: 'Sınıf',
    noStudents: 'Henüz öğrenci eklenmemiş',
    
    // Books
    addBook: 'Kitap Ekle',
    bookTitle: 'Kitap Adı',
    author: 'Yazar',
    noBooks: 'Henüz kitap eklenmemiş',
    
    // Programs
    createProgram: 'Program Oluştur',
    programTitle: 'Program Başlığı',
    selectStudent: 'Öğrenci Seçin',
    programType: 'Program Türü',
    timedProgram: 'Saatli Program',
    untimedProgram: 'Saatsiz Program',
    noPrograms: 'Henüz program oluşturulmamış',
    
    // Common
    add: 'Ekle',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    save: 'Kaydet',
    loading: 'Yükleniyor...',
    success: 'Başarılı',
    error: 'Hata',
    confirm: 'Onayla',
    back: 'Geri',
  },
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    registerNow: 'Register Now',
    signIn: 'Sign In',
    
    // Navigation
    dashboard: 'Dashboard',
    students: 'Students',
    books: 'Books',
    programs: 'Programs',
    progress: 'Progress',
    logout: 'Logout',
    
    // Dashboard
    totalStudents: 'Total Students',
    totalBooks: 'Total Books',
    totalPrograms: 'Total Programs',
    viewAll: 'View All',
    recentPrograms: 'Recent Programs',
    
    // Students
    addStudent: 'Add Student',
    studentName: 'Student Name',
    studentEmail: 'Student Email (Optional)',
    class: 'Class',
    noStudents: 'No students added yet',
    
    // Books
    addBook: 'Add Book',
    bookTitle: 'Book Title',
    author: 'Author',
    noBooks: 'No books added yet',
    
    // Programs
    createProgram: 'Create Program',
    programTitle: 'Program Title',
    selectStudent: 'Select Student',
    programType: 'Program Type',
    timedProgram: 'Timed Program',
    untimedProgram: 'Untimed Program',
    noPrograms: 'No programs created yet',
    
    // Common
    add: 'Add',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    back: 'Back',
  },
};

export type TranslationKey = keyof typeof translations.en;

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  const t = (key: TranslationKey) => {
    return translations[language][key];
  };
  
  return { t, language };
};