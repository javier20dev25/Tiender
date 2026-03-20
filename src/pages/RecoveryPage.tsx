// src/pages/RecoveryPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Key, Lock, ArrowLeft, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

interface RecoveryPageProps {
  onSwitchToSignIn?: () => void;
}

const RecoveryPage: React.FC<RecoveryPageProps> = ({ onSwitchToSignIn }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'enter_code' | 'reset_password'>('enter_phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSwitchToSignIn = () => {
    if (onSwitchToSignIn) {
      onSwitchToSignIn();
    } else {
      navigate('/auth');
    }
  };

  const handleFindUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!whatsapp) {
      setErrorMessage('Introduce tu número de WhatsApp.');
      return;
    }
    setStep('enter_code');
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await getSupabase().functions.invoke('verify-backup-code', {
        body: { phone: whatsapp, code: recoveryCode },
      });

      if (error) throw new Error(error.message || 'Error al verificar el código.');

      if (data.success) {
        setStep('reset_password');
      } else {
        throw new Error(data.message || 'Código inválido o expirado.');
      }
    } catch (error: unknown) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await getSupabase().functions.invoke('verify-backup-code', {
        body: { phone: whatsapp, code: recoveryCode, newPassword },
      });

      if (error) throw new Error(error.message || 'Error al restablecer la contraseña.');

      if (data?.success) {
        navigate('/auth', { state: { passwordReset: true } });
      } else {
        throw new Error(data?.error || 'Error inesperado al restablecer la contraseña.');
      }
    } catch (error: unknown) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink/50 transition-all text-sm";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-brand-pink transition-colors";

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-pink/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-neon/10 blur-[120px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Sparkles className="w-10 h-10 text-brand-pink mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Recuperar Acceso</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Sigue los pasos para volver a tu tienda</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {step === 'enter_phone' && (
                <form onSubmit={handleFindUser} className="space-y-6">
                  <p className="text-zinc-400 text-sm text-center font-medium">Introduce tu número de WhatsApp para encontrar tu cuenta.</p>
                  <div className="relative group">
                    <Phone className={iconClasses} />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Tu WhatsApp"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] shadow-xl shadow-brand-pink/10 transition-all">
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {step === 'enter_code' && (
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <p className="text-zinc-400 text-sm text-center font-medium">Introduce uno de tus códigos de recuperación de 8 dígitos.</p>
                  <div className="relative group">
                    <Key className={iconClasses} />
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Ej: ABC123XYZ"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] shadow-xl shadow-brand-pink/10 transition-all">
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <ArrowRight className="w-5 h-5" />}
                    <span>Verificar Código</span>
                  </button>
                </form>
              )}

              {step === 'reset_password' && (
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <p className="text-zinc-400 text-sm text-center font-medium">Código verificado. Elige una nueva contraseña segura.</p>
                  <div className="relative group">
                    <Lock className={iconClasses} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva Contraseña"
                      required
                      className={inputClasses}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 rounded-[22px] bg-sunset-gradient text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-[1.02] shadow-xl shadow-brand-pink/10 transition-all">
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <ArrowRight className="w-5 h-5" />}
                    <span>Restablecer Contraseña</span>
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black uppercase">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </motion.div>
          )}
        </div>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={handleSwitchToSignIn}
            className="px-6 py-3 rounded-2xl bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al login
          </button>
          <div className="text-[10px] font-black italic tracking-tighter uppercase opacity-30 text-white">Tiender Control Panel</div>
        </div>
      </motion.div>
    </div>
  );
};

export default RecoveryPage;
