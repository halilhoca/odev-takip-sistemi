import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-500 via-purple-400 to-pink-300">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <GraduationCap className="h-16 w-16 text-white drop-shadow-lg bg-gradient-to-tr from-pink-400 to-indigo-500 rounded-full p-3" />
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
          ÖdevTakip
        </h2>
        <p className="mt-2 text-center text-base text-white/80 font-medium">
          ÖdevTakip ile ödevlerini kolayca takip et
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white/90 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white/40 backdrop-blur-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(error || formError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {formError || error}
              </div>
            )}
            
            <Input
              label="E-posta Adresi"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <Input
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                fullWidth
                className="bg-gradient-to-r from-indigo-500 to-pink-400 border-0 text-white shadow-lg hover:from-indigo-600 hover:to-pink-500"
              >
                Giriş Yap
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              <span>Hesabınız yok mu?</span>
              <Link
                to="/register"
                className="font-bold text-pink-500 hover:text-indigo-600 ml-1 transition-colors"
              >
                Hemen Kayıt Olun
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;