import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-neon/5 blur-[120px] rounded-full pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
            >
                {/* Big 404 */}
                <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-600 to-zinc-800 leading-none tracking-tighter select-none">
                    404
                </h1>

                <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight -mt-4">
                    Página no encontrada
                </h2>

                <p className="text-zinc-500 text-sm font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                    La página que buscas no existe o ha sido movida. Vuelve al inicio para seguir explorando.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="px-8 py-4 bg-brand-neon text-brand-dark font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        <Home className="w-4 h-4" />
                        Ir al Inicio
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-4 bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 font-bold text-sm rounded-2xl hover:bg-zinc-700/50 transition-all flex items-center justify-center gap-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver Atrás
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
