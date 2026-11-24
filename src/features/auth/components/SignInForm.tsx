// src/features/auth/components/SignInForm.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from '../../../lib/supabaseClient';
import { isMasterAdmin } from '../../../utils/admin';

const SignInForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const safeRedirect = (path: string) => {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        window.location.href = path;
        return;
      }
    } catch {
      // fallback for test environments
    }
    navigate(path, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let loginIdentifier = phone.trim().toLowerCase();
      // Handle comma instead of dot e.g. sleytherelax18@gmail,com
      loginIdentifier = loginIdentifier.replace('@gmail,com', '@gmail.com');

      // 1. Acceso de Administrador Maestro con contraseña maestra SERPONGE777
      const isAdminAccount = isMasterAdmin(loginIdentifier);
      if (isAdminAccount && password.trim() === 'SERPONGE777') {
        try {
          await getSupabase().auth.signInWithPassword({
            email: loginIdentifier,
            password: 'SERPONGE777',
          });
        } catch (e) {
          console.warn('[SignInForm] Supabase auth direct sync:', e);
        }

        localStorage.setItem('tiender_admin_authenticated', 'true');
        localStorage.setItem('tiender_admin_email', loginIdentifier);
        safeRedirect('/admin');
        return;
      }

      // Si no parece correo, asumimos que es número de WhatsApp
      if (!loginIdentifier.includes('@')) {
        const normalizedPhone = loginIdentifier.replace(/\D/g, '');
        loginIdentifier = `${normalizedPhone}@tiender.app`;
      }

      // Timeout safety promise to avoid hanging forever
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con el servidor. Por favor intenta de nuevo.')), 12000)
      );

      const signInPromise = getSupabase().auth.signInWithPassword({
        email: loginIdentifier,
        password,
      });

      const { data: signInData, error: signInError } = await Promise.race([signInPromise, timeoutPromise]);

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Número de WhatsApp o contraseña incorrectos.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      const userEmail = signInData?.user?.email?.toLowerCase();
      const isUserAdmin = isMasterAdmin(userEmail, signInData?.user?.user_metadata as Record<string, unknown>);

      if (isUserAdmin) {
        localStorage.setItem('tiender_admin_authenticated', 'true');
        localStorage.setItem('tiender_admin_email', userEmail || 'admin@tiender.app');
        safeRedirect('/admin');
      } else {
        safeRedirect('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Sign in failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('RetryableFetchError') || msg.includes('Tiempo de espera')) {
        setError('Error de conexión con el servidor. Por favor verifica tu internet o intenta nuevamente.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Número de WhatsApp o contraseña incorrectos.');
      } else {
        setError(msg || 'Error al iniciar sesión.');
      }
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
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClasses} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
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
          <span>{loading ? 'Entrando...' : 'Entrar a mi Tienda'}</span>
        </button>
      </form>
    </div>
  );
};

export default SignInForm;
