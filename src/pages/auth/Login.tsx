import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion } from 'framer-motion';
import { 
  GraduationCap, CheckCircle, BarChart3, BookmarkIcon, LockIcon, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('E-posta ve şifre gereklidir');
      return;
    }
    await login(email, password);
    if (!error) {
      toast.success('Giriş başarılı!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-indigo-100 flex">
      {/* Sol Taraf - Bilgi Paneli */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-blue-900/95"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-8"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
              <h1 className="ml-4 text-5xl font-bold text-white">ÖdevTakip</h1>
            </div>
            <p className="text-xl text-white/90 font-light mb-8 leading-relaxed">
              Eğitimde mükemmelliğe ulaşmak için geliştirilen modern ödev takip platformu. Sınıfınızı daha etkili yönetin, öğrenci başarısını artırın.
            </p>
          </motion.div>
          
          <div className="grid gap-8">
            {/* Özellik 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-start"
            >
              <div className="mt-1 p-2 rounded-lg bg-indigo-500/30">
                <CheckCircle className="h-6 w-6 text-indigo-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Ödev Takibi</h3>
                <p className="text-white/70">Haftalık programlar oluşturun, kitap ve sayfa bilgileri kaydedin</p>
              </div>
            </motion.div>
            
            {/* Özellik 2 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-start"
            >
              <div className="mt-1 p-2 rounded-lg bg-indigo-500/30">
                <BookmarkIcon className="h-6 w-6 text-indigo-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Özel Öğrenci Bağlantıları</h3>
                <p className="text-white/70">Öğrencilere ve velilere özel bağlantı ile kolay erişim</p>
              </div>
            </motion.div>
            
            {/* Özellik 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-start"
            >
              <div className="mt-1 p-2 rounded-lg bg-indigo-500/30">
                <BarChart3 className="h-6 w-6 text-indigo-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">İstatistikler</h3>
                <p className="text-white/70">Öğrenci performans verilerini analiz edin ve raporlayın</p>
              </div>
            </motion.div>
            
            {/* Özellik 4 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-start"
            >
              <div className="mt-1 p-2 rounded-lg bg-indigo-500/30">
                <LockIcon className="h-6 w-6 text-indigo-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Güvenlik</h3>
                <p className="text-white/70">Yalnızca öğretmenlerin giriş yapabildiği, öğrenci verilerini koruyan güvenli sistem</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Sağ Taraf - Giriş Formu */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 py-12">
        {/* Mobil Başlık - Yalnızca Mobil Görünümde */}
        <div className="lg:hidden mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-2xl bg-indigo-100">
              <GraduationCap className="h-10 w-10 text-indigo-700" />
            </div>
            <h1 className="ml-3 text-3xl font-bold text-indigo-900">ÖdevTakip</h1>
          </div>
          <p className="text-center text-gray-600 mb-6">
            Eğitimde mükemmelliğe ulaşmak için geliştirilen modern ödev takip platformu
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Hoş Geldiniz</h2>
            <p className="text-gray-600">Öğrencilerinizin gelişimini takip etmek için giriş yapın</p>
          </div>
          
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {(error || formError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{formError || error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div>
                <Input
                  label="E-posta Adresi"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  className="bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div>
                <Input
                  label="Şifre"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  className="bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  fullWidth
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all py-3 text-lg font-medium rounded-xl"
                >
                  <div className="flex items-center justify-center">
                    <span>Giriş Yap</span>
                    <Zap className="ml-2 h-5 w-5" />
                  </div>
                </Button>
              </div>
            </form>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-center text-gray-600">
                <span>Hesabınız yok mu?</span>
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-800 ml-1 transition-colors"
                >
                  Hemen Kayıt Olun
                </Link>
              </p>
            </div>
          </div>
          
          {/* Mobil özellikler */}
          <div className="lg:hidden mt-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <CheckCircle className="h-8 w-8 text-indigo-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Ödev Takibi</h3>
                <p className="text-gray-600 text-sm mt-1">Kitap ve sayfa bilgileri</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <BookmarkIcon className="h-8 w-8 text-indigo-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Özel Bağlantılar</h3>
                <p className="text-gray-600 text-sm mt-1">Kolay öğrenci erişimi</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <BarChart3 className="h-8 w-8 text-indigo-500 mb-2" />
                <h3 className="font-semibold text-gray-900">İstatistikler</h3>
                <p className="text-gray-600 text-sm mt-1">Performans verileri</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <LockIcon className="h-8 w-8 text-indigo-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Güvenlik</h3>
                <p className="text-gray-600 text-sm mt-1">Veri koruma sistemi</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;