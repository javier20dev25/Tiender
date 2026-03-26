// src/pages/HomePage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Share2, ShoppingBag } from 'lucide-react';
import { PlanCard } from '../components/PlanCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlanSelection = (planType: string) => {
    navigate(`/upgrade?plan=${planType.toLowerCase()}`);
  };

  const standardFeatures = [
    "Hasta 30 productos",
    "Analíticas básicas de visitas",
    "Integración con WhatsApp",
    "Swipe Experience",
  ];

  const fullFeatures = [
    "Hasta 60 productos",
    "Analíticas y reportes de IA",
    "Integración con WhatsApp",
    "Ofertas 'Match' gamificadas",
    "Vende en Piloto Automático",
  ];

  return (
    <div className="bg-brand-dark min-h-screen text-white overflow-x-hidden selection:bg-brand-pink/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-neon/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32">
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
            className="flex flex-col sm:flex-row gap-6"
          >
            <button
              onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-5 rounded-[22px] bg-white text-black font-black uppercase tracking-tighter italic flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Empezar Prueba Gratis
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="px-12 py-5 rounded-[22px] bg-zinc-800/50 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-zinc-700/50 transition-all backdrop-blur-md">
              Ver Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-24 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink mb-6 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Viralidad Nativa</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Formato vertical optimizado para TikTok, Instagram y WhatsApp. Comparte y deja que el Swipe haga el resto.</p>
          </div>
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Social Commerce</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Cero fricción. Tus clientes eligen, hacen Match y te contactan directamente por WhatsApp para cerrar.</p>
          </div>
          <div className="p-8 rounded-[40px] bg-zinc-900 border border-white/5 relative group">
            <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 italic">Ventas con IA</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">Reportes inteligentes y consultoría IA para saber qué productos están funcionando y por qué.</p>
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-cyan/5 -skew-y-3 origin-top-left -z-10"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className="px-4 py-1.5 rounded-full bg-zinc-800/50 border border-brand-cyan/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-flex items-center gap-2 text-brand-cyan">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div>
              Agent-Ready Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-6">
              Tiender for <br/><span className="bg-brand-cyan bg-clip-text text-transparent">AI Agents</span>
            </h2>
            <p className="text-zinc-400 font-medium leading-relaxed mb-8">
              Delega la creación, gestión y análisis de tu tienda completamente a la Inteligencia Artificial. Nuestra renovada CLI permite a cualquier Agente crear una cuenta (o usar la tuya) para automatizar tareas, administrar productos y orquestar decisiones con permisos 100% seguros y respaldados por RLS.
            </p>
            <div className="flex gap-4">
              <Link to="/cli" className="px-8 py-4 rounded-[18px] bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold uppercase tracking-wider text-xs hover:bg-brand-cyan/20 transition-all flex items-center gap-2">
                Ver Docs de CLI <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="rounded-[24px] bg-[#0A0A0A] border border-white/10 p-6 font-mono text-sm shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-brand-neon"></div>
              <div className="flex gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="text-zinc-500 mb-2">$ npm run tiender -- help</div>
              <div className="text-brand-cyan mb-6">▶ Tiender CLI initialized (Agent Mode)</div>
              
              <div className="text-zinc-500 mb-2">$ npm run tiender -- create-store --name "AI Store"</div>
              <div className="text-white mb-6"><span className="text-brand-pink">✔</span> Store created successfully. URL: /ai-store</div>
              
              <div className="text-zinc-500 mb-2">$ npm run tiender -- add-product --title "Consulting"</div>
              <div className="text-white mb-1"><span className="text-brand-pink">✔</span> Product synced correctly. Dashboard updated.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="px-6 py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-pink/5 blur-[150px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">Elige tu velocidad</h2>
            <p className="text-zinc-500 text-lg font-medium">Todos los planes incluyen 7 días de acceso premium sin cargo.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <PlanCard
              planName="Standard"
              price="$10"
              features={standardFeatures}
              onSelect={() => handlePlanSelection('Standard')}
              loading={false}
              buttonText="Lanzar Standard"
            />
            <PlanCard
              planName="Full"
              price="$25"
              features={fullFeatures}
              onSelect={() => handlePlanSelection('Full')}
              loading={false}
              isFeatured={true}
              buttonText="Escalar al Full"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-20 border-t border-white/5">
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
