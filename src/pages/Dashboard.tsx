import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useTranslation } from '../translations';
import StatCard from '../components/dashboard/StatCard';
import RecentProgramCard from '../components/dashboard/RecentProgramCard';
import { Book, ClipboardList, GraduationCap, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    stats, 
    recentPrograms, 
    fetchStats, 
    fetchRecentPrograms 
  } = useDataStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      fetchStats(user.id);
      fetchRecentPrograms(user.id);
    }
  }, [user, fetchStats, fetchRecentPrograms]);
  
  const handleStatCardClick = (route: string) => {
    navigate(route);
  };
  
  if (!user) return null;
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600">{t('welcome')}</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('totalStudents')}
          value={stats.studentCount}
          icon={GraduationCap}
          color="bg-indigo-600"
          delay={0.1}
          onClick={() => handleStatCardClick('/students')}
        />
        <StatCard
          title={t('totalBooks')}
          value={stats.bookCount}
          icon={Book}
          color="bg-purple-600"
          delay={0.2}
          onClick={() => handleStatCardClick('/books')}
        />
        <StatCard
          title={t('totalPrograms')}
          value={stats.programCount}
          icon={ClipboardList}
          color="bg-blue-600"
          delay={0.3}
          onClick={() => handleStatCardClick('/programs')}
        />
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl font-semibold text-gray-900"
        >
          {t('recentPrograms')}
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link to="/programs/new">
            <Button variant="primary" size="sm">
              <Plus size={16} className="mr-1" />
              {t('createProgram')}
            </Button>
          </Link>
        </motion.div>
      </div>
      
      {recentPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPrograms.map((program, index) => (
            <RecentProgramCard 
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
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-sm text-center"
        >
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noPrograms')}</h3>
          <p className="text-gray-600 mb-4">{t('createFirstProgram')}</p>
          <Link to="/programs/new">
            <Button variant="primary">
              <Plus size={16} className="mr-1" />
              {t('createProgram')}
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;