// src/components/PasswordChangeModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { getSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      let accessToken = '';
      let userId = '';

      try {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || '';
        userId = session?.user?.id || '';
      } catch {
        // Fallback a localStorage
      }

      if (!accessToken && typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('antigravity-auth-token');
          if (raw) {
            const parsed = JSON.parse(raw);
            accessToken = parsed?.access_token || parsed?.currentSession?.access_token || '';
            userId = parsed?.user?.id || parsed?.currentSession?.user?.id || '';
          }
        } catch {
          // ignore
        }
      }

      let updated = false;

      // Método 1: Direct REST PUT a /auth/v1/user (rápido, sin bloqueo de locks del navegador)
      if (accessToken) {
        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), 7000);
          const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              password: newPassword,
              data: { must_change_password: false }
            }),
            signal: controller.signal
          });
          clearTimeout(tId);
          if (res.ok) {
            updated = true;
          }
        } catch (fetchErr) {
          console.warn('[PasswordChangeModal] Direct fetch attempt error:', fetchErr);
        }
      }

      // Método 2: Edge Function admin-manage-users
      if (!updated && userId) {
        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), 7000);
          const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-manage-users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              action: 'update-password',
              payload: { userId, password: newPassword }
            }),
            signal: controller.signal
          });
          clearTimeout(tId);
          if (res.ok) {
            updated = true;
          }
        } catch (fnErr) {
          console.warn('[PasswordChangeModal] Function attempt error:', fnErr);
        }
      }

      // Método 3: Standard supabase.auth.updateUser con timeout de seguridad
      if (!updated) {
        const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con el servidor.')), 8000)
        );
        const updatePromise = supabase.auth.updateUser({
          password: newPassword,
          data: { must_change_password: false }
        });
        const res = await Promise.race([updatePromise, timeoutPromise]);
        if ('error' in res && res.error) {
          throw res.error;
        }
        updated = true;
      }

      // Actualizar metadata en caché local para que la UI no vuelva a abrir el modal
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('antigravity-auth-token');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.user?.user_metadata) {
              parsed.user.user_metadata.must_change_password = false;
            }
            if (parsed?.currentSession?.user?.user_metadata) {
              parsed.currentSession.user.user_metadata.must_change_password = false;
            }
            localStorage.setItem('antigravity-auth-token', JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        window.location.reload();
      }, 1200);
    } catch (err: unknown) {
      console.error('[PasswordChangeModal] Error updating password:', err);
      const msg = err instanceof Error ? err.message : 'Error al actualizar la contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-zinc-900 border border-brand-neon/30 rounded-[35px] p-8 shadow-2xl shadow-brand-neon/10 text-center z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
          Actualiza tu Contraseña
        </h2>
        <p className="text-zinc-400 text-xs font-medium mb-6 leading-relaxed">
          Has ingresado con la contraseña temporal asignada por el administrador. Por seguridad, define tu contraseña personal para acceder en el futuro.
        </p>

        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-brand-neon/10 border border-brand-neon/30 rounded-2xl flex flex-col items-center gap-3 text-brand-neon"
          >
            <CheckCircle className="w-10 h-10" />
            <p className="font-bold text-sm">¡Contraseña actualizada exitosamente!</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 mb-1 block">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-800/60 border border-white/5 rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                  title={showNewPassword ? "Ocultar" : "Mostrar"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 mb-1 block">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-800/60 border border-white/5 rounded-2xl pl-11 pr-11 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                  title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-2xl bg-sunset-gradient text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-pink/20 disabled:opacity-40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Guardar y Continuar al Dashboard</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
