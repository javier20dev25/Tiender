import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-zinc-300">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-sm font-bold">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Inicio
                </Link>

                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Política de Privacidad</h1>
                <p className="text-zinc-600 text-sm mb-12">Última actualización: 16 de febrero de 2026</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">1. Información que Recopilamos</h2>
                        <p>Recopilamos información que nos proporcionas directamente al crear tu cuenta: nombre, número de teléfono y datos de tu tienda (nombre, productos, imágenes). También recopilamos datos de uso como visitas a tiendas, interacciones (likes, dislikes, añadir al carrito) y datos analíticos agregados.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">2. Cómo Usamos tu Información</h2>
                        <p>Utilizamos tu información para: operar y mantener el Servicio, procesar transacciones y suscripciones, generar analíticas para tu tienda, mejorar la experiencia del usuario, proteger contra fraude y uso indebido, y enviarte comunicaciones relacionadas con el Servicio.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">3. Almacenamiento y Seguridad</h2>
                        <p>Tus datos se almacenan de forma segura en servidores proporcionados por Supabase, con cifrado en tránsito y en reposo. Implementamos medidas de seguridad como autenticación segura, protección anti-bot (visit-gate), y políticas de Row Level Security (RLS) en la base de datos.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">4. Compartición de Datos</h2>
                        <p>No vendemos ni compartimos tu información personal con terceros con fines de marketing. Podemos compartir datos con: proveedores de servicios necesarios para operar la plataforma (Supabase, PayPal, Vercel), y cuando sea requerido por ley.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">5. Datos de los Visitantes</h2>
                        <p>Cuando los clientes visitan tu tienda pública, recopilamos datos de interacción (visitas, likes, dislikes, artículos añadidos al carrito) de forma anónima para generar las analíticas de tu panel de control. No recopilamos información personal identificable de los visitantes de las tiendas.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">6. Pagos</h2>
                        <p>Los pagos de suscripción se procesan a través de PayPal. No almacenamos información de tarjetas de crédito ni datos financieros sensibles en nuestros servidores. Los datos de pago son gestionados directamente por PayPal bajo su propia política de privacidad.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">7. Tus Derechos</h2>
                        <p>Tienes derecho a: acceder a tus datos personales, solicitar la corrección de datos inexactos, solicitar la eliminación de tu cuenta y datos asociados, y exportar tus datos. Para ejercer estos derechos, contáctanos a través de la plataforma.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">8. Cookies y Tecnologías Similares</h2>
                        <p>Utilizamos cookies esenciales para el funcionamiento del Servicio (autenticación de sesión). No utilizamos cookies de seguimiento de terceros ni publicidad dirigida.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">9. Retención de Datos</h2>
                        <p>Conservamos tu información mientras tu cuenta esté activa. Si cancelas tu cuenta, tus datos se eliminarán dentro de los 30 días siguientes, salvo que la ley requiera un período de retención mayor.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">10. Cambios a esta Política</h2>
                        <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma. El uso continuado del Servicio después de los cambios constituye tu aceptación.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
