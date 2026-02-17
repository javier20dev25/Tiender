// src/features/auth/components/SignInForm.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../../lib/supabaseClient';

const SignInForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let loginIdentifier = phone.trim();

      // If it doesn't look like an email, assume it's a phone number and transform to shadow email
      if (!loginIdentifier.includes('@')) {
        const normalizedPhone = loginIdentifier.replace(/\D/g, '');
        loginIdentifier = `${normalizedPhone}@tiender.app`;
      }

      const { error } = await getSupabase().auth.signInWithPassword({
        email: loginIdentifier,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Número de WhatsApp o contraseña incorrectos.');
        } else {
          setError(error.message);
        }
        throw error;
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 focus:border-brand-neon/50 transition-all text-sm";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-brand-neon transition-colors";

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bienvenido de vuelta</h2>
        <p className="text-zinc-500 text-xs font-medium mt-1">Ingresa tus credenciales para continuar</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative group">
            <label htmlFor="signin-phone" className="sr-only">Número de WhatsApp o Email</label>
            <Phone className={iconClasses} />
            <input
              id="signin-phone"
              name="phone"
              type="text"
              autoComplete="username"
              placeholder="Número de WhatsApp o Email"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="relative group">
            <label htmlFor="signin-password" className="sr-only">Contraseña</label>
            <Lock className={iconClasses} />
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/recovery" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-brand-neon transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black uppercase">
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-brand-pink/10"
        >
          {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <ArrowRight className="w-5 h-5" />}
          <span>{loading ? 'Entrando' : 'Entrar a mi Tienda'}</span>
        </button>
      </form>
    </div>
  );
};

export default SignInForm;
