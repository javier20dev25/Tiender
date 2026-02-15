// src/pages/AuthPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignUpForm } from '../features/auth/components/SignUpForm';
import SignInForm from '../features/auth/components/SignInForm';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(true);

  const switchToSignIn = () => setIsSignUp(false);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-neon/10 blur-[120px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Tiender.</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">El futuro de tu tienda empieza aquí</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {isSignUp ? (
                <SignUpForm onSwitchToSignIn={switchToSignIn} />
              ) : (
                <SignInForm />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="px-6 py-3 rounded-2xl bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-widest border border-white/5"
            role="button"
          >
            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;