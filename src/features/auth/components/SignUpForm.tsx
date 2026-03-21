// src/features/auth/components/SignUpForm.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Rocket, AlertCircle, Info, Hash, Mail } from 'lucide-react';
import { getSupabase } from '../../../lib/supabaseClient';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [countryCode, setCountryCode] = useState('+505');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const countries = [
    { code: '+505', flag: '🇳🇮', length: 8 },
    { code: '+52', flag: '🇲🇽', length: 10 },
    { code: '+57', flag: '🇨🇴', length: 10 },
    { code: '+1', flag: '🇺🇸', length: 10 },
    { code: '+34', flag: '🇪🇸', length: 9 },
    { code: '+54', flag: '🇦🇷', length: 10 },
    { code: '+56', flag: '🇨🇱', length: 9 },
    { code: '+51', flag: '🇵🇪', length: 9 },
    { code: '+506', flag: '🇨🇷', length: 8 },
    { code: '+502', flag: '🇬🇹', length: 8 },
    { code: '+504', flag: '🇭🇳', length: 8 },
    { code: '+503', flag: '🇸🇻', length: 8 },
    { code: '+507', flag: '🇵🇦', length: 8 },
    { code: '+591', flag: '🇧🇴', length: 8 },
    { code: '+593', flag: '🇪🇨', length: 9 },
    { code: '+598', flag: '🇺🇾', length: 8 },
    { code: '+595', flag: '🇵🇾', length: 9 },
    { code: '+58', flag: '🇻🇪', length: 10 }
  ];

  const currentCountry = countries.find(c => c.code === countryCode) || countries[0];

  /** Extract a meaningful error message from a Supabase Edge Function error */
  const extractEdgeFunctionError = async (error: unknown): Promise<string> => {
    if (error && typeof error === 'object' && 'context' in error) {
      try {
        const response = (error as { context: Response }).context;
        const body = await response.json();
        if (body?.message) return body.message;
      } catch {
        // Fall through
      }
    }
    if (error instanceof Error) return error.message;
    return 'Error inesperado al procesar tu solicitud.';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    const cleanedWhatsapp = whatsapp.replace(/\D/g, '');
    
    if (cleanedWhatsapp.length !== currentCountry.length) {
      setErrorMessage(`El número para ${currentCountry.flag} debe tener exactamente ${currentCountry.length} dígitos.`);
      triggerShake();
      setLoading(false);
      return;
    }

    try {
      const fullPhone = `${countryCode}${cleanedWhatsapp}`;
      const searchParams = new URLSearchParams(location.search);
      const selectedPlan = searchParams.get('plan') || 'standard';

      const { data: orchestrateData, error: orchestrateError } = await getSupabase().functions.invoke('orchestrate-signup', {
        body: {
          phone: fullPhone,
          password,
          selectedPlan,
          recovery_email: recoveryEmail.trim() || null
        }
      });

      if (orchestrateError) {
        const msg = await extractEdgeFunctionError(orchestrateError);
        throw new Error(msg);
      }
      if (orchestrateData?.error_code) throw new Error(orchestrateData.message);

      console.log('Orchestrate signup successful, attempting automatic login...');
      
      const authPhone = fullPhone.replace(/\D/g, '');
      // Login using shadow email (MUST match exactly the one created in orchestrate-signup)
      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email: `${authPhone}@tiender.app`,
        password,
      });

      if (signInError) {
        console.error('Auto-login failed after signup:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Cuenta creada con éxito, pero hubo un problema iniciando tu sesión automática. Por favor, ve a "Iniciar Sesión" e ingresa con tu número y contraseña.');
        }
        throw signInError;
      }

      console.log('Auto-login successful, redirecting to dashboard...');
      navigate('/dashboard');
    } catch (error: unknown) {
      setErrorMessage((error as Error).message || 'Error inesperado.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink/50 transition-all text-sm";
  const labelClasses = "flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2";
  const iconClasses = "absolute left-4 top-[42px] w-5 h-5 text-zinc-600 group-focus-within:text-brand-pink transition-colors";

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Únete a la Revolución</h2>
        <p className="text-zinc-500 text-xs font-medium mt-1">Crea tu cuenta y empieza a vender en segundos</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group flex flex-col">
              <label htmlFor="signup-whatsapp" className={labelClasses}><Phone className="w-3 h-3" /> WhatsApp del Negocio</label>
              <div className="flex gap-2">
                <select
                  id="signup-country-code"
                  name="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[100px] bg-zinc-800/50 border border-white/5 rounded-2xl px-3 py-4 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all appearance-none text-center font-bold"
                  aria-label="Código de país"
                >
                  {countries.map(c => <option key={c.code} value={c.code} className="bg-zinc-900">{c.flag} {c.code}</option>)}
                </select>
                <div className="relative flex-grow group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-brand-pink" />
                  <input
                    id="signup-whatsapp"
                    name="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    placeholder="8888 8888"
                    maxLength={currentCountry.length}
                    required
                    value={whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= currentCountry.length) setWhatsapp(val);
                    }}
                    className={`w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-10 py-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all font-bold text-sm ${isShake ? 'animate-shake' : ''}`}
                  />
                  {whatsapp.length > 0 && whatsapp.length < currentCountry.length && (
                    <span className="absolute -bottom-5 right-2 text-[9px] text-zinc-500 font-bold uppercase tabular-nums">
                      Faltan {currentCountry.length - whatsapp.length} dígitos
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-pink shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                Este será el número oficial de tu negocio. Por seguridad, <span className="text-white font-bold italic">no podrá ser cambiado</span> después del registro.
              </p>
            </div>
          </div>

          <div className="relative group">
            <label htmlFor="signup-password" className={labelClasses}><Lock className="w-3 h-3" /> Password</label>
            <Lock className={iconClasses} />
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="relative group">
            <label htmlFor="signup-email" className={labelClasses}><Mail className="w-3 h-3" /> Correo de Recuperación (Opcional)</label>
            <Mail className="absolute left-4 top-[42px] w-5 h-5 text-zinc-600 group-focus-within:text-brand-pink transition-colors" />
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              className={inputClasses}
            />
            <p className="text-[9px] text-zinc-600 font-medium mt-2 ml-1">
              Lo usaremos solo para recuperar tu cuenta si olvidas la contraseña.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
            <button type="button" onClick={onSwitchToSignIn} className="text-[9px] font-bold text-zinc-500 hover:text-white underline text-left ml-6">
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-brand-pink/10"
        >
          {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Rocket className="w-5 h-5" />}
          <span>{loading ? 'Preparando Cohete' : 'Crear Mi Tienda'}</span>
        </button>
      </form>
    </div>
  );
};
