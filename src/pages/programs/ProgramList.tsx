import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import ProgramCard from '../../components/programs/ProgramCard';
import { ClipboardList, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProgramList: React.FC = () => {
  const { user } = useAuthStore();
  const { programs, fetchPrograms } = useDataStore();
  
  useEffect(() => {
    if (user) {
      fetchPrograms(user.id);
    }
  }, [user, fetchPrograms]);
  
  if (!user) return null;
  
  // Sadeleştirilmiş program listesi: Tüm programları tek gridde göster
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Programlar</h1>
          <p className="text-gray-600">Öğrenci ödev programlarını yönetin</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/programs/new">
            <Button variant="primary">
              <Plus size={16} className="mr-1" />
              Program Oluştur
            </Button>
          </Link>
        </motion.div>
      </div>
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <ProgramCard 
              key={program.id} 
              program={program} 
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
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz program yok</h3>
          <p className="text-gray-600 mb-4">İlk ödev programınızı oluşturun</p>
          <Link to="/programs/new">
            <Button variant="primary">
              <Plus size={16} className="mr-1" />
              Program Oluştur
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default ProgramList;