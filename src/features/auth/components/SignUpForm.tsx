// src/features/auth/components/SignUpForm.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, Lock, Rocket, AlertCircle, Info, Hash } from 'lucide-react';
import { getSupabase } from '../../../lib/supabaseClient';
import BackupCodesModal from './BackupCodesModal';
import html2canvas from 'html2canvas';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [countryCode, setCountryCode] = useState('+505');
  const [useEmail, setUseEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const navigate = useNavigate();

  const handleDownloadCodes = useCallback(async () => {
    const codesContainer = document.getElementById('recovery-codes-content');
    if (!codesContainer) return;

    try {
      const canvas = await html2canvas(codesContainer);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'tiender-recovery-codes.png';
      link.href = image;
      link.click();
      navigate('/dashboard');
    } catch (error) {
      console.error("Error downloading codes:", error);
    }
  }, [navigate]);

  /** Extract a meaningful error message from a Supabase Edge Function error */
  const extractEdgeFunctionError = async (error: unknown): Promise<string> => {
    // FunctionsHttpError has a .context property which is the Response object
    if (error && typeof error === 'object' && 'context' in error) {
      try {
        const response = (error as { context: Response }).context;
        const body = await response.json();
        if (body?.message) return body.message;
      } catch {
        // Fall through to generic message
      }
    }
    if (error instanceof Error) return error.message;
    return 'Error inesperado al procesar tu solicitud.';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setIsLoadingCodes(true);
    setIsModalOpen(true);

    try {
      const fullPhone = `${countryCode}${whatsapp.trim()}`;
      const normalizedPhone = fullPhone.replace(/\D/g, '');
      let codesGenerated = false;

      if (useEmail) {
        const { data: signUpData, error: signUpError } = await getSupabase().auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("User creation failed.");

        try {
          const invokeResponse = await getSupabase().functions.invoke('generate-backup-codes', {
            body: { userId: signUpData.user.id },
          });
          const { data: codesData, error: codesError } = invokeResponse;
          if (!codesError && codesData?.plain_codes) {
            setBackupCodes(codesData.plain_codes);
            codesGenerated = true;
          }
        } catch (codesErr) {
          console.error("Non-blocking error generating backup codes:", codesErr);
        }

        await getSupabase().auth.signInWithPassword({ email, password });
      } else {
        // WhatsApp flow: Use Edge Function (creates user, store, trial, AND codes atomically)
        const { data: orchestrateData, error: orchestrateError } = await getSupabase().functions.invoke('orchestrate-signup', {
          body: { phone: fullPhone, password }
        });

        if (orchestrateError) {
          const msg = await extractEdgeFunctionError(orchestrateError);
          throw new Error(msg);
        }
        if (orchestrateData?.error_code) throw new Error(orchestrateData.message);

        // Get backup codes from the same response (if generated)
        if (orchestrateData?.backup_codes) {
          setBackupCodes(orchestrateData.backup_codes);
          codesGenerated = true;
        }

        // Login using shadow email
        const { error: signInError } = await getSupabase().auth.signInWithPassword({
          email: `${normalizedPhone}@tiender.app`,
          password,
        });
        if (signInError) throw signInError;
      }

      setIsLoadingCodes(false);

      // If no backup codes were generated, skip the modal and go directly to dashboard
      if (!codesGenerated) {
        setIsModalOpen(false);
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      setErrorMessage((error as Error).message || 'Error inesperado.');
      setIsModalOpen(false);
      setIsLoadingCodes(false);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink/50 transition-all text-sm";
  const labelClasses = "flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2";
  const iconClasses = "absolute left-4 top-[42px] w-5 h-5 text-zinc-600 group-focus-within:text-brand-pink transition-colors";

  const countries = [
    { code: '+505', flag: '🇳🇮' }, { code: '+52', flag: '🇲🇽' }, { code: '+57', flag: '🇨🇴' },
    { code: '+1', flag: '🇺🇸' }, { code: '+34', flag: '🇪🇸' }, { code: '+54', flag: '🇦🇷' },
    { code: '+56', flag: '🇨🇱' }, { code: '+51', flag: '🇵🇪' }, { code: '+506', flag: '🇨🇷' },
    { code: '+502', flag: '🇬🇹' }, { code: '+504', flag: '🇭🇳' }, { code: '+503', flag: '🇸🇻' },
    { code: '+507', flag: '🇵🇦' }, { code: '+591', flag: '🇧🇴' }, { code: '+593', flag: '🇪🇨' },
    { code: '+598', flag: '🇺🇾' }, { code: '+595', flag: '🇵🇾' }, { code: '+58', flag: '🇻🇪' }
  ];

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Únete a la Revolución</h2>
        <p className="text-zinc-500 text-xs font-medium mt-1">Crea tu cuenta y empieza a vender en segundos</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {useEmail ? (
            <div className="relative group">
              <label htmlFor="signup-email" className={labelClasses}><Mail className="w-3 h-3" /> Email</label>
              <Mail className={iconClasses} />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
            </div>
          ) : (
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
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-10 py-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 transition-all font-bold text-sm"
                    />
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
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setUseEmail(!useEmail)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-brand-pink transition-colors"
            >
              {useEmail ? 'O USAR WHATSAPP' : 'O USAR EMAIL'}
            </button>
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
          disabled={loading || isLoadingCodes}
          className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-brand-pink/10"
        >
          {loading || isLoadingCodes ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Rocket className="w-5 h-5" />}
          <span>{loading || isLoadingCodes ? 'Preparando Cohete' : 'Crear Mi Tienda'}</span>
        </button>
      </form>

      {isModalOpen && (
        <BackupCodesModal
          codes={backupCodes}
          isLoading={isLoadingCodes}
          onClose={() => {
            setIsModalOpen(false);
            if (backupCodes) navigate('/dashboard');
          }}
          onDownload={handleDownloadCodes}
          onConfirm={() => {
            setIsModalOpen(false);
            if (backupCodes) navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};
