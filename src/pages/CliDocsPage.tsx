import React, { useEffect } from 'react';
import { Terminal, Copy, CheckCircle2, Box, CreditCard, Code2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#0A0A0A] border border-white/10 my-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan/50 to-brand-neon/50"></div>
      <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs text-zinc-500 font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="text-zinc-500 hover:text-white transition-colors p-1"
          aria-label="Copy code"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-brand-green" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default function CliDocsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-cyan/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-cyan/10 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-brand-neon/10 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">
            Tiender.
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">
              App
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest mb-6">
            <Terminal className="w-3 h-3" />
            Developer Docs
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
            Tiender <span className="bg-brand-cyan bg-clip-text text-transparent">CLI</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl">
            La herramienta definitiva para automatizar tu Social Store. Diseñada para Desarrolladores y <strong className="text-white">Agentes de IA</strong>.
          </p>
        </header>

        <div className="space-y-16">
          {/* Quick Start Segment */}
          <section id="getting-started">
            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-3">
              <Cpu className="w-6 h-6 text-brand-cyan" /> 1. Instalación Rápida
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              <p className="text-zinc-400">
                La CLI de Tiender permite gestionar tu tienda directamente desde la terminal. Puedes crear cuentas, gestionar productos, ver estadísticas y operar bajo el mismo entorno seguro (User RLS) que la app web.
              </p>
              <p className="text-zinc-400 mt-4">Asegúrate de tener instalado <strong>Node.js</strong> y <strong>Bun</strong> (o npm).</p>
              
              <CodeBlock code={'# Instalar dependencias del proyecto\nbun install\n\n# Probar el comando help usando nuestro shortcut\nnpm run tiender -- help'} language="bash" />
            </div>
          </section>

          {/* Authentication Segment */}
          <section id="authentication">
            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-3">
              <Code2 className="w-6 h-6 text-brand-neon" /> 2. Autenticación
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              <p className="text-zinc-400 mb-4">
                Inicia sesión para generar tu sesión local (<code>.session.json</code>). Agentes pueden inyectar esto en sus automatizaciones fácilmente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-2">Login</h3>
                  <CodeBlock code={'npm run tiender -- login --email ai@agent.com --password super_secret'} />
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-2">Status & Logout</h3>
                  <CodeBlock code={'npm run tiender -- status\nnpm run tiender -- logout'} />
                </div>
              </div>
            </div>
          </section>

          {/* Store Creation Segment */}
          <section id="store-management">
            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-3">
              <Box className="w-6 h-6 text-brand-pink" /> 3. Gestión de Tienda y Productos
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Crear tu tienda Base</h3>
                <p className="text-zinc-400 mb-4">Si no tienes tienda, la CLI te permite crearla y generar tu slug público automáticamente.</p>
                <CodeBlock code={'npm run tiender -- create-store --name "AI Store" --slug "ai-store"'} />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Añadir Múltiples Productos (Carga masiva)</h3>
                <p className="text-zinc-400 mb-4">Agrega inventario dinámicamente o actualízalo mediante IDs.</p>
                <CodeBlock code={'npm run tiender -- add-product --name "Plan Inteligente" --price 19.99 --description "Suscripción base"\nnpm run tiender -- list-products\nnpm run tiender -- update-product --id "UUID" --price 25.00'} />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Ver Métricas</h3>
                <p className="text-zinc-400 mb-4">La CLI extraerá los views, clics de WhatsApp y likes en formato JSON consumible (agentes amigables).</p>
                <CodeBlock code={'npm run tiender -- stats'} />
              </div>
            </div>
          </section>

          {/* Subscriptions */}
          <section id="subscriptions">
            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-brand-yellow" /> 4. Trial y Suscripciones
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              <div className="p-6 rounded-2xl bg-brand-yellow/5 border border-brand-yellow/20">
                <p className="text-zinc-300 font-medium">
                  <strong>⚠️ Trial Management:</strong> Todos los Agentes y Usuarios disfrutan de <strong>7 días gratis</strong> al crear su cuenta / primera tienda.<br/><br/>
                  Si intentas realizar acciones mutables (crear tienda, añadir productos) y el Trial expiró (y no posees Suscripción activa "Standard" o "Full"), la CLI bloqueará la ejecución con Error 403 y presentará un Prompt para dirigirte a:
                </p>
                <CodeBlock code={`https://tiender.app/upgrade`} />
                <p className="text-zinc-400 text-sm mt-4">Asegúrate de mejorar de plan para seguir automatizando.</p>
              </div>
            </div>
          </section>

          {/* Next Steps CTA */}
          <section className="pt-8 border-t border-white/5 flex justify-center">
            <Link to="/auth" className="w-full md:w-auto px-12 py-6 rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-2">
              <span className="text-xl">Empieza a Automatizar</span>
              <span className="text-xs text-zinc-500 font-medium normal-case tracking-normal">Ir al Dashboard →</span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
