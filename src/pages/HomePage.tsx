// src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Share2, ShoppingBag, LogIn, Sparkles } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="bg-brand-dark min-h-screen text-white overflow-x-hidden selection:bg-brand-pink/30 flex flex-col justify-between">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-neon/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Top Navbar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Tiender<span className="text-brand-pink">.</span>
          </span>
        </Link>
        <Link
          to="/auth?mode=signin"
          className="px-6 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all backdrop-blur-md hover:scale-105 active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5 text-brand-neon" />
          <span>Iniciar sesión</span>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-24 my-auto">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 rounded-full bg-zinc-800/50 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-ping"></div>
            Vende viralmente hoy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-center mb-8 uppercase italic tracking-tighter leading-[0.9]"
          >
            Tu Tienda <br />
            <span className="bg-sunset-gradient bg-clip-text text-transparent">Social es Real</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-zinc-500 text-center max-w-2xl mb-12 font-medium"
          >
            Transforma tu catálogo en una experiencia adictiva tipo Swipe.
            Conecta con tus clientes donde pasan su tiempo y vende por WhatsApp en segundos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto items-center"
          >
            <Link
              to="/auth?mode=signin"
              className="w-full sm:w-auto px-10 py-5 rounded-[22px] bg-white text-black font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            >
              <LogIn className="w-5 h-5 text-brand-dark" />
              <span>Iniciar sesión</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/auth?mode=signup"
              className="w-full sm:w-auto px-10 py-5 rounded-[22px] bg-zinc-800/60 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-zinc-700/60 transition-all backdrop-blur-md flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-brand-pink" />
              <span>Crear cuenta</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-20 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group hover:border-brand-pink/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink mb-6 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Viralidad Nativa</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Formato vertical optimizado para TikTok, Instagram y WhatsApp. Comparte tu link y deja que el Swipe haga el resto.</p>
          </div>
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group hover:border-brand-cyan/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Social Commerce</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Cero fricción. Tus clientes eligen productos, arman su carrito con envío y te contactan directamente a tu WhatsApp para cerrar la compra.</p>
          </div>
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group hover:border-brand-yellow/20 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Ventas con IA</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Analíticas inteligentes y reportes automatizados para entender qué productos tienen mayor tracción y maximizar tu conversión.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="text-3xl font-black italic tracking-tighter uppercase mb-2 opacity-50">Tiender.</div>
            <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">Built for the Social Era</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terminos" className="text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-wider transition-colors">
              Términos
            </Link>
            <Link to="/privacidad" className="text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-wider transition-colors">
              Privacidad
            </Link>
          </div>
          <p className="text-zinc-800 text-xs font-medium">© {new Date().getFullYear()} Tiender. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
