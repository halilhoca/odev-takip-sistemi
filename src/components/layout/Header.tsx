import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Book, GraduationCap, Layout, LogOut, Globe } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const t = (key: string) => {
    const tr = {
      dashboard: 'Genel Bakış',
      students: 'Öğrenciler',
      books: 'Kitaplar',
      programs: 'Programlar',
      logout: 'Çıkış Yap',
    };
    return tr[key] || key;
  };
  
  if (!user) return null;
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ÖdevTakip</span>
            </Link>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <motion.nav 
              className="flex space-x-4 items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                to="/"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center"
              >
                <Layout className="h-4 w-4 mr-1" />
                <span>{t('dashboard')}</span>
              </Link>
              
              <Link
                to="/students"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center"
              >
                <GraduationCap className="h-4 w-4 mr-1" />
                <span>{t('students')}</span>
              </Link>
              
              <Link
                to="/books"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center"
              >
                <Book className="h-4 w-4 mr-1" />
                <span>{t('books')}</span>
              </Link>
            </motion.nav>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>{t('logout')}</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;